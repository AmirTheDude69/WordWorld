const LANG_CONFIG = {
  en: { label: 'English', locale: 'en-US', dir: 'ltr' },
  uk: { label: 'Ukrainian', locale: 'uk-UA', dir: 'ltr' },
  fa: { label: 'Persian', locale: 'fa-IR', dir: 'rtl' },
};

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
const viewButtons = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');

const galleryGrid = document.getElementById('galleryGrid');

const askModal = document.getElementById('askModal');
const askInput = document.getElementById('askInput');
const chatBody = document.getElementById('chatBody');
const sendAsk = document.getElementById('sendAsk');
const closeAsk = document.getElementById('closeAsk');

const quizMeta = document.getElementById('quizMeta');
const quizQuestion = document.getElementById('quizQuestion');
const quizOptions = document.getElementById('quizOptions');
const quizNextBtn = document.getElementById('quizNextBtn');
const allLangBtn = document.querySelector('.lang-btn[data-lang="all"]');

const state = {
  lang: 'en',
  view: 'learning',
  filter: 'en',
  current: null,
  currentImage: null,
  flipped: false,
  loading: false,
  collected: [],
  favorites: new Set(),
  prefetch: { en: [], uk: [], fa: [] },
  audioCache: new Map(),
  chat: {},
  quiz: {
    questions: [],
    index: 0,
    score: 0,
    locked: false,
  },
};

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

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function setLoading(isLoading) {
  state.loading = isLoading;
  collectBtn.disabled = isLoading;
  skipBtn.disabled = isLoading;
  speakBtn.disabled = isLoading;
}

function setView(view) {
  state.view = view;
  views.forEach((section) => {
    section.classList.toggle('active', section.dataset.view === view);
  });
  viewButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  if (allLangBtn) {
    allLangBtn.hidden = view === 'learning';
  }
  updateTopLangUI();
  if (view === 'gallery') {
    renderGallery();
  }
  if (view === 'quiz') {
    buildQuiz();
  }
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
  if (!LANG_CONFIG[lang]) return;
  if (state.view === 'learning') {
    state.lang = lang;
    state.filter = lang;
    updateTopLangUI();
    loadWord({ forceNew: false });
  } else {
    state.filter = lang;
    updateTopLangUI();
    if (state.view === 'gallery') renderGallery();
    if (state.view === 'quiz') buildQuiz();
  }
}

function updateCard() {
  if (!state.current) return;
  const langMeta = LANG_CONFIG[state.lang];
  const isRtl = langMeta.dir === 'rtl';

  wordPronounce.textContent = state.current.romanization || '—';
  wordNative.textContent = state.current.native;
  wordType.textContent = state.current.type;
  wordMeaning.textContent = state.current.meaning_en;
  sentenceNative.textContent = state.current.sentence.native;
  sentenceRoman.textContent = state.current.sentence.romanization;
  sentenceMeaning.textContent = state.current.sentence.meaning_en;

  [wordNative, sentenceNative].forEach((el) => {
    el.classList.toggle('rtl', isRtl);
  });

  wordCard.classList.toggle('flipped', state.flipped);

  const isFavorite = state.favorites.has(state.current.id);
  favBtn.classList.toggle('active', isFavorite);
  favBtn.querySelector('.icon').textContent = isFavorite ? '★' : '☆';

  resetArt();
}

function resetArt() {
  artFrame.classList.remove('loaded');
  artImage.removeAttribute('src');
  artLoading.textContent = 'Painting the scene…';
  state.currentImage = null;
}

function updateArt(base64) {
  if (!base64) return;
  const dataUrl = `data:image/png;base64,${base64}`;
  artImage.src = dataUrl;
  artFrame.classList.add('loaded');
  artLoading.textContent = '';
  state.currentImage = base64;
}

function chatKey() {
  return state.current ? `chat-${state.current.id}` : 'chat-default';
}

function renderChat() {
  if (!chatBody) return;
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

async function ensureImage() {
  if (!state.current) return;
  const cached = await idb.get('images', state.current.id);
  if (cached) {
    updateArt(cached);
    return;
  }

  artLoading.textContent = 'Painting the scene…';
  const res = await fetch('/api/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: state.current.image_prompt }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    artLoading.textContent = data.details || data.error || 'Unable to create art.';
    return;
  }
  if (data.image_base64) {
    await idb.set('images', state.current.id, data.image_base64);
    updateArt(data.image_base64);
  }
}

async function prefetchWord(lang) {
  if (!LANG_CONFIG[lang]) return;
  if (state.prefetch[lang].length >= 2) return;
  try {
    const res = await fetch(`/api/word?lang=${lang}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data?.id) state.prefetch[lang].push(data);
  } catch (err) {
    // ignore prefetch errors
  }
}

async function loadWord({ forceNew }) {
  setLoading(true);
  state.flipped = false;
  wordCard.classList.remove('flipped');

  const cache = storage.load('www.dailyCache', { date: '', items: {} });
  const today = todayKey();
  if (!forceNew && cache.date === today && cache.items?.[state.lang]) {
    state.current = cache.items[state.lang];
    updateCard();
    prefetchWord(state.lang);
    setLoading(false);
    return;
  }

  try {
    let data = null;
    if (state.prefetch[state.lang].length > 0) {
      data = state.prefetch[state.lang].shift();
    } else {
      const res = await fetch(`/api/word?lang=${state.lang}`);
      data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data.error || 'Unable to load a new word.';
        const detail = data.details ? ` (${data.details})` : '';
        throw new Error(`${message}${detail}`);
      }
    }
    state.current = data;

    const nextCache = {
      date: today,
      items: { ...(cache.items || {}), [state.lang]: data },
    };
    storage.save('www.dailyCache', nextCache);
    updateCard();
    prefetchWord(state.lang);
  } catch (err) {
    const message = err?.message || 'Unable to load a new word.';
    wordPronounce.textContent = message.includes('OPENAI_API_KEY') ? 'API key missing' : 'Offline';
    wordNative.textContent = 'Try again';
    wordType.textContent = '—';
    wordMeaning.textContent = message;
  } finally {
    setLoading(false);
  }
}

async function collectCurrent() {
  if (!state.current) return;
  setLoading(true);

  if (!state.currentImage) {
    await ensureImage();
  }

  const entry = {
    ...state.current,
    imageId: state.current.id,
    collectedAt: new Date().toISOString(),
  };

  const exists = state.collected.find((item) => item.id === entry.id);
  if (!exists) {
    state.collected.unshift(entry);
  }

  storage.save('www.collected', state.collected);
  setLoading(false);
  renderGallery();
  loadWord({ forceNew: true });
}

function toggleFavorite() {
  if (!state.current) return;
  if (state.favorites.has(state.current.id)) {
    state.favorites.delete(state.current.id);
  } else {
    state.favorites.add(state.current.id);
  }
  storage.save('www.favorites', Array.from(state.favorites));
  updateCard();
  renderGallery();
}

function toggleFlip() {
  state.flipped = !state.flipped;
  wordCard.classList.toggle('flipped', state.flipped);
  if (state.flipped && !state.currentImage) {
    ensureImage();
  }
}

async function speakWord() {
  if (!state.current) return;
  const text = state.current.native;
  const cacheKey = `audio-${state.current.id}`;

  if (state.audioCache.has(cacheKey)) {
    const url = state.audioCache.get(cacheKey);
    const audio = new Audio(url);
    audio.play();
    return;
  }

  const cached = await idb.get('audio', cacheKey);
  if (cached) {
    const url = URL.createObjectURL(cached);
    state.audioCache.set(cacheKey, url);
    const audio = new Audio(url);
    audio.play();
    return;
  }

  try {
    const res = await fetch('/api/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang: state.lang }),
    });

    if (!res.ok) throw new Error('TTS failed');

    const blob = await res.blob();
    await idb.set('audio', cacheKey, blob);
    const url = URL.createObjectURL(blob);
    state.audioCache.set(cacheKey, url);
    const audio = new Audio(url);
    audio.play();
  } catch (err) {
    // Keep OpenAI TTS as the only pronunciation source.
  }
}

function openAskModal() {
  askInput.value = '';
  if (!state.chat[chatKey()]) {
    state.chat[chatKey()] = [
      { role: 'assistant', content: 'Ask me anything about this word or phrase.' },
    ];
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
  const placeholderIndex = state.chat[key].length;
  state.chat[key].push({ role: 'assistant', content: 'Thinking…' });
  renderChat();
  askInput.value = '';

  try {
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: state.chat[key].slice(-6), word: state.current }),
    });
    if (!res.ok) throw new Error('Ask failed');
    const data = await res.json();
    state.chat[key][placeholderIndex] = {
      role: 'assistant',
      content: data.answer || 'No response yet.',
    };
    renderChat();
  } catch (err) {
    state.chat[key][placeholderIndex] = {
      role: 'assistant',
      content: 'Unable to reach the tutor right now.',
    };
    renderChat();
  }
}

function renderGallery() {
  galleryGrid.innerHTML = '';
  const filtered =
    state.filter === 'all'
      ? state.collected
      : state.collected.filter((item) => item.language === state.filter);

  if (!filtered.length) {
    const empty = document.createElement('p');
    empty.textContent = 'Collect words to build your gallery.';
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

    const native = document.createElement('h2');
    native.className = 'native-word';
    native.textContent = entry.native;
    if (LANG_CONFIG[entry.language]?.dir === 'rtl') native.classList.add('rtl');

    const meaning = document.createElement('p');
    meaning.className = 'meaning';
    meaning.textContent = entry.meaning_en;

    front.append(meta, native, meaning);

    const back = document.createElement('article');
    back.className = 'card-face card-back';

    const frame = document.createElement('div');
    frame.className = 'art-frame';
    const loading = document.createElement('div');
    loading.className = 'art-loading';
    loading.textContent = 'Loading art…';
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
        return;
      }
      img.src = `data:image/png;base64,${base64}`;
      frame.classList.add('loaded');
      loading.textContent = '';
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
  const pool =
    state.filter === 'all'
      ? state.collected
      : state.collected.filter((item) => item.language === state.filter);

  if (pool.length < 2) {
    quizMeta.textContent = 'Collect at least 2 words to start the quiz.';
    quizQuestion.textContent = '—';
    quizOptions.innerHTML = '';
    quizNextBtn.disabled = true;
    return;
  }

  const questions = shuffle(pool).slice(0, 8).map((entry) => {
    const type = shuffle(['meaning', 'translation', 'pronunciation'])[0];
    return { type, entry };
  });

  state.quiz = {
    questions,
    index: 0,
    score: 0,
    locked: false,
  };

  renderQuizQuestion();
}

function renderQuizQuestion() {
  const { questions, index, score } = state.quiz;
  const current = questions[index];
  if (!current) {
    quizMeta.textContent = `Done! Score ${score}/${questions.length}`;
    quizQuestion.textContent = 'Great job!';
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
  const optionsPool = shuffle(
    state.filter === 'all'
      ? state.collected.filter((item) => item.id !== entry.id)
      : state.collected.filter((item) => item.language === state.filter && item.id !== entry.id),
  ).slice(0, 3);

  let questionText = '';
  let correct = '';
  let options = [];

  if (current.type === 'meaning') {
    questionText = `What does “${entry.native}” mean?`;
    correct = entry.meaning_en;
    options = shuffle([correct, ...optionsPool.map((item) => item.meaning_en)]);
  } else if (current.type === 'translation') {
    questionText = `Pick the ${LANG_CONFIG[entry.language]?.label || ''} word for: ${entry.meaning_en}`;
    correct = entry.native;
    options = shuffle([correct, ...optionsPool.map((item) => item.native)]);
  } else {
    questionText = `Which pronunciation matches “${entry.native}”?`;
    correct = entry.romanization;
    options = shuffle([correct, ...optionsPool.map((item) => item.romanization)]);
  }

  quizMeta.textContent = `Question ${index + 1}/${questions.length} · Score ${score}`;
  quizQuestion.textContent = questionText;

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
    const isAnswer = button === btn;
    if (isAnswer && isCorrect) button.classList.add('correct');
    if (isAnswer && !isCorrect) button.classList.add('wrong');
  });

  if (isCorrect) state.quiz.score += 1;
  quizNextBtn.disabled = false;

  quizNextBtn.onclick = () => {
    if (!questions[index + 1]) {
      state.quiz.index += 1;
      renderQuizQuestion();
      return;
    }
    state.quiz.index += 1;
    renderQuizQuestion();
  };
}

wordCard.addEventListener('click', (event) => {
  if (event.target.closest('button')) return;
  toggleFlip();
});

skipBtn.addEventListener('click', () => loadWord({ forceNew: true }));
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

function updateTopLangUI() {
  const active = state.view === 'learning' ? state.lang : state.filter;
  langButtons.forEach((btn) => {
    const isActive = btn.dataset.lang === active;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

function init() {
  state.collected = storage.load('www.collected', []);
  const favs = storage.load('www.favorites', []);
  state.favorites = new Set(favs);
  state.filter = state.lang;
  updateTopLangUI();
  loadWord({ forceNew: false });
  Object.keys(LANG_CONFIG).forEach((lang) => prefetchWord(lang));
}

init();
