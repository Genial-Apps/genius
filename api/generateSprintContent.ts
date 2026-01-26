import { Type } from '@google/genai';
import { randomUUID } from 'node:crypto';
import { getClient, withJsonHandler } from './_lib/genaiClient';
import type { SprintPayload } from './_lib/types';

const MODEL = 'gemini-3-flash-preview';

export default withJsonHandler(async (payload: SprintPayload) => {
  const { topic, priming, scopingData, prefs } = payload;
  if (!topic) {
    throw new Error('`topic` is required.');
  }

  const client = getClient();
  const selectedGoals = (scopingData.goals || []).filter((goal) => goal.isSelected);
  const goalContext = selectedGoals.map((goal) => `- [${goal.priority}] ${goal.text}`).join('\n');

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
       - For "Critical" goals, go deep.
       - For "Interesting" goals, add trivia or lateral connections.
    4. **CRITICAL**: Ensure the "thresholdConcepts" (${scopingData.thresholdConcepts.join(', ')}) appear naturally in the text.
    5. Quiz: 2 questions based on the content.
    6. Word Pairs: 8 pairs for memory game (Concept + Short Definition).

    Output JSON matching LearningUnit schema. Fixed duration: 10 minutes.
  `;

  const response = await client.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
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

  const data = JSON.parse(response.text ?? '{}');
  return {
    ...data,
    id: data.id || randomUUID(),
    duration: data.duration || 10
  };
});
