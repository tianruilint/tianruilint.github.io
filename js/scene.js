// One continuous world: wafer -> exposure -> interconnect -> the routed RV32I core.
// The wafer, optics and interconnect are illustrative. The layout textures are real
// OpenROAD output for rv32i_pipeline_core on Nangate45.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const P = 8.6;                 // die pitch
const WC = new THREE.Vector2(-2.5 * P, 1.5 * P); // wafer centre
const WR = P * 11;             // wafer radius
const FOG = new THREE.Color(0x05070a);

// ---------------------------------------------------------------- states
// c = camera position, t = look-at target
export const STATES = {
  // film
  rimA:   { c: [52, 100, 118], t: [-21.5, 0, 8], fov: 30, field: -25.8, fieldI: 0, expose: 0, patternAll: 0, hole: 0, build: 0, lid: 0, pulses: 0, optics: 0, reveal: 0 },
  rimB:   { c: [8, 30, 60], t: [-21, 0, 2], fov: 30 },
  expA:   { c: [-46, 9, 30], t: [-22, 0, -2], fov: 34, optics: 1 },
  expB:   { c: [-10, 7.5, 21], t: [-2, 0, -1], fov: 34, optics: 1 },
  dive:   { c: [1.6, 1.7, 2.9], t: [-0.4, -1.4, 0.2], fov: 40, optics: 0 },
  cityA:  { c: [-1.3, 0.95, 2.7], t: [0.6, -1.7, -0.4], fov: 48 },
  cityB:  { c: [-2.9, 0.5, -0.8], t: [1.4, -1.3, -1.0], fov: 50 },
  cityC:  { c: [3.2, 0.9, 3.6], t: [0, -0.6, 0], fov: 44 },
  // hero hold + scroll poses
  hero:   { c: [9.5, 9.0, 12.5], t: [0, 0, 0], fov: 30, field: 0, fieldI: 0, expose: 4, patternAll: 1, hole: 1, build: 1, lid: 1, pulses: 0, optics: 0, reveal: 1.15 },
  about:  { c: [14, 5.2, 15], t: [0, 0, 0], fov: 30, lid: 1, pulses: 0 },
  rtl:    { c: [2.4, 1.2, 4.4], t: [-0.4, -1.3, 0], fov: 46, lid: 0, pulses: 1 },
  layout: { c: [0.01, 15.5, 0.4], t: [0, 0, 0], fov: 30, lid: 1, pulses: 0 },
  soc:    { c: [-3.6, -0.55, 3.4], t: [1.6, -1.6, -1.2], fov: 54, lid: 0, pulses: 1 },
  exp:    { c: [-16, 12, 26], t: [-6, 0, 2], fov: 32, lid: 1, pulses: 0 },
  end:    { c: [-21.5, 150, 78], t: [-21.5, 0, 6], fov: 34, lid: 1, pulses: 0 },
};
const KEYS = ['field', 'fieldI', 'expose', 'patternAll', 'hole', 'build', 'lid', 'pulses', 'optics', 'fov', 'reveal'];
function full(name) {
  // fill unspecified fields from `hero` (scroll poses) so every state is complete
  const s = STATES[name]; const base = STATES.hero; const o = {};
  o.cx = s.c[0]; o.cy = s.c[1]; o.cz = s.c[2]; o.tx = s.t[0]; o.ty = s.t[1]; o.tz = s.t[2];
  for (const k of KEYS) o[k] = s[k] ?? base[k];
  return o;
}
export const stateOf = full;

// ---------------------------------------------------------------- shaders
const waferVert = /* glsl */`
varying vec3 vW;
void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;

const waferFrag = /* glsl */`
precision highp float;
varying vec3 vW;
uniform vec3 uCam; uniform vec3 uFog;
uniform float uPatternAll, uExpose, uHole, uFieldI, uR, uP, uFogK, uSweep;
uniform vec2 uField, uC;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
vec3 spectrum(float t){ return 0.5 + 0.5*cos(6.28318*(t + vec3(0.0,0.33,0.67))); }
vec3 env(vec3 r){
  float up = clamp(r.y, 0.0, 1.0);
  float strips = smoothstep(0.80, 0.99, sin(r.x*4.0 + 1.3)*0.5+0.5) * smoothstep(0.015, 0.3, up);
  float strips2 = smoothstep(0.90, 1.0, sin(r.z*7.0 - 0.6)*0.5+0.5) * smoothstep(0.25, 0.7, up);
  float ring = smoothstep(0.07, 0.0, abs(length(r.xz) - 0.42));
  vec3 c = mix(vec3(0.010,0.013,0.018), vec3(0.035,0.05,0.075), up);
  c += vec3(0.72,0.84,1.0)*strips*1.25 + vec3(0.8,0.9,1.0)*strips2*0.5 + vec3(1.0,0.66,0.42)*ring*0.55*up;
  return c;
}
void main(){
  vec2 p = vW.xz;
  vec3 V = normalize(uCam - vW);
  vec3 N = vec3(0.0,1.0,0.0);
  float rad = length(p - uC);
  vec2 g = (p + uP*0.5)/uP; vec2 cell = floor(g); vec2 f = fract(g);
  float dieHalf = 4.0/uP;
  vec2 d = abs(f - 0.5);
  float aa = fwidth(g.x) + fwidth(g.y);
  float inDie = 1.0 - smoothstep(dieHalf - aa, dieHalf + aa, max(d.x,d.y));
  vec2 cc = cell*uP;
  float valid = step(length(abs(cc - uC) + vec2(4.0)), uR*0.955) * inDie;
  float k = cell.x + 3.0;
  float inRow = step(abs(cell.y),0.5) * step(-0.5,k) * step(k,3.5);
  float exposed = inRow * smoothstep(k + 0.5, k + 0.95, uExpose);
  float pat = valid * max(uPatternAll, exposed);

  vec2 u = (f - 0.5)/(2.0*dieHalf) + 0.5;
  vec2 grid = vec2(5.0, 4.0);
  vec2 bq = floor(u*grid);
  float bh = hash(bq + 7.0);
  float dir = step(0.5, hash(bq + 3.1));
  float freq = mix(18.0, 60.0, hash(bq + 9.7));
  vec2 bu = fract(u*grid);
  float border = smoothstep(0.0,0.05,bu.x)*smoothstep(1.0,0.95,bu.x)*smoothstep(0.0,0.06,bu.y)*smoothstep(1.0,0.94,bu.y);
  float coord = (dir > 0.5 ? u.x : u.y) * freq;
  float lw = fwidth(coord);
  float lines = mix(0.5 + 0.5*sin(coord*6.28318), 0.5, clamp(lw*2.5, 0.0, 1.0));

  // second level of detail: cell rows inside each block, a pad ring and a seal ring at the die edge
  vec2 sq = floor(bu*vec2(7.0, 5.0));
  float subTone = mix(0.72, 1.18, hash(sq + bq*13.0));
  float subFade = 1.0 - clamp((fwidth(bu.x) + fwidth(bu.y))*7.0, 0.0, 1.0);
  float edgeD = max(abs(u.x - 0.5), abs(u.y - 0.5));
  float core = 1.0 - smoothstep(0.435, 0.45, edgeD);
  float ringBand = smoothstep(0.455, 0.462, edgeD)*(1.0 - smoothstep(0.484, 0.49, edgeD));
  float along = (abs(u.x - 0.5) > abs(u.y - 0.5) ? u.y : u.x)*28.0;
  float pads = ringBand*step(0.42, fract(along))*(1.0 - clamp(fwidth(along)*2.0, 0.0, 1.0));
  border *= core;

  vec3 L = normalize(vec3(0.35, 1.0, 0.25));
  vec3 H = normalize(V + L);
  vec2 gd = dir > 0.5 ? vec2(1.0,0.0) : vec2(0.0,1.0);
  float diff = dot(H.xz, gd);
  vec3 irid = spectrum(diff*(1.6 + 2.2*bh) + bh*0.9 + 0.52);
  irid = mix(vec3(dot(irid, vec3(0.333))), irid, 0.62) * vec3(0.8, 0.95, 1.15);
  vec3 R = reflect(-V, N);
  float ndv = max(dot(N,V), 0.0);
  float fres = 0.05 + 0.95*pow(1.0 - ndv, 5.0);
  vec3 refl = env(R);

  vec3 resist = spectrum(ndv*0.9 + rad/uR*0.4 + 0.50);
  resist = mix(vec3(dot(resist, vec3(0.333))), resist, 0.55) * vec3(0.75, 0.95, 1.2);
  vec3 colBare = refl*(0.30 + fres*0.9) * mix(vec3(1.0), resist*1.3, 0.6) + resist*0.012 + vec3(0.006,0.008,0.012);
  vec3 colPat = refl*(0.22 + fres*1.6)*(0.55 + 0.45*lines)*(0.6 + 0.8*bh)
              + irid*(0.2 + 0.8*bh)*border*(0.012 + 0.2*pow(1.0 - abs(diff), 4.0))*(0.6 + 0.4*lines)
              + vec3(0.010,0.012,0.018)*border;
  vec2 radial = (p - uC)/max(rad, 0.001);
  vec2 sd = vec2(cos(uSweep), sin(uSweep));
  float bow = pow(abs(dot(radial, sd)), 26.0);
  vec3 bowCol = mix(vec3(0.75,0.85,1.0), spectrum(rad/uR*0.9 + 0.1), 0.45);
  colBare = colBare*0.7 + resist*0.035 + bowCol*bow*(0.20 + 0.5*fres);
  colPat += bowCol*bow*0.05;
  colPat *= mix(1.0, subTone, subFade*core);
  colPat += vec3(0.95, 0.74, 0.48)*pads*(0.05 + 0.5*fres + 0.25*bow);
  vec3 col = mix(colBare, colPat, pat);
  col *= mix(1.0, 0.4, (1.0 - inDie)*uPatternAll*step(rad, uR*0.97));

  vec2 fd = abs(p - uField);
  float m = max(fd.x, fd.y);
  float fieldBox = 1.0 - smoothstep(3.95, 4.15, m);
  float halo = exp(-max(m - 4.0, 0.0)*0.45);
  col += vec3(0.42,0.58,1.0)*uFieldI*(fieldBox*1.9*(0.75 + 0.25*lines) + halo*0.22);

  float rim = smoothstep(uR*0.988, uR, rad);
  col = mix(col, refl*1.6 + 0.02, rim*0.7);

  float dist = length(uCam - vW);
  col = mix(uFog, col, exp(-dist*dist*uFogK));

  float hole = step(abs(cell.x) + abs(cell.y), 0.5) * inDie * uHole;
  if (hole > 0.995) discard;
  gl_FragColor = vec4(col, 1.0 - hole);
}`;

// ---------------------------------------------------------------- scene
export function createScene(canvas, { mobile = false, onFirstFrame, capture = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: 'high-performance', preserveDrawingBuffer: !!capture });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(FOG, 1);

  const scene = new THREE.Scene();
  scene.background = FOG;
  scene.fog = new THREE.FogExp2(FOG, 0.006);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.02, 900);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.16;

  // --- wafer
  const waferMat = new THREE.ShaderMaterial({
    vertexShader: waferVert, fragmentShader: waferFrag, transparent: true,
    uniforms: {
      uCam: { value: new THREE.Vector3() }, uFog: { value: FOG }, uFogK: { value: 0.000032 },
      uPatternAll: { value: 0 }, uExpose: { value: 0 }, uHole: { value: 0 }, uFieldI: { value: 0 }, uSweep: { value: 0 },
      uField: { value: new THREE.Vector2() }, uC: { value: WC }, uR: { value: WR }, uP: { value: P },
    },
  });
  const wafer = new THREE.Mesh(new THREE.CircleGeometry(WR, 160), waferMat);
  wafer.rotation.x = -Math.PI / 2; wafer.position.set(WC.x, 0, WC.y); wafer.renderOrder = 1;
  scene.add(wafer);
  const rimMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(WR, WR - 0.25, 0.5, 160, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x1a1f26, metalness: 1, roughness: 0.25 }));
  rimMesh.position.set(WC.x, -0.25, WC.y); scene.add(rimMesh);
  // chuck with a square opening under the die, so the interconnect below the surface is visible
  const chuckShape = new THREE.Shape();
  chuckShape.absarc(WC.x, -WC.y, WR * 3.2, 0, Math.PI * 2, false);
  const opening = new THREE.Path();
  opening.moveTo(-4.02, -4.02); opening.lineTo(-4.02, 4.02); opening.lineTo(4.02, 4.02); opening.lineTo(4.02, -4.02); opening.closePath();
  chuckShape.holes.push(opening);
  const chuck = new THREE.Mesh(new THREE.ShapeGeometry(chuckShape, 96), new THREE.MeshBasicMaterial({ color: 0x030405 }));
  chuck.rotation.x = -Math.PI / 2; chuck.position.set(0, -0.5, 0); scene.add(chuck);
  const chuckRing = new THREE.Mesh(
    new THREE.RingGeometry(WR + 1.2, WR + 1.7, 160),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.36, 0.22) }));
  chuckRing.rotation.x = -Math.PI / 2; chuckRing.position.set(WC.x, -0.48, WC.y); scene.add(chuckRing);

  // --- exposure optics (illustrative)
  const optics = new THREE.Group();
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 6.2, 9, 64, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x15191f, metalness: 1, roughness: 0.32, side: THREE.DoubleSide }));
  barrel.position.y = 11.5;
  const lensCap = new THREE.Mesh(new THREE.CircleGeometry(6.2, 64), new THREE.MeshStandardMaterial({ color: 0x06080b, metalness: 1, roughness: 0.15 }));
  lensCap.rotation.x = Math.PI / 2; lensCap.position.y = 7.0;
  const glowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.9, 1.3, 2.6), transparent: true, opacity: 0 });
  const lensGlow = new THREE.Mesh(new THREE.RingGeometry(2.3, 2.6, 4, 1, Math.PI / 4), glowMat);
  lensGlow.rotation.x = Math.PI / 2; lensGlow.position.y = 6.98;
  const lensRing = new THREE.Mesh(new THREE.TorusGeometry(6.2, 0.08, 8, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.7, 0.45, 0.28) }));
  lensRing.rotation.x = Math.PI / 2; lensRing.position.y = 7.0;
  optics.add(barrel, lensCap, lensGlow, lensRing); scene.add(optics);

  // --- die interior
  const tex = new THREE.TextureLoader();
  const loadTex = (url) => { const t = tex.load(url); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const routingTex = loadTex('assets/layout/lid_routing.webp');
  const placeTex = loadTex('assets/layout/lid_placement.webp');

  const walls = new THREE.Mesh(new THREE.BoxGeometry(8, 2.5, 8), new THREE.MeshBasicMaterial({ color: 0x040507, side: THREE.BackSide }));
  walls.position.y = -1.26; scene.add(walls);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshBasicMaterial({ map: placeTex, color: new THREE.Color(0.55, 0.6, 0.75) }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -2.32; scene.add(floor);

  const rnd = (() => { let s = 20261107; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();
  const layers = [
    { y: -2.10, w: 0.045, h: 0.05, pitch: 0.105, len: [0.25, 1.6], fill: 0.78 },
    { y: -1.86, w: 0.045, h: 0.05, pitch: 0.115, len: [0.3, 2.2], fill: 0.72 },
    { y: -1.58, w: 0.065, h: 0.07, pitch: 0.17, len: [0.5, 3.0], fill: 0.66 },
    { y: -1.26, w: 0.065, h: 0.07, pitch: 0.19, len: [0.6, 3.6], fill: 0.6 },
    { y: -0.86, w: 0.12, h: 0.12, pitch: 0.36, len: [1.2, 5.0], fill: 0.58 },
    { y: -0.40, w: 0.18, h: 0.15, pitch: 0.62, len: [2.0, 7.0], fill: 0.6 },
  ];
  const density = mobile ? 0.55 : 1;
  const wires = []; // {x,y,z,len,h,w,dirZ,layer}
  layers.forEach((L, li) => {
    const dirZ = li % 2 === 1;
    for (let tr = -4 + L.pitch; tr < 4 - L.pitch * 0.5; tr += L.pitch) {
      if (rnd() > density) continue;
      let pos = -4 + rnd() * 0.3;
      while (pos < 3.9) {
        const len = Math.min(L.len[0] + rnd() * (L.len[1] - L.len[0]), 3.95 - pos);
        if (len > 0.12 && rnd() < L.fill) {
          const mid = pos + len / 2;
          wires.push({ x: dirZ ? tr : mid, y: L.y, z: dirZ ? mid : tr, len, h: L.h, w: L.w, dirZ, layer: li });
        }
        pos += len + 0.08 + rnd() * 0.5;
      }
    }
  });
  const vias = [];
  wires.forEach((w) => {
    if (w.layer >= 5 || rnd() > 0.55) return;
    const up = layers[w.layer + 1];
    const e = (rnd() < 0.5 ? -1 : 1) * (w.len / 2 - w.w);
    vias.push({ x: w.dirZ ? w.x : w.x + e, z: w.dirZ ? w.z + e : w.z, y: (w.y + up.y) / 2, h: up.y - w.y, s: Math.min(w.w, up.w) * 0.95, layer: w.layer });
  });
  const count = wires.length + vias.length;
  const wireMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.28 });
  const buildU = { value: 0 };
  wireMat.onBeforeCompile = (sh) => {
    sh.uniforms.uBuild = buildU;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aSeed; uniform float uBuild;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat gB = smoothstep(aSeed, aSeed + 0.10, uBuild); transformed.x *= gB; transformed.yz *= step(0.002, gB);');
  };
  const city = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), wireMat, count);
  const seeds = new Float32Array(count);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), qz = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
  const qv = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
  const col = new THREE.Color();
  wires.forEach((w, i) => {
    m4.compose(new THREE.Vector3(w.x, w.y, w.z), w.dirZ ? qz : q, new THREE.Vector3(w.len, w.h, w.w));
    city.setMatrixAt(i, m4);
    const tone = rnd();
    const lk = 0.3 + 0.7 * (w.layer / 5);
    col.setRGB((0.72 + tone * 0.2) * lk, (0.30 + tone * 0.1) * lk, (0.11 + tone * 0.06) * lk);
    if (w.layer >= 4 && tone > 0.7) col.setRGB(0.9, 0.5, 0.24);
    city.setColorAt(i, col);
    seeds[i] = (w.layer / 6) * 0.86 + rnd() * 0.05;
  });
  vias.forEach((v, j) => {
    const i = wires.length + j;
    m4.compose(new THREE.Vector3(v.x, v.y, v.z), qv, new THREE.Vector3(v.h, v.s, v.s));
    city.setMatrixAt(i, m4);
    col.setRGB(0.3, 0.13, 0.05); city.setColorAt(i, col);
    seeds[i] = ((v.layer + 0.6) / 6) * 0.86 + rnd() * 0.05;
  });
  city.geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
  city.instanceMatrix.needsUpdate = true; city.frustumCulled = false;
  scene.add(city);

  // pulses: signals on the upper metal
  const top = wires.filter((w) => w.layer >= 3);
  const NP = mobile ? 40 : 90;
  const pulseMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.2, 2.4, 4.0), transparent: true, opacity: 0 });
  const pulses = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), pulseMat, NP);
  const pd = Array.from({ length: NP }, () => ({ w: top[Math.floor(rnd() * top.length)], ph: rnd(), sp: 0.25 + rnd() * 0.6 }));
  pulses.frustumCulled = false; scene.add(pulses);

  // lid = the real routed layout
  const lidDim = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false }));
  lidDim.rotation.x = -Math.PI / 2; lidDim.position.y = 0.012; lidDim.renderOrder = 2; scene.add(lidDim);
  const lid = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { map: { value: routingTex }, uOpacity: { value: 0 }, uReveal: { value: 1.15 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    // the layout is drawn in along a diagonal scan line, like a plot being written out
    fragmentShader: `uniform sampler2D map; uniform float uOpacity, uReveal; varying vec2 vUv;
      void main(){
        float d = (vUv.x + (1.0 - vUv.y)) * 0.5;
        float m = 1.0 - smoothstep(uReveal - 0.02, uReveal, d);
        float line = exp(-pow((d - uReveal) / 0.014, 2.0)) * step(uReveal, 1.04);
        vec3 c = texture2D(map, vUv).rgb * m + vec3(1.0, 0.72, 0.45) * line * 1.6;
        gl_FragColor = vec4(c * uOpacity, 1.0);
      }`,
  }));
  lid.rotation.x = -Math.PI / 2; lid.position.y = 0.02; lid.renderOrder = 3; scene.add(lid);
  const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(8.06, 8.06)), new THREE.LineBasicMaterial({ color: new THREE.Color(1.0, 0.68, 0.42), transparent: true, opacity: 0 }));
  frame.rotation.x = -Math.PI / 2; frame.position.y = 0.03; frame.renderOrder = 4; scene.add(frame);

  const key = new THREE.DirectionalLight(0xffd2a8, 1.7); key.position.set(4, 7, 2.5); scene.add(key);
  const fillL = new THREE.PointLight(0x7fb4ff, 3.5, 12, 1.6); fillL.position.set(-3, 1.5, 3); scene.add(fillL);

  // --- post
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.42, 0.7, 0.85);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // --- state
  let api = null;
  const S = full('hero');
  const offset = { x: 0, y: 0 }; // principal-point shift as fraction of viewport
  let W = 1, H = 1, running = true, first = true, clock = 0, last = performance.now();
  let probe = 0, probeT = 0;
  const target = new THREE.Vector3();

  function resize() {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    renderer.setSize(W, H, false); composer.setSize(W, H);
    camera.aspect = W / H;
    applyOffset();
  }
  function applyOffset() {
    camera.setViewOffset(W, H, -offset.x * W, -offset.y * H, W, H);
    camera.updateProjectionMatrix();
  }
  function setOffset(x, y) { if (x !== offset.x || y !== offset.y) { offset.x = x; offset.y = y; applyOffset(); } }

  function apply(dt) {
    const portrait = camera.aspect < 0.8;
    camera.position.set(S.cx, S.cy, S.cz);
    target.set(S.tx, S.ty, S.tz);
    camera.lookAt(target);
    if (api && (api.nudge.x || api.nudge.y)) {
      // small pointer-driven parallax, proportional to the distance to the subject
      const d = camera.position.distanceTo(target) * 0.022;
      camera.translateX(api.nudge.x * d); camera.translateY(-api.nudge.y * d);
      camera.lookAt(target);
    }
    const fov = S.fov * (portrait ? 1.55 : camera.aspect < 1.25 ? 1.2 : 1);
    if (Math.abs(camera.fov - fov) > 0.001) { camera.fov = fov; camera.updateProjectionMatrix(); }
    const insideK = Math.min(1, Math.max(0, (1.6 - S.cy) / 2.2));
    scene.fog.density = 0.006 + insideK * 0.34;
    const u = waferMat.uniforms;
    u.uCam.value.copy(camera.position);
    u.uPatternAll.value = S.patternAll; u.uExpose.value = S.expose; u.uHole.value = S.hole; u.uFieldI.value = S.fieldI;
    u.uField.value.set(S.field, 0); u.uSweep.value = 0.9 + clock * 0.12;
    optics.position.set(S.field, 0, 0); optics.visible = S.optics > 0.01;
    optics.scale.setScalar(1); optics.position.y = (1 - S.optics) * 30;
    glowMat.opacity = Math.min(1, S.fieldI * 1.2);
    buildU.value = S.build;
    const inside = S.hole > 0.01;
    city.visible = walls.visible = floor.visible = inside;
    lid.material.uniforms.uOpacity.value = S.lid * 0.95; lid.material.uniforms.uReveal.value = S.reveal;
    lidDim.material.opacity = S.lid * 0.62 * Math.min(1, S.reveal); frame.material.opacity = S.lid * 0.9;
    lid.visible = lidDim.visible = frame.visible = S.lid > 0.005;
    pulseMat.opacity = Math.min(1, S.pulses) * S.build;
    pulses.visible = inside && pulseMat.opacity > 0.01;
    if (pulses.visible) {
      for (let i = 0; i < NP; i++) {
        const p = pd[i]; const w = p.w;
        const tt = ((clock * p.sp + p.ph) % 1.4) / 1.0;
        const a = (Math.min(tt, 1) - 0.5) * w.len;
        const s = tt > 1 ? 0 : 1;
        m4.compose(new THREE.Vector3(w.dirZ ? w.x : w.x + a, w.y + w.h * 0.5 + 0.012, w.dirZ ? w.z + a : w.z), w.dirZ ? qz : q,
          new THREE.Vector3(0.11 * s, 0.014 * s, w.w * 0.7 * s));
        pulses.setMatrixAt(i, m4);
      }
      pulses.instanceMatrix.needsUpdate = true;
    }
    fillL.position.set(Math.sin(clock * 0.3) * 3, -0.4, Math.cos(clock * 0.23) * 3);
  }

  function frameLoop(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; if (!api.frozen) clock += dt;
    api.onFrame && api.onFrame(dt);
    apply(dt);
    composer.render();
    if (first) { first = false; onFirstFrame && onFirstFrame(); }
    // adaptive resolution: if the first second of frames is slow, drop to 1x pixels
    if (probe >= 0 && !capture) {
      probe++; probeT += dt;
      if (probe === 45) { if (probeT / 45 > 0.03 && renderer.getPixelRatio() > 1) { renderer.setPixelRatio(1); resize(); } probe = -1; }
    }
    requestAnimationFrame(frameLoop);
  }
  function start() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frameLoop); } }
  function stop() { running = false; }
  function renderOnce() { apply(0); composer.render(); }

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frameLoop);
  api = { S, start, stop, renderOnce, resize, setOffset, renderer, canvas, frozen: false, onFrame: null, nudge: { x: 0, y: 0 } };
  return api;
}
