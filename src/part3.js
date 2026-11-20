
// ================================================================ AVATARS
const IDENTS = [
  { name: 'ROOK', jacket: 0x2f5d9e, skin: '#b77b52', hair: '#21160e' },
  { name: 'JO', jacket: 0xb0322c, skin: '#f0c6a0', hair: '#7a4a1c' },
  { name: 'PIKE', jacket: 0x3c7a3a, skin: '#7d4f33', hair: '#0e0e0e' },
  { name: 'WREN', jacket: 0xc79a2a, skin: '#e2ad84', hair: '#c9b07a' },
];
function faceCanvas(id, mode) {
  // mode: 'open' | 'blink' | 'borrowed' (the Host's printed copy: too wide, eyes misaligned, seams)
  const t = canvasTex(32, 32, true); const ctx = t.ctx;
  ctx.fillStyle = id.skin; ctx.fillRect(0, 0, 32, 32);
  ctx.fillStyle = id.hair; ctx.fillRect(0, 0, 32, 7); ctx.fillRect(0, 0, 3, 14); ctx.fillRect(29, 0, 3, 14);
  const b = mode === 'borrowed';
  ctx.fillStyle = '#16100c';
  if (mode === 'blink') { ctx.fillRect(8, 15, 5, 1); ctx.fillRect(19, 15, 5, 1); }
  else { ctx.fillRect(b ? 9 : 8, b ? 13 : 14, 4, 3); ctx.fillRect(b ? 19 : 20, b ? 15 : 14, 4, 3); ctx.fillStyle = '#fff'; ctx.fillRect(b ? 10 : 9, b ? 13 : 14, 1, 1); ctx.fillRect(b ? 20 : 21, b ? 15 : 14, 1, 1); }
  ctx.fillStyle = '#6a2a24';
  if (b) { ctx.fillRect(10, 23, 12, 2); ctx.fillRect(9, 22, 1, 1); ctx.fillRect(22, 22, 1, 1); } // held smile
  else ctx.fillRect(12, 23, 8, 2);
  if (b) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 7, 32, 1); ctx.fillRect(1, 8, 1, 20); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(28, 9, 2, 18); }
  t.tex.needsUpdate = true; return t.tex;
}
function trueFaceTex() {
  // Original Host design: blank mannequin head, faint eye dents, a mouth that opens far too wide.
  const t = canvasTex(64, 64, true); const ctx = t.ctx;
  ctx.fillStyle = '#dcd6cc'; ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#c9c2b6'; ctx.beginPath(); ctx.ellipse(20, 22, 6, 3, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(44, 22, 6, 3, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#0a0203'; ctx.beginPath(); ctx.ellipse(32, 44, 24, 17, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#efe8d8';
  for (let i = 0; i < 15; i++) { const a = Math.PI + (i + 0.5) / 15 * Math.PI; const x = 32 + Math.cos(a) * 22, y = 44 + Math.sin(a) * 15; ctx.fillRect(x - 1, y, 2, 3); }
  for (let i = 0; i < 15; i++) { const a = (i + 0.5) / 15 * Math.PI; const x = 32 + Math.cos(a) * 22, y = 44 + Math.sin(a) * 15; ctx.fillRect(x - 1, y - 3, 2, 3); }
  ctx.fillStyle = '#3a0a0c'; ctx.beginPath(); ctx.ellipse(32, 47, 8, 6, 0, 0, 7); ctx.fill();
  t.tex.needsUpdate = true; return t.tex;
}
const TRUE_FACE = trueFaceTex();
const faceCache = {};
function faceTex(id, mode) { const k = id.name + mode; return faceCache[k] || (faceCache[k] = faceCanvas(id, mode)); }
const tagCache = {};
function tagTex(name) {
  if (tagCache[name]) return tagCache[name];
  const t = canvasTex(64, 32); t.ctx.fillStyle = '#efe9d6'; t.ctx.fillRect(0, 0, 64, 32); t.ctx.fillStyle = '#123'; t.ctx.font = `bold 15px ${FONT}`;
  t.ctx.textAlign = 'center'; t.ctx.fillText(name, 32, 15); t.ctx.font = `bold 9px ${FONT}`; t.ctx.fillText('WKRT-9 CREW', 32, 27); t.tex.needsUpdate = true;
  return (tagCache[name] = t.tex);
}

function makeAvatar() {
  const g = new THREE.Group();
  const jacket = lam(0x888888), pants = lam(0x26262c), skinM = lam(0xffffff);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.56, 0.26), jacket); torso.position.y = 1.18; g.add(torso);
  const hip = new THREE.Group(); hip.position.y = 0.88; g.add(hip);
  const legs = [-0.11, 0.11].map((x) => { const p = new THREE.Group(); p.position.set(x, 0.88, 0); const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.86, 0.18), pants); m.position.y = -0.43; p.add(m); g.add(p); return p; });
  const arms = [-0.29, 0.29].map((x) => { const p = new THREE.Group(); p.position.set(x, 1.42, 0); const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.14), jacket); m.position.y = -0.3; p.add(m); const h = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), skinM); h.position.y = -0.63; p.add(h); g.add(p); return p; });
  const tagM = new THREE.MeshLambertMaterial({ map: null });
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.08), tagM); tag.position.set(0.1, 1.28, 0.132); g.add(tag);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.12), skinM); neck.position.y = 1.5; g.add(neck);
  const headPivot = new THREE.Group(); headPivot.position.y = 1.55; g.add(headPivot);
  const faceM = new THREE.MeshLambertMaterial({ map: null }); const headSkin = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const hairM = new THREE.MeshLambertMaterial({ color: 0x222222 });
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.29, 0.25), [headSkin, headSkin, hairM, headSkin, faceM, hairM]);
  head.position.y = 0.15; headPivot.add(head);
  const mic = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.12), M.black); mic.position.set(0.11, 0.08, 0.1); head.add(mic);
  const trueM = new THREE.MeshLambertMaterial({ map: TRUE_FACE }); const pale = new THREE.MeshLambertMaterial({ color: 0xdcd6cc });
  const trueHead = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.31, 0.25), [pale, pale, pale, pale, trueM, pale]);
  trueHead.position.y = 0.16; trueHead.layers.set(4); trueHead.visible = false; headPivot.add(trueHead);
  scene.add(g);
  return { g, torso, legs, arms, tag, tagM, headPivot, head, faceM, headSkin, hairM, skinM, jacket, trueHead };
}
function setAvatarLayer(av, layer) { av.g.traverse((o) => { if (o !== av.trueHead) o.layers.set(layer); }); }
function dressAvatar(av, id, borrowed) {
  av.jacket.color.setHex(id.jacket);
  const skin = new THREE.Color(id.skin); av.headSkin.color.copy(skin); av.skinM.color.copy(skin);
  av.hairM.color.set(id.hair);
  av.faceM.map = faceTex(id, borrowed ? 'borrowed' : 'open'); av.faceM.needsUpdate = true;
  av.tagM.map = tagTex(id.name); av.tagM.needsUpdate = true;
  av.head.scale.set(borrowed ? 1.07 : 1, 1, 1);
  av.g.scale.set(1, borrowed ? 1.04 : 1, 1); // stolen skins are a little too tall
}

// ================================================================ BOTS
class Bot {
  constructor() {
    this.av = makeAvatar(); this.pos = this.av.g.position;
    this.path = []; this.yaw = 0; this.headYaw = 0; this.phase = 0; this.stepAcc = 0;
  }
  reset(id, isHost, spot) {
    this.ident = id; this.origIdent = id; this.isHost = isHost; this.alive = true; this.av.g.visible = true;
    this.path = []; this.wait = rand(1, 3); this.mode = 'lobby'; this.follow = 0; this.stare = 0; this.flee = 0;
    this.repath = 0; this.target = null; this.working = false; this.blinkT = rand(1, 4); this.camNotice = 0; this.saidCode = false;
    this.pos.set(spot[0], 0, spot[1]); this.yaw = -Math.PI / 2; this.headYaw = 0;
    setAvatarLayer(this.av, 0);
    dressAvatar(this.av, id, false);
    if (isHost) { this.av.head.layers.set(3); this.av.trueHead.visible = true; this.av.faceM.map = faceTex(id, 'borrowed'); this.av.head.scale.set(1.07, 1, 1); }
    else this.av.trueHead.visible = false;
  }
  get name() { return this.ident.name; }
  goTo(node) { this.path = findPath(nearestNode(this.pos.x, this.pos.z), node).map((k) => nodes[k]); this.dest = node; }
  steer(tx, tz, dt, speed, stopDist = 0.15) {
    const dx = tx - this.pos.x, dz = tz - this.pos.z, d = Math.hypot(dx, dz);
    if (d < stopDist) return true;
    const s = Math.min(d, speed * dt);
    this.pos.x += dx / d * s; this.pos.z += dz / d * s;
    const targetYaw = Math.atan2(dx, dz);
    this.yaw += angDiff(this.yaw, targetYaw) * Math.min(1, dt * 8);
    this.moving = true; return false;
  }
  followPath(dt, speed) {
    if (!this.path.length) return true;
    const [nx, nz] = this.path[0];
    if (this.steer(nx, nz, dt, speed, 0.25)) this.path.shift();
    return this.path.length === 0;
  }
  sees(x, z, range = 10) { return d2(this.pos.x, this.pos.z, x, z) < range && los(this.pos.x, this.pos.z, x, z); }
  animate(dt, t) {
    const av = this.av;
    if (this.moving) { this.phase += dt * 7.5; this.stepAcc += dt; if (this.stepAcc > 0.42) { this.stepAcc = 0; sfx.step(this); } }
    else this.phase *= 0.9;
    const sw = Math.sin(this.phase) * (this.moving ? 0.5 : 0);
    av.legs[0].rotation.x = sw; av.legs[1].rotation.x = -sw;
    const workArm = this.working ? -1.1 + Math.sin(t * 6 + this.pos.x) * 0.15 : 0;
    const grab = this.grabbing ? -1.5 : 0;
    av.arms[0].rotation.x = grab || workArm || -sw * 0.8; av.arms[1].rotation.x = grab || workArm || sw * 0.8;
    av.g.rotation.y = this.yaw;
    av.torso.position.y = 1.18 + Math.abs(Math.sin(this.phase)) * 0.02;
    // head: crew look at you quickly; the Host's head turns a beat after its body
    let look = 0;
    const p = G.playerPos;
    if (p && d2(this.pos.x, this.pos.z, p.x, p.z) < 4.5) look = clamp(angDiff(this.yaw, Math.atan2(p.x - this.pos.x, p.z - this.pos.z)), -1.2, 1.2);
    if (this.stare > 0) { this.stare -= dt; look = clamp(angDiff(this.yaw, Math.atan2(p.x - this.pos.x, p.z - this.pos.z)), -1.6, 1.6); this.headYaw = look; }
    const rate = this.isHost ? 1.6 : 9;
    this.headYaw += (look - this.headYaw) * Math.min(1, dt * rate);
    av.headPivot.rotation.y = this.headYaw;
    av.headPivot.rotation.z = this.isHost && this.leaning ? 0.35 : 0;
    // blinking. The Host never blinks.
    if (!this.isHost) {
      this.blinkT -= dt;
      if (this.blinkT < 0) { av.faceM.map = faceTex(this.ident, 'blink'); if (this.blinkT < -0.13) { av.faceM.map = faceTex(this.ident, 'open'); this.blinkT = rand(1.5, 5); } }
    }
    this.moving = false;
  }
}
const bots = [new Bot(), new Bot(), new Bot(), new Bot()];
const LOBBY_SPOTS = [[-2.0, 2.0], [-2.2, 4.0], [-1.2, 1.5], [-1.0, 4.6]];
const host = () => bots.find((b) => b.isHost);
const crewAlive = () => bots.filter((b) => b.alive && !b.isHost);

// Hallucination figure: wears a crew skin, stands where nobody is. Seen by eyes only, never by the camcorder.
const figure = makeAvatar();
setAvatarLayer(figure, 3); figure.g.visible = false;
