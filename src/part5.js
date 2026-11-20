
// ================================================================ GAME FLOW
// HUD-ish things live on layer 5 so the camcorder and the security camera never film them.
camera.layers.enable(5);
for (const o of [sub, endCard, staticSphere, tip, rayLine]) o.layers.set(5);
G.playerPos = new THREE.Vector3(0, 1.6, 3.4);
G.phase = 'menu';

const ccHit = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.4), new THREE.MeshBasicMaterial({ visible: false }));
ccHit.position.copy(ccHome.pos); scene.add(ccHit);
const ccPick = addUse(ccHit, 'CAMCORDER', () => { G.hasCam = true; sfx.clunk(); placeItems(); say(G.vr ? 'Got it. Look at the flip screen. Hold LEFT TRIGGER to record.' : 'Got it. Hold RIGHT MOUSE to look through it, R to record.', 5); });
ccPick.userData.enabled = () => !G.hasCam;
tapes.forEach((t) => { t.userData.enabled = () => G.held !== t && !(G.tasks.tape && t.userData.tapeLabel === G.tapeLabel); });

// Glowing task markers (big, readable, kid-friendly)
const markerMat = new THREE.MeshBasicMaterial({ color: 0xffb040, fog: false });
const markers = [
  [-4.55, 2.15, -20.2, () => !G.tasks.breaker],
  [7.55, 2.1, -8.0, () => !G.tasks.code && G.phase === 'play'],
  [-9.0, 2.35, -10.2, () => !G.tasks.tape && !G.held],
  [6.65, 1.45, -11.42, () => !G.tasks.tape && !!G.held],
  [3.6, 1.45, -11.55, () => !G.hasCam],
  [3.0, 1.9, -20.7, () => G.evidence],
  [3.6, 2.0, 3.1, () => G.onAir],
].map(([x, y, z, show]) => { const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), markerMat); m.position.set(x, y, z); m.userData.y = y; m.userData.show = show; scene.add(m); return m; });
function updateMarkers(t) { for (const m of markers) { m.visible = G.phase !== 'menu' && G.phase !== 'end' && m.userData.show(); m.rotation.y = t * 2; m.position.y = m.userData.y + Math.sin(t * 2.5) * 0.04; } }

function at(delay, fn) { G.events.push({ t: G.t + delay, fn }); }
function aliveCrewExcept(x) { return crewAlive().filter((c) => c !== x); }

function newMatch() {
  Object.assign(G, {
    phase: 'reveal', t: 0, phaseT: 0, stage: 1, tasks: { breaker: false, code: false, tape: false }, wireDone: [false, false, false], selWire: null,
    entry: '', held: null, hasCam: false, tape: 90, recording: false, recWas: false, evProg: 0, evGrace: 0, evidence: false, decay: 0, lastHallu: -20,
    takes: [], hostCD: 0, radioMsg: null, bars: 5, isolatedT: 0, endReason: null, events: [], onAir: false, callCD: 0, silenceT: 0,
    falseEndT: 0, lightsOutT: 0, hostInFrame: false, raised: false, endT: 0, flashOn: true, decayCDT: 0,
  });
  G.code = String(randi(1000, 9999)).replace(/0/g, () => String(randi(1, 9)));
  const tapeChoices = TAPE_LABELS.filter((l) => l !== 'DO NOT AIR');
  G.tapeLabel = pick(tapeChoices);
  G.falseRule = pick(FALSE_RULES);
  G.rules = shuffle([...TRUE_RULES.slice(0, 3), G.falseRule.text]); G.rules.push(TRUE_RULES[3]);
  rig.position.set(1.4, 0, 3.4); rig.rotation.set(0, Math.PI / 2, 0); camera.rotation.x = 0;
  const ids = shuffle(IDENTS.slice()); const hi = randi(0, 3);
  bots.forEach((b, i) => b.reset(ids[i], i === hi, LOBBY_SPOTS[i]));
  if (G.held) returnTape(G.held);
  G.held = null; tapes.forEach(returnTape);
  shuffleSockets(); wires.forEach((w) => w.material.emissive.setHex(w.userData.baseEm));
  drawTapeMonitor(false); drawKeyDisplay('____'); drawCodeMonitor(); drawPhoto(0); resetSecCam(); drawExitSign(false);
  if (!walls.includes(exitWall)) walls.push(exitWall);
  exitDoor.visible = true;
  lit.clear(); lit.add('break');
  L.hall.userData.base = 12; L.boiler.userData.base = 12; L.studio.userData.base = 6; L.control.userData.base = 6;
  bcScreenMat.uniforms.map.value = bc.tex; bcScreenMat.uniforms.gain.value = 1;
  endCard.visible = false; staticSphere.visible = false; staticMat.uniforms.op.value = 0; figure.g.visible = false;
  camera.layers.enable(3); camera.layers.disable(4);
  setSilence(false); placeItems(); flashlight.visible = true;
  // radio script for this match
  at(26, () => { const c = crewAlive()[0]; radio(c.name, 'I\'ll take the boiler room. Stick together, okay?'); });
  at(rand(45, 75), () => { const c = pick(crewAlive()); if (c && !G.tasks.code) radio(c.name, `Studio monitor code is ${G.code.split('').join('-')}.`); });
  at(rand(95, 140), () => { const h = host(); if (h && h.alive && !G.tasks.code) radio(h.name, `Correction, code is ${wrongCode()}. I double-checked.`); });
  at(rand(160, 220), () => { const h = host(); if (h && h.alive) { const fake = !G.tasks.breaker ? 'Breaker\'s rewired. You\'re welcome.' : !G.tasks.tape ? 'I loaded the tape already.' : 'Hallway\'s clear, come on through.'; radio(h.name, fake); } });
  for (let k = 0; k < 8; k++) at(60 + k * rand(45, 70), () => {
    const c = pick(crewAlive()); if (!c || G.phase !== 'play') return;
    radio(c.name, pick(['Anyone else hear that?', 'Hallway lights keep flickering.', 'Stay in pairs.', 'Where is everyone?', 'Something\'s in the basement.', 'Did somebody move the camcorder?']));
  });
  for (let k = 0; k < 6; k++) at(35 + k * rand(60, 90), () => sfx.jingle());
}
function wrongCode() { const d = G.code.split(''); [d[1], d[2]] = [d[2], d[1]]; if (d.join('') === G.code) d[3] = String((+d[3] % 9) + 1); return d.join('-'); }

function completeTask(k) {
  if (G.tasks[k]) return;
  G.tasks[k] = true; sfx.chime(); G.decay = Math.max(0, G.decay - 10);
  const n = Object.values(G.tasks).filter(Boolean).length;
  const names = { breaker: 'BREAKER REWIRED', code: 'TRANSMITTER UNLOCKED', tape: 'STATION ID LOADED' };
  say(`${names[k]}  -  ${n} OF 3`, 3.5);
  if (k === 'breaker') { lit.add('hall'); lit.add('boiler'); L.hall.userData.base = 20; L.boiler.userData.base = 18; }
  if (k === 'code') { lit.add('control'); L.control.userData.base = 14; }
  if (k === 'tape') { lit.add('studio'); L.studio.userData.base = 14; }
  G.stage = n >= 2 ? 3 : 2;
  if (G.stage === 3) { bcScreenMat.uniforms.map.value = secRT.texture; bcScreenMat.uniforms.gain.value = 2.2; }
  if (n === 3) {
    G.onAir = true; walls.splice(walls.indexOf(exitWall), 1); exitDoor.visible = false; drawExitSign(true);
    at(1.2, () => radio(pick(crewAlive())?.name || '???', 'We\'re ON AIR! Everybody to the van!'));
    at(4, () => say('WKRT 9 IS BACK ON AIR. GET TO THE VAN (BREAK ROOM EXIT).', 5));
    for (const b of crewAlive()) { b.follow = 0; b.path = []; }
  } else {
    at(1.5, () => { const c = pick(crewAlive()); if (c) radio(c.name, pick(['Nice. Keep going.', `That's ${n}. Good work.`, 'Lights just came back over here.'])); });
  }
}

function playerSees(b) { const p = G.playerPos; return d2(p.x, p.z, b.pos.x, b.pos.z) < 16 && los(p.x, p.z, b.pos.x, b.pos.z); }
function canTakeBot(h, v) { return !playerSees(h) && !playerSees(v) && !aliveCrewExcept(v).some((c) => c.sees(v.pos.x, v.pos.z, 10)); }
function takeBot(h, v) {
  v.alive = false; v.av.g.visible = false; v.follow = 0;
  G.takes.push({ name: v.name, time: G.clockStr }); G.hostCD = 75; h.mode = 'blend'; h.path = [];
  sfx.thud(v.pos.clone().setY(1));
  radio(v.name, pick(['Wait, who\'s th-', 'Hey, you scared m-', 'Is that you? Why are y-']), { garble: true });
  drawPhoto(G.takes.length);
  const vic = v.ident;
  at(7, () => { const c = pick(crewAlive()); if (c) radio(c.name, `${vic.name}? ${vic.name}, come in.`); });
  if (Math.random() < 0.7) { h.pendingSkin = vic; h.pendingAt = G.t + 5; }
}
function followPlayer(b, dt, speed, stop) {
  const p = G.playerPos; const d = d2(b.pos.x, b.pos.z, p.x, p.z);
  if (d < stop) { b.yaw += angDiff(b.yaw, Math.atan2(p.x - b.pos.x, p.z - b.pos.z)) * Math.min(1, dt * 4); b.path = []; return true; }
  if (d < 9 && los(b.pos.x, b.pos.z, p.x, p.z)) { b.path = []; b.steer(p.x, p.z, dt, speed, stop); }
  else {
    b.repath -= dt;
    if (b.repath <= 0 || !b.path.length) { b.repath = 1; b.path = findPath(nearestNode(b.pos.x, b.pos.z), nearestNode(p.x, p.z)).map((k) => nodes[k]); }
    b.followPath(dt, speed);
  }
  return false;
}
function wander(b, dt) {
  b.working = false;
  if (b.follow > 0) { b.follow -= dt; followPlayer(b, dt, 1.55, 1.4); return; }
  if (b.path.length) { if (b.followPath(dt, 1.15)) { b.atWork = true; b.wait = rand(6, 14); } return; }
  b.working = !!b.atWork; b.wait -= dt;
  if (b.wait <= 0) {
    b.atWork = false;
    if (!b.isHost && Math.random() < 0.18) b.follow = rand(15, 30);
    else b.goTo(pick(workSpots));
  }
}
function crewBrain(b, dt) {
  if (G.onAir) { b.working = false; if (b.mode !== 'leave') { b.mode = 'leave'; b.goTo('E'); } b.followPath(dt, 1.6); return; }
  wander(b, dt);
}
function hostBrain(h, dt) {
  h.creep = false; h.leaning = false; h.working = false;
  G.hostCD -= dt;
  const p = G.playerPos; const dP = d2(h.pos.x, h.pos.z, p.x, p.z);
  // put on a stolen face, out of sight
  if (h.pendingSkin && G.t > h.pendingAt && !playerSees(h)) {
    const old = h.ident; h.ident = h.pendingSkin; h.pendingSkin = null;
    dressAvatar(h.av, h.ident, true); h.av.head.layers.set(3);
    at(10, () => { if (h.alive && G.phase === 'play') radio(h.ident.name, 'I\'m fine. Radio cut out.'); });
    at(25, () => { const c = pick(crewAlive()); if (c && G.phase === 'play') radio(c.name, `Has anyone seen ${old.name}?`); });
  }
  const canTake = G.t > 60 && G.hostCD <= 0 && (G.stage >= 2 || G.takes.length < 1 || G.evidence);
  const canTakePlayer = canTake && (G.stage >= 2 || G.evidence) && G.t > 110 && G.isolatedT > 3;
  // dodge the camcorder
  if (h.flee > 0) { h.flee -= dt; if (h.followPath(dt, 1.7)) h.flee = 0; return; }
  if (G.hostInFrame && G.recording && dP < 7 && h.mode !== 'stalk') {
    h.camNotice += dt;
    if (h.camNotice > 1.0) { h.camNotice = 0; if (Math.random() < 0.45) { h.flee = 8; h.follow = 0; let far = 'B0', fd = 0; for (const k of workSpots) { const dd = d2(nodes[k][0], nodes[k][1], p.x, p.z); if (dd > fd && dd < 22) { fd = dd; far = k; } } h.goTo(far); return; } }
  }
  if (h.mode === 'stalk') {
    if (!canTakePlayer && G.isolatedT <= 0) { h.mode = 'blend'; h.path = []; if (Math.random() < 0.5) radio(h.name, pick(['Hey. It\'s me.', 'Over here.', 'I found something.'])); return; }
    h.creep = dP < 6; h.leaning = dP < 2.2;
    if (dP < 1.05 && canTakePlayer) { startPlayerTake(h); return; }
    followPlayer(h, dt, h.creep ? 0.95 : G.evidence ? 1.8 : 1.45, 0.75);
    return;
  }
  if (h.mode === 'hunt') {
    const v = h.target; h.huntT -= dt;
    if (!v || !v.alive || h.huntT < 0) { h.mode = 'blend'; h.path = []; return; }
    const dv = d2(h.pos.x, h.pos.z, v.pos.x, v.pos.z);
    if (dv < 1.1 && canTakeBot(h, v)) { takeBot(h, v); return; }
    if (dv < 6 && los(h.pos.x, h.pos.z, v.pos.x, v.pos.z)) { h.path = []; h.steer(v.pos.x, v.pos.z, dt, 1.4, 0.8); }
    else { h.repath -= dt; if (h.repath <= 0 || !h.path.length) { h.repath = 1; h.path = findPath(nearestNode(h.pos.x, h.pos.z), nearestNode(v.pos.x, v.pos.z)).map((k) => nodes[k]); } h.followPath(dt, 1.4); }
    return;
  }
  h.think = (h.think || 0) - dt;
  if (h.think <= 0) {
    h.think = 1.5;
    if (canTakePlayer && (G.evidence || h.follow > 0 || Math.random() < 0.45)) { h.mode = 'stalk'; h.repath = 0; return; }
    if (canTake && !G.onAir && G.takes.length < 2) {
      const v = crewAlive().find((c) => !playerSees(c) && !aliveCrewExcept(c).some((o) => o.sees(c.pos.x, c.pos.z, 10)));
      if (v && Math.random() < 0.25) { h.mode = 'hunt'; h.target = v; h.huntT = 40; h.repath = 0; return; }
    }
  }
  if (G.onAir) { // drifts toward the exit too, hoping someone walks out alone
    if (!h.path.length && d2(h.pos.x, h.pos.z, nodes.B2[0], nodes.B2[1]) > 1) h.goTo('B2');
    h.followPath(dt, 1.3); return;
  }
  wander(h, dt);
}
function startPlayerTake(h) {
  G.phase = 'taking'; G.takeT = 0; G.takeHost = h;
  const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
  h.pos.set(G.playerPos.x + fwd.x * 0.55, 0, G.playerPos.z + fwd.z * 0.55);
  h.yaw = Math.atan2(-fwd.x, -fwd.z); h.headYaw = 0; h.grabbing = true; h.leaning = true;
  sfx.stinger(); if (h.breath) h.breath.gain.setTargetAtTime(0, AC.currentTime, 0.05);
}

function updateBots(dt) {
  const p = G.playerPos;
  for (const b of bots) {
    if (!b.alive) continue;
    if (G.phase === 'reveal' || G.phase === 'lobby') { b.yaw += angDiff(b.yaw, -Math.PI / 2) * Math.min(1, dt * 3); b.animate(dt, G.t); continue; }
    if (G.phase === 'play') {
      if (b.isHost) hostBrain(b, dt); else crewBrain(b, dt);
      const dx = b.pos.x - p.x, dz = b.pos.z - p.z, dd = Math.hypot(dx, dz), minD = b.leaning ? 0.5 : 0.65;
      if (dd < minD && dd > 1e-4) { b.pos.x = p.x + dx / dd * minD; b.pos.z = p.z + dz / dd * minD; }
      for (const o of bots) {
        if (o === b || !o.alive) continue;
        const ox = b.pos.x - o.pos.x, oz = b.pos.z - o.pos.z, od = Math.hypot(ox, oz);
        if (od < 0.55 && od > 1e-4) { b.pos.x += ox / od * (0.55 - od) * 0.5; b.pos.z += oz / od * (0.55 - od) * 0.5; }
      }
      collideCircle(b.pos, 0.22);
    }
    b.animate(dt, G.t);
  }
}

// ---------------------------------------------------------------- Signal Decay + hallucinations
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();
function updateDecay(dt) {
  const p = G.playerPos; const crew = crewAlive();
  const near = crew.filter((c) => d2(c.pos.x, c.pos.z, p.x, p.z) < 6).length;
  const h = host(); const hd = h && h.alive ? d2(h.pos.x, h.pos.z, p.x, p.z) : 99;
  let r = 0;
  if (near === 0) r += 2; if (near >= 2) r -= 3;
  r += lit.has(roomAt(p.x, p.z)) ? -1 : 1;
  if (hd < 8) r += 2;
  G.decay = clamp(G.decay + r * dt * 0.6, 0, G.stage === 1 ? 30 : 100);
  // isolation timer (no living crew can see you)
  if (crew.some((c) => c.sees(p.x, p.z, 8))) G.isolatedT = 0; else G.isolatedT += dt;
}
function tryHallucination() {
  if (G.phase !== 'play' || G.t - G.lastHallu < 45 || G.recording) return;
  const p = G.playerPos;
  if (bots.some((b) => b.alive && d2(b.pos.x, b.pos.z, p.x, p.z) < 3)) return;
  const opts = [];
  if (G.decay >= 30) opts.push('stare');
  if (G.decay >= 45) opts.push('voice');
  if (G.decay >= 55) opts.push('figure');
  if (G.decay >= 70) opts.push('silence');
  if (G.decay >= 85) opts.push('falseEnd');
  if (!opts.length || Math.random() > 0.3) return;
  const kind = pick(opts); G.lastHallu = G.t;
  if (kind === 'stare') { const b = bots.filter((b) => b.alive && playerSees(b) && d2(b.pos.x, b.pos.z, p.x, p.z) < 12)[0]; if (b) b.stare = 1.0; else G.lastHallu -= 40; }
  if (kind === 'voice') radio('YOU', pick(['It\'s me. Open up.', 'Over here.', 'I found something.', 'Don\'t look behind you.']));
  if (kind === 'figure') {
    const fwd = _v1; camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
    let best = null;
    for (const k in nodes) { const [x, z] = nodes[k]; const dx = x - p.x, dz = z - p.z, d = Math.hypot(dx, dz); if (d > 6 && d < 14 && (dx * fwd.x + dz * fwd.z) / d > 0.75 && los(p.x, p.z, x, z)) best = [x, z]; }
    if (!best) { G.lastHallu -= 40; return; }
    const id = G.takes.length ? IDENTS.find((i) => i.name === G.takes[0].name) : pick(IDENTS);
    dressAvatar(figure, id, false); figure.g.position.set(best[0], 0, best[1]);
    figure.g.rotation.y = Math.atan2(p.x - best[0], p.z - best[1]); figure.g.visible = true; G.figureT = 5;
  }
  if (kind === 'silence') { setSilence(true); G.silenceT = G.lowIntensity ? 2 : 4; }
  if (kind === 'falseEnd') { drawEndCard('SURVIVORS WIN', 'The signal is back. You made it out.', []); endCard.visible = true; G.falseEndT = 2.6; }
}

// ---------------------------------------------------------------- end of match
function drawEndCard(title, subtitle, lines, good) {
  const { ctx } = endC;
  ctx.fillStyle = '#050608'; ctx.fillRect(0, 0, 512, 320);
  ctx.fillStyle = good === false ? '#ff5a4a' : '#e9f0ff'; ctx.font = `bold 40px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(title, 256, 62);
  ctx.fillStyle = '#c9c2a8'; ctx.font = `bold 18px ${FONT}`; ctx.fillText(subtitle, 256, 96);
  ctx.textAlign = 'left'; ctx.font = `bold 16px ${FONT}`; ctx.fillStyle = '#e8e2cc';
  let y = 136; for (const l of lines) { y = wrapText(ctx, l, 28, y, 456, 20) + 26; }
  endC.tex.needsUpdate = true;
}
function endMatch(reason) {
  if (G.phase === 'end') return;
  G.phase = 'end'; G.endT = 0; G.endReason = reason; G.recording = false;
  const h = host();
  const crewWin = reason === 'van' || reason === 'burned';
  const titles = { van: ['SIGNAL RESTORED', 'You got WKRT 9 back on air and escaped.'], burned: ['HOST DESTROYED', 'The tape burned. So did it.'], taken: ['YOU WERE TAKEN', 'It was standing right next to you.'], dawn: ['6:00 AM', 'Dawn. The station stays dark. It wins.'] };
  const lines = [];
  const wore = h.ident.name !== h.origIdent.name ? ` (last seen wearing ${h.ident.name}'s face)` : '';
  lines.push(`THE HOST WAS ${h.origIdent.name}${wore}.`);
  lines.push(G.takes.length ? `TAKEN: ${G.takes.map((t) => `${t.name} at ${t.time}`).join(', ')}` : 'NOBODY ELSE WAS TAKEN.');
  lines.push(`THE LIE ON TV: "${G.falseRule.text}" ${G.falseRule.truth}`);
  lines.push(G.vr ? 'PULL A TRIGGER TO PLAY AGAIN' : 'CLICK TO PLAY AGAIN');
  drawEndCard(titles[reason][0], titles[reason][1], lines, crewWin);
  endCard.visible = true; if (staticSphere.visible) staticMat.uniforms.op.value = 0.55;
  if (crewWin) sfx.chime();
}

// ================================================================ INPUT
const keys = {};
const input = { use: false, call: false, flash: false, recHeld: false, raise: false, turn: 0, mx: 0, my: 0 };
let pointerLocked = false, dragLook = false, lastMouse = null, yaw = Math.PI / 2, pitch = 0;
addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'KeyE' || e.code === 'Space') input.use = true;
  if (e.code === 'KeyQ') input.call = true;
  if (e.code === 'KeyF') input.flash = true;
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
const cvs = renderer.domElement;
cvs.addEventListener('contextmenu', (e) => e.preventDefault());
cvs.addEventListener('mousedown', (e) => {
  if (G.vr) return;
  if (e.button === 2) { input.raise = true; return; }
  if (e.button === 0) {
    if (!pointerLocked && G.phase !== 'menu') { try { const r = cvs.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (err) { /* frame may refuse; drag to look */ } }
    dragLook = true; lastMouse = [e.clientX, e.clientY, 0];
  }
});
addEventListener('mouseup', (e) => {
  if (e.button === 2) input.raise = false;
  if (e.button === 0) { if (dragLook && (pointerLocked || (lastMouse && lastMouse[2] < 6))) input.use = true; dragLook = false; }
});
addEventListener('mousemove', (e) => {
  if (G.vr) return;
  let dx = 0, dy = 0;
  if (pointerLocked) { dx = e.movementX; dy = e.movementY; }
  else if (dragLook && lastMouse) { dx = e.clientX - lastMouse[0]; dy = e.clientY - lastMouse[1]; lastMouse[2] += Math.abs(dx) + Math.abs(dy); lastMouse[0] = e.clientX; lastMouse[1] = e.clientY; }
  yaw -= dx * 0.0025; pitch = clamp(pitch - dy * 0.0025, -1.3, 1.3);
});
document.addEventListener('pointerlockchange', () => { pointerLocked = document.pointerLockElement === cvs; });

// VR controllers (target-ray space; items are attached so they point where you point)
const ctrls = [0, 1].map((i) => {
  const c = renderer.xr.getController(i); rig.add(c);
  c.addEventListener('connected', (e) => { c.userData.hand = e.data.handedness; placeItems(); });
  c.addEventListener('disconnected', () => { c.userData.hand = null; placeItems(); });
  return c;
});
const prevBtn = { left: [], right: [] };
let snapLatch = false;
function readVRInput() {
  const session = renderer.xr.getSession(); if (!session) return;
  input.mx = 0; input.my = 0; input.turn = 0; input.recHeld = false;
  for (const src of session.inputSources) {
    const gp = src.gamepad; if (!gp) continue;
    const hand = src.handedness; const prev = prevBtn[hand] || (prevBtn[hand] = []);
    const ax = gp.axes.length >= 4 ? [gp.axes[2], gp.axes[3]] : [gp.axes[0] || 0, gp.axes[1] || 0];
    const pressed = (i) => !!(gp.buttons[i] && gp.buttons[i].pressed);
    const edge = (i) => pressed(i) && !prev[i];
    if (hand === 'left') {
      input.mx = Math.abs(ax[0]) > 0.15 ? ax[0] : 0; input.my = Math.abs(ax[1]) > 0.15 ? ax[1] : 0;
      input.recHeld = pressed(0);
      if (edge(4) || edge(5)) input.call = true;
      if (edge(0) && G.phase === 'end') input.use = true;
    } else if (hand === 'right') {
      if (Math.abs(ax[0]) > 0.7) { if (!snapLatch) { input.turn = -Math.sign(ax[0]) * Math.PI / 6; snapLatch = true; } } else if (Math.abs(ax[0]) < 0.3) snapLatch = false;
      if (edge(0)) input.use = true;
      if (edge(1)) input.flash = true;
      if (edge(4) || edge(5)) input.call = true;
    }
    for (let i = 0; i < gp.buttons.length; i++) prev[i] = pressed(i);
  }
}

// Where items live: in your hands in VR, in view on desktop.
function placeItems() {
  const r = G.vr && ctrls.find((c) => c.userData.hand === 'right');
  const l = G.vr && ctrls.find((c) => c.userData.hand === 'left');
  if (r) { r.add(handR); handR.position.set(0, 0, 0); } else { camera.add(handR); handR.position.set(0.24, -0.24, -0.36); }
  if (l) { l.add(handL); handL.position.set(0, 0, 0); } else { camera.add(handL); handL.position.set(-0.2, -0.16, -0.3); }
  handR.add(flashlight); flashlight.position.set(0, -0.015, -0.05);
  handR.add(rayLine); rayLine.visible = !!r;
  handL.add(walkie);
  if (l) { walkie.position.set(0, -0.035, 0.11); walkie.rotation.set(0.5, 0, 0); } else { walkie.position.set(0, 0, 0); walkie.rotation.set(1.2, 0, 0); }
  if (G.hasCam) {
    if (l) { handL.add(camcorder); camcorder.position.set(0, 0.015, -0.05); camcorder.rotation.set(0, 0, 0); ccScreen.rotation.x = -0.35; }
    else camera.add(camcorder);
  } else { scene.add(camcorder); camcorder.position.copy(ccHome.pos); camcorder.rotation.copy(ccHome.rot); }
}
function poseDesktopCamcorder(dt) {
  if (G.vr || !G.hasCam) return;
  const up = input.raise || keys.KeyR;
  const tgt = up ? _v1.set(0, -0.075, -0.2) : _v1.set(0.12, -0.46, -0.4);
  camcorder.position.lerp(tgt, Math.min(1, dt * 12));
  camcorder.rotation.set(up ? 0 : 0.6, 0, 0); ccScreen.rotation.x = up ? 0 : -0.35;
  G.raised = up;
}

// Hover + use
const raycaster = new THREE.Raycaster(); raycaster.far = 2.7;
let hovered = null;
function updateHover() {
  const origin = _v2, dir = _v3;
  if (G.vr && rayLine.visible) { handR.getWorldPosition(origin); dir.set(0, 0, -1).applyQuaternion(handR.getWorldQuaternion(new THREE.Quaternion())); }
  else { camera.getWorldPosition(origin); camera.getWorldDirection(dir); }
  raycaster.set(origin, dir);
  const hits = raycaster.intersectObjects(interactables, false);
  let hit = null;
  for (const h of hits) { const u = h.object.userData; if (u.enabled && !u.enabled()) continue; hit = h; break; }
  const obj = hit ? hit.object : null;
  if (hovered && hovered !== obj && hovered.userData.baseEm != null && !(hovered.userData.idx === G.selWire && wires.includes(hovered))) hovered.material.emissive.setHex(hovered.userData.baseEm);
  hovered = obj;
  if (obj) {
    if (obj.userData.baseEm != null && obj.material.emissive.getHex() === obj.userData.baseEm) obj.material.emissive.setHex(0x2a2a20);
    setTip(obj.userData.label); tip.visible = true;
    tip.position.copy(hit.point).addScaledVector(dir, -0.15); tip.position.y += 0.09;
    if (G.vr) { rayLine.scale.z = hit.distance; }
  } else { tip.visible = false; if (G.vr) rayLine.scale.z = 0.6; }
}
function doUse() {
  if (G.phase === 'end') { if (G.endT > 1.5) newMatch(); return; }
  if (G.phase !== 'play' && G.phase !== 'lobby') return;
  if (hovered && hovered.userData.onUse) { const o = hovered; if (o.userData.baseEm != null) o.material.emissive.setHex(o.userData.baseEm); o.userData.onUse(); }
}
function callCrew() {
  if (G.phase !== 'play' || G.callCD > 0) return;
  G.callCD = 10; radio('YOU', 'Regroup on me.');
  const p = G.playerPos;
  const b = bots.filter((b) => b.alive).sort((a, c) => d2(a.pos.x, a.pos.z, p.x, p.z) - d2(c.pos.x, c.pos.z, p.x, p.z))[0];
  if (!b) return;
  at(1.6, () => { if (!b.alive || G.phase !== 'play') return; b.follow = 40; b.path = []; b.repath = 0; if (b.isHost && b.mode === 'hunt') b.mode = 'blend'; radio(b.name, pick(['On my way.', 'Coming to you.', 'Stay there, I\'m coming.'])); });
}
