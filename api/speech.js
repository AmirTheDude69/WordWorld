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
  if (!body.text) {
    res.status(400).json({ error: 'Missing text' });
    return;
  }

  const lang = String(body.lang || 'en').toLowerCase();
  const voiceProfiles = {
    en: {
      model: 'tts-1-hd',
      voice: 'nova',
      speed: 1.0,
      instructions: null,
    },
    uk: {
      model: 'gpt-4o-mini-tts',
      voice: 'alloy',
      speed: 0.9,
      instructions: 'Speak in clear standard Ukrainian with native pronunciation. Do not transliterate or translate.',
    },
    fa: {
      model: 'gpt-4o-mini-tts',
      voice: 'alloy',
      speed: 0.88,
      instructions: 'Speak in clear standard Persian (Farsi) with native pronunciation. Do not transliterate or translate.',
    },
  };

  const primary = voiceProfiles[lang] || voiceProfiles.en;

  async function generateSpeech(payload) {
    return fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  try {
    const primaryPayload = {
      model: primary.model,
      voice: primary.voice,
      input: body.text,
      response_format: 'mp3',
      speed: primary.speed,
    };
    if (primary.instructions) {
      primaryPayload.instructions = primary.instructions;
    }

    let response = await generateSpeech(primaryPayload);
    if (!response.ok) {
      // Fallback to high-quality baseline if the multilingual profile is unavailable.
      response = await generateSpeech({
        model: 'tts-1-hd',
        voice: 'nova',
        input: body.text,
        response_format: 'mp3',
        speed: 0.95,
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      res.status(500).json({ error: 'Speech generation failed', details: errText });
      return;
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.status(200).send(audioBuffer);
  } catch (err) {
    res.status(500).json({ error: 'Speech generation error' });
  }
};
