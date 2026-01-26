import { Type } from '@google/genai';
import { getClient, normalizeSyllabus, normalizeTitle, withJsonHandler } from './_lib/genaiClient';

const MODEL = 'gemini-3-flash-preview';

export default withJsonHandler(async ({ topic, complexity }: { topic?: string; complexity?: string }) => {
  if (!topic) {
    throw new Error('`topic` is required.');
  }

  const client = getClient();
  const prompt = `
      Act as an Accelerated Learning Architect.
      Design a 7-Session Mastery Program for the topic: "${topic}".
      Complexity Level: ${complexity || 'Intermediate'}.

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

  const response = await client.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          syllabus: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  const data = JSON.parse(response.text ?? '{}');
  const title = normalizeTitle(data.title, topic);
  const syllabus = normalizeSyllabus(data.syllabus);

  return {
    title,
    syllabus
  };
});
