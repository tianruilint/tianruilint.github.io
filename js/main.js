// Page behaviour: first paint -> text intro -> lazy WebGL film -> scroll choreography + widgets.
import { initWidgets } from './widgets.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const html = document.documentElement;
const params = new URLSearchParams(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || params.has('reduce'); // ?reduce previews the reduced-motion page
const mobile = matchMedia('(max-width: 760px)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;
const saveData = navigator.connection && navigator.connection.saveData;
let seen = false;
try { seen = sessionStorage.getItem('film') === '1'; } catch { /* private mode */ }
const playFilm = !reduced && !seen && !saveData;

html.classList.add('js');
$('#year').textContent = new Date().getFullYear();

// A returning or reduced-motion visitor starts on the final frame instead of the first one.
if (!playFilm) {
  const pic = $('#poster');
  pic.querySelector('source').srcset = 'assets/poster-end-m.webp';
  pic.querySelector('img').src = 'assets/poster-end.webp';
}

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);

// ------------------------------------------------------------------ text splitting
$$('[data-split]').forEach((el) => {
  if (el.classList.contains('statement')) {
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="sl" style="display:inline-block;vertical-align:top"><span>${w}&nbsp;</span></span>`).join('');
  } else {
    el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i).map((l) => `<span class="sl"><span>${l.trim()}</span></span>`).join('');
  }
});

// ------------------------------------------------------------------ slate (film caption)
const SHOTS = [
  ['01', 'Bare wafer, resist coated', 'Wafer and process scenes are illustrative.'],
  ['02', 'Step and expose', 'Wafer and process scenes are illustrative.'],
  ['03', 'Metal interconnect, layer by layer', 'Wafer and process scenes are illustrative.'],
  ['04', 'rv32i_pipeline_core, routed', 'This layout is real: my five-stage RV32I core, placed and routed with OpenROAD on Nangate45. It closes at 714 MHz. The wafer around it is a rendering.'],
];
function slate(i) {
  $('#slateNo').textContent = SHOTS[i][0];
  $('#slateTxt').textContent = SHOTS[i][1];
  $('#slateNote').textContent = SHOTS[i][2];
}
function filmDoneUI() {
  slate(3);
  $('#slateBar').style.transform = 'scaleX(1)';
  $('#skipFilm').hidden = true;
  $('#replayFilm').hidden = reduced;
  $('.cue').classList.add('show');
}
if (!playFilm) filmDoneUI();

// ------------------------------------------------------------------ boot once GSAP is in
window.addEventListener('DOMContentLoaded', () => {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  gsap.ticker.lagSmoothing(0); // animations follow wall-clock time even when frames are slow

  // hero intro: text is live HTML and does not wait for WebGL
  if (reduced) {
    gsap.set('.hero .ln>span, .sl>span', { y: 0 });
    gsap.set('.hero .over, .hero .hero-foot, .slate, [data-r]', { opacity: 1, y: 0 });
  } else {
    gsap.timeline({ defaults: { ease: 'power4.out' } })
      .to('.hero .ln>span', { y: 0, duration: 1.25, stagger: 0.11 }, 0.1)
      .to('.hero .over', { opacity: 1, duration: 0.8 }, 0.35)
      .to('.hero .hero-foot', { opacity: 1, duration: 0.9 }, 0.75)
      .to('.slate', { opacity: 1, duration: 0.9 }, 0.95);

    $$('[data-split]').forEach((el) => {
      gsap.to(el.querySelectorAll('.sl>span'), {
        y: 0, duration: 1.05, ease: 'power4.out', stagger: el.classList.contains('statement') ? 0.028 : 0.1,
        scrollTrigger: { trigger: el, start: 'top 86%', once: true },
      });
    });
    ScrollTrigger.batch('[data-r]', {
      start: 'top 90%', once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.95, ease: 'power3.out', stagger: 0.09, overwrite: true }),
    });
    // big story numbers drift slightly against the scroll
    // hero hands off: the name lifts and fades as the camera starts to move
    gsap.to('.hero-inner, .slate', { yPercent: -14, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '62% top', scrub: true } });
    // outlined half of each heading fills in as it crosses the viewport
    $$('h2 em').forEach((em) => gsap.to(em, { '--fill': '100%', ease: 'none', scrollTrigger: { trigger: em.closest('h2'), start: 'top 72%', end: 'top 28%', scrub: 0.4 } }));
    // numbers count up once
    $$('[data-count]').forEach((b) => {
      const n = +b.dataset.count, o = { v: 0 };
      gsap.to(o, { v: n, duration: 1.4, ease: 'power2.out', onUpdate: () => (b.textContent = Math.round(o.v)), scrollTrigger: { trigger: b, start: 'top 88%', once: true } });
    });
    const hot = $('.story-num .hot b');
    if (hot) {
      const o = { v: 625 };
      gsap.to(o, { v: 714, duration: 1.6, ease: 'power3.inOut', onUpdate: () => (hot.firstChild.nodeValue = Math.round(o.v)), scrollTrigger: { trigger: hot, start: 'top 80%', once: true } });
    }
    gsap.fromTo('.story-num', { xPercent: -4 }, { xPercent: 2, ease: 'none', scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
    gsap.fromTo('.portrait img', { yPercent: 5 }, { yPercent: -4, ease: 'none', scrollTrigger: { trigger: '.portrait', start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
  }

  // smooth scrolling on desktop pointers only; native scroll stays in charge
  let lenis = null;
  if (!reduced && !coarse && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
  }
  const go = (target) => {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { duration: 1.5 });
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  };
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    e.preventDefault(); closeDrawer(); go(id === '#top' ? document.body : id);
    history.replaceState(null, '', id);
  }));

  // drawer
  const burger = $('#burger'), drawer = $('#drawer');
  function closeDrawer() {
    drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Open navigation');
    document.body.style.overflow = ''; lenis && lenis.start();
  }
  burger.addEventListener('click', () => {
    const open = !drawer.classList.contains('open');
    if (!open) return closeDrawer();
    drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true'); burger.setAttribute('aria-label', 'Close navigation');
    document.body.style.overflow = 'hidden'; lenis && lenis.stop();
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('open')) { closeDrawer(); burger.focus(); } });

  // ---------------------------------------------------------------- scroll -> pose
  const sections = $$('[data-pose]');
  const veilEl = $('.veil'), header = $('#header'), rail = $('#rail');
  const railItems = $$('#rail li'), navLinks = $$('.nav a');
  let tops = [], vh = innerHeight, active = -1;
  const measure = () => { vh = innerHeight; tops = sections.map((s) => s.getBoundingClientRect().top + scrollY); };
  measure();
  addEventListener('resize', measure);
  new ResizeObserver(measure).observe(document.body);

  const pose = { i: 0, t: 0 };   // current section index and blend toward the next
  function onScroll() {
    const y = scrollY;
    let i = 0;
    for (let k = 0; k < tops.length; k++) if (tops[k] <= y + vh * 0.15) i = k;
    const next = tops[i + 1];
    const t = next === undefined ? 0 : smooth(clamp((y + vh - next) / (vh * 0.85)));
    pose.i = i; pose.t = t;
    const v0 = +sections[i].dataset.veil, v1 = next === undefined ? v0 : +sections[i + 1].dataset.veil;
    veilEl.style.setProperty('--veil', (v0 + (v1 - v0) * t).toFixed(3));
    header.classList.toggle('solid', y > 40);
    rail.classList.toggle('show', y > vh * 0.5);
    const a = t > 0.5 ? i + 1 : i;
    if (a !== active) {
      active = a;
      const id = sections[a].id;
      railItems.forEach((li) => li.classList.toggle('on', li.dataset.for === id));
      navLinks.forEach((l) => l.classList.toggle('on', l.getAttribute('href') === '#' + id));
    }
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------------------------------------------------------------- widgets
  initWidgets({ gsap, ScrollTrigger, reduced, coarse, mobile });

  // ---------------------------------------------------------------- motion toggle
  const motionBtn = $('#motionToggle');
  let paused = reduced;
  let scene = null;
  let film = null;
  function setPaused(p) {
    paused = p;
    motionBtn.setAttribute('aria-pressed', String(p));
    motionBtn.querySelector('.motion-txt').textContent = p ? 'Play motion' : 'Pause motion';
    document.body.classList.toggle('paused', p);
    if (scene) scene.frozen = p;
    if (film && film.progress() < 1) p ? film.pause() : film.play();
    dispatchEvent(new CustomEvent('motion', { detail: { paused: p } }));
  }
  motionBtn.addEventListener('click', () => setPaused(!paused));
  if (reduced) { motionBtn.disabled = true; setPaused(true); }

  // ---------------------------------------------------------------- WebGL, loaded after first paint
  const boot = async () => {
    const probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return; // poster stays
    const { createScene, stateOf } = await import('./scene.js');
    const canvas = $('#world');
    const capture = params.has('capture');
    const OFF = mobile ? { hero: [0, -0.24], about: [0, -0.12] } : { hero: [0.17, 0.0], about: [0.24, 0] };
    const targetOf = (name) => {
      const s = stateOf(name); const o = OFF[name] || [0, 0]; s.ox = o[0]; s.oy = o[1]; return s;
    };
    const P = sections.map((s) => targetOf(s.dataset.pose));
    const F = targetOf(playFilm ? 'rimA' : 'hero');
    if (playFilm) Object.assign(F, { ox: OFF.hero[0], oy: OFF.hero[1] });
    let mode = playFilm ? 'film' : 'scroll';

    scene = createScene(canvas, {
      mobile, capture,
      onFirstFrame: () => { $('.world').classList.add('live'); if (playFilm) startFilm(); },
    });
    const S = scene.S; S.ox = F.ox; S.oy = F.oy;
    Object.assign(S, F);
    scene.frozen = paused;
    const keys = Object.keys(P[0]);

    const ptr = { x: 0, y: 0 };
    scene.onFrame = (dt) => {
      if (mode === 'film') { Object.assign(S, F); }
      else if (reduced) { Object.assign(S, P[0]); }
      else {
        const a = P[pose.i], b = P[pose.i + 1] || a, t = pose.t;
        const k = 1 - Math.exp(-dt * 4.2);
        for (const key of keys) { const tv = a[key] + (b[key] - a[key]) * t; S[key] += (tv - S[key]) * k; }
      }
      scene.setOffset(S.ox, S.oy);
      const nk = 1 - Math.exp(-dt * 3);
      const live = !paused && !reduced && mode !== 'hold';
      scene.nudge.x += ((live ? ptr.x : 0) - scene.nudge.x) * nk;
      scene.nudge.y += ((live ? ptr.y : 0) - scene.nudge.y) * nk;
    };
    if (!coarse) addEventListener('pointermove', (e) => { ptr.x = (e.clientX / innerWidth) * 2 - 1; ptr.y = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });
    document.addEventListener('visibilitychange', () => (document.hidden ? scene.stop() : scene.start()));

    function startFilm() {
      const { gsap } = window;
      const cam = (n) => { const s = stateOf(n); return { cx: s.cx, cy: s.cy, cz: s.cz, tx: s.tx, ty: s.ty, tz: s.tz, fov: s.fov }; };
      Object.assign(F, targetOf('rimA'), { ox: OFF.hero[0], oy: OFF.hero[1] });
      mode = 'film';
      slate(0); $('#skipFilm').hidden = false; $('#replayFilm').hidden = true; $('.cue').classList.remove('show');
      const bar = $('#slateBar');
      film = gsap.timeline({
        onUpdate: () => { bar.style.transform = `scaleX(${film.progress().toFixed(4)})`; },
        onComplete: () => { mode = 'scroll'; filmDoneUI(); try { sessionStorage.setItem('film', '1'); } catch { /* ignore */ } },
      });
      // 01 wafer
      film.to(F, { ...cam('rimB'), duration: 3.2, ease: 'power2.inOut' }, 0);
      // 02 expose (cut)
      film.call(slate, [1], 3.2).set(F, { ...cam('expA'), optics: 1 }, 3.2);
      film.to(F, { ...cam('expB'), duration: 3.5, ease: 'sine.inOut' }, 3.2);
      [0, 1, 2, 3].forEach((k) => {
        const t0 = 3.55 + k * 0.8;
        if (k > 0) film.to(F, { field: -25.8 + 8.6 * k, duration: 0.3, ease: 'power3.inOut' }, t0 - 0.36);
        film.to(F, { fieldI: 1, duration: 0.1 }, t0).to(F, { expose: k + 1, duration: 0.36, ease: 'none' }, t0).to(F, { fieldI: 0.14, duration: 0.28 }, t0 + 0.3);
      });
      // 03 into the die
      film.to(F, { ...cam('dive'), duration: 1.5, ease: 'power2.in' }, 6.75).to(F, { optics: 0, fieldI: 0, duration: 0.6 }, 6.75);
      film.to(F, { hole: 1, duration: 0.8 }, 7.3).set(F, { patternAll: 1 }, 8.25).call(slate, [2], 7.9);
      film.to(F, { build: 0.34, duration: 0.9, ease: 'none' }, 7.3).to(F, { build: 0.76, duration: 2.3, ease: 'none' }, 8.2).to(F, { build: 1, duration: 1.3, ease: 'none' }, 10.5);
      film.to(F, { pulses: 1, duration: 0.8 }, 8.8);
      film.to(F, { ...cam('cityA'), duration: 1.25, ease: 'none' }, 8.25);
      film.to(F, { ...cam('cityB'), duration: 1.35, ease: 'none' }, 9.5);
      film.to(F, { ...cam('cityC'), duration: 1.15, ease: 'none' }, 10.85);
      // 04 the real layout
      film.call(slate, [3], 12.0);
      film.to(F, { ...cam('hero'), duration: 2.4, ease: 'power3.out' }, 12.0);
      film.to(F, { lid: 1, duration: 0.4 }, 12.1).to(F, { reveal: 1.15, duration: 1.9, ease: 'power2.inOut' }, 12.2).to(F, { pulses: 0, duration: 1.2 }, 12.6);
      if (paused) film.pause();
    }
    function skipFilm() { if (film && film.progress() < 1) { film.pause(); window.gsap.to(film, { progress: 1, duration: 0.9, ease: 'power2.inOut', overwrite: true }); } }
    $('#skipFilm').addEventListener('click', skipFilm);
    addEventListener('scroll', () => { if (mode === 'film' && scrollY > 60) skipFilm(); }, { passive: true });
    $('#replayFilm').addEventListener('click', () => {
      if (paused) setPaused(false);
      go(document.body);
      setTimeout(startFilm, scrollY > 40 ? 900 : 0);
    });

    if (capture || location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      window.__scene = { scene, stateOf, targetOf, set: (n, extra = {}) => { mode = 'hold'; Object.assign(S, targetOf(n), extra); }, film: () => film, release: () => { mode = 'scroll'; } };
    }
  };
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 200));
  if (document.readyState === 'complete') idle(boot); else addEventListener('load', () => idle(boot));

  // ---------------------------------------------------------------- misc
  const copyBtn = $('#copyMail'), copyTxt = $('#copyTxt');
  copyBtn.addEventListener('click', async () => {
    let ok = false;
    try { await navigator.clipboard.writeText('tianruilint@gmail.com'); ok = true; }
    catch {
      // older browsers, or clipboard permission refused: select-and-copy fallback
      const ta = document.createElement('textarea');
      ta.value = 'tianruilint@gmail.com'; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      ta.remove(); copyBtn.focus({ preventScroll: true });
    }
    copyTxt.textContent = ok ? 'Copied' : 'Use the email link';
    setTimeout(() => (copyTxt.textContent = 'Copy address'), 2600);
  });
});
