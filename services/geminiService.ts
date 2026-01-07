import { GoogleGenAI, Type } from "@google/genai";
import { LearningUnit, SprintLog, UserPreferences, ScopingData, ScopedGoal } from "../types";

// Safe access to process.env for browser environments
const getApiKey = () => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env?.API_KEY) {
      // @ts-ignore
      return process.env.API_KEY;
    }
  } catch (e) {
    // process is not defined, ignore
  }
  return ''; 
};

const API_KEY = getApiKey();

type LogCallback = (type: 'info' | 'request' | 'response' | 'error', message: string, data?: any) => void;

class GeniusEngineService {
  private ai: GoogleGenAI;
  private logger: LogCallback | null = null;

  constructor() {
    console.log(`[Genius Engine] Initializing. Key configured: ${!!API_KEY}`);
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  setLogger(callback: LogCallback) {
    this.logger = callback;
  }

  private log(type: 'info' | 'request' | 'response' | 'error', message: string, data?: any) {
    if (this.logger) {
      this.logger(type, message, data);
    } else {
      console.log(`[GE-${type.toUpperCase()}] ${message}`, data);
    }
  }

  // PHASE 1: Quick URL Resolution
  async resolveWebPageTitle(url: string): Promise<string> {
      this.log('info', `Resolving title for URL: ${url}`);
      const modelName = 'gemini-3-flash-preview';
      const prompt = `
        I have this URL: "${url}".
        I need the actual human-readable Title of the page or video.
        Use Google Search to find it.
        
        Rules:
        1. Return ONLY the title string.
        2. Do NOT return the URL.
        3. Do NOT add quotes.
        4. If it's a Youtube video, return the video title.
        5. If you absolutely cannot find it, return "External Resource".
      `;
      
      try {
        const response = await this.ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
                responseMimeType: "text/plain"
            }
        });
        let title = response.text?.trim() || "External Resource";
        // Clean up quotes if model adds them
        title = title.replace(/^"|"$/g, '');
        
        // Fallback if model just returns the URL back
        if (title.includes('http')) {
            title = "External Resource";
        }

        this.log('info', `Resolved Title: ${title}`);
        return title;
      } catch (error: any) {
        this.log('error', `Title Resolution Failed: ${error.message}`);
        return "External Resource";
      }
  }

  // PHASE 1.5: Syllabus Generation (Program Creation)
  async generateSyllabus(topic: string, complexity: string): Promise<{ title: string, syllabus: string[] }> {
    this.log('info', `Generating Syllabus for: ${topic}`);
    const modelName = 'gemini-3-flash-preview';

    const prompt = `
      Act as an Accelerated Learning Architect.
      Design a 7-Session Mastery Program for the topic: "${topic}".
      Complexity Level: ${complexity}.

      CRITICAL: If the input topic is a URL (like YouTube, Medium, etc.), use the Google Search tool to find the ACTUAL title and context of that content.
      
      Extract a concise, meaningful, and punchy "Program Title" (2-6 words) based on the actual content found. Do not use the URL as the title.

      The program must be a logical progression:
      Session 1: Foundations & Core Principles
      Session 2-3: Mechanisms & Deep Dives
      Session 4-5: Applications & Synthesis
      Session 6: Advanced/Edge Cases
      Session 7: Mastery & Integration

      Return ONLY a JSON object.
      Schema: { title: string, syllabus: string[] }
    `;

    try {
       const response = await this.ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}], // Enable search for URL resolution
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        syllabus: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
       });
       
       // Handle grounding chunks if present (optional logging)
       if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
           this.log('info', 'Grounding used for syllabus generation');
       }

       // @ts-ignore
       const data = JSON.parse(response.text);
       return {
           title: data.title || topic,
           syllabus: data.syllabus.slice(0, 7) // Ensure max 7
       };
    } catch (error: any) {
        this.log('error', `Syllabus Gen Failed: ${error.message}`, error);
        // Fallback
        return {
            title: topic,
            syllabus: [
                `Foundations of ${topic}`,
                `Core Mechanisms`,
                `Systems`,
                `Applications`,
                `Advanced Theory`,
                `Synthesis`,
                `Final Integration`
            ]
        };
    }
  }

  // PHASE 2: Initial Scoping (Concurrent with User Priming)
  async performInitialScoping(
      topic: string, 
      prefs: UserPreferences, 
      sessionIndex: number, 
      totalSessions: number,
      programTopic: string
  ): Promise<ScopingData> {
    this.log('info', `Scoping session ${sessionIndex + 1}/${totalSessions}: ${topic}`);
    const modelName = 'gemini-3-flash-preview';

    const contextStr = `
      User Profile: ${prefs.learningStyle}, ${prefs.complexityPreference}.
      Program Context: This is Session ${sessionIndex + 1} of 7 in a program about "${programTopic}".
      Current Session Focus: "${topic}".
    `;

    const prompt = `
      Act as an Accelerated Learning Curriculum Designer.
      Analyze the specific session topic "${topic}" within the broader context of "${programTopic}".
      
      ${contextStr}

      Return a JSON object with:
      1. 'complexity': The assessed complexity level. MUST be one of: 'Beginner', 'Intermediate', 'Expert'.
      2. 'thresholdConcepts': 8-10 key terms/jargon specific to THIS session.
      3. 'goals': A list of 5 specific learning outcomes for THIS session.

      Schema: { complexity: string, thresholdConcepts: string[], goals: string[] }
    `;

    try {
        const response = await this.ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        complexity: { type: Type.STRING, enum: ['Beginner', 'Intermediate', 'Expert'] },
                        thresholdConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
                        goals: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });

        // @ts-ignore
        const data = JSON.parse(response.text);
        
        // Transform goals into ScopedGoal objects
        const scopedGoals: ScopedGoal[] = data.goals.map((text: string) => ({
            id: crypto.randomUUID(),
            text,
            isSelected: true,
            priority: 'Useful' // Default priority
        }));

        return {
            complexity: data.complexity,
            thresholdConcepts: data.thresholdConcepts,
            goals: scopedGoals
        };

    } catch (error: any) {
        this.log('error', `Scoping Failed: ${error.message}`, error);
        throw error;
    }
  }

  // PHASE 3: Content Generation (Happens during Sprint Load)
  async generateSprintContent(
      topic: string, 
      priming: SprintLog['primingAnswers'], 
      scopingData: ScopingData,
      prefs: UserPreferences
  ): Promise<LearningUnit> {
    this.log('info', `Generating content for: ${topic}`);
    const modelName = 'gemini-3-flash-preview';

    const selectedGoals = scopingData.goals.filter(g => g.isSelected);
    const goalContext = selectedGoals.map(g => `- [${g.priority}] ${g.text}`).join('\n');

    const prompt = `
      Create a "High-Velocity Learning Unit" for "${topic}".
      
      User Priming Context:
      - Relevance: ${priming.relevance}
      - Context: ${priming.relation}
      - Expectations: ${priming.scope}

      Agreed Learning Goals (Prioritized):
      ${goalContext}

      User Profile: ${prefs.complexityPreference}, ${prefs.learningStyle}.

      Protocol:
      1. Title: Create a clean, engaging headline for this unit (do NOT use a URL).
      2. Motivating Statement: Directly address the user's "Relevance" answer.
      3. Sections: Create 4 learning sections. Content must be tailored to the prioritized goals.
         - For 'Critical' goals, go deep.
         - For 'Interesting' goals, add trivia or lateral connections.
      4. **CRITICAL**: Ensure the 'thresholdConcepts' (${scopingData.thresholdConcepts.join(', ')}) appear naturally in the text.
      5. Quiz: 2 questions based on the content.
      6. Word Pairs: 8 pairs for memory game (Concept + Short Definition).

      Output JSON matching LearningUnit schema. Fixed duration: 10 minutes.
    `;

    this.log('request', `Sending Content Prompt`, { prompt });

    try {
        const response = await this.ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                // maxOutputTokens removed to prevent generation errors on complex JSON
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        duration: { type: Type.NUMBER },
                        complexity: { type: Type.STRING },
                        motivatingStatement: { type: Type.STRING },
                        smartGoals: { type: Type.ARRAY, items: { type: Type.STRING } },
                        thresholdConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
                        sections: {
                            type: Type.ARRAY,
                            items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                content: { type: Type.STRING },
                                imageKeyword: { type: Type.STRING },
                                interactionType: { type: Type.STRING, enum: ['READ', 'REFLECTION'] }
                            }
                            }
                        },
                        wordPairs: {
                            type: Type.ARRAY,
                            items: {
                            type: Type.OBJECT,
                            properties: {
                                a: { type: Type.STRING },
                                b: { type: Type.STRING }
                            }
                            }
                        },
                        quiz: {
                            type: Type.ARRAY,
                            items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                question: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                correctIndex: { type: Type.NUMBER },
                                explanation: { type: Type.STRING }
                            }
                            }
                        }
                    }
                }
            }
        });

        // @ts-ignore
        const data = JSON.parse(response.text);
        // Force 10 minutes default
        return { ...data, id: data.id || crypto.randomUUID(), duration: 10 };

    } catch (error: any) {
        this.log('error', `Generation Failed: ${error.message}`, error);
        // Return minimal fallback for error state
        return {
            id: 'error',
            title: 'Generation Error',
            duration: 10,
            complexity: 'Error',
            motivatingStatement: 'Error generating content. Please check debug logs.',
            smartGoals: [],
            thresholdConcepts: [],
            sections: [{ title: 'Error', content: `The AI could not generate this unit. Details: ${error.message}`, imageKeyword: 'error', interactionType: 'READ' }],
            wordPairs: [],
            quiz: []
        };
    }
  }
}

export const geniusEngine = new GeniusEngineService();