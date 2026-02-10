function maskKey(key) {
  if (!key || key.length < 10) return null;
  return `${key.slice(0, 7)}...${key.slice(-4)}`;
}

module.exports = (req, res) => {
  const key = process.env.OPENAI_API_KEY || '';

  res.status(200).json({
    ok: true,
    message: 'WordWideWorld API online',
    openai: {
      keyConfigured: Boolean(key),
      keyType: key.startsWith('sk-proj-') ? 'project' : key ? 'user' : 'missing',
      keyFingerprint: maskKey(key),
      projectHeaderConfigured: Boolean(process.env.OPENAI_PROJECT_ID),
      orgHeaderConfigured: Boolean(process.env.OPENAI_ORG_ID),
    },
  });
};
