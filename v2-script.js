/* =========================================================
   V2 — Polaroid Memory Wall — interactions
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initPhotoWall();
  initScrollReveal();
  initMusic();
  initCake();
  initPolaroidGallery();
  initQuiz();
  initNotes();
  initLightbox();
  initConfetti();
  initReplay();

  setTimeout(() => fireConfetti({ count: 180, spread: 80, duration: 3500 }), 350);
});

/* ---------------------------------------------------------
   Background photo wall — 4 scrolling columns of polaroids
--------------------------------------------------------- */
function initPhotoWall() {
  const wall = document.getElementById('photo-wall');
  if (!wall || typeof PHOTOS === 'undefined' || !PHOTOS.length) return;

  const COL_COUNT = 4;
  const COL_SPEEDS = [85, 110, 95, 120]; // seconds per loop — slower = more cinematic

  // Shuffle a copy so each column gets a different order
  const shuffled = shuffle([...PHOTOS]);

  // Distribute photos into columns round-robin
  const columns = Array.from({ length: COL_COUNT }, () => []);
  shuffled.forEach((p, i) => columns[i % COL_COUNT].push(p));

  columns.forEach((photos, idx) => {
    const col = document.createElement('div');
    col.className = `photo-column col-${idx + 1}`;
    col.style.animationDuration = `${COL_SPEEDS[idx]}s`;

    // We duplicate the photos in the column so the loop is seamless
    // (the keyframe translateY(-50%) lands on the start of the second copy)
    const fill = [...photos, ...photos];
    fill.forEach((p, n) => {
      const card = document.createElement('div');
      card.className = 'wall-poly';
      card.style.setProperty('--tilt', `${(Math.random() * 8 - 4).toFixed(2)}deg`);
      const img = document.createElement('img');
      img.src = p.src;
      img.alt = '';
      img.loading = 'lazy';
      card.appendChild(img);
      col.appendChild(card);
    });
    wall.appendChild(col);
  });
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ---------------------------------------------------------
   Scroll reveal
--------------------------------------------------------- */
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ---------------------------------------------------------
   Music toggle
--------------------------------------------------------- */
function initMusic() {
  const btn = document.getElementById('music-toggle');
  const audio = document.getElementById('bg-audio');
  if (!btn || !audio) return;

  let canPlay = false;
  audio.addEventListener('canplay', () => { canPlay = true; });
  audio.addEventListener('error', () => btn.classList.add('hidden'));

  btn.addEventListener('click', () => {
    if (audio.paused) {
      const p = audio.play();
      if (p && p.catch) p.catch(() => {});
      btn.classList.add('playing');
    } else {
      audio.pause();
      btn.classList.remove('playing');
    }
  });

  setTimeout(() => {
    if (!canPlay && audio.readyState === 0) btn.classList.add('hidden');
  }, 2500);
}

/* ---------------------------------------------------------
   Cake (same as v1)
--------------------------------------------------------- */
function initCake() {
  const cake = document.getElementById('cake');
  const wish = document.getElementById('wish-message');
  const relight = document.getElementById('relight-btn');
  if (!cake) return;

  const blow = () => {
    if (cake.classList.contains('blown')) return;
    cake.classList.add('blown');
    setTimeout(() => {
      wish.classList.add('visible');
      fireConfetti({ count: 120, spread: 70, duration: 2500, origin: 'cake' });
      relight.classList.add('visible');
    }, 900);
  };

  cake.addEventListener('click', blow);
  cake.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); blow(); }
  });
  relight.addEventListener('click', () => {
    cake.classList.remove('blown');
    wish.classList.remove('visible');
    relight.classList.remove('visible');
  });
}

/* ---------------------------------------------------------
   Polaroid Gallery (centerpiece carousel)
--------------------------------------------------------- */
const galleryState = { photos: [], index: 0, timer: null };

function initPolaroidGallery() {
  const stage = document.getElementById('polaroid-stage');
  const counter = document.getElementById('poly-counter');
  const prev = document.getElementById('poly-prev');
  const next = document.getElementById('poly-next');
  if (!stage) return;

  galleryState.photos = (typeof PHOTOS !== 'undefined' && PHOTOS.length) ? PHOTOS : [];
  if (!galleryState.photos.length) {
    counter.textContent = 'Add photos to v2-photos.js to populate the gallery';
    return;
  }

  galleryState.photos.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'polaroid hidden';
    card.dataset.index = i;
    card.innerHTML = `
      <img src="${escapeAttr(p.src)}" alt="${escapeAttr(p.caption || `Photo ${i + 1}`)}" loading="lazy" />
      ${getCaption(i) ? `<div class="poly-caption">${escapeHtml(getCaption(i))}</div>` : ''}
    `;
    card.addEventListener('click', () => {
      if (card.classList.contains('active')) openLightbox(i);
      else goToPolaroid(i);
    });
    stage.appendChild(card);
  });

  prev.addEventListener('click', () => { restartTimer(); goToPolaroid(galleryState.index - 1); });
  next.addEventListener('click', () => { restartTimer(); goToPolaroid(galleryState.index + 1); });
  stage.addEventListener('mouseenter', stopTimer);
  stage.addEventListener('mouseleave', startTimer);

  goToPolaroid(0);
  startTimer();
}

function getCaption(i) {
  if (typeof GALLERY_CAPTIONS !== 'undefined' && GALLERY_CAPTIONS[i]) return GALLERY_CAPTIONS[i];
  const p = galleryState.photos[i];
  return p && p.caption ? p.caption : '';
}

function goToPolaroid(i) {
  const stage = document.getElementById('polaroid-stage');
  const counter = document.getElementById('poly-counter');
  const cards = stage.querySelectorAll('.polaroid');
  const n = cards.length;
  if (!n) return;
  const idx = ((i % n) + n) % n;
  galleryState.index = idx;
  const prevIdx = (idx - 1 + n) % n;
  const nextIdx = (idx + 1) % n;
  cards.forEach((c, k) => {
    c.classList.remove('active', 'prev', 'next', 'hidden');
    if (k === idx) c.classList.add('active');
    else if (k === prevIdx) c.classList.add('prev');
    else if (k === nextIdx) c.classList.add('next');
    else c.classList.add('hidden');
  });
  counter.textContent = `${idx + 1} / ${n}`;
}

function startTimer() {
  stopTimer();
  if (galleryState.photos.length > 1) {
    galleryState.timer = setInterval(() => goToPolaroid(galleryState.index + 1), 4200);
  }
}
function stopTimer() {
  if (galleryState.timer) { clearInterval(galleryState.timer); galleryState.timer = null; }
}
function restartTimer() { stopTimer(); startTimer(); }

/* ---------------------------------------------------------
   Lightbox — click featured polaroid to enlarge
--------------------------------------------------------- */
const lightboxState = { open: false, index: 0 };

function initLightbox() {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  const close = document.getElementById('lightbox-close');
  const prev = document.getElementById('lightbox-prev');
  const next = document.getElementById('lightbox-next');
  if (!lb) return;

  close.addEventListener('click', closeLightbox);
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
  prev.addEventListener('click', () => navigateLightbox(-1));
  next.addEventListener('click', () => navigateLightbox(1));
  document.addEventListener('keydown', (e) => {
    if (!lightboxState.open) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  });
}

function openLightbox(i) {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  lightboxState.open = true;
  lightboxState.index = i;
  img.src = galleryState.photos[i].src;
  lb.classList.add('open');
  lb.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  const lb = document.getElementById('lightbox');
  lightboxState.open = false;
  lb.classList.remove('open');
  lb.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
function navigateLightbox(delta) {
  const n = galleryState.photos.length;
  if (!n) return;
  lightboxState.index = ((lightboxState.index + delta) % n + n) % n;
  document.getElementById('lightbox-img').src = galleryState.photos[lightboxState.index].src;
  goToPolaroid(lightboxState.index);
}

/* ---------------------------------------------------------
   Quiz — "How well do you know us?"
   ---------------------------------------------------------
   State model:
     current   = the latest unanswered question index (new answers land here)
     viewing   = which question is currently shown (≤ current)
     answers   = answers[i] is the option index she chose for question i
     finished  = true once she has answered the last question
     locked    = prevents double-click during the reveal animation
--------------------------------------------------------- */
const quizState = {
  current: 0,
  viewing: 0,
  score: 0,
  answers: [],
  finished: false,
  locked: false
};

function initQuiz() {
  const questions = (typeof QUIZ_QUESTIONS !== 'undefined' && QUIZ_QUESTIONS.length) ? QUIZ_QUESTIONS : [];
  if (!questions.length) return;

  // Dynamic subtitle so it stays in sync with however many questions exist
  const sub = document.getElementById('quiz-sub');
  if (sub) sub.textContent = `${numberWord(questions.length)} questions, answer honestly!`;

  buildQuizProgress(questions.length);

  document.getElementById('quiz-restart').addEventListener('click', resetQuiz);
  document.getElementById('quiz-prev').addEventListener('click', () => navigateQuiz(-1));
  document.getElementById('quiz-next').addEventListener('click', () => navigateQuiz(1));
  document.getElementById('quiz-to-result').addEventListener('click', showResultFromReview);
  document.getElementById('quiz-review').addEventListener('click', startReviewFromResult);

  renderQuizQuestion();
}

function numberWord(n) {
  return ['zero','one','two','three','four','five','six','seven','eight','nine','ten'][n] || String(n);
}

function buildQuizProgress(count) {
  const bar = document.getElementById('quiz-progress');
  if (!bar) return;
  bar.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('span');
    dot.className = 'dot';
    bar.appendChild(dot);
  }
}

function updateQuizProgress() {
  const dots = document.querySelectorAll('#quiz-progress .dot');
  dots.forEach((d, i) => {
    d.classList.remove('current', 'done');
    if (i < quizState.current) d.classList.add('done');
    if (i === quizState.viewing) d.classList.add('current');
  });
}

function renderQuizQuestion() {
  const q = QUIZ_QUESTIONS[quizState.viewing];
  if (!q) return finishQuiz();

  document.getElementById('quiz-stage').hidden = false;
  document.getElementById('quiz-result').hidden = true;

  const total = QUIZ_QUESTIONS.length;
  const isReview = quizState.viewing < quizState.current;

  document.getElementById('quiz-counter').textContent =
    `question ${quizState.viewing + 1} of ${total}${isReview ? ' (reviewing)' : ''}`;
  document.getElementById('quiz-question').textContent = q.question;

  const optsBox = document.getElementById('quiz-options');
  optsBox.innerHTML = '';
  const chosen = quizState.answers[quizState.viewing];

  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quiz-option';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', i === chosen ? 'true' : 'false');
    btn.dataset.index = String(i);
    btn.textContent = opt;

    if (isReview) {
      // Locked view: show her answer and the correct one
      btn.disabled = true;
      if (i === chosen) btn.classList.add('selected');
      if (i === q.correctIndex) btn.classList.add('correct');
      else if (i === chosen)    btn.classList.add('incorrect');
    } else {
      btn.addEventListener('click', () => handleQuizAnswer(i));
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleQuizAnswer(i); }
      });
    }
    optsBox.appendChild(btn);
  });

  // Feedback line
  const fb = document.getElementById('quiz-feedback');
  if (isReview) {
    const wasCorrect = chosen === q.correctIndex;
    fb.textContent = wasCorrect ? 'you got this one!' : `correct answer: ${q.options[q.correctIndex]}`;
  } else {
    fb.textContent = '';
  }

  quizState.locked = false;
  updateQuizProgress();
  updateQuizNav();
}

function updateQuizNav() {
  const prevBtn = document.getElementById('quiz-prev');
  const nextBtn = document.getElementById('quiz-next');
  const resultBtn = document.getElementById('quiz-to-result');

  // Previous: shown whenever there's a question behind to look at
  prevBtn.hidden = quizState.viewing === 0;

  // Next: only when reviewing an already-answered question
  const isReview = quizState.viewing < quizState.current;
  nextBtn.hidden = !isReview;

  // See result: only when reviewing AND the quiz is finished
  resultBtn.hidden = !(isReview && quizState.finished);
}

function handleQuizAnswer(chosenIndex) {
  if (quizState.locked) return;
  // Only allowed on the current (unanswered) question
  if (quizState.viewing !== quizState.current) return;
  quizState.locked = true;

  const q = QUIZ_QUESTIONS[quizState.viewing];
  const buttons = document.querySelectorAll('#quiz-options .quiz-option');
  const correct = chosenIndex === q.correctIndex;

  // Store the answer immediately so it survives navigation
  quizState.answers[quizState.current] = chosenIndex;
  if (correct) quizState.score++;

  buttons.forEach((b, i) => {
    b.disabled = true;
    b.setAttribute('aria-checked', i === chosenIndex ? 'true' : 'false');
    if (i === chosenIndex) b.classList.add('selected');
  });

  // Reveal correct/incorrect after a short beat
  setTimeout(() => {
    buttons.forEach((b, i) => {
      if (i === q.correctIndex) b.classList.add('correct');
      else if (i === chosenIndex) b.classList.add('incorrect');
    });
    document.getElementById('quiz-feedback').textContent =
      correct ? 'nailed it!' : `the answer was: ${q.options[q.correctIndex]}`;

    // Advance the cursor
    setTimeout(() => {
      quizState.current++;
      quizState.viewing = quizState.current;
      if (quizState.current >= QUIZ_QUESTIONS.length) {
        quizState.finished = true;
        finishQuiz();
      } else {
        renderQuizQuestion();
      }
    }, 1400);
  }, 800);
}

function navigateQuiz(delta) {
  const total = QUIZ_QUESTIONS.length;
  const target = quizState.viewing + delta;
  // Don't navigate past the current frontier (no peeking at unanswered questions)
  if (target < 0 || target > quizState.current || target >= total) return;
  quizState.viewing = target;
  renderQuizQuestion();
}

function finishQuiz() {
  document.getElementById('quiz-stage').hidden = true;
  document.getElementById('quiz-result').hidden = false;

  const total = QUIZ_QUESTIONS.length;
  const s = quizState.score;
  document.getElementById('quiz-score').textContent = `${s} / ${total}`;
  document.getElementById('quiz-message').textContent = quizResultMessage(s, total);

  document.querySelectorAll('#quiz-progress .dot').forEach(d => {
    d.classList.remove('current');
    d.classList.add('done');
  });

  if (s / total >= 0.66) {
    fireConfetti({ count: 140, spread: 80, duration: 2800 });
  }
}

function startReviewFromResult() {
  // Jump back to Q1 in review mode (current is already at total because quiz is done)
  quizState.viewing = 0;
  renderQuizQuestion();
}

function showResultFromReview() {
  // Snap viewing forward to current so we hide the question card and show the result
  quizState.viewing = quizState.current;
  if (quizState.finished) finishQuiz();
  else renderQuizQuestion();
}

function quizResultMessage(score, total) {
  const ratio = score / total;
  if (score === total)  return "soulmate-friend behavior, you got us memorized 💖";
  if (ratio >= 0.66)    return "you know us well, but we knew that already 🧡";
  if (ratio >= 0.33)    return "plot twist! time for more late-night talks 😄";
  return "all good, drinks on us, we'll catch you up 🍹";
}

function resetQuiz() {
  quizState.current = 0;
  quizState.viewing = 0;
  quizState.score = 0;
  quizState.answers = [];
  quizState.finished = false;
  quizState.locked = false;
  renderQuizQuestion();
}

/* ---------------------------------------------------------
   Memory notes (uses MEMORIES from memories.js)
--------------------------------------------------------- */
function initNotes() {
  const grid = document.getElementById('notes-grid');
  if (!grid) return;
  const items = (typeof MEMORIES !== 'undefined' && MEMORIES.length) ? MEMORIES : [];

  items.forEach(({ label, message }) => {
    const note = document.createElement('div');
    note.className = 'note';
    note.setAttribute('role', 'button');
    note.setAttribute('tabindex', '0');
    note.innerHTML = `
      <div class="note-inner">
        <div class="note-face front"><div class="label">${escapeHtml(label)}</div></div>
        <div class="note-face back"><div class="message">${escapeHtml(message)}</div></div>
      </div>
    `;
    const flip = () => note.classList.toggle('flipped');
    note.addEventListener('click', flip);
    note.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
    });
    grid.appendChild(note);
  });
}

/* ---------------------------------------------------------
   Confetti — warm palette
--------------------------------------------------------- */
const confettiState = { particles: [], raf: null, canvas: null, ctx: null };

function initConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  confettiState.canvas = canvas;
  confettiState.ctx = canvas.getContext('2d');
  resizeConfetti();
  window.addEventListener('resize', resizeConfetti);
}

function resizeConfetti() {
  const c = confettiState.canvas;
  if (!c) return;
  c.width = window.innerWidth;
  c.height = window.innerHeight;
}

function fireConfetti({ count = 150, spread = 60, duration = 3000, origin = 'top' } = {}) {
  const { canvas } = confettiState;
  if (!canvas) return;

  const colors = ['#ec6b4a', '#ff9d6c', '#d4a047', '#fff0d4', '#b94e2e', '#ffd4b3'];
  let originX = canvas.width / 2;
  let originY = -20;
  if (origin === 'cake') {
    const cake = document.getElementById('cake');
    if (cake) {
      const r = cake.getBoundingClientRect();
      originX = r.left + r.width / 2;
      originY = r.top + 40;
    }
  }

  const startedAt = performance.now();
  for (let i = 0; i < count; i++) {
    confettiState.particles.push({
      x: originX + (Math.random() - 0.5) * spread,
      y: originY + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 7,
      vy: origin === 'top' ? (Math.random() * 3 + 2) : -(Math.random() * 7 + 3),
      gravity: 0.12 + Math.random() * 0.08,
      size: 4 + Math.random() * 6,
      rotation: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.25,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() < 0.5 ? 'rect' : 'circle',
      bornAt: startedAt,
      life: duration + Math.random() * 1000
    });
  }
  if (!confettiState.raf) loopConfetti();
}

function loopConfetti() {
  const { canvas, ctx, particles } = confettiState;
  const now = performance.now();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.vy += p.gravity;
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.vr;
    const age = now - p.bornAt;
    const alpha = Math.max(0, 1 - age / p.life);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;
    if (p.shape === 'rect') ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    if (alpha <= 0 || p.y > canvas.height + 50) particles.splice(i, 1);
  }

  if (particles.length > 0) {
    confettiState.raf = requestAnimationFrame(loopConfetti);
  } else {
    cancelAnimationFrame(confettiState.raf);
    confettiState.raf = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

/* ---------------------------------------------------------
   Replay button
--------------------------------------------------------- */
function initReplay() {
  const btn = document.getElementById('replay-confetti');
  if (!btn) return;
  btn.addEventListener('click', () => fireConfetti({ count: 200, spread: 100, duration: 3500 }));
}

/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }
