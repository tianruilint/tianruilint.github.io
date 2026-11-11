// Interactive evidence: pipeline stepper, matched-program bars, layout viewer, clock sweep, SoC run.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (tag, cls, htmlStr) => { const e = document.createElement(tag); if (cls) e.className = cls; if (htmlStr !== undefined) e.innerHTML = htmlStr; return e; };

// ---------------------------------------------------------------- pipeline model
const PROGRAMS = [
  { id: 'fwd', label: 'Forwarding', ins: [
    { t: 'addi x1, x0, 5' },
    { t: 'addi x2, x1, 3', fw: '<b>x1</b> is forwarded from EX/MEM.' },
    { t: 'add  x3, x1, x2', fw: '<b>x2</b> comes from EX/MEM and <b>x1</b> from MEM/WB.' },
    { t: 'sub  x4, x3, x1', fw: '<b>x3</b> comes from EX/MEM. <b>x1</b> was caught by the WB-to-ID bypass a cycle earlier.' },
    { t: 'or   x5, x4, x2', fw: '<b>x4</b> comes from EX/MEM.' },
  ] },
  { id: 'load', label: 'Load-use', ins: [
    { t: 'lw   x1, 0(x10)' },
    { t: 'add  x2, x1, x1', use: 'x1', fw: 'The loaded <b>x1</b> arrives from MEM/WB.' },
    { t: 'lw   x3, 4(x10)' },
    { t: 'sub  x4, x3, x2', use: 'x3', fw: 'The loaded <b>x3</b> arrives from MEM/WB.' },
    { t: 'addi x5, x4, 1', fw: '<b>x4</b> comes from EX/MEM.' },
  ] },
  { id: 'br', label: 'Taken branch', ins: [
    { t: 'addi x1, x0, 2' },
    { t: 'beq  x1, x1, L1', taken: 'beq', wrong: ['addi x2, x0, 9', 'addi x3, x0, 9'] },
    { t: 'L1: add x4, x1, x1' },
    { t: 'jal  x0, L2', taken: 'jal', wrong: ['sub  x4, x4, x1', 'xor  x4, x4, x4'] },
    { t: 'L2: addi x5, x4, 1' },
  ] },
];

function schedule(prog) {
  const rows = []; const events = {};
  const say = (c, s) => { (events[c] = events[c] || []).push(s); };
  let ifS = 1, idS = 2, L = 0, R = 0;
  prog.ins.forEach((ins) => {
    const stall = ins.use ? 1 : 0;
    const exS = idS + 1 + stall;
    const cells = {};
    for (let c = ifS; c < idS; c++) cells[c] = ['IF', 'IF'];
    cells[idS] = ['ID', 'ID'];
    const name = ins.t.replace(/^L\d: /, '').split(/\s+/)[0];
    if (stall) {
      cells[idS + 1] = ['ID', 'stall']; L++;
      say(idS, `Load-use hazard: <b>${name}</b> needs <b>${ins.use}</b> while the load is still in EX. Hold IF and ID, send a bubble to EX.`);
    }
    cells[exS] = ['EX', 'EX']; cells[exS + 1] = ['MEM', 'MEM']; cells[exS + 2] = ['WB', 'WB'];
    if (ins.fw) say(exS, ins.fw);
    say(exS + 2, `<b>${name}</b> retires.`);
    rows.push({ t: ins.t, cells });
    if (ins.taken) {
      R++;
      const w1 = {}, w2 = {};
      for (let c = idS; c < exS; c++) w1[c] = ['IF', 'IF'];
      w1[exS] = ['ID', 'ID']; w1[exS + 1] = ['✕', 'kill'];
      w2[exS] = ['IF', 'IF']; w2[exS + 1] = ['✕', 'kill'];
      rows.push({ t: ins.wrong[0], cells: w1, sq: true }, { t: ins.wrong[1], cells: w2, sq: true });
      say(exS, `<b>${name}</b> resolves in EX and is taken. The two younger instructions are on the wrong path.`);
      say(exS + 1, 'Flush: both slots lose their valid and write-enable bits, so nothing they did can be written. Fetch restarts at the target.');
      ifS = exS + 1; idS = exS + 2;
    } else { ifS = idS; idS = exS; }
  });
  const last = rows.filter((r) => !r.sq).pop();
  const total = Math.max(...Object.keys(last.cells).map(Number));
  return { rows, events, total, N: prog.ins.length, L, R };
}

function initPipeline({ reduced, ScrollTrigger }) {
  const grid = $('#pipeGrid'), tabs = $('#pipeTabs');
  const cycEl = $('#pipeCycle'), totEl = $('#pipeTotal'), evEl = $('#pipeEvent'), fEl = $('#pipeFormula'), play = $('#pipePlay');
  let sch, cycle = 0, timer = null, cellEls = [], headEls = [];

  function build(prog) {
    sch = schedule(prog);
    grid.innerHTML = ''; cellEls = []; headEls = [];
    grid.style.gridTemplateColumns = `max-content repeat(${sch.total}, minmax(0, 1fr))`;
    grid.append(el('div', 'h'));
    for (let c = 1; c <= sch.total; c++) { const h = el('div', 'h', String(c)); headEls.push(h); grid.append(h); }
    sch.rows.forEach((r) => {
      grid.append(el('div', 'ins' + (r.sq ? ' sq' : ''), r.t.replace(/ /g, '&nbsp;')));
      for (let c = 1; c <= sch.total; c++) {
        const cell = r.cells[c];
        const d = el('div', 'c ' + (cell ? cell[1] + (cell[1] === 'stall' ? '' : '') : 'e'), cell ? cell[0] : '');
        d.dataset.c = c; cellEls.push(d); grid.append(d);
      }
    });
    totEl.textContent = '/ ' + sch.total;
    fEl.innerHTML = `C = N + 4 + L + 2R<br>= ${sch.N} + 4 + ${sch.L} + ${2 * sch.R} = <b>${sch.total} cycles</b>`;
    set(reduced ? sch.total : 0);
  }
  function set(c) {
    cycle = Math.max(0, Math.min(sch.total, c));
    cycEl.textContent = cycle;
    cellEls.forEach((d) => { const cc = +d.dataset.c; d.classList.toggle('on', cc <= cycle && !d.classList.contains('e')); d.classList.toggle('now', cc === cycle && !d.classList.contains('e')); });
    headEls.forEach((h, i) => h.classList.toggle('now', i + 1 === cycle));
    const ev = sch.events[cycle];
    evEl.innerHTML = cycle === 0 ? 'Press Run, or step one clock edge at a time.' : ev ? ev.join(' ') : 'Instructions advance one stage.';
    play.textContent = timer ? 'Pause' : cycle >= sch.total ? 'Run again' : 'Run';
  }
  function stop() { clearInterval(timer); timer = null; set(cycle); }
  function run() {
    if (timer) return stop();
    if (cycle >= sch.total) set(0);
    timer = setInterval(() => { if (cycle >= sch.total) return stop(); set(cycle + 1); }, 720);
    set(cycle + 1);
  }
  PROGRAMS.forEach((p, i) => {
    const b = el('button', '', p.label); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(i === 1));
    b.addEventListener('click', () => { stop(); $$('button', tabs).forEach((x) => x.setAttribute('aria-selected', String(x === b))); build(p); if (!reduced) run(); });
    tabs.append(b);
  });
  play.addEventListener('click', run);
  $('#pipePrev').addEventListener('click', () => { stop(); set(cycle - 1); });
  $('#pipeNext').addEventListener('click', () => { stop(); set(cycle + 1); });
  build(PROGRAMS[1]);
  if (!reduced) ScrollTrigger.create({ trigger: '#pipe', start: 'top 62%', once: true, onEnter: () => { if (!timer && cycle === 0) run(); } });
  addEventListener('motion', (e) => { if (e.detail.paused) stop(); });
}

// ---------------------------------------------------------------- matched-program bars
function initBars({ ScrollTrigger, reduced }) {
  const data = [
    ['Independent ALU', 512, 512, 516, 'no hazards: four fill cycles'],
    ['Dependent ALU', 512, 512, 516, 'forwarding, no stalls'],
    ['Branch loop', 771, 771, 1285, '255 taken redirects × 2'],
    ['Repeated load-use', 259, 259, 391, '128 load-use stalls × 1'],
  ];
  const max = 1285, box = $('#bars');
  data.forEach(([name, , sc, pl, note]) => {
    const row = el('div', 'bar-row');
    row.innerHTML = `<p><b>${name}</b><span>${note}</span></p>
      <div class="bar"><i style="--w:${(sc / max * 100).toFixed(2)}%"></i><em>single-cycle</em><b>${sc.toLocaleString('en')}</b></div>
      <div class="bar pl"><i style="--w:${(pl / max * 100).toFixed(2)}%"></i><em>pipeline</em><b>${pl.toLocaleString('en')}</b></div>`;
    box.append(row);
  });
  const fill = () => $$('.bar i', box).forEach((b, i) => setTimeout(() => b.style.setProperty('--p', 1), reduced ? 0 : i * 70));
  if (reduced) fill(); else ScrollTrigger.create({ trigger: box, start: 'top 80%', once: true, onEnter: fill });
}

// ---------------------------------------------------------------- layout viewer
function initViewer({ coarse }) {
  const VIEWS = [
    ['routing', 'Routing', 'Detailed routing at 1.4 ns. Each colour is a metal layer; the triangles on the edge are I/O pins. Route DRC count: 0.', 'First sweep, 1.6 ns: the same floorplan before the RTL fix, closing at 625 MHz.'],
    ['placement', 'Placement', 'Placed standard cells and I/O pins. At 40% core utilisation the placer leaves the upper-left corner mostly empty.'],
    ['clocks', 'Clock tree', 'The clock tree after CTS. The clock enters at the top left and fans out through buffers to the pipeline registers.'],
    ['worst_path', 'Worst path', 'Worst setup path at 1.4 ns, in red. It now runs between flops inside the core. At 1.2 ns the limiter becomes forwarding → 32-bit ALU → EX/MEM.', 'First sweep, 1.6 ns: the worst path ran from the reset pin across the die to a data_write_data output pin. That feed-through came from my RTL.'],
    ['all', 'All layers', 'Cells, routing and pins drawn together.'],
  ];
  const tabs = $('#viewerTabs'), img = $('#viewerImg'), cap = $('#viewerCap'), old = $('#viewerOld'), sw = $('#sweepSwitch');
  const stage = $('#viewerStage'), lens = $('#lens');
  let cur = VIEWS[0];
  const src = () => `assets/layout/${cur[0]}_${old.checked && cur[3] ? '1p6' : '1p4'}.webp`;
  function show() {
    const s = src();
    sw.classList.toggle('off', !cur[3]);
    if (!cur[3]) old.checked = false;
    cap.textContent = old.checked && cur[3] ? cur[3] : cur[2];
    img.classList.add('swap');
    const pre = new Image();
    pre.onload = () => { img.src = s; lens.style.backgroundImage = `url(${s})`; img.classList.remove('swap'); };
    pre.src = s;
    img.alt = `${cur[1]} view of the RV32I pipeline core layout`;
  }
  VIEWS.forEach((v, i) => {
    const b = el('button', '', v[1]); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(i === 0));
    b.addEventListener('click', () => { cur = v; $$('button', tabs).forEach((x) => x.setAttribute('aria-selected', String(x === b))); show(); });
    tabs.append(b);
  });
  old.addEventListener('change', show);
  cap.textContent = cur[2]; lens.style.backgroundImage = `url(${src()})`;
  const Z = 2.8;
  if (!coarse) {
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top;
      stage.classList.add('mag');
      lens.style.left = x + 'px'; lens.style.top = y + 'px';
      lens.style.backgroundSize = `${r.width * Z}px ${r.height * Z}px`;
      lens.style.backgroundPosition = `${-(x * Z - 105)}px ${-(y * Z - 105)}px`;
    });
    stage.addEventListener('pointerleave', () => stage.classList.remove('mag'));
  } else {
    stage.style.cursor = 'zoom-in';
    stage.addEventListener('click', () => openZoom(src(), img.alt, '#000'));
  }
}

function openZoom(src, alt, bg) {
  const dlg = $('#zoom'), im = $('#zoomImg');
  im.src = src; im.alt = alt; dlg.style.background = bg || '#f6fafd';
  if (dlg.showModal) dlg.showModal();
}

// ---------------------------------------------------------------- clock sweep
function initSweep() {
  // clock ns, MHz, WNS, TNS, mW, std-cell area µm², repair buffers, first-sweep WNS
  const D = [
    [10.0, 100, 8.228, 0, 2.48, 20339, 915, null],
    [2.2, 455, 0.483, 0, 9.89, 20328, 910, null],
    [2.0, 500, 0.367, 0, 10.84, 20337, 913, null],
    [1.8, 556, 0.188, 0, 12.01, 20379, 935, null],
    [1.6, 625, 0.076, 0, 13.50, 20425, 974, '+0.080'],
    [1.4, 714, 0.005, 0, 15.29, 20543, 1072, '−0.006'],
    [1.2, 833, -0.015, -0.125, 17.85, 21496, 1690, '−0.176'],
  ];
  const plot = $('#sweepPlot'), range = $('#sweepRange'), read = $('#sweepRead'), state = $('#sweepState');
  const fmt = (v) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(3);
  D.forEach((d, i) => {
    const c = el('div', d[2] < 0 ? 'neg' : '', `<i style="height:${(d[1] / 833 * 100).toFixed(1)}%"></i><span>${d[0].toFixed(1)} ns</span>`);
    c.addEventListener('click', () => { range.value = i; show(); });
    plot.append(c);
  });
  function show() {
    const i = +range.value, d = D[i], met = d[2] >= 0;
    $$('div', plot).forEach((c, k) => c.classList.toggle('on', k === i));
    state.className = 'sweep-state ' + (met ? 'met' : 'bad');
    state.textContent = (met ? 'Timing met · route DRC 0 · LEC equivalent' : `Setup violated · TNS ${fmt(d[3])} ns`) + (d[7] ? ` · before the fix ${d[7]} ns` : '');
    read.innerHTML = [
      ['Clock', `${d[0].toFixed(1)}<small>ns</small>`], ['Frequency', `${d[1]}<small>MHz</small>`],
      ['Worst slack', `${fmt(d[2])}<small>ns</small>`],
      ['Power', `${d[4].toFixed(2)}<small>mW est.</small>`], ['Std-cell area', `${d[5].toLocaleString('en')}<small>µm²</small>`], ['Repair buffers', d[6].toLocaleString('en')],
    ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    range.setAttribute('aria-valuetext', `${d[0]} nanoseconds, ${d[1]} megahertz, ${met ? 'timing met' : 'setup violated'}`);
  }
  range.addEventListener('input', show);
  show();
}

// ---------------------------------------------------------------- SoC
function initSoc({ reduced, ScrollTrigger, mobile }) {
  const B = {
    cpu: ['up', 20, 30, 190, 100, 'FRISCV CPU + caches', 'RV32IM · I / D masters', 'Reused: dpretet/friscv (MIT), pinned. An RV32IM core with instruction and data caches. Not my design. I patched bugs in it on a build copy and reported them upstream.'],
    dma: ['mine', 20, 250, 190, 100, 'DMA engine', '128-bit single-beat copy', 'Mine. Copies 16–4096 bytes between 16-byte-aligned, non-overlapping RAM regions. A START while busy returns SLVERR, a bus error ends the job with ERROR set, and a hardware event wins over a same-cycle W1C.'],
    xbar: ['up', 285, 30, 170, 320, 'AXI-Lite crossbar', '3 initiators · 4 targets', 'Reused: dpretet/axi-crossbar (MIT), pinned. Arbitration, routing and DECERR. The wrapper, address map and ID map around it are mine.'],
    ram: ['model', 530, 30, 210, 66, 'RAM model', '1 MiB behavioural', 'A behavioural RAM for simulation. The DMA buffers sit in an uncached region, so there is no cache-coherence claim.'],
    io: ['up', 530, 114, 210, 66, 'FRISCV IO / UART', 'GPIO · CLINT · serial TX', 'Reused from FRISCV. One write-response bug I found here is now fixed upstream through my pull request.'],
    dmac: ['mine', 530, 198, 210, 66, 'DMA control', 'SRC · DST · LEN · STATUS', 'Mine. Register block with BUSY and sticky W1C DONE, ERROR, IRQ_PENDING and START_REJECT.'],
    apb: ['mine', 530, 282, 210, 66, 'APB bridge + timer', 'AXI-Lite → 32-bit APB', 'Mine. The bridge accepts AW and W in either order, picks one 32-bit lane by addr[3:2], holds the APB transfer through PREADY waits, forwards PSLVERR and holds the response under backpressure. The timer has periodic and one-shot modes.'],
  };
  const W = {
    cx: 'M210 80H285', dx: 'M210 300H285', xr: 'M455 63H530', xi: 'M455 147H530', xd: 'M455 231H530', xa: 'M455 315H530',
    irq: 'M635 348V398H8V80H20',
  };
  const STEPS = [
    ['Fill a 256-byte source buffer', ['cpu', 'xbar', 'ram'], ['cx', 'xr'], 'The firmware writes a known pattern into RAM, with guard words on both sides of the destination.'],
    ['Program the APB timer', ['cpu', 'xbar', 'apb'], ['cx', 'xa'], 'A write crosses the crossbar and my bridge, which turns one 128-bit lane into a 32-bit APB transfer.'],
    ['Start the DMA', ['cpu', 'xbar', 'dmac'], ['cx', 'xd'], 'SRC, DST and LEN are written, then START. A second START while busy would return SLVERR.'],
    ['DMA copies while the CPU keeps reading RAM', ['dma', 'cpu', 'xbar', 'ram'], ['dx', 'cx', 'xr'], 'Two initiators share the crossbar. This is the case that exposed the third-party cache bugs.'],
    ['Check all 64 words and both guards', ['cpu', 'xbar', 'ram'], ['cx', 'xr'], 'The CPU reads back every destination word and the guard words around them.'],
    ['Print P2_DMA_PASS over UART', ['cpu', 'xbar', 'io'], ['cx', 'xi'], 'The testbench decodes the serial line. A pass is only a pass if the firmware says so.'],
    ['Second image: interrupts', ['apb', 'dma', 'cpu'], ['irq'], 'Timer and DMA interrupts go through one C ISR that checks mcause, clears the source and returns through MRET.'],
  ];
  let view = '0 0 760 410', irqAt = [14, 392], pad = 14;
  if (mobile) {
    // phone: initiators on top, crossbar as a bar, targets in a 2 x 2 grid
    const G = { cpu: [10, 10, 150, 70], dma: [200, 10, 150, 70], xbar: [10, 120, 340, 60], ram: [10, 230, 165, 64], io: [185, 230, 165, 64], dmac: [10, 320, 165, 64], apb: [185, 320, 165, 64] };
    for (const k in G) B[k].splice(1, 4, ...G[k]);
    Object.assign(W, { cx: 'M85 80V120', dx: 'M275 80V120', xr: 'M180 180V262H175', xi: 'M180 180V262H185', xd: 'M180 180V352H175', xa: 'M180 180V352H185', irq: 'M267 384V402H4V45H10' });
    view = '0 0 360 420'; irqAt = [10, 416]; pad = 9;
  }
  const svgBox = $('#socSvg'), stepsEl = $('#socSteps'), detail = $('#socDetail');
  let s = `<svg viewBox="${view}" role="img" aria-label="SoC block diagram">`;
  for (const [k, d] of Object.entries(W)) s += `<path class="wire" data-w="${k}" d="${d}"/>`;
  s += `<text class="s" x="${irqAt[0]}" y="${irqAt[1]}">irq</text>`;
  for (const [k, b] of Object.entries(B)) {
    const [cls, x, y, w, h, t, sub] = b;
    s += `<g class="blk ${cls}" data-b="${k}" tabindex="0" role="button" aria-label="${t}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/><text x="${x + pad}" y="${y + (h > 90 ? 40 : 28)}">${t}</text><text class="s" x="${x + pad}" y="${y + (h > 90 ? 60 : 47)}">${sub}</text></g>`;
  }
  svgBox.innerHTML = s + '</svg>';
  let cur = 0, auto = null;
  function step(i, user) {
    cur = (i + STEPS.length) % STEPS.length;
    const [, blocks, wires, text] = STEPS[cur];
    $$('.blk', svgBox).forEach((g) => { g.classList.toggle('hot', blocks.includes(g.dataset.b)); g.classList.remove('sel'); });
    $$('.wire', svgBox).forEach((p) => p.classList.toggle('hot', wires.includes(p.dataset.w)));
    $$('button', stepsEl).forEach((b, k) => (k === cur ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current')));
    detail.innerHTML = `<b>Step ${cur + 1} of ${STEPS.length}</b>${text}`;
    if (user) stopAuto();
  }
  const stopAuto = () => { clearInterval(auto); auto = null; };
  STEPS.forEach((st, i) => {
    const li = el('li'); const b = el('button', '', `<i>0${i + 1}</i><span>${st[0]}</span>`); b.type = 'button';
    b.addEventListener('click', () => step(i, true)); li.append(b); stepsEl.append(li);
  });
  $$('.blk', svgBox).forEach((g) => {
    const pick = () => {
      stopAuto(); const b = B[g.dataset.b];
      $$('.blk', svgBox).forEach((x) => x.classList.toggle('sel', x === g));
      detail.innerHTML = `<b>${b[5]}</b>${b[7]}`;
    };
    g.addEventListener('click', pick);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  });
  step(0);
  if (!reduced) {
    ScrollTrigger.create({
      trigger: '#soc', start: 'top 70%', end: 'bottom 20%',
      onToggle: (self) => { stopAuto(); if (self.isActive && !document.body.classList.contains('paused')) auto = setInterval(() => step(cur + 1), 3400); },
    });
    addEventListener('motion', (e) => { if (e.detail.paused) stopAuto(); });
  }
}

function initBugs() {
  const base = 'https://github.com/dpretet/friscv/';
  const rows = [
    ['IO subsystem: no B response when AW and W arrive together', 'Issue #5', 'Fixed by my PR #11 · merged', 'pull/11', true],
    ['D-cache drops AWPROT', 'Issue #7', 'Fixed by my PR #12 · merged', 'pull/12', true],
    ['mcause ignores mstatus.MIE', 'Issue #10', 'Fixed by the maintainer', 'issues/10', true],
    ['D-cache updates the line before the real B response', 'Issue #6', 'Open', 'issues/6', false],
    ['Load/store bus errors ignored, so a failed load writes the register', 'Issue #8 · maintainer asked for a narrower fix', 'Open', 'issues/8', false],
    ['Fetch bus errors executed as instructions and cached', 'Issue #9', 'Open', 'issues/9', false],
  ];
  $('#bugList').innerHTML = rows.map(([t, sub, st, path, ok]) =>
    `<li><p>${t}<small>${sub}</small></p><a class="chip${ok ? ' ok' : ''}" href="${base}${path}" target="_blank" rel="noopener">${st}</a></li>`).join('');
}

export function initWidgets(ctx) {
  initPipeline(ctx); initBars(ctx); initViewer(ctx); initSweep(); initSoc(ctx); initBugs();
  $('#waveBtn').addEventListener('click', () => openZoom('assets/img/dma-waveform.webp', 'Measured AXI handshakes during a DMA copy with random RAM stalls'));
  $('#zoomClose').addEventListener('click', () => $('#zoom').close());
  $('#zoom').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });
}
