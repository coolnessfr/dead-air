
// ================================================================ STATION SCREENS + WALL DETAILS
const G = {}; // match state (filled by newMatch)

// --- Safety Broadcast CRT (break room). One rule is a lie.
const TRUE_RULES = [
  'STAY WITH YOUR CREW. ALONE IS WHERE IT FINDS YOU.',
  'NOT SURE? LOOK THROUGH THE CAMCORDER. IT NEVER LIES.',
  'FINISH THE 3 JOBS, THEN LEAVE IN THE VAN.',
  'TAPE ITS REAL FACE FOR 3 SECONDS. BURN THE TAPE.',
];
const FALSE_RULES = [
  { text: 'THE HOST CANNOT USE THE RADIO.', truth: 'It can. It talks on the radio, and it lies.' },
  { text: 'THE HOST BLINKS, JUST LIKE YOU.', truth: 'It never blinks. Watch the eyes.' },
];
const bc = canvasTex(256, 192);
const bcScreenMat = vhsMat(bc.tex, { amount: 1.0 });
const bcScreen = plane(0.5, 0.375, bcScreenMat, -3.19, 1.11, 3.0, Math.PI / 2);
function drawBroadcast(t) {
  const { ctx } = bc;
  const g = ctx.createLinearGradient(0, 0, 0, 192); g.addColorStop(0, '#0d2a6b'); g.addColorStop(1, '#03113a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 192);
  ctx.fillStyle = '#1b3f8f'; ctx.fillRect(170, 18, 70, 46); ctx.fillStyle = '#e8e2c8'; ctx.font = `bold 26px ${FONT}`; ctx.fillText('WKRT', 172, 44); ctx.fillText(' 9 ', 186, 62);
  // presenter: too smooth, eyes follow you, mouth out of sync
  ctx.fillStyle = '#6b1d22'; ctx.beginPath(); ctx.moveTo(52, 192); ctx.lineTo(70, 118); ctx.lineTo(136, 118); ctx.lineTo(154, 192); ctx.fill();
  ctx.fillStyle = '#ece6dc'; ctx.beginPath(); ctx.moveTo(92, 118); ctx.lineTo(103, 150); ctx.lineTo(114, 118); ctx.fill();
  ctx.fillStyle = '#e9dccf'; ctx.beginPath(); ctx.ellipse(103, 80, 27, 36, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a2a22'; ctx.beginPath(); ctx.ellipse(103, 50, 28, 12, 0, Math.PI, 0); ctx.fill();
  const px = G.playerPos ? clamp((G.playerPos.z - 3.0) * -1.2, -3, 3) : 0;
  ctx.fillStyle = '#fff'; ctx.fillRect(88, 72, 9, 5); ctx.fillRect(109, 72, 9, 5);
  ctx.fillStyle = '#111'; ctx.fillRect(91 + px, 73, 3, 3); ctx.fillRect(112 + px, 73, 3, 3);
  const talk = Math.max(0, Math.sin(t * 6.3 + 1.9)) * (Math.sin(t * 1.3) > -0.2 ? 1 : 0);
  ctx.fillStyle = '#5a1e1e'; ctx.fillRect(95, 98, 16, 2 + talk * 5);
  // lower third
  ctx.fillStyle = '#c8b25a'; ctx.fillRect(0, 128, 256, 14); ctx.fillStyle = '#111'; ctx.font = `bold 11px ${FONT}`;
  ctx.fillText('SAFETY BROADCAST  -  TONIGHT\'S RULES', 6, 139);
  const rules = G.rules || TRUE_RULES; const idx = Math.floor(t / 5) % rules.length;
  ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 142, 256, 50);
  ctx.fillStyle = '#fff'; ctx.font = `bold 13px ${FONT}`;
  wrapText(ctx, `RULE ${idx + 1}: ${rules[idx]}`, 6, 158, 246, 15);
  bc.tex.needsUpdate = true;
}
function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(' '); let line = '';
  for (const w of words) { const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, y); line = w; y += lh; } else line = test; }
  if (line) ctx.fillText(line, x, y);
  return y;
}

// --- Code monitor (studio). The real code is here; the radio may lie about it.
const codeC = canvasTex(256, 192);
plane(0.85, 0.62, vhsMat(codeC.tex, { amount: 0.9 }), -5.5, 1.28, -11.34, 0);
function drawCodeMonitor() {
  const { ctx } = codeC;
  ctx.fillStyle = '#001a8a'; ctx.fillRect(0, 0, 256, 192);
  ctx.fillStyle = '#9cf'; ctx.font = `bold 18px ${FONT}`; ctx.textAlign = 'center';
  ctx.fillText('TRANSMITTER ACCESS', 128, 50);
  ctx.fillStyle = '#fff'; ctx.font = `bold 58px ${FONT}`; ctx.fillText(G.code ? G.code.split('').join(' ') : '- - - -', 128, 120);
  ctx.fillStyle = '#9cf'; ctx.font = `bold 14px ${FONT}`; ctx.fillText('ENTER AT CONTROL ROOM KEYPAD', 128, 160);
  ctx.textAlign = 'left'; codeC.tex.needsUpdate = true;
}

// --- Security feed (control room monitor; break room CRT at stage 3)
const secRT = new THREE.WebGLRenderTarget(160, 120);
const secCam = new THREE.PerspectiveCamera(70, 4 / 3, 0.1, 25);
secCam.layers.enable(3); // ordinary cameras see the disguise. Only the camcorder sees the truth.
scene.add(secCam);
function resetSecCam() { secCam.position.set(0.9, 2.6, -13.4); secCam.lookAt(0, 1.0, -2); }
const secMat = vhsMat(secRT.texture, { amount: 1.2, gain: 2.2, lift: 0.02, tint: 0xc8ffd0 });
plane(0.85, 0.62, secMat, 4.2, 1.28, -11.39, 0);
// --- Tape monitor (control room): test pattern until the right tape plays
const tapeC = canvasTex(128, 96);
plane(0.85, 0.62, vhsMat(tapeC.tex, { amount: 1.0 }), 5.6, 1.28, -11.39, 0);
function drawTapeMonitor(playing) {
  const { ctx } = tapeC;
  if (!playing) { ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, 128, 96); ctx.fillStyle = '#8af'; ctx.font = `bold 12px ${FONT}`; ctx.fillText('NO SIGNAL', 30, 52); }
  else {
    const bars = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
    bars.forEach((b, i) => { ctx.fillStyle = b; ctx.fillRect(i * 128 / 7, 0, 128 / 7 + 1, 70); });
    ctx.fillStyle = '#111'; ctx.fillRect(0, 70, 128, 26); ctx.fillStyle = '#fff'; ctx.font = `bold 12px ${FONT}`; ctx.fillText('WKRT 9  ON AIR', 14, 88);
  }
  tapeC.tex.needsUpdate = true;
}

// --- Studio backdrop sign
const signC = canvasTex(256, 64);
signC.ctx.fillStyle = '#0b1d4a'; signC.ctx.fillRect(0, 0, 256, 64); signC.ctx.fillStyle = '#e9c25a'; signC.ctx.font = `bold 34px ${FONT}`; signC.ctx.fillText('WKRT 9 NEWS', 14, 44); signC.tex.needsUpdate = true;
plane(2.6, 0.65, new THREE.MeshBasicMaterial({ map: signC.tex, color: 0x777777 }), -5.5, 1.9, -4.12, Math.PI);

// --- Clocks. One of them is stuck at 3:33.
const clockC = canvasTex(128, 128); const clock2C = canvasTex(128, 128);
plane(0.38, 0.38, lam(0xffffff, 0, clockC.tex), 0, 2.25, 5.88, Math.PI);
plane(0.38, 0.38, lam(0xffffff, 0, clock2C.tex), -3.0, 2.25, -11.88, 0);
function drawClock(t, h, m) {
  const { ctx } = t; ctx.fillStyle = '#ddd8c8'; ctx.beginPath(); ctx.arc(64, 64, 60, 0, 7); ctx.fill();
  ctx.strokeStyle = '#222'; ctx.lineWidth = 6; ctx.stroke();
  ctx.lineCap = 'round'; const ha = ((h % 12) + m / 60) / 12 * Math.PI * 2, ma = m / 60 * Math.PI * 2;
  ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(64, 64); ctx.lineTo(64 + Math.sin(ha) * 30, 64 - Math.cos(ha) * 30); ctx.stroke();
  ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(64, 64); ctx.lineTo(64 + Math.sin(ma) * 48, 64 - Math.cos(ma) * 48); ctx.stroke();
  t.tex.needsUpdate = true;
}
drawClock(clock2C, 3, 33);

// --- Crew photo: one more figure joins the back row every time someone is taken.
const photoC = canvasTex(128, 96, true);
plane(0.55, 0.41, lam(0xffffff, 0, photoC.tex), -3.88, 1.9, 1.3, Math.PI / 2);
function drawPhoto(extra) {
  const { ctx } = photoC;
  ctx.fillStyle = '#6d6250'; ctx.fillRect(0, 0, 128, 96); ctx.fillStyle = '#efe9da'; ctx.fillRect(4, 4, 120, 88);
  ctx.fillStyle = '#8a8274'; ctx.fillRect(8, 8, 112, 70);
  for (let i = 0; i < extra; i++) { const x = 20 + i * 26; ctx.fillStyle = '#2a2622'; ctx.fillRect(x, 18, 10, 34); ctx.fillStyle = '#d9d2c4'; ctx.fillRect(x + 1, 12, 8, 9); }
  const cols = ['#2f5d9e', '#b0322c', '#3c7a3a', '#c79a2a'];
  cols.forEach((c, i) => { const x = 16 + i * 26; ctx.fillStyle = c; ctx.fillRect(x, 44, 16, 32); ctx.fillStyle = '#c9a07a'; ctx.fillRect(x + 3, 32, 10, 11); ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x + 4, 36, 8, 3); });
  ctx.fillStyle = '#333'; ctx.font = `9px ${FONT}`; ctx.fillText('NIGHT CREW  NOV 94', 18, 88);
  photoC.tex.needsUpdate = true;
}

// --- Floating label for whatever you're pointing at
const tipC = canvasTex(256, 48);
const tip = new THREE.Sprite(new THREE.SpriteMaterial({ map: tipC.tex, depthTest: false, transparent: true }));
tip.scale.set(0.36, 0.0675, 1); tip.renderOrder = 998; tip.visible = false; scene.add(tip);
let tipText = '';
function setTip(text) {
  if (text === tipText) return; tipText = text;
  const { ctx } = tipC; ctx.clearRect(0, 0, 256, 48);
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 4, 256, 40);
  ctx.fillStyle = '#ffe9a8'; ctx.font = `bold 20px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(text, 128, 31); ctx.textAlign = 'left';
  tipC.tex.needsUpdate = true;
}

// ================================================================ INTERACTABLES
const interactables = [];
function addUse(mesh, label, onUse) {
  mesh.userData.label = label; mesh.userData.onUse = onUse;
  if (!Array.isArray(mesh.material)) mesh.userData.baseEm = mesh.material.emissive ? mesh.material.emissive.getHex() : null;
  interactables.push(mesh); return mesh;
}

// --- Task: Rewire the breaker (boiler room). Match wire colors.
const WIRE_COLS = [0xd23b2f, 0xe3c33a, 0x2f6fd2];
const WIRE_NAMES = ['RED', 'YELLOW', 'BLUE'];
box(-4.98, -4.88, 1.0, 1.85, -20.75, -19.65, M.darkMetal);
const wires = [], sockets = [], wireLinks = [];
for (let i = 0; i < 3; i++) {
  const w = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), lam(WIRE_COLS[i], new THREE.Color(WIRE_COLS[i]).multiplyScalar(0.35)));
  w.position.set(-4.82, 1.65 - i * 0.22, -19.9); scene.add(w); w.userData.idx = i; wires.push(w);
  addUse(w, `${WIRE_NAMES[i]} WIRE`, () => useWire(i));
  const s = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.09), lam(WIRE_COLS[i], new THREE.Color(WIRE_COLS[i]).multiplyScalar(0.35)));
  s.position.set(-4.84, 1.65 - i * 0.22, -20.5); scene.add(s); sockets.push(s);
  addUse(s, `${WIRE_NAMES[i]} SOCKET`, () => useSocket(s));
}
function shuffleSockets() {
  const ys = shuffle([1.65, 1.43, 1.21]); sockets.forEach((s, i) => { s.position.y = ys[i]; s.userData.color = i; });
  for (const l of wireLinks) scene.remove(l); wireLinks.length = 0;
}
function useWire(i) {
  if (G.tasks.breaker || G.wireDone[i]) return;
  G.selWire = i; sfx.click(); say(`${WIRE_NAMES[i]} wire picked up. Touch the ${WIRE_NAMES[i].toLowerCase()} socket.`, 3);
  wires.forEach((w, k) => w.material.emissive.setHex(k === i ? 0xffffff : w.userData.baseEm));
}
function useSocket(s) {
  if (G.tasks.breaker || G.selWire == null) { sfx.click(); return; }
  if (s.userData.color !== G.selWire) { sfx.spark(); say('Wrong socket. Match the colors.', 2.5); return; }
  const a = wires[G.selWire].position, b = s.position;
  const len = a.distanceTo(b);
  const link = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, len, 6), lam(WIRE_COLS[G.selWire]));
  link.position.copy(a).add(b).multiplyScalar(0.5); link.lookAt(b); link.rotateX(Math.PI / 2);
  scene.add(link); wireLinks.push(link);
  G.wireDone[G.selWire] = true; wires[G.selWire].material.emissive.setHex(wires[G.selWire].userData.baseEm); G.selWire = null; sfx.clunk();
  if (G.wireDone.every(Boolean)) completeTask('breaker');
}

// --- Task: Read the code (studio monitor) and enter it (control room keypad)
box(7.88, 7.98, 1.0, 1.85, -8.3, -7.7, M.darkMetal);
const keyDispC = canvasTex(128, 32);
plane(0.26, 0.065, new THREE.MeshBasicMaterial({ map: keyDispC.tex }), 7.87, 1.76, -8.0, -Math.PI / 2);
function drawKeyDisplay(txt, col = '#7f7') {
  const { ctx } = keyDispC; ctx.fillStyle = '#031'; ctx.fillRect(0, 0, 128, 32);
  ctx.fillStyle = col; ctx.font = `bold 24px ${FONT}`; ctx.fillText(txt, 8, 25); keyDispC.tex.needsUpdate = true;
}
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', 'OK'];
KEYS.forEach((k, i) => {
  const c = canvasTex(64, 64); c.ctx.fillStyle = '#ccc6b4'; c.ctx.fillRect(0, 0, 64, 64); c.ctx.fillStyle = '#111';
  c.ctx.font = `bold ${k.length > 1 ? 22 : 40}px ${FONT}`; c.ctx.textAlign = 'center'; c.ctx.fillText(k, 32, k.length > 1 ? 40 : 46); c.tex.needsUpdate = true;
  const btn = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.075, 0.075), [lam(0xffffff, 0, c.tex), lam(0x999999), lam(0x999999), lam(0x999999), lam(0x999999), lam(0x999999)]);
  btn.rotation.y = Math.PI; // +x face (label) points into the room
  btn.position.set(7.86, 1.62 - Math.floor(i / 3) * 0.095, -8.095 + (i % 3) * 0.095); scene.add(btn);
  addUse(btn, k === 'OK' ? 'ENTER' : k === 'CLR' ? 'CLEAR' : `KEY ${k}`, () => pressKey(k));
});
function pressKey(k) {
  if (G.tasks.code) return;
  sfx.beep(k === 'OK' ? 660 : 990);
  if (k === 'CLR') G.entry = '';
  else if (k === 'OK') {
    if (G.entry === G.code) { drawKeyDisplay('ACCEPTED'); completeTask('code'); return; }
    sfx.buzz(); drawKeyDisplay('DENIED', '#f55'); G.entry = ''; say('Wrong code. Was the radio telling the truth?', 3.5); setTimeout(() => !G.tasks.code && drawKeyDisplay('____'), 900); return;
  } else if (G.entry.length < 4) G.entry += k;
  drawKeyDisplay((G.entry + '____').slice(0, 4));
}

// --- Task: Find the tape (studio shelf) and load it (control room deck)
const TAPE_LABELS = ['STATION ID 9', 'WEATHER 11/94', 'BLOOPERS', 'TEST PATTERN', 'PSA: FIRE', 'SIGN-OFF', 'COOKING HOUR', 'NEWS 6PM', 'KIDS CLUB', 'DO NOT AIR'];
const tapes = [];
TAPE_LABELS.forEach((label, i) => {
  const c = canvasTex(128, 72); const ctx = c.ctx;
  ctx.fillStyle = '#141414'; ctx.fillRect(0, 0, 128, 72); ctx.fillStyle = label === 'DO NOT AIR' ? '#d33' : '#f4efdc'; ctx.fillRect(8, 14, 112, 44);
  ctx.fillStyle = '#111'; ctx.font = `bold ${label.length > 10 ? 14 : 17}px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(label, 64, 42); c.tex.needsUpdate = true;
  const dark = lam(0x141414);
  const t = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.115, 0.2), [lam(0xffffff, 0, c.tex), dark, dark, dark, dark, dark]);
  const row = i < 4 ? 0 : i < 7 ? 1 : 2, col = i < 4 ? i : i < 7 ? i - 4 : i - 7;
  t.userData.home = new THREE.Vector3(-9.38, [0.33, 0.93, 1.53][row], -11.25 + col * 0.6 + (row ? 0.3 : 0));
  t.position.copy(t.userData.home); t.rotation.z = 0.12; t.userData.tapeLabel = label;
  scene.add(t); tapes.push(t);
  addUse(t, `TAPE: ${label}`, () => takeTape(t));
});
function returnTape(t) { scene.add(t); t.position.copy(t.userData.home); t.rotation.set(0, 0, 0.12); }
function takeTape(t) {
  if (G.held === t) return;
  if (G.held) returnTape(G.held);
  G.held = t; sfx.click(); holdInHand(t);
  if (t.userData.tapeLabel === 'DO NOT AIR') { radio('???', '...put it back...', { garble: true }); G.decay += 10; }
  else say(`Holding "${t.userData.tapeLabel}". Load it in the Control Room deck.`, 3);
}
const deck = box(6.4, 6.9, 0.9, 1.0, -11.6, -11.25, lam(0x2a2a2c));
addUse(deck, 'VCR DECK', () => {
  if (G.tasks.tape) return;
  if (!G.held) { say(`Find the tape labeled "${G.tapeLabel}" in Studio A.`, 3); sfx.click(); return; }
  if (G.held.userData.tapeLabel !== G.tapeLabel) { sfx.buzz(); say('Wrong tape. The deck spits it out.', 3); returnTape(G.held); G.held = null; return; }
  const t = G.held; G.held = null; scene.add(t); t.position.set(6.65, 1.02, -11.42); t.rotation.set(0, Math.PI / 2, Math.PI / 2);
  drawTapeMonitor(true); completeTask('tape');
});

// --- Camcorder pickup (control room console) and the furnace (boiler room)
const furnaceDoor = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.6), new THREE.MeshBasicMaterial({ color: 0xff5a1a }));
furnaceDoor.position.set(3, 0.75, -20.99); scene.add(furnaceDoor);
const furnaceHit = box(2.2, 3.8, 0.2, 1.6, -21.0, -20.9, new THREE.MeshBasicMaterial({ visible: false }));
addUse(furnaceHit, 'FURNACE', () => {
  if (G.evidence) { G.evidence = false; sfx.whoosh(); endMatch('burned'); }
  else { sfx.whoosh(); say('The furnace roars. Burn proof here: tape of the Host\'s real face.', 4); }
});
