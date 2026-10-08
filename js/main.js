/* =====================================================
   ORDAH · MAIN SCRIPT (vanilla JS, no libraries)
   Sections: 1 Nav · 2 Scroll reveal · 3 Counters · 4 Course tabs
             5 Hero parallax + cursor glow · 6 Scroll-spy · 7 Lesson simulator · 8 Contact form
   ===================================================== */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduced  = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasMouse = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- 1. NAV: shadow on scroll + mobile menu ---------- */
const nav = $('#nav'), burger = $('#burger'), menu = $('#menu');
const setMenu = (open) => {
  menu.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
};
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 10), { passive: true });
burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
$$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));          // close after choosing a link
addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });          // Esc closes
document.addEventListener('click', e => { if (!nav.contains(e.target)) setMenu(false); }); // outside tap closes
addEventListener('resize', () => { if (innerWidth > 768) setMenu(false); });            // reset when going desktop

/* ---------- 2. SCROLL REVEAL (staggered per group of siblings) ---------- */
const revealEls = $$('.reveal');
const show = el => el.classList.add('in');
if (!('IntersectionObserver' in window) || reduced) {
  revealEls.forEach(show);                                    // old browsers / reduced motion: just show everything
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -5% 0px' });
  revealEls.forEach(el => {
    const sibs = $$(':scope > .reveal', el.parentElement);
    el.style.setProperty('--d', sibs.indexOf(el) * 90 + 'ms');   // delay only affects the reveal animation
    io.observe(el);
  });
}

/* ---------- 3. STAT COUNTERS (count up once when visible) ---------- */
const countTo = (el) => {
  const end = +el.dataset.count, dur = reduced ? 0 : 1600, t0 = performance.now();
  const tick = (t) => {
    const p = dur ? Math.min((t - t0) / dur, 1) : 1;
    el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));   // ease-out
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
if ('IntersectionObserver' in window) {
  const cio = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { countTo(e.target); cio.unobserve(e.target); } });
  }, { threshold: .3 });
  $$('[data-count]').forEach(el => cio.observe(el));
} else $$('[data-count]').forEach(el => el.textContent = el.dataset.count);

/* ---------- 4. COURSE TABS (click + arrow keys) ---------- */
const tabs = $$('.tab');
const selectTab = (tab, focus) => {
  tabs.forEach(t => {
    const on = t === tab;
    t.classList.toggle('active', on);
    t.setAttribute('aria-selected', on);
    t.tabIndex = on ? 0 : -1;
  });
  $$('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + tab.dataset.tab));
  if (focus) tab.focus();
};
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') selectTab(tabs[(i + 1) % tabs.length], true);
    if (e.key === 'ArrowLeft')  selectTab(tabs[(i - 1 + tabs.length) % tabs.length], true);
  });
});

/* ---------- 5. HERO PARALLAX + CURSOR GLOW (mouse devices only) ---------- */
if (hasMouse && !reduced) {
  const cursor = $('.cursor'), cards = $$('.float-card');
  let mx = innerWidth / 2, my = innerHeight / 2, queued = false;
  const paint = () => {                                        // one DOM write per frame (smooth)
    queued = false;
    cursor.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    const dx = (innerWidth / 2 - mx) / innerWidth, dy = (innerHeight / 2 - my) / innerHeight;
    cards.forEach(c => { const d = +c.dataset.depth; c.style.transform = `translate(${dx * d}px, ${dy * d}px)`; });
  };
  addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY; cursor.classList.add('on');
    if (!queued) { queued = true; requestAnimationFrame(paint); }
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => cursor.classList.remove('on'));
}

/* ---------- 6. SCROLL-SPY (highlights the nav link of the section in view) ---------- */
if ('IntersectionObserver' in window) {
  const links = $$('#menu a[href^="#"]:not(.btn)');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  links.forEach(l => { const s = $(l.getAttribute('href')); if (s) spy.observe(s); });
}

/* ---------- 7. LESSON SIMULATOR: Video → Quiz → Video → Activity → Quiz → Review ---------- */
(() => {
  const sim = $('#sim'); if (!sim) return;
  const stage = $('#sim-stage'), list = $('#sim-steps'), bar = $('#sim-bar'), count = $('#sim-count'), next = $('#sim-next');
  const steps = [
    { k: 'Video',    t: 'Meet the loop',                         n: 'A short pre-recorded lesson' },
    { k: 'Quiz',     t: 'Which one repeats code?',               o: ['A for loop', 'A comment', 'A variable'], a: 0 },
    { k: 'Video',    t: 'Loops in Scratch',                      n: 'Watch it happen, block by block' },
    { k: 'Activity', t: 'Make a loop that draws a square',       n: 'Your TISPRO tutor is on hand to help' },
    { k: 'Quiz',     t: 'A loop runs 4 times. How many sides?',  o: ['2', '4', '8'], a: 1 },
    { k: 'Review',   t: 'Session complete',                      n: '' }
  ];
  let i = 0, score = 0, answered = false, timer = null, auto = !reduced, visible = false;

  steps.forEach((s, n) => {                                     // build the 6 step buttons
    const li = document.createElement('li'), b = document.createElement('button');
    b.type = 'button'; b.textContent = s.k;
    b.addEventListener('click', () => { auto = false; clearTimeout(timer); go(n); });   // user took control
    li.appendChild(b); list.appendChild(li);
  });

  function render() {
    const s = steps[i];
    stage.innerHTML = '';
    const tag = Object.assign(document.createElement('span'), { className: 'chip chip-y stage-tag', textContent: s.k });
    const title = Object.assign(document.createElement('div'), { className: 'stage-title', textContent: s.t });
    stage.append(tag, title);
    if (s.k === 'Video') {
      stage.insertAdjacentHTML('beforeend', '<div class="play"><b>▶</b><div class="play-bar"><i></i></div></div>');
    }
    if (s.o) {                                                  // quiz options
      const box = Object.assign(document.createElement('div'), { className: 'opts' });
      s.o.forEach((txt, n) => {
        const o = Object.assign(document.createElement('button'), { type: 'button', className: 'opt', textContent: txt });
        o.addEventListener('click', () => { auto = false; clearTimeout(timer); answer(n); });
        box.appendChild(o);
      });
      stage.appendChild(box);
    }
    const note = s.k === 'Review' ? `You scored ${score} / 2. Results go straight to your tutor's report.` : s.n;
    if (note) stage.appendChild(Object.assign(document.createElement('div'), { className: 'stage-note', textContent: note }));

    $$('li', list).forEach((li, n) => { li.classList.toggle('now', n === i); li.classList.toggle('done', n < i); });
    bar.style.width = ((i + 1) / steps.length * 100) + '%';
    count.textContent = `Step ${i + 1} of ${steps.length}`;
    next.textContent = i === steps.length - 1 ? '↺ Replay' : 'Next ›';
    stage.classList.remove('swap'); void stage.offsetWidth; stage.classList.add('swap');   // restart fade animation
  }

  function answer(n) {                                          // mark right / wrong, score once per quiz
    if (answered) return;
    answered = true;
    const s = steps[i], opts = $$('.opt', stage);
    opts.forEach((o, k) => { o.disabled = true; if (k === s.a) o.classList.add('right'); });
    if (n === s.a) score++; else if (opts[n]) opts[n].classList.add('wrong');
  }

  function go(n) {
    clearTimeout(timer);
    if (n >= steps.length) { n = 0; score = 0; }                // replay resets the score
    i = n; answered = false; render(); schedule();
  }

  function schedule() {                                         // autoplay: 2 beats for quizzes (reveal, then advance)
    clearTimeout(timer);
    if (!auto || !visible) return;
    const s = steps[i];
    timer = setTimeout(() => {
      if (s.o && !answered) { answer(s.a); schedule(); return; }
      go(i + 1);
    }, s.o && !answered ? 3200 : s.k === 'Review' ? 4200 : 3400);
  }

  next.addEventListener('click', () => { auto = false; go(i + 1); });
  sim.addEventListener('mouseenter', () => clearTimeout(timer));            // pause while reading
  sim.addEventListener('mouseleave', () => schedule());
  if ('IntersectionObserver' in window) {                                   // only autoplay while on screen
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? schedule() : clearTimeout(timer); }, { threshold: .4 }).observe(sim);
  } else visible = true;
  render();
})();

/* ---------- 8. CONTACT FORM (front-end only: connect to your backend/email service later) ---------- */
// ---- EmailJS config (get these from your EmailJS dashboard) ----
const EMAILJS_PUBLIC_KEY  = 'PJAcqshTxB0rUlVKf';   // Account > General
const EMAILJS_SERVICE_ID  = 'service_bp35e97';   // Email Services
const EMAILJS_TEMPLATE_ID = 'service_bp35e97';  // Email Templates

emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

const form = $('#contact-form'), note = $('#form-note');
const submitBtn = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async e => {
  e.preventDefault();

  const bad = $$('input, textarea', form).find(f => !f.checkValidity());
  if (bad) {
    note.textContent = 'Please complete every field with a valid email.';
    bad.focus();
    return;
  }

  // Prevent double submits while sending
  const originalLabel = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';
  note.textContent = '';

  try {
    await emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form);
    note.textContent = "Thank you! We'll be in touch shortly.";
    form.reset();
  } catch (err) {
    console.error('EmailJS error:', err);
    note.textContent = 'Sorry, something went wrong. Please try again in a moment.';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
    setTimeout(() => note.textContent = '', 6000);
  }
});
