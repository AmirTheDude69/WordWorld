const { randomUUID } = require('crypto');

const LANG_RULES = {
  en: {
    difficulty: 'advanced',
    guidance: 'Use advanced, sophisticated English vocabulary or phrases used by educated native speakers.',
  },
  uk: {
    difficulty: 'beginner',
    guidance: 'Use beginner Ukrainian words or short phrases for daily life, romantic, or emotional settings.',
  },
  fa: {
    difficulty: 'beginner',
    guidance: 'Use beginner Persian (Farsi) words or short phrases for daily life, romantic, or emotional settings.',
  },
};

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

function parseJsonSafe(text) {
  if (typeof text !== 'string') return null;
  try {
    return JSON.parse(text);
  } catch (err) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch (innerErr) {
        return null;
      }
    }
    return null;
  }
}

async function callOpenAI({ apiKey, model, system, user }) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.7,
      text: { format: { type: 'json_object' } },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    return { ok: false, status: response.status, details };
  }

  const payload = await response.json();
  const text = extractOutputText(payload);
  const data = parseJsonSafe(text);
  if (!data) {
    return { ok: false, status: 500, details: 'Invalid JSON from model' };
  }

  return { ok: true, data };
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const lang = String(req.query.lang || 'en').toLowerCase();
  if (!LANG_RULES[lang]) {
    res.status(400).json({ error: 'Unsupported language' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
    return;
  }

  const system = `You are a language tutor creating a single Word of the Day card.\nReturn only valid JSON.`;
  const user = `Language: ${lang}.\n${LANG_RULES[lang].guidance}\n\nReturn a JSON object with these fields:\n- native: the word/phrase in the target language\n- romanization: pronunciation using English letters (for English too)\n- type: Noun, Verb, Adjective, Proverb, Phrase, etc.\n- meaning_en: meaning in English\n- sentence: { native, romanization, meaning_en }\n- image_prompt: a vivid scene that illustrates the word, in anime watercolor style, soft brush texture, cinematic lighting, whimsical mood, no text in image\n- tags: array of 2-4 short tags like daily, romantic, emotional, nature\n\nConstraints:\n- Keep the word/phrase short.\n- Sentence should match the scene in image_prompt.\n- Keep the romanization clear for beginners.\n- No extra keys.`;

  try {
    let openAIResult = await callOpenAI({ apiKey, model: 'gpt-4.1', system, user });
    if (!openAIResult.ok && [403, 404].includes(openAIResult.status)) {
      openAIResult = await callOpenAI({ apiKey, model: 'gpt-4.1-mini', system, user });
    }

    if (!openAIResult.ok) {
      res.status(500).json({ error: 'OpenAI request failed', details: openAIResult.details });
      return;
    }

    const data = openAIResult.data;

    const wordResult = {
      id: randomUUID(),
      language: lang,
      difficulty: LANG_RULES[lang].difficulty,
      native: data.native,
      romanization: data.romanization,
      type: data.type,
      meaning_en: data.meaning_en,
      sentence: data.sentence,
      image_prompt: data.image_prompt,
      tags: data.tags || [],
    };

    res.status(200).json(wordResult);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate word', details: err?.message });
  }
};
