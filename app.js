const BANK_SIZE = 365;

const LANG_CONFIG = {
  en: { label: 'English', locale: 'en-US', dir: 'ltr' },
  uk: { label: 'Ukrainian', locale: 'uk-UA', dir: 'ltr' },
  fa: { label: 'Persian', locale: 'fa-IR', dir: 'rtl' },
};

const STORAGE_KEYS = {
  collected: 'www.collected',
  favorites: 'www.favorites',
  indices: 'www.wordIndexByLang',
};

const LEGACY_EN_TOKEN_SUFFIX_RE = /\s+\((today|at dawn|tonight|in practice|in reflection|in conversation|with intention|in daily life)\)$/i;
const LEGACY_BEGINNER_MEANING_SUFFIX_RE = /\s+\((today|now|in the evening|in the morning|always|sincerely|together|quietly|tonight|calmly|gently)\)$/i;
const LEGACY_UK_NATIVE_SUFFIXES = ['сьогодні', 'зараз', 'ввечері', 'вранці', 'завжди', 'щиро', 'разом', 'тихо'];
const LEGACY_UK_ROMAN_SUFFIXES = ['sohodni', 'zaraz', 'vvecheri', 'vrantsi', 'zavzhdy', 'shchyro', 'razom', 'tykho'];
const LEGACY_FA_NATIVE_SUFFIXES = ['امروز', 'الان', 'امشب', 'صبح', 'همیشه', 'آرام', 'با هم', 'آهسته'];
const LEGACY_FA_ROMAN_SUFFIXES = ['emrooz', 'alan', 'emshab', 'sobh', 'hamisheh', 'aram', 'ba ham', 'aheste'];

const wordCard = document.getElementById('wordCard');
const wordPronounce = document.getElementById('wordPronounce');
const wordNative = document.getElementById('wordNative');
const wordType = document.getElementById('wordType');
const wordMeaning = document.getElementById('wordMeaning');
const sentenceNative = document.getElementById('sentenceNative');
const sentenceRoman = document.getElementById('sentenceRoman');
const sentenceMeaning = document.getElementById('sentenceMeaning');
const artFrame = document.getElementById('artFrame');
const artImage = document.getElementById('artImage');
const artLoading = document.getElementById('artLoading');

const skipBtn = document.getElementById('skipBtn');
const askBtn = document.getElementById('askBtn');
const favBtn = document.getElementById('favBtn');
const collectBtn = document.getElementById('collectBtn');
const speakBtn = document.getElementById('speakBtn');

const langButtons = document.querySelectorAll('.lang-btn');
const allLangBtn = document.querySelector('.lang-btn[data-lang="all"]');
const favoritesLangBtn = document.querySelector('.lang-btn[data-lang="favorites"]');
const viewButtons = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');

const galleryGrid = document.getElementById('galleryGrid');
const gallerySearch = document.getElementById('gallerySearch');
const statTotalWords = document.getElementById('statTotalWords');
const statFavorites = document.getElementById('statFavorites');
const statLanguages = document.getElementById('statLanguages');
const statShowing = document.getElementById('statShowing');

const askModal = document.getElementById('askModal');
const askInput = document.getElementById('askInput');
const chatBody = document.getElementById('chatBody');
const sendAsk = document.getElementById('sendAsk');
const closeAsk = document.getElementById('closeAsk');

const quizMeta = document.getElementById('quizMeta');
const quizQuestion = document.getElementById('quizQuestion');
const quizOptions = document.getElementById('quizOptions');
const quizNextBtn = document.getElementById('quizNextBtn');
const quizSceneImage = document.getElementById('quizSceneImage');
const quizSceneCaption = document.getElementById('quizSceneCaption');
const quizSceneFallback = document.getElementById('quizSceneFallback');

const state = {
  lang: 'en',
  view: 'learning',
  filter: 'en',
  current: null,
  currentImage: null,
  flipped: false,
  loading: false,
  requestSeq: 0,
  collected: [],
  favorites: new Set(),
  indices: { en: 0, uk: 0, fa: 0 },
  galleryQuery: '',
  audioCache: new Map(),
  chat: {},
  quiz: {
    questions: [],
    index: 0,
    score: 0,
    locked: false,
  },
};

const inFlightImageRequests = new Map();
const inFlightWordRequests = new Map();

const storage = {
  load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  },
  save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

const idb = (() => {
  let dbPromise = null;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('www-cache', 2);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('images')) db.createObjectStore('images');
        if (!db.objectStoreNames.contains('audio')) db.createObjectStore('audio');
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return dbPromise;
  }

  async function get(storeName, key) {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }

  async function set(storeName, key, value) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(storeName).put(value, key);
    });
  }

  return { get, set };
})();

function dayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 1);
  const now = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = now - start;
  return Math.floor(diff / 86400000);
}

function stripTrailingSuffix(text, suffixes) {
  if (typeof text !== 'string') return text;
  for (const suffix of suffixes) {
    const withSpace = ` ${suffix}`;
    if (text.endsWith(withSpace)) {
      return text.slice(0, -withSpace.length).trim();
    }
  }
  return text;
}

function stripTrailingSuffixWithPunctuation(text, suffixes) {
  if (typeof text !== 'string') return text;
  let base = text.trim();
  let punctuation = '';
  if (/[.!?]$/.test(base)) {
    punctuation = base.slice(-1);
    base = base.slice(0, -1).trim();
  }
  const cleaned = stripTrailingSuffix(base, suffixes);
  return punctuation ? `${cleaned}${punctuation}` : cleaned;
}

function sanitizeLegacyEntry(entry) {
  if (!entry || typeof entry !== 'object') return entry;
  const next = JSON.parse(JSON.stringify(entry));

  if (next.language === 'en') {
    next.native = String(next.native || '').replace(LEGACY_EN_TOKEN_SUFFIX_RE, '').trim();
    next.romanization = String(next.romanization || '').replace(LEGACY_EN_TOKEN_SUFFIX_RE, '').trim();
    next.meaning_en = String(next.meaning_en || '').replace(LEGACY_EN_TOKEN_SUFFIX_RE, '').trim();
  }

  if (next.language === 'uk') {
    const hasLegacySuffix =
      LEGACY_BEGINNER_MEANING_SUFFIX_RE.test(String(next.meaning_en || '')) ||
      LEGACY_BEGINNER_MEANING_SUFFIX_RE.test(String(next.sentence?.meaning_en || ''));

    if (hasLegacySuffix) {
      next.native = stripTrailingSuffix(String(next.native || ''), LEGACY_UK_NATIVE_SUFFIXES);
      next.romanization = stripTrailingSuffix(String(next.romanization || ''), LEGACY_UK_ROMAN_SUFFIXES);
      if (next.sentence) {
        next.sentence.native = stripTrailingSuffixWithPunctuation(String(next.sentence.native || ''), LEGACY_UK_NATIVE_SUFFIXES);
        next.sentence.romanization = stripTrailingSuffixWithPunctuation(String(next.sentence.romanization || ''), LEGACY_UK_ROMAN_SUFFIXES);
      }
    }

    next.meaning_en = String(next.meaning_en || '').replace(LEGACY_BEGINNER_MEANING_SUFFIX_RE, '').trim();
  }

  if (next.language === 'fa') {
    const hasLegacySuffix =
      LEGACY_BEGINNER_MEANING_SUFFIX_RE.test(String(next.meaning_en || '')) ||
      LEGACY_BEGINNER_MEANING_SUFFIX_RE.test(String(next.sentence?.meaning_en || ''));

    if (hasLegacySuffix) {
      next.native = stripTrailingSuffix(String(next.native || ''), LEGACY_FA_NATIVE_SUFFIXES);
      next.romanization = stripTrailingSuffix(String(next.romanization || ''), LEGACY_FA_ROMAN_SUFFIXES);
      if (next.sentence) {
        next.sentence.native = stripTrailingSuffixWithPunctuation(String(next.sentence.native || ''), LEGACY_FA_NATIVE_SUFFIXES);
        next.sentence.romanization = stripTrailingSuffixWithPunctuation(String(next.sentence.romanization || ''), LEGACY_FA_ROMAN_SUFFIXES);
      }
    }

    next.meaning_en = String(next.meaning_en || '').replace(LEGACY_BEGINNER_MEANING_SUFFIX_RE, '').trim();
  }

  if (!next.sentence || typeof next.sentence !== 'object') {
    next.sentence = {
      native: next.native || '—',
      romanization: next.romanization || '—',
      meaning_en: next.meaning_en || '—',
    };
  }

  if (next.sentence) {
    next.sentence.meaning_en = String(next.sentence.meaning_en || next.meaning_en || '').replace(LEGACY_BEGINNER_MEANING_SUFFIX_RE, '').replace(LEGACY_EN_TOKEN_SUFFIX_RE, '').trim();
  }

  return next;
}

function entryKey(item) {
  return `${item?.language || ''}|${item?.native || ''}|${item?.meaning_en || ''}`.toLowerCase();
}

function dedupeCollected(items) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    if (!item) continue;
    const key = entryKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}

function setLoading(isLoading) {
  state.loading = isLoading;
  collectBtn.disabled = isLoading;
  skipBtn.disabled = isLoading;
  speakBtn.disabled = isLoading;
}

function updateTopLangUI() {
  const active = state.view === 'learning' ? state.lang : state.filter;
  langButtons.forEach((btn) => {
    const isActive = btn.dataset.lang === active;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

function setView(view) {
  state.view = view;

  if (view === 'learning') {
    state.filter = state.lang;
  } else if (view === 'quiz' && state.filter === 'favorites') {
    state.filter = 'all';
  }

  views.forEach((section) => {
    section.classList.toggle('active', section.dataset.view === view);
  });

  viewButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });

  if (allLangBtn) {
    allLangBtn.hidden = view === 'learning';
  }
  if (favoritesLangBtn) {
    favoritesLangBtn.hidden = view !== 'gallery';
  }

  updateTopLangUI();

  if (view === 'gallery' && gallerySearch) {
    gallerySearch.value = state.galleryQuery;
  }
  if (view === 'gallery') renderGallery();
  if (view === 'quiz') buildQuiz();
}

function setLanguage(lang) {
  if (lang === 'all') {
    if (state.view !== 'learning') {
      state.filter = 'all';
      updateTopLangUI();
      if (state.view === 'gallery') renderGallery();
      if (state.view === 'quiz') buildQuiz();
    }
    return;
  }

  if (lang === 'favorites') {
    if (state.view === 'gallery') {
      state.filter = 'favorites';
      updateTopLangUI();
      renderGallery();
    }
    return;
  }

  if (!LANG_CONFIG[lang]) return;

  if (state.view === 'learning') {
    state.lang = lang;
    state.filter = lang;
    updateTopLangUI();
    loadWord({ advance: false });
  } else {
    state.filter = lang;
    updateTopLangUI();
    if (state.view === 'gallery') renderGallery();
    if (state.view === 'quiz') buildQuiz();
  }
}

function resetArt() {
  artFrame.classList.remove('loaded');
  artImage.removeAttribute('src');
  artLoading.textContent = 'Painting the scene...';
  state.currentImage = null;
}

function toImageDataUrl(base64) {
  return `data:image/png;base64,${base64}`;
}

function updateArt(base64) {
  if (!base64) return;
  artImage.src = toImageDataUrl(base64);
  artFrame.classList.add('loaded');
  artLoading.textContent = '';
  state.currentImage = base64;
}

function primeCurrentImage(wordId, base64) {
  if (!base64) return;
  if (!state.current || state.current.id !== wordId) return;
  artImage.src = toImageDataUrl(base64);
  state.currentImage = base64;
  if (state.flipped) {
    artFrame.classList.add('loaded');
    artLoading.textContent = '';
  }
}

function renderError(message) {
  wordPronounce.textContent = 'Offline';
  wordNative.textContent = 'Try again';
  wordType.textContent = '—';
  wordMeaning.textContent = message;
  sentenceNative.textContent = '—';
  sentenceRoman.textContent = '—';
  sentenceMeaning.textContent = '—';
  resetArt();
}

function updateCard() {
  if (!state.current) return;

  const isRtl = LANG_CONFIG[state.current.language]?.dir === 'rtl';

  wordPronounce.textContent = state.current.romanization || '—';
  wordNative.textContent = state.current.native;
  wordType.textContent = state.current.type || 'Phrase';
  wordMeaning.textContent = state.current.meaning_en;
  sentenceNative.textContent = state.current.sentence?.native || '—';
  sentenceRoman.textContent = state.current.sentence?.romanization || '—';
  sentenceMeaning.textContent = state.current.sentence?.meaning_en || '—';

  [wordNative, sentenceNative].forEach((el) => {
    el.classList.toggle('rtl', isRtl);
  });

  state.flipped = false;
  wordCard.classList.remove('flipped');

  const isFavorite = state.favorites.has(state.current.id);
  favBtn.classList.toggle('active', isFavorite);
  favBtn.querySelector('.icon').textContent = isFavorite ? '★' : '☆';

  resetArt();
}

function persistIndices() {
  storage.save(STORAGE_KEYS.indices, state.indices);
}

function advanceIndex(lang) {
  state.indices[lang] = ((state.indices[lang] + 1) % BANK_SIZE + BANK_SIZE) % BANK_SIZE;
  persistIndices();
}

async function ensureImageForWord(word, showStatus) {
  const cached = await idb.get('images', word.id);
  if (cached) return cached;

  if (inFlightImageRequests.has(word.id)) {
    return inFlightImageRequests.get(word.id);
  }

  if (showStatus && state.current?.id === word.id) {
    artLoading.textContent = 'Painting the scene...';
  }

  const request = (async () => {
    const res = await fetch('/api/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: word.image_prompt }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      let message = data.details || data.error || 'Unable to create art.';

      // Some API errors come nested as JSON string payloads.
      if (typeof message === 'string' && message.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(message);
          message = parsed?.error?.message || parsed?.message || message;
        } catch (err) {
          // Keep original text if parsing fails.
        }
      }

      throw new Error(message);
    }

    if (!data.image_base64) {
      throw new Error('No image returned.');
    }

    await idb.set('images', word.id, data.image_base64);
    return data.image_base64;
  })();

  inFlightImageRequests.set(word.id, request);
  try {
    return await request;
  } finally {
    inFlightImageRequests.delete(word.id);
  }
}

async function ensureImage() {
  if (!state.current) return;
  const word = state.current;

  try {
    const base64 = await ensureImageForWord(word, true);
    if (state.current?.id === word.id) {
      updateArt(base64);
    }
  } catch (err) {
    if (state.current?.id === word.id) {
      artLoading.textContent = err?.message || 'Unable to create art.';
    }
  }
}

async function fetchWordByIndex(lang, index) {
  const cacheKey = `${lang}:${index}`;
  if (inFlightWordRequests.has(cacheKey)) {
    return inFlightWordRequests.get(cacheKey);
  }

  const request = (async () => {
    const res = await fetch(`/api/word?lang=${lang}&index=${index}`);
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.language !== lang) return null;
    return sanitizeLegacyEntry(data);
  })();

  inFlightWordRequests.set(cacheKey, request);
  try {
    return await request;
  } finally {
    inFlightWordRequests.delete(cacheKey);
  }
}

async function prewarmImagesForCurrentAndNext(word, requestId, index) {
  const currentTask = (async () => {
    try {
      const currentBase64 = await ensureImageForWord(word, false);
      if (requestId === state.requestSeq) {
        primeCurrentImage(word.id, currentBase64);
      }
    } catch (err) {
      // Keep learning flow responsive even if image generation fails.
    }
  })();

  const nextTask = (async () => {
    try {
      const nextIndex = (index + 1) % BANK_SIZE;
      const nextWord = await fetchWordByIndex(word.language, nextIndex);
      if (!nextWord || nextWord.language !== word.language) return;
      await ensureImageForWord(nextWord, false);
    } catch (err) {
      // Next-card prefetch is best-effort.
    }
  })();

  await Promise.allSettled([currentTask, nextTask]);
}

async function loadWord({ advance }) {
  const lang = state.lang;

  if (advance) {
    advanceIndex(lang);
  }

  const index = state.indices[lang];
  const requestId = ++state.requestSeq;

  setLoading(true);

  try {
    const res = await fetch(`/api/word?lang=${lang}&index=${index}`);
    const data = await res.json().catch(() => ({}));

    if (requestId !== state.requestSeq) return;

    if (!res.ok) {
      const message = data.error || 'Unable to load a new word.';
      const detail = data.details ? ` (${data.details})` : '';
      throw new Error(`${message}${detail}`);
    }

    const normalized = sanitizeLegacyEntry(data);

    if (!normalized || normalized.language !== lang) {
      throw new Error('Language mismatch from word source.');
    }

    state.current = normalized;
    updateCard();
    void prewarmImagesForCurrentAndNext(normalized, requestId, index);
  } catch (err) {
    if (requestId !== state.requestSeq) return;
    renderError(err?.message || 'Unable to load a new word.');
  } finally {
    if (requestId === state.requestSeq) {
      setLoading(false);
    }
  }
}

async function collectCurrent() {
  if (!state.current || state.loading) return;

  const entry = {
    ...state.current,
    imageId: state.current.id,
    collectedAt: new Date().toISOString(),
  };

  const key = entryKey(entry);
  const idx = state.collected.findIndex((item) => entryKey(item) === key);
  if (idx === -1) {
    state.collected.unshift(entry);
  } else {
    state.collected[idx] = { ...state.collected[idx], ...entry };
  }

  state.collected = dedupeCollected(state.collected);
  storage.save(STORAGE_KEYS.collected, state.collected);

  if (!state.currentImage) {
    ensureImageForWord(state.current, false).catch(() => {});
  }

  if (state.view === 'gallery') {
    renderGallery();
  }

  await loadWord({ advance: true });
}

function skipCurrent() {
  if (state.loading) return;
  loadWord({ advance: true });
}

function toggleFavorite() {
  if (!state.current) return;

  if (state.favorites.has(state.current.id)) {
    state.favorites.delete(state.current.id);
  } else {
    state.favorites.add(state.current.id);
  }

  storage.save(STORAGE_KEYS.favorites, Array.from(state.favorites));
  updateCard();

  if (state.view === 'gallery') {
    renderGallery();
  }
}

function toggleFlip() {
  if (!state.current) return;
  state.flipped = !state.flipped;
  wordCard.classList.toggle('flipped', state.flipped);

  if (!state.flipped) return;

  if (state.currentImage) {
    updateArt(state.currentImage);
  } else {
    ensureImage();
  }
}

async function speakWord() {
  if (!state.current) return;

  const text = state.current.native;
  const lang = state.current.language || state.lang;
  const cacheKey = `audio-v2-${state.current.id}-${lang}`;

  try {
    if (state.audioCache.has(cacheKey)) {
      new Audio(state.audioCache.get(cacheKey)).play();
      return;
    }

    const cached = await idb.get('audio', cacheKey);
    if (cached) {
      const cachedUrl = URL.createObjectURL(cached);
      state.audioCache.set(cacheKey, cachedUrl);
      new Audio(cachedUrl).play();
      return;
    }

    const res = await fetch('/api/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang }),
    });

    if (!res.ok) return;

    const blob = await res.blob();
    await idb.set('audio', cacheKey, blob);
    const url = URL.createObjectURL(blob);
    state.audioCache.set(cacheKey, url);
    new Audio(url).play();
  } catch (err) {
    // Intentionally keep OpenAI TTS as the only source for pronunciation quality consistency.
  }
}

function chatKey() {
  return state.current ? `chat-${state.current.id}` : 'chat-default';
}

function renderChat() {
  chatBody.innerHTML = '';
  const messages = state.chat[chatKey()] || [];

  messages.forEach((message) => {
    const bubble = document.createElement('div');
    bubble.className = `chat-message ${message.role === 'user' ? 'user' : 'ai'}`;
    bubble.textContent = message.content;
    chatBody.appendChild(bubble);
  });

  chatBody.scrollTop = chatBody.scrollHeight;
}

function openAskModal() {
  askInput.value = '';

  const key = chatKey();
  if (!state.chat[key]) {
    state.chat[key] = [{ role: 'assistant', content: 'Ask me anything about this word or phrase.' }];
  }

  renderChat();
  askModal.classList.remove('hidden');
  askModal.setAttribute('aria-hidden', 'false');
  askInput.focus();
}

function closeAskModal() {
  askModal.classList.add('hidden');
  askModal.setAttribute('aria-hidden', 'true');
}

async function sendAskQuestion() {
  if (!state.current) return;
  const question = askInput.value.trim();
  if (!question) return;

  const key = chatKey();
  if (!state.chat[key]) state.chat[key] = [];

  state.chat[key].push({ role: 'user', content: question });
  const pendingIndex = state.chat[key].length;
  state.chat[key].push({ role: 'assistant', content: 'Thinking...' });
  askInput.value = '';
  renderChat();

  try {
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: state.chat[key].slice(-8), word: state.current }),
    });

    const data = await res.json().catch(() => ({}));
    state.chat[key][pendingIndex] = {
      role: 'assistant',
      content: res.ok ? data.answer || 'No response yet.' : 'Unable to reach the tutor right now.',
    };
  } catch (err) {
    state.chat[key][pendingIndex] = {
      role: 'assistant',
      content: 'Unable to reach the tutor right now.',
    };
  }

  renderChat();
}

function renderGallery() {
  galleryGrid.innerHTML = '';

  let filtered = state.collected;
  if (state.filter === 'favorites') {
    filtered = filtered.filter((item) => state.favorites.has(item.id));
  } else if (state.filter !== 'all') {
    filtered = filtered.filter((item) => item.language === state.filter);
  }
  const query = state.galleryQuery.trim().toLowerCase();
  if (query) {
    filtered = filtered.filter((item) =>
      [item.native, item.romanization, item.meaning_en, item.type]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }

  if (statTotalWords) statTotalWords.textContent = String(state.collected.length);
  if (statFavorites) {
    const favoriteCount = state.collected.filter((item) => state.favorites.has(item.id)).length;
    statFavorites.textContent = String(favoriteCount);
  }
  if (statLanguages) {
    const languageCount = new Set(state.collected.map((item) => item.language)).size;
    statLanguages.textContent = String(languageCount);
  }
  if (statShowing) statShowing.textContent = String(filtered.length);

  if (!filtered.length) {
    const empty = document.createElement('p');
    if (state.galleryQuery.trim()) {
      empty.textContent = 'No words match your search.';
    } else {
      empty.textContent = state.filter === 'favorites' ? 'No favorited words yet.' : 'Collect words to build your gallery.';
    }
    empty.style.color = 'var(--muted)';
    galleryGrid.appendChild(empty);
    return;
  }

  filtered.forEach((entry) => {
    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'gallery-card';

    const flip = document.createElement('div');
    flip.className = 'flip-card';

    const front = document.createElement('article');
    front.className = 'card-face card-front';

    const meta = document.createElement('div');
    meta.className = 'card-meta';

    const pronounce = document.createElement('span');
    pronounce.className = 'pronounce';
    pronounce.textContent = entry.romanization;

    const badge = document.createElement('span');
    badge.className = 'type-pill';
    badge.textContent = entry.type;

    meta.append(pronounce, badge);

    const preview = document.createElement('div');
    preview.className = 'art-frame gallery-preview';

    const previewLoading = document.createElement('div');
    previewLoading.className = 'art-loading';
    previewLoading.textContent = 'Loading art...';

    const previewImg = document.createElement('img');
    previewImg.alt = 'Collected illustration preview';

    preview.append(previewLoading, previewImg);

    const native = document.createElement('h2');
    native.className = 'native-word';
    native.textContent = entry.native;
    if (LANG_CONFIG[entry.language]?.dir === 'rtl') native.classList.add('rtl');

    const meaning = document.createElement('p');
    meaning.className = 'meaning';
    meaning.textContent = entry.meaning_en;

    front.append(preview, meta, native, meaning);

    const back = document.createElement('article');
    back.className = 'card-face card-back';

    const frame = document.createElement('div');
    frame.className = 'art-frame';

    const loading = document.createElement('div');
    loading.className = 'art-loading';
    loading.textContent = 'Loading art...';

    const img = document.createElement('img');
    img.alt = 'Collected illustration';

    frame.append(loading, img);

    const sentence = document.createElement('div');
    sentence.className = 'sentence';

    const sNative = document.createElement('p');
    sNative.className = 'sentence-native';
    sNative.textContent = entry.sentence.native;
    if (LANG_CONFIG[entry.language]?.dir === 'rtl') sNative.classList.add('rtl');

    const sRoman = document.createElement('p');
    sRoman.className = 'sentence-roman';
    sRoman.textContent = entry.sentence.romanization;

    const sMeaning = document.createElement('p');
    sMeaning.className = 'sentence-meaning';
    sMeaning.textContent = entry.sentence.meaning_en;

    sentence.append(sNative, sRoman, sMeaning);
    back.append(frame, sentence);

    flip.append(front, back);
    cardWrapper.appendChild(flip);
    galleryGrid.appendChild(cardWrapper);

    flip.addEventListener('click', () => {
      flip.classList.toggle('flipped');
    });

    idb.get('images', entry.imageId).then((base64) => {
      if (!base64) {
        loading.textContent = 'No art yet.';
        previewLoading.textContent = 'No art yet.';
        return;
      }
      const dataUrl = toImageDataUrl(base64);
      img.src = dataUrl;
      previewImg.src = dataUrl;
      frame.classList.add('loaded');
      preview.classList.add('loaded');
      loading.textContent = '';
      previewLoading.textContent = '';
    });
  });
}

function shuffle(array) {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

function buildQuiz() {
  const quizFilter = state.filter === 'favorites' ? 'all' : state.filter;
  const pool =
    quizFilter === 'all'
      ? state.collected
      : state.collected.filter((item) => item.language === quizFilter);

  if (pool.length < 2) {
    quizMeta.textContent = 'Collect at least 2 words to start the quiz.';
    quizQuestion.textContent = '—';
    if (quizSceneImage) {
      quizSceneImage.removeAttribute('src');
      quizSceneImage.style.display = 'none';
    }
    if (quizSceneFallback) {
      quizSceneFallback.hidden = false;
      quizSceneFallback.textContent = 'Collect words with images to enable visual quiz mode.';
    }
    if (quizSceneCaption) {
      quizSceneCaption.textContent = 'Image context from your collected card.';
    }
    quizOptions.innerHTML = '';
    quizNextBtn.disabled = true;
    return;
  }

  const questions = shuffle(pool).slice(0, 8).map((entry) => ({
    type: shuffle(['meaning', 'translation', 'pronunciation'])[0],
    entry,
  }));

  state.quiz = {
    questions,
    index: 0,
    score: 0,
    locked: false,
  };

  renderQuizQuestion();
}

async function renderQuizScene(entry) {
  if (!quizSceneImage || !quizSceneFallback || !entry) return;
  const imageId = entry.imageId || entry.id;

  if (!imageId) {
    quizSceneImage.removeAttribute('src');
    quizSceneImage.style.display = 'none';
    quizSceneFallback.hidden = false;
    if (quizSceneCaption) quizSceneCaption.textContent = 'No image available for this word yet.';
    return;
  }

  const base64 = await idb.get('images', imageId);
  if (!base64) {
    quizSceneImage.removeAttribute('src');
    quizSceneImage.style.display = 'none';
    quizSceneFallback.hidden = false;
    if (quizSceneCaption) quizSceneCaption.textContent = 'Collect this card once to cache its scene image.';
    return;
  }

  quizSceneImage.src = toImageDataUrl(base64);
  quizSceneImage.style.display = 'block';
  quizSceneFallback.hidden = true;
  if (quizSceneCaption) quizSceneCaption.textContent = entry.sentence?.meaning_en || entry.meaning_en || 'Image context';
}

function renderQuizQuestion() {
  const { questions, index, score } = state.quiz;
  const current = questions[index];

  if (!current) {
    quizMeta.textContent = `Done! Score ${score}/${questions.length}`;
    quizQuestion.textContent = 'Great job!';
    if (quizSceneImage) {
      quizSceneImage.removeAttribute('src');
      quizSceneImage.style.display = 'none';
    }
    if (quizSceneFallback) {
      quizSceneFallback.hidden = false;
      quizSceneFallback.textContent = 'Quiz completed. Press Restart to run another round.';
    }
    quizOptions.innerHTML = '';
    quizNextBtn.disabled = false;
    quizNextBtn.textContent = 'Restart';
    quizNextBtn.onclick = () => buildQuiz();
    return;
  }

  quizNextBtn.disabled = true;
  quizNextBtn.textContent = 'Next';
  quizOptions.innerHTML = '';
  state.quiz.locked = false;

  const entry = current.entry;
  const quizFilter = state.filter === 'favorites' ? 'all' : state.filter;
  const optionPoolBase =
    quizFilter === 'all'
      ? state.collected.filter((item) => item.id !== entry.id)
      : state.collected.filter((item) => item.language === quizFilter && item.id !== entry.id);

  const optionsPool = shuffle(optionPoolBase).slice(0, 3);

  let questionText = '';
  let correct = '';
  let options = [];

  if (current.type === 'meaning') {
    questionText = `What does “${entry.native}” mean?`;
    correct = entry.meaning_en;
    options = shuffle([correct, ...optionsPool.map((item) => item.meaning_en)]);
  } else if (current.type === 'translation') {
    questionText = `Pick the ${LANG_CONFIG[entry.language]?.label || ''} phrase for: ${entry.meaning_en}`;
    correct = entry.native;
    options = shuffle([correct, ...optionsPool.map((item) => item.native)]);
  } else {
    questionText = `Which pronunciation matches “${entry.native}”?`;
    correct = entry.romanization;
    options = shuffle([correct, ...optionsPool.map((item) => item.romanization)]);
  }

  quizMeta.textContent = `Question ${index + 1}/${questions.length} - Score ${score}`;
  quizQuestion.textContent = questionText;
  void renderQuizScene(entry);

  options.forEach((option) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = option;
    btn.addEventListener('click', () => handleAnswer(btn, option === correct));
    quizOptions.appendChild(btn);
  });
}

function handleAnswer(btn, isCorrect) {
  if (state.quiz.locked) return;
  state.quiz.locked = true;

  const { questions, index } = state.quiz;
  const buttons = quizOptions.querySelectorAll('.quiz-option');

  buttons.forEach((button) => {
    if (button === btn && isCorrect) button.classList.add('correct');
    if (button === btn && !isCorrect) button.classList.add('wrong');
  });

  if (isCorrect) state.quiz.score += 1;

  quizNextBtn.disabled = false;
  quizNextBtn.onclick = () => {
    state.quiz.index += 1;
    if (!questions[index + 1]) {
      renderQuizQuestion();
      return;
    }
    renderQuizQuestion();
  };
}

wordCard.addEventListener('click', (event) => {
  if (event.target.closest('button')) return;
  toggleFlip();
});

skipBtn.addEventListener('click', skipCurrent);
collectBtn.addEventListener('click', collectCurrent);
favBtn.addEventListener('click', toggleFavorite);
speakBtn.addEventListener('click', speakWord);

askBtn.addEventListener('click', openAskModal);
closeAsk.addEventListener('click', closeAskModal);
askModal.addEventListener('click', (event) => {
  if (event.target === askModal) closeAskModal();
});
sendAsk.addEventListener('click', sendAskQuestion);

langButtons.forEach((btn) => {
  btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
});

viewButtons.forEach((btn) => {
  btn.addEventListener('click', () => setView(btn.dataset.view));
});

if (gallerySearch) {
  gallerySearch.addEventListener('input', (event) => {
    state.galleryQuery = event.target.value || '';
    if (state.view === 'gallery') {
      renderGallery();
    }
  });
}

function initIndices() {
  const saved = storage.load(STORAGE_KEYS.indices, null);
  if (
    saved &&
    Number.isFinite(saved.en) &&
    Number.isFinite(saved.uk) &&
    Number.isFinite(saved.fa)
  ) {
    state.indices = {
      en: ((Math.trunc(saved.en) % BANK_SIZE) + BANK_SIZE) % BANK_SIZE,
      uk: ((Math.trunc(saved.uk) % BANK_SIZE) + BANK_SIZE) % BANK_SIZE,
      fa: ((Math.trunc(saved.fa) % BANK_SIZE) + BANK_SIZE) % BANK_SIZE,
    };
    return;
  }

  const base = dayOfYear() % BANK_SIZE;
  state.indices = {
    en: base,
    uk: (base + 121) % BANK_SIZE,
    fa: (base + 243) % BANK_SIZE,
  };
  persistIndices();
}

function init() {
  initIndices();
  const rawCollected = storage.load(STORAGE_KEYS.collected, []);
  const sanitized = rawCollected
    .map((item) => sanitizeLegacyEntry(item))
    .filter((item) => item && LANG_CONFIG[item.language]);
  state.collected = dedupeCollected(sanitized);
  storage.save(STORAGE_KEYS.collected, state.collected);
  state.favorites = new Set(storage.load(STORAGE_KEYS.favorites, []));

  if (allLangBtn) {
    allLangBtn.hidden = true;
  }
  if (favoritesLangBtn) {
    favoritesLangBtn.hidden = true;
  }
  if (gallerySearch) {
    gallerySearch.value = '';
  }

  state.filter = state.lang;
  if (quizSceneFallback) {
    quizSceneFallback.hidden = false;
  }
  updateTopLangUI();
  loadWord({ advance: false });
}

init();
