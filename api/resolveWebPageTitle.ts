import { getClient, withJsonHandler } from './_lib/genaiClient.js';

const MODEL = 'gemini-3-flash-preview';

export default withJsonHandler(async ({ url }: { url?: string }) => {
  if (!url) {
    throw new Error('`url` is required.');
  }

  const client = getClient();
  const prompt = `
    I have this URL: "${url}".
    I need the actual human-readable Title of the page or video.
    Use Google Search to find it.

    Rules:
    1. Return ONLY the title string.
    2. Do NOT return the URL.
    3. Do NOT add quotes.
    4. If it's a YouTube video, return the video title.
    5. If you absolutely cannot find it, return "External Resource".
  `;

  const response = await client.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: 'text/plain'
    }
  });

  let title = response.text?.trim() || 'External Resource';
  title = title.replace(/^"|"$/g, '');

  if (title.includes('http')) {
    title = 'External Resource';
  }

  return title;
});
