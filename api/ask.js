async function readJson(req) {
  if (req.body) return req.body;
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch (err) {
        resolve({});
      }
    });
  });
}

function extractOutputText(payload) {
  if (payload.output_text) return payload.output_text;
  const message = payload.output?.find((item) => item.type === 'message');
  const content = message?.content?.find((item) => item.type === 'output_text');
  return content?.text || '';
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
    return;
  }

  const body = await readJson(req);
  const question = body.question;
  const word = body.word;
  if (!question || !word) {
    res.status(400).json({ error: 'Missing question or word' });
    return;
  }

  const system =
    'You are a concise, friendly language tutor. Answer clearly with usage tips, pronunciation help, or nuance. Keep it under 80 words.';

  const prompt = `Word info:\n- Language: ${word.language}\n- Native: ${word.native}\n- Romanization: ${word.romanization}\n- Meaning: ${word.meaning_en}\n- Example: ${word.sentence?.native} / ${word.sentence?.meaning_en}\n\nQuestion: ${question}`;

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        input: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(500).json({ error: 'Ask request failed', details: errText });
      return;
    }

    const payload = await response.json();
    const text = extractOutputText(payload);
    res.status(200).json({ answer: text.trim() });
  } catch (err) {
    res.status(500).json({ error: 'Ask request error' });
  }
};
