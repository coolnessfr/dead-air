// DEAD AIR — test build (single-player slice, bot crew, one hidden Host)
// WebXR + desktop fallback. All art and audio are generated in code.
import * as THREE from 'three';

// ---------------------------------------------------------------- utils
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const d2 = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
const FONT = '"Courier New", Courier, monospace';
const MATCH_LEN = 600; // seconds from midnight to 6:00 AM

// ---------------------------------------------------------------- renderer / scene
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
renderer.xr.setFoveation(1);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.Fog(0x000000, 4, 19);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 60);
camera.position.set(0, 1.6, 0);
camera.rotation.order = 'YXZ';
camera.layers.enable(3); // layer 3: what eyes see (borrowed faces, hallucinations)
const rig = new THREE.Group();
rig.add(camera);
scene.add(rig);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------------------------------------------------------------- canvas helpers
function canvasTex(w, h, nearest = false) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (nearest) { tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; }
  return { c, ctx, tex };
}
function noiseTex(w, h, base, spread, repeatX, repeatY, extra) {
  const t = canvasTex(w, h);
  const { ctx } = t;
  const img = ctx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const n = (Math.random() - 0.5) * spread;
    img.data[i * 4] = clamp(base[0] + n, 0, 255);
    img.data[i * 4 + 1] = clamp(base[1] + n, 0, 255);
    img.data[i * 4 + 2] = clamp(base[2] + n, 0, 255);
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  if (extra) extra(ctx, w, h);
  t.tex.wrapS = t.tex.wrapT = THREE.RepeatWrapping;
  t.tex.repeat.set(repeatX, repeatY);
  t.tex.needsUpdate = true;
  return t.tex;
}

// VHS screen shader: used ONLY on in-world screens (CRTs, camcorder), never on the player's full view.
const screenMats = [];
function vhsMat(map, opts = {}) {
  const m = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: map },
      time: { value: 0 },
      amount: { value: opts.amount ?? 1 },
      gain: { value: opts.gain ?? 1 },
      lift: { value: opts.lift ?? 0 },
      tint: { value: new THREE.Color(opts.tint ?? 0xffffff) },
      staticAmt: { value: 0 },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      uniform sampler2D map; uniform float time, amount, gain, lift, staticAmt; uniform vec3 tint; varying vec2 vUv;
      float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){
        vec2 uv = vUv;
        float line = floor(uv.y * 140.0);
        uv.x += (rnd(vec2(line, floor(time * 24.0))) - 0.5) * 0.004 * amount;
        float band = 1.0 - smoothstep(0.0, 0.035, abs(uv.y - fract(time * 0.11)));
        uv.x += band * 0.025 * amount * (rnd(vec2(line, time)) - 0.5);
        float o = 0.004 * amount;
        vec3 c = vec3(texture2D(map, uv + vec2(o, 0.0)).r, texture2D(map, uv).g, texture2D(map, uv - vec2(o, 0.0)).b);
        c = c * gain + lift;
        c *= tint;
        float n = rnd(uv * vec2(320.0, 240.0) + fract(time * 7.13));
        c += (n - 0.5) * 0.16 * amount;
        c = mix(c, vec3(n), staticAmt);
        c *= 0.86 + 0.14 * sin(vUv.y * 520.0);
        c += band * 0.12 * amount;
        vec2 d = vUv - 0.5; c *= 1.0 - dot(d, d) * 1.1;
        gl_FragColor = vec4(max(c, 0.0), 1.0);
        #include <colorspace_fragment>
      }`,
    fog: false,
  });
  screenMats.push(m);
  return m;
}

// ---------------------------------------------------------------- materials
const lam = (color, emissive = 0, map = null) => new THREE.MeshLambertMaterial({ color, emissive, map });
const M = {
  wall: lam(0x8f9a86, 0, noiseTex(64, 64, [150, 160, 140], 18, 2, 1)),
  wallLow: lam(0x4e5a4a),
  hallWall: lam(0x9b8f74, 0, noiseTex(64, 64, [160, 148, 120], 20, 3, 1)),
  studioWall: lam(0x262628),
  concrete: lam(0x6a6862, 0, noiseTex(64, 64, [110, 108, 100], 40, 2, 1)),
  ceiling: lam(0x3a3a36),
  floorLino: lam(0xffffff, 0, noiseTex(64, 64, [180, 180, 170], 10, 8, 6, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(40,60,50,0.55)'; ctx.fillRect(0, 0, w / 2, h / 2); ctx.fillRect(w / 2, h / 2, w / 2, h / 2);
  })),
  carpet: lam(0xffffff, 0, noiseTex(64, 64, [92, 62, 44], 30, 3, 14)),
  studioFloor: lam(0x18181a),
  greyFloor: lam(0x55585c, 0, noiseTex(64, 64, [90, 92, 96], 20, 6, 5)),
  concreteFloor: lam(0xffffff, 0, noiseTex(64, 64, [96, 94, 88], 50, 8, 7)),
  wood: lam(0x5a3d26),
  metal: lam(0x6d7377),
  darkMetal: lam(0x2c3034),
  black: lam(0x0b0b0c),
  plastic: lam(0x1e1e20),
  couch: lam(0x5b3b44),
  fridge: lam(0xd8d2bd),
  pipe: lam(0x5e5248),
  door: lam(0x6b5a44),
  lightPanelGreen: new THREE.MeshBasicMaterial({ color: 0xe8ffe8 }),
  lightPanelOrange: new THREE.MeshBasicMaterial({ color: 0xffb060 }),
};

// ---------------------------------------------------------------- level geometry
const H = 3.0;           // ceiling
const DOOR_H = 2.35;     // doors slightly too tall, on purpose
const walls = [];        // full-height walls: collision + line of sight
const props = [];        // furniture: collision only
function box(x0, x1, y0, y1, z0, z1, mat, list = null) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  scene.add(m);
  if (list) { const r = { x0, x1, z0, z1, mesh: m }; list.push(r); }
  return m;
}
const T = 0.1;
function wallAlongX(z, xa, xb, mat) { box(xa, xb, 0, H, z - T, z + T, mat, walls); }
function wallAlongZ(x, za, zb, mat) { box(x - T, x + T, 0, H, za, zb, mat, walls); }
function lintelX(z, xa, xb, mat) { box(xa, xb, DOOR_H, H, z - T, z + T, mat); }
function lintelZ(x, za, zb, mat) { box(x - T, x + T, DOOR_H, H, za, zb, mat); }
function floor(x0, x1, z0, z1, mat) { box(x0, x1, -0.05, 0, z0, z1, mat); box(x0, x1, H, H + 0.05, z0, z1, M.ceiling); }
function plane(w, h, mat, x, y, z, ry = 0, rx = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(x, y, z); m.rotation.set(rx, ry, 0, 'YXZ');
  scene.add(m); return m;
}

const rooms = {
  break: { x0: -4, x1: 4, z0: 0, z1: 6, name: 'BREAK ROOM' },
  hall: { x0: -1.25, x1: 1.25, z0: -14, z1: 0, name: 'HALLWAY' },
  studio: { x0: -10, x1: -1.25, z0: -12, z1: -4, name: 'STUDIO A' },
  control: { x0: 1.25, x1: 8, z0: -12, z1: -6, name: 'CONTROL ROOM' },
  boiler: { x0: -5, x1: 5, z0: -22, z1: -14, name: 'BOILER ROOM' },
  lot: { x0: 4, x1: 9, z0: 1.5, z1: 4.7, name: 'PARKING LOT' },
};
function roomAt(x, z) {
  for (const k in rooms) { const r = rooms[k]; if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return k; }
  return 'hall';
}

// Break room
floor(-4, 4, 0, 6, M.floorLino);
wallAlongX(6, -4, 4, M.wall);
wallAlongZ(-4, 0, 6, M.wall);
wallAlongZ(4, 0, 2.5, M.wall); wallAlongZ(4, 3.7, 6, M.wall); lintelZ(4, 2.5, 3.7, M.wall);
wallAlongX(0, -4, -1.25, M.wall); wallAlongX(0, 1.25, 4, M.wall); lintelX(0, -1.25, 1.25, M.wall);
box(-3.98, 3.98, 0, 0.9, 5.88, 5.9, M.wallLow); // wainscot stripe
// Hallway
floor(-1.25, 1.25, -14, 0, M.carpet);
wallAlongZ(-1.25, -14, -7, M.hallWall); wallAlongZ(-1.25, -5.8, 0, M.hallWall); lintelZ(-1.25, -7, -5.8, M.hallWall);
wallAlongZ(1.25, -14, -9.6, M.hallWall); wallAlongZ(1.25, -8.4, 0, M.hallWall); lintelZ(1.25, -9.6, -8.4, M.hallWall);
// Studio A
floor(-10, -1.25, -12, -4, M.studioFloor);
wallAlongX(-12, -10, -1.25, M.studioWall); wallAlongX(-4, -10, -1.25, M.studioWall); wallAlongZ(-10, -12, -4, M.studioWall);
// Control room
floor(1.25, 8, -12, -6, M.greyFloor);
wallAlongX(-12, 1.25, 8, M.wall); wallAlongX(-6, 1.25, 8, M.wall); wallAlongZ(8, -12, -6, M.wall);
// Boiler room
floor(-5, 5, -22, -14, M.concreteFloor);
wallAlongX(-22, -5, 5, M.concrete); wallAlongZ(-5, -22, -14, M.concrete); wallAlongZ(5, -22, -14, M.concrete);
wallAlongX(-14, -5, -1.25, M.concrete); wallAlongX(-14, 1.25, 5, M.concrete); lintelX(-14, -1.25, 1.25, M.concrete);
// Parking lot outside the exit (where the van waits)
box(4, 9, -0.05, 0, 1.5, 4.7, lam(0x1a1a1c));
wallAlongX(1.5, 4, 9, M.black); wallAlongX(4.7, 4, 9, M.black); wallAlongZ(9, 1.5, 4.7, M.black);
const van = new THREE.Group();
const vpart = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); van.add(m); };
vpart(new THREE.BoxGeometry(1.8, 1.7, 3.6), lam(0xcfc8b4), 0, 1.05, 0);
vpart(new THREE.BoxGeometry(1.82, 0.5, 0.9), lam(0x1d5a8a), 0, 1.0, 0.6);
for (const s of [-0.6, 0.6]) vpart(new THREE.BoxGeometry(0.25, 0.15, 0.05), new THREE.MeshBasicMaterial({ color: 0xfff2c0 }), s, 0.75, -1.82);
van.position.set(7.2, 0, 3.1); van.rotation.y = -Math.PI / 2;
scene.add(van);

// Exit door (locked until the station is back on air)
const exitDoor = box(3.95, 4.05, 0, DOOR_H, 2.5, 3.7, M.door.clone(), walls);
const exitWall = walls[walls.length - 1];
const exitSignTex = canvasTex(128, 48);
const exitSign = plane(0.42, 0.16, new THREE.MeshBasicMaterial({ map: exitSignTex.tex }), 3.88, 2.55, 3.1, -Math.PI / 2);
function drawExitSign(open) {
  const { ctx } = exitSignTex;
  ctx.fillStyle = open ? '#063' : '#300'; ctx.fillRect(0, 0, 128, 48);
  ctx.fillStyle = open ? '#4f8' : '#f43'; ctx.font = `bold 30px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(open ? 'EXIT' : 'LOCKED', 64, 34);
  exitSignTex.tex.needsUpdate = true;
}

// ---------------------------------------------------------------- props
// Break room
box(-3.9, -3.1, 0, 0.8, 2.4, 3.6, M.darkMetal, props); // CRT cart
box(-3.85, -3.2, 0.8, 1.42, 2.7, 3.3, M.plastic); // CRT body
box(-2.5, 0.5, 0, 0.45, 5.2, 5.9, M.couch, props); box(-2.5, 0.5, 0.45, 1.0, 5.7, 5.9, M.couch); // couch
box(3.0, 3.8, 0, 1.8, 4.9, 5.8, M.fridge, props); // fridge
box(2.0, 3.8, 0, 0.9, 0.1, 0.7, M.wood, props); // counter
box(2.3, 2.6, 0.9, 1.25, 0.25, 0.55, M.black); // coffee maker
box(3.2, 3.6, 1.8, 2.0, 5.2, 5.5, lam(0x3a2a20)); // radio on fridge
plane(1.2, 0.08, M.lightPanelGreen, 0, 2.98, 3, 0, Math.PI / 2);
// Hallway
for (const z of [-3, -10.5]) plane(1.0, 0.08, M.lightPanelOrange, 0, 2.98, z, 0, Math.PI / 2);
box(1.13, 1.2, 0, 2.3, -3.6, -2.6, M.door); // fake door (stuck)
box(-1.2, -1.13, 0, 2.3, -12.6, -11.6, M.door);
box(0.8, 1.15, 2.6, 2.85, -13.85, -13.55, M.plastic); // security camera
// Studio A
box(-7, -4, 0, 0.9, -5.4, -4.8, M.wood, props); // news desk
box(-3.5, -2.9, 0, 1.4, -10.3, -9.7, M.darkMetal, props); // studio camera on tripod
box(-9.9, -9.45, 0, 2.1, -11.6, -8.9, M.wood, props); // tape shelf
for (const y of [0.25, 0.85, 1.45]) box(-9.9, -9.4, y - 0.02, y, -11.6, -8.9, M.wood);
box(-5.9, -5.1, 0, 0.9, -11.95, -11.5, M.darkMetal, props); // monitor stand
box(-6.0, -5.0, 0.9, 1.65, -11.95, -11.35, M.plastic); // code monitor body
// Control room
box(3, 7.9, 0, 0.9, -11.95, -11.2, M.darkMetal, props); // console
box(3.7, 4.7, 0.9, 1.65, -11.95, -11.4, M.plastic); // security monitor
box(5.1, 6.1, 0.9, 1.65, -11.95, -11.4, M.plastic); // tape monitor
// Boiler room
const boilerTank = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 2.6, 16), M.metal);
boilerTank.position.set(-2.5, 1.3, -17.5); scene.add(boilerTank);
props.push({ x0: -3.5, x1: -1.5, z0: -18.5, z1: -16.5 });
box(2.2, 3.8, 0, 1.8, -21.95, -21.0, M.darkMetal, props); // furnace
for (const x of [-4, -1, 2, 4]) box(x, x + 0.12, 2.6, 2.72, -21.9, -14.1, M.pipe);

// ---------------------------------------------------------------- lights
const hemi = new THREE.HemisphereLight(0x3a4a5a, 0x0d0a08, 0.8);
scene.add(hemi);
function plight(color, intensity, x, y, z, dist = 14) {
  const l = new THREE.PointLight(color, intensity, dist, 2);
  l.position.set(x, y, z); scene.add(l); l.userData.base = intensity; return l;
}
const L = {
  break: plight(0xdff5e0, 22, 0, 2.7, 3, 14),
  hall: plight(0xff9a3a, 12, 0, 2.6, -6.5, 14),
  studio: plight(0x3a5cff, 6, -5.5, 1.6, -10.6, 12),
  control: plight(0x4a70ff, 6, 5, 1.6, -10.8, 12),
  boiler: plight(0xff4a14, 12, 3, 1.0, -20.4, 14),
};
const lit = new Set(['break']); // rooms that count as "in the light" for Signal Decay

// ---------------------------------------------------------------- waypoint graph for bots
const nodes = {
  B0: [-1.6, 3.0], B1: [0, 0.6], B2: [1.8, 3.8], E: [3.4, 3.1],
  H1: [0, -2], H2: [0, -6.4], H3: [0, -9], H4: [0, -13],
  S0: [-2.2, -6.4], S1: [-5.5, -8.0], S2: [-8.8, -10.2], S3: [-5.5, -10.9], S4: [-5.5, -6.0],
  C0: [2.2, -9], C1: [4.8, -9], C2: [7.2, -8], C3: [5.5, -10.6],
  R0: [0, -15], R1: [0, -18.5], R2: [-4.2, -20.2], R3: [3, -20.3],
};
const edges = [['B0', 'B1'], ['B0', 'B2'], ['B1', 'B2'], ['B2', 'E'], ['B1', 'H1'], ['H1', 'H2'], ['H2', 'H3'], ['H3', 'H4'],
  ['H2', 'S0'], ['S0', 'S1'], ['S0', 'S4'], ['S4', 'S1'], ['S1', 'S2'], ['S1', 'S3'], ['H3', 'C0'], ['C0', 'C1'], ['C1', 'C2'], ['C1', 'C3'],
  ['H4', 'R0'], ['R0', 'R1'], ['R1', 'R2'], ['R1', 'R3']];
const adj = {}; for (const k in nodes) adj[k] = [];
for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
const workSpots = ['S2', 'S3', 'S4', 'C2', 'C3', 'C1', 'R2', 'R3', 'R1', 'B0', 'H4', 'H2'];

// ---------------------------------------------------------------- collision + line of sight
function segHitsBox(ax, az, bx, bz, w) {
  let t0 = 0, t1 = 1; const dx = bx - ax, dz = bz - az;
  const p = [-dx, dx, -dz, dz], q = [ax - w.x0, w.x1 - ax, az - w.z0, w.z1 - az];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) { if (q[i] < 0) return false; }
    else { const t = q[i] / p[i]; if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; } }
  }
  return true;
}
function los(ax, az, bx, bz) { for (const w of walls) if (segHitsBox(ax, az, bx, bz, w)) return false; return true; }
function collideCircle(p, r) {
  for (const list of [walls, props]) for (const w of list) {
    const cx = clamp(p.x, w.x0, w.x1), cz = clamp(p.z, w.z0, w.z1);
    const dx = p.x - cx, dz = p.z - cz, dd = dx * dx + dz * dz;
    if (dd < r * r) {
      if (dd > 1e-9) { const d = Math.sqrt(dd); p.x = cx + dx / d * r; p.z = cz + dz / d * r; }
      else {
        const opts = [[w.x0 - r - p.x, 0], [w.x1 + r - p.x, 0], [0, w.z0 - r - p.z], [0, w.z1 + r - p.z]];
        opts.sort((a, b) => Math.abs(a[0] + a[1]) - Math.abs(b[0] + b[1]));
        p.x += opts[0][0]; p.z += opts[0][1];
      }
    }
  }
}
function nearestNode(x, z) {
  let best = null, bd = 1e9, bestAny = null, bda = 1e9;
  for (const k in nodes) {
    const [nx, nz] = nodes[k]; const d = d2(x, z, nx, nz);
    if (d < bda) { bda = d; bestAny = k; }
    if (d < bd && los(x, z, nx, nz)) { bd = d; best = k; }
  }
  return best || bestAny;
}
function findPath(a, b) {
  if (a === b) return [b];
  const prev = { [a]: null }; const q = [a];
  while (q.length) { const n = q.shift(); if (n === b) break; for (const m of adj[n]) if (!(m in prev)) { prev[m] = n; q.push(m); } }
  if (!(b in prev)) return [b];
  const out = []; for (let n = b; n; n = prev[n]) out.unshift(n); return out;
}
