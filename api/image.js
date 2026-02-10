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
  if (!body.prompt) {
    res.status(400).json({ error: 'Missing prompt' });
    return;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1.5',
        prompt: body.prompt,
        size: '1024x1024',
        quality: 'medium',
        response_format: 'b64_json',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(500).json({ error: 'Image generation failed', details: errText });
      return;
    }

    const payload = await response.json();
    const imageBase64 = payload.data?.[0]?.b64_json;

    if (!imageBase64) {
      res.status(500).json({ error: 'No image returned' });
      return;
    }

    res.status(200).json({ image_base64: imageBase64, mime: 'image/png' });
  } catch (err) {
    res.status(500).json({ error: 'Image generation error' });
  }
};
