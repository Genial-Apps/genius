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
    // process is not defined, ignore and use fallback
  }
  // Fallback for prototype/testing
  return 'AIzaSyB4bHg-sRw1it-_ZGEYZfaVpnF3YRYRMBA'; 
};

const API_KEY = getApiKey();

type LogCallback = (type: 'info' | 'request' | 'response' | 'error', message: string, data?: any) => void;

class GeniusEngineService {
  private ai: GoogleGenAI;
  private logger: LogCallback | null = null;

  constructor() {
    console.log(`[Genius Engine] Initializing. Key configured: ${!!API_KEY}, Length: ${API_KEY?.length || 0}`);
    if (!API_KEY) {
      console.error("[Genius Engine] CRITICAL: No API Key found.");
    }
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

  // PHASE 1.5: Syllabus Generation (Program Creation)
  async generateSyllabus(topic: string, complexity: string): Promise<string[]> {
    this.log('info', `Generating Syllabus for: ${topic}`);
    const modelName = 'gemini-3-flash-preview';

    const prompt = `
      Act as an Accelerated Learning Architect.
      Design a 7-Session Mastery Program for the topic: "${topic}".
      Complexity Level: ${complexity}.

      The program must be a logical progression:
      Session 1: Foundations & Core Principles
      Session 2-3: Mechanisms & Deep Dives
      Session 4-5: Applications & Synthesis
      Session 6: Advanced/Edge Cases
      Session 7: Mastery & Integration

      Return ONLY a JSON object containing an array of 7 short, punchy session titles.
      Schema: { syllabus: string[] }
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
                        syllabus: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
       });
       // @ts-ignore
       const data = JSON.parse(response.text);
       return data.syllabus.slice(0, 7); // Ensure max 7
    } catch (error: any) {
        this.log('error', `Syllabus Gen Failed: ${error.message}`);
        // Fallback
        return [
            `${topic}: Foundations`,
            `${topic}: Core Mechanisms`,
            `${topic}: Systems`,
            `${topic}: Applications`,
            `${topic}: Advanced Theory`,
            `${topic}: Synthesis`,
            `${topic}: Final Integration`
        ];
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
      1. 'complexity': The assessed complexity level.
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
                        complexity: { type: Type.STRING },
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
        this.log('error', `Scoping Failed: ${error.message}`);
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
      1. Motivating Statement: Directly address the user's "Relevance" answer.
      2. Sections: Create 4 learning sections. Content must be tailored to the prioritized goals.
         - For 'Critical' goals, go deep.
         - For 'Interesting' goals, add trivia or lateral connections.
      3. **CRITICAL**: Ensure the 'thresholdConcepts' (${scopingData.thresholdConcepts.join(', ')}) appear naturally in the text.
      4. Quiz: 2 questions based on the content.
      5. Word Pairs: 8 pairs for memory game (Concept + Short Definition).

      Output JSON matching LearningUnit schema. Fixed duration: 10 minutes.
    `;

    this.log('request', `Sending Content Prompt`, { prompt });

    try {
        const response = await this.ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                maxOutputTokens: 8192,
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
        this.log('error', `Generation Failed: ${error.message}`);
        // Return minimal fallback for error state
        return {
            id: 'error',
            title: 'Generation Error',
            duration: 10,
            complexity: 'Error',
            motivatingStatement: 'Error generating content.',
            smartGoals: [],
            thresholdConcepts: [],
            sections: [{ title: 'Error', content: 'Please retry.', imageKeyword: 'error', interactionType: 'READ' }],
            wordPairs: [],
            quiz: []
        };
    }
  }
}

export const geniusEngine = new GeniusEngineService();
