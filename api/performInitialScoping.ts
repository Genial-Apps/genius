import { Type } from '@google/genai';
import { randomUUID } from 'node:crypto';
import { getClient, withJsonHandler } from './_lib/genaiClient.js';
import type { ScopingGoal, ScopingPayload } from './_lib/types';

const MODEL = 'gemini-3-flash-preview';

export default withJsonHandler(async (payload: ScopingPayload) => {
  const { topic, prefs, sessionIndex, totalSessions, programTopic } = payload;
  if (!topic) {
    throw new Error('`topic` is required.');
  }

  const client = getClient();
  const contextStr = `
    User Profile: ${prefs.learningStyle}, ${prefs.complexityPreference}.
    Program Context: This is Session ${sessionIndex + 1} of ${totalSessions} in a program about "${programTopic}".
    Current Session Focus: "${topic}".
  `;

  const prompt = `
    Act as an Accelerated Learning Curriculum Designer.
    Analyze the specific session topic "${topic}" within the broader context of "${programTopic}".

    ${contextStr}

    Return a JSON object with:
    1. "complexity": The assessed complexity level. MUST be one of: "Beginner", "Intermediate", "Expert".
    2. "thresholdConcepts": 8-10 key terms/jargon specific to THIS session.
    3. "goals": A list of 5 specific learning outcomes for THIS session.

    Schema: { complexity: string, thresholdConcepts: string[], goals: string[] }
  `;

  const response = await client.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
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

  const data = JSON.parse(response.text ?? '{}');

  const scopedGoals: ScopingGoal[] = Array.isArray(data.goals)
    ? data.goals.map((text: string) => ({
        id: randomUUID(),
        text,
        isSelected: true,
        priority: 'Useful'
      }))
    : [];

  return {
    complexity: data.complexity || 'Intermediate',
    thresholdConcepts: Array.isArray(data.thresholdConcepts) ? data.thresholdConcepts : [],
    goals: scopedGoals
  };
});
