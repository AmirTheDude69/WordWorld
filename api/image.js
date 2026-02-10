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

function asBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}

function buildOpenAIHeaders(apiKey) {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  if (process.env.OPENAI_PROJECT_ID) {
    headers['OpenAI-Project'] = process.env.OPENAI_PROJECT_ID;
  }
  if (process.env.OPENAI_ORG_ID) {
    headers['OpenAI-Organization'] = process.env.OPENAI_ORG_ID;
  }
  return headers;
}

function parseOpenAIError(text) {
  try {
    const payload = JSON.parse(text || '{}');
    const err = payload?.error || payload;
    return {
      message: err?.message || text || 'Unknown OpenAI error.',
      code: err?.code || null,
      type: err?.type || null,
      param: err?.param || null,
    };
  } catch (err) {
    return {
      message: text || 'Unknown OpenAI error.',
      code: null,
      type: null,
      param: null,
    };
  }
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    res.status(200).json({ error: 'Use POST with JSON { prompt } to generate an image.' });
    return;
  }
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
    const headers = buildOpenAIHeaders(apiKey);
    const makeRequest = async (model, size) =>
      fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          prompt: body.prompt,
          size,
          quality: 'medium',
        }),
      });

    const attempts = [
      { model: 'gpt-image-1.5', size: '1536x1024' },
      { model: 'gpt-image-1.5', size: '1024x1024' },
      { model: 'gpt-image-1', size: '1536x1024' },
      { model: 'gpt-image-1', size: '1024x1024' },
    ];

    let response = null;
    let lastError = null;
    const attemptErrors = [];
    for (const attempt of attempts) {
      const candidate = await makeRequest(attempt.model, attempt.size);
      if (candidate.ok) {
        response = candidate;
        break;
      }
      const rawText = await candidate.text();
      const parsed = parseOpenAIError(rawText);
      lastError = parsed;
      attemptErrors.push({
        model: attempt.model,
        size: attempt.size,
        status: candidate.status,
        code: parsed.code,
        message: parsed.message,
      });

      if (parsed.code === 'billing_hard_limit_reached') {
        res.status(402).json({
          error: 'OpenAI billing hard limit reached for the key/project used by this deployment.',
          code: parsed.code,
          details: parsed.message,
          hint:
            'This usually means your Vercel OPENAI_API_KEY belongs to a different OpenAI project/org than the dashboard you checked. Use a key from the intended project, and optionally set OPENAI_PROJECT_ID / OPENAI_ORG_ID in Vercel.',
          attempts: attemptErrors,
        });
        return;
      }
    }

    if (!response) {
      res.status(500).json({
        error: 'Image generation failed',
        details: lastError?.message || 'No successful image response.',
        attempts: attemptErrors,
      });
      return;
    }

    const payload = await response.json();
    let imageBase64 = payload.data?.[0]?.b64_json;
    const imageUrl = payload.data?.[0]?.url;

    if (!imageBase64 && imageUrl) {
      const imageResponse = await fetch(imageUrl);
      if (imageResponse.ok) {
        imageBase64 = asBase64(await imageResponse.arrayBuffer());
      }
    }

    if (!imageBase64) {
      res.status(500).json({ error: 'No image returned' });
      return;
    }

    res.status(200).json({ image_base64: imageBase64, mime: 'image/png' });
  } catch (err) {
    res.status(500).json({ error: 'Image generation error', details: err?.message });
  }
};
