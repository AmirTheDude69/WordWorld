const { BANK_SIZE, WORD_BANK } = require('../lib/wordBank');

function dayOfYear(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const now = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const diff = now - start;
  return Math.floor(diff / 86400000);
}

function normalizeIndex(value) {
  if (!Number.isFinite(value)) return null;
  const base = Math.trunc(value);
  return ((base % BANK_SIZE) + BANK_SIZE) % BANK_SIZE;
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const lang = String(req.query.lang || 'en').toLowerCase();
  if (!WORD_BANK[lang]) {
    res.status(400).json({ error: 'Unsupported language' });
    return;
  }

  const requestedIndex = normalizeIndex(Number(req.query.index));
  const index = requestedIndex === null ? dayOfYear() % BANK_SIZE : requestedIndex;

  const word = WORD_BANK[lang][index];
  if (!word) {
    res.status(500).json({ error: 'Word bank entry missing' });
    return;
  }

  res.status(200).json(word);
};
