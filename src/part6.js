
// ================================================================ MAIN LOOP
const clk = new THREE.Clock();
let frameN = 0, acc5 = 0, acc10 = 0, acc1 = 0, accBars = 0, lastMin = -1;
const _q = new THREE.Quaternion();

function snapTurn(a) {
  const head = camera.getWorldPosition(_v1);
  rig.position.sub(head); rig.position.applyAxisAngle(_v2.set(0, 1, 0), a); rig.position.add(head); rig.rotation.y += a;
}

function frame(dt) {
  for (const m of screenMats) m.uniforms.time.value += dt;
  staticMat.uniforms.time.value += dt;
  acc10 += dt; acc5 += dt; acc1 += dt; accBars += dt;
  if (acc10 > 0.1) { drawBroadcast(G.t || performance.now() / 1000); }
  if (G.phase === 'menu') { acc10 = 0; return; }
  G.t += dt; G.phaseT += dt;
  for (let i = G.events.length - 1; i >= 0; i--) if (G.t >= G.events[i].t) { const e = G.events.splice(i, 1)[0]; e.fn(); }

  // ---- phases
  if (G.phase === 'reveal' && G.phaseT > 3.2) { G.phase = 'lobby'; G.phaseT = 0; say('Watch the Safety Broadcast. One of the rules is a lie.', 6); }
  if (G.phase === 'lobby' && G.phaseT > 22) {
    G.phase = 'play'; G.phaseT = 0; say('Get to work. The camcorder is in the Control Room.', 5);
    bots.forEach((b) => { b.wait = rand(0, 3); b.path = []; b.mode = 'blend'; b.atWork = false; });
  }
  const active = G.phase === 'lobby' || G.phase === 'play';

  // ---- movement
  let mx = 0, my = 0;
  if (!G.vr) {
    if (keys.KeyW || keys.ArrowUp) my -= 1; if (keys.KeyS || keys.ArrowDown) my += 1;
    if (keys.KeyD) mx += 1; if (keys.KeyA) mx -= 1;
    if (keys.ArrowLeft) yaw += dt * 2; if (keys.ArrowRight) yaw -= dt * 2;
    rig.rotation.y = yaw; camera.rotation.x = pitch;
  } else { mx = input.mx; my = input.my; if (input.turn && G.phase !== 'taking') snapTurn(input.turn); input.turn = 0; }
  if (active) {
    const fwd = camera.getWorldDirection(_v1); fwd.y = 0; fwd.normalize();
    const sp = (G.vr ? 1.8 : 2.3) * dt;
    rig.position.x += (-fwd.x * my - fwd.z * mx) * sp;
    rig.position.z += (-fwd.z * my + fwd.x * mx) * sp;
  }
  camera.getWorldPosition(G.playerPos);
  const c = { x: G.playerPos.x, z: G.playerPos.z }; collideCircle(c, 0.25);
  rig.position.x += c.x - G.playerPos.x; rig.position.z += c.z - G.playerPos.z;
  G.playerPos.x = c.x; G.playerPos.z = c.z;

  // ---- actions
  if (input.use) { input.use = false; doUse(); }
  if (input.call) { input.call = false; callCrew(); }
  if (input.flash) { input.flash = false; G.flashOn = !G.flashOn; sfx.click(); }
  G.callCD -= dt;
  if (active) updateHover(); else tip.visible = false;
  poseDesktopCamcorder(dt);

  // ---- camcorder: recording + is the Host in frame?
  const want = G.hasCam && active && G.tape > 0 && (G.vr ? input.recHeld : !!keys.KeyR);
  if (want && !G.recWas) { if (G.t > G.decayCDT) { G.decay = Math.max(0, G.decay - 10); G.decayCDT = G.t + 8; } sfx.click(); }
  G.recording = want; G.recWas = want; if (want) G.tape -= dt;
  G.hostInFrame = false;
  const h = host();
  if (G.hasCam && h && h.alive) {
    camcorder.updateMatrixWorld(true);
    h.av.headPivot.getWorldPosition(_v1); _v1.y += 0.12; ccCam.getWorldPosition(_v2);
    if (_v1.distanceTo(_v2) < 9 && los(_v2.x, _v2.z, _v1.x, _v1.z)) {
      _v3.copy(_v1).project(ccCam);
      if (Math.abs(_v3.x) < 0.85 && Math.abs(_v3.y) < 0.85 && _v3.z < 1) G.hostInFrame = true;
    }
  }
  if (G.recording && G.hostInFrame && !G.evidence && G.phase === 'play') {
    G.evProg += dt; G.evGrace = 0.5;
    if (G.evProg >= 3) { G.evidence = true; G.evProg = 0; sfx.chime(); say('EVIDENCE TAPE! Burn it in the Boiler Room furnace.', 5); G.hostCD = Math.min(G.hostCD, 8); }
  } else { G.evGrace -= dt; if (G.evGrace <= 0) G.evProg = 0; }

  // ---- bots, decay, hallucinations
  if (G.phase !== 'end') updateBots(dt);
  if (G.phase === 'play') updateDecay(dt);
  if (acc1 > 1) { acc1 = 0; tryHallucination(); }
  updateMarkers(G.t);
  if (G.silenceT > 0) { G.silenceT -= dt; if (G.silenceT <= 0) setSilence(false); }
  if (G.falseEndT > 0) { G.falseEndT -= dt; if (G.falseEndT <= 0) { endCard.visible = false; G.lightsOutT = 3; say('...', 2); } }
  if (G.lightsOutT > 0) G.lightsOutT -= dt;
  if (figure.g.visible) { G.figureT -= dt; if (G.figureT <= 0 || d2(figure.g.position.x, figure.g.position.z, G.playerPos.x, G.playerPos.z) < 5) figure.g.visible = false; }

  // ---- lights
  const hd = h && h.alive ? d2(h.pos.x, h.pos.z, G.playerPos.x, G.playerPos.z) : 99;
  for (const k in L) {
    const l = L[k]; let v = l.userData.base;
    if (G.phase === 'reveal' || G.lightsOutT > 0) v = 0;
    else {
      if (G.stage >= 2 && (k === 'hall' || k === 'studio')) { const f = Math.sin(G.t * 23.1 + k.length) * Math.sin(G.t * 3.7 + 1); if (f > 0.82) v *= 0.12; }
      if (h && h.alive && d2(h.pos.x, h.pos.z, l.position.x, l.position.z) < 5 && Math.random() < 0.08) v *= 0.3;
      if (k === 'boiler') v *= 0.8 + Math.random() * 0.2;
    }
    l.intensity = v;
  }
  hemi.intensity = G.phase === 'reveal' ? 0.0 : 1.0;
  spot.intensity = G.flashOn && G.phase !== 'reveal' ? (hd < 4 && Math.random() < 0.15 ? 1.5 : 8) : 0;
  flLens.material.color.setHex(spot.intensity > 0 ? 0xfff4d0 : 0x333333);

  // ---- audio that tracks the Host
  if (AC && h) {
    const k = h.alive && hd < 10 && G.phase === 'play' ? 1 - hd / 10 : 0;
    sigGain.gain.setTargetAtTime(k * 0.035, AC.currentTime, 0.2); sigLfoGain.gain.setTargetAtTime(k * 70, AC.currentTime, 0.2);
    for (const b of bots) if (b.breath) {
      let g = 0;
      if (b === h && b.alive && hd < 3.2 && G.phase === 'play') {
        const f = camera.getWorldDirection(_v1); const dx = h.pos.x - G.playerPos.x, dz = h.pos.z - G.playerPos.z;
        if ((f.x * dx + f.z * dz) / (Math.hypot(dx, dz) + 1e-4) < 0.3) g = 0.6 * (0.5 + 0.5 * Math.sin(G.t * 3.4));
      }
      b.breath.gain.setTargetAtTime(g, AC.currentTime, 0.12);
    }
  }

  // ---- walkie signal bars (they lie when Signal Decay is high)
  if (accBars > 0.5) {
    accBars = 0;
    G.bars = hd > 14 ? 5 : hd > 10 ? 4 : hd > 7 ? 3 : hd > 4 ? 2 : 1;
    if (G.decay > 50 && Math.random() < 0.25) G.bars = randi(1, 5);
  }
  const mins = Math.floor(clamp(G.t / MATCH_LEN, 0, 1) * 360); const hh = Math.floor(mins / 60), mm = mins % 60;
  G.clockStr = `${hh === 0 ? 12 : hh}:${String(mm).padStart(2, '0')} AM`;
  if (mins !== lastMin) { lastMin = mins; drawClock(clockC, hh, mm); }
  if (acc5 > 0.2) { acc5 = 0; drawWalkie(); }
  if (acc10 > 0.1) { acc10 = 0; if (G.hasCam) drawOsd(); }
  if (sub.visible && G.t > subUntil) sub.visible = false;

  // ---- stage 3: the feeds show you, from behind
  if (G.stage >= 3) {
    const f = camera.getWorldDirection(_v1); f.y = 0; f.normalize();
    secCam.position.set(G.playerPos.x - f.x * 2.2, 2.5, G.playerPos.z - f.z * 2.2); secCam.lookAt(G.playerPos.x, 1.3, G.playerPos.z);
  }

  // ---- the take
  if (G.phase === 'taking') {
    G.takeT += dt;
    const flash = !G.lowIntensity && G.takeT > 0.3 && G.takeT < 0.42;
    if (flash) { camera.layers.enable(4); camera.layers.disable(3); } else { camera.layers.disable(4); camera.layers.enable(3); }
    if (G.takeT > 0.6 && G.takeT < 1.9) { staticSphere.visible = true; staticMat.uniforms.op.value = Math.min(0.92, (G.takeT - 0.6) / 0.9); }
    if (G.takeT > 1.9) endMatch('taken');
  }
  if (G.phase === 'end') G.endT += dt;
  if (G.phase === 'play' && G.onAir && G.playerPos.x > 4.6 && G.playerPos.z > 1.5 && G.playerPos.z < 4.7) endMatch('van');
  if (G.phase === 'play' && G.t >= MATCH_LEN) endMatch('dawn');
}

function renderOffscreen() {
  const xr = renderer.xr.enabled; renderer.xr.enabled = false;
  if (G.hasCam && (!G.vr || frameN % 2 === 0)) { ccScreen.visible = false; renderer.setRenderTarget(ccRT); renderer.render(scene, ccCam); ccScreen.visible = true; }
  if (frameN % 3 === 0) { renderer.setRenderTarget(secRT); renderer.render(scene, secCam); }
  renderer.setRenderTarget(null); renderer.xr.enabled = xr;
}

renderer.setAnimationLoop(() => {
  const dt = Math.min(clk.getDelta(), 0.05);
  if (renderer.xr.isPresenting) { renderer.xr.updateCamera(camera); readVRInput(); }
  frame(dt);
  renderOffscreen();
  renderer.render(scene, camera);
  frameN++;
});

// ================================================================ MENU
const $ = (id) => document.getElementById(id);
renderer.xr.addEventListener('sessionstart', () => { G.vr = true; camera.position.set(0, 0, 0); camera.rotation.set(0, 0, 0); rig.rotation.y = yaw; placeItems(); });
renderer.xr.addEventListener('sessionend', () => {
  G.vr = false; camera.position.set(0, 1.6, 0); camera.rotation.set(0, 0, 0); yaw = rig.rotation.y; placeItems();
  $('menu').style.display = 'flex'; $('desk').textContent = 'KEEP PLAYING ON DESKTOP';
});
async function enterVR() {
  try {
    const s = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor'] });
    await renderer.xr.setSession(s);
  } catch (e) { $('note').textContent = 'Could not start VR here: ' + e.message + '. Open this page directly in the Quest browser.'; $('menu').style.display = 'flex'; }
}
function start(vr) {
  initAudio();
  G.lowIntensity = $('low').checked;
  if (G.phase === 'menu' || G.phase === 'end') newMatch();
  $('menu').style.display = 'none';
  if (vr) enterVR();
}
$('desk').onclick = () => start(false);
$('vr').onclick = () => start(true);
if (navigator.xr && navigator.xr.isSessionSupported) {
  navigator.xr.isSessionSupported('immersive-vr').then((ok) => { if (ok) { $('vr').disabled = false; $('vr').textContent = 'ENTER VR'; } }).catch(() => {});
}
newMatch(); G.phase = 'menu';
window.__deadair = { G, bots, host, newMatch, endMatch, completeTask, rig, camera, look: (y, p) => { yaw = y; pitch = p || 0; }, L, hemi, sim: (n) => { for (let i = 0; i < n; i++) frame(0.05); }, input, keys };
