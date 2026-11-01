// Netlify Function: proxies questions to an OpenAI-compatible chat API.
// Configure in Netlify > Site configuration > Environment variables:
//   AI_API_KEY (required), AI_API_URL (optional), AI_MODEL (optional)
const MAX_QUESTION = 500;
const MAX_ASSETS = 20;

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return json(503, { error: 'AI is not configured yet. Add AI_API_KEY in Netlify.' });

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid request' });
  }

  const question = String(payload.question || '').trim().slice(0, MAX_QUESTION);
  if (!question) return json(400, { error: 'Please type a question' });

  const assets = (Array.isArray(payload.assets) ? payload.assets : [])
    .slice(0, MAX_ASSETS)
    .map(a => `${String(a.name).slice(0, 40)} (${String(a.type).slice(0, 12)}): score ${Number(a.score) || 0}, ${Number(a.votes) || 0} rating points`)
    .join('\n');

  const url = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';
  const model = process.env.AI_MODEL || 'gpt-4o-mini';

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        max_tokens: 350,
        messages: [
          {
            role: 'system',
            content: 'You are Cryp Rat, a friendly assistant on a crypto rating site. Explain and summarise the community rating data you are given in plain language. Keep answers under 120 words. Never give financial advice; remind users this is community opinion, not investment advice.'
          },
          { role: 'user', content: `Current community ratings:\n${assets}\n\nQuestion: ${question}` }
        ]
      })
    });

    if (!res.ok) return json(502, { error: 'The AI service returned an error. Try again later.' });
    const data = await res.json();
    const answer = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    return json(200, { answer: (answer || 'No answer received.').trim() });
  } catch {
    return json(502, { error: 'Could not reach the AI service.' });
  }
};
