
// ================================================================ AUDIO (all synthesized; no voices are ever recorded or played)
let listener = null, AC = null, noiseBuf = null, radioOut = null, sigGain = null, sigLfoGain = null;
const emitters = {};
function initAudio() {
  if (AC) { AC.resume(); return; }
  listener = new THREE.AudioListener(); camera.add(listener); AC = listener.context; AC.resume();
  noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
  const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const out = listener.getInput();
  // radio chain: band-pass + crunch, like a cheap 90s walkie
  const hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 450;
  const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2800;
  const shaper = AC.createWaveShaper(); const curve = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * 3); } shaper.curve = curve;
  radioOut = AC.createGain(); radioOut.gain.value = 0.9; radioOut.connect(hp).connect(lp).connect(shaper).connect(out);
  // constant station hum. When it cuts out, you notice.
  const hum = AC.createOscillator(); hum.type = 'sawtooth'; hum.frequency.value = 60;
  const humF = AC.createBiquadFilter(); humF.type = 'lowpass'; humF.frequency.value = 160;
  const humG = AC.createGain(); humG.gain.value = 0.05; hum.connect(humF).connect(humG).connect(out); hum.start();
  // fluorescent buzz (break room)
  emitters.buzz = makeEmitter(new THREE.Vector3(0, 2.9, 3), 1.5);
  const bz = AC.createOscillator(); bz.type = 'square'; bz.frequency.value = 120;
  const bzF = AC.createBiquadFilter(); bzF.type = 'bandpass'; bzF.frequency.value = 2400; bzF.Q.value = 6;
  const bzG = AC.createGain(); bzG.gain.value = 0.05; bz.connect(bzF).connect(bzG).connect(emitters.buzz); bz.start();
  // boiler rumble
  emitters.boiler = makeEmitter(new THREE.Vector3(-2.5, 1.2, -17.5), 2.5);
  loopNoise(emitters.boiler, 'lowpass', 110, 0.9);
  emitters.furnace = makeEmitter(new THREE.Vector3(3, 0.8, -20.8), 1.5);
  loopNoise(emitters.furnace, 'bandpass', 500, 0.12);
  emitters.radio = makeEmitter(new THREE.Vector3(3.4, 1.9, 5.35), 1.2);
  emitters.tv = makeEmitter(new THREE.Vector3(-3.4, 1.1, 3), 1.2);
  loopNoise(emitters.tv, 'bandpass', 3500, 0.025);
  // walkie signal tone: wavers harder as the Host gets close
  const so = AC.createOscillator(); so.frequency.value = 1350;
  const lfo = AC.createOscillator(); lfo.frequency.value = 5; sigLfoGain = AC.createGain(); sigLfoGain.gain.value = 0;
  lfo.connect(sigLfoGain).connect(so.frequency); lfo.start();
  sigGain = AC.createGain(); sigGain.gain.value = 0; so.connect(sigGain).connect(radioOut); so.start();
  for (const b of bots) {
    b.emit = makeEmitter(null, 1.0, b.av.headPivot);
    b.breath = AC.createGain(); b.breath.gain.value = 0;
    const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 650; f.Q.value = 0.8;
    const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.connect(f).connect(b.breath).connect(b.emit); s.start();
  }
}
function makeEmitter(pos, ref = 1, parent = scene) {
  const pa = new THREE.PositionalAudio(listener);
  pa.hasPlaybackControl = false; pa.panner.panningModel = 'HRTF';
  pa.setRefDistance(ref); pa.setRolloffFactor(1.4); pa.setMaxDistance(40);
  if (pos) pa.position.copy(pos);
  parent.add(pa); return pa.panner;
}
function loopNoise(dest, type, freq, gain) {
  const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const f = AC.createBiquadFilter(); f.type = type; f.frequency.value = freq; const g = AC.createGain(); g.gain.value = gain;
  s.connect(f).connect(g).connect(dest); s.start(); return g;
}
function burst(dest, { dur = 0.1, f = 800, q = 1, type = 'bandpass', g = 0.3, rate = 1, attack = 0.004, at = 0 } = {}) {
  if (!AC) return;
  const t = AC.currentTime + at;
  const s = AC.createBufferSource(); s.buffer = noiseBuf; s.playbackRate.value = rate;
  const fl = AC.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  const ga = AC.createGain(); ga.gain.setValueAtTime(0.0001, t); ga.gain.linearRampToValueAtTime(g, t + attack); ga.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl).connect(ga).connect(dest); s.start(t, Math.random()); s.stop(t + dur + 0.05);
}
function tone(dest, { f = 440, f2 = null, dur = 0.2, type = 'sine', g = 0.2, at = 0 } = {}) {
  if (!AC) return;
  const t = AC.currentTime + at;
  const o = AC.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  const ga = AC.createGain(); ga.gain.setValueAtTime(0.0001, t); ga.gain.linearRampToValueAtTime(g, t + 0.01); ga.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(ga).connect(dest); o.start(t); o.stop(t + dur + 0.05);
}
const ui = () => (AC ? listener.getInput() : null);
const sfx = {
  click() { if (AC) burst(ui(), { dur: 0.04, f: 3000, g: 0.15 }); },
  clunk() { if (AC) { tone(ui(), { f: 120, f2: 60, dur: 0.25, type: 'square', g: 0.15 }); burst(ui(), { dur: 0.12, f: 400, g: 0.3 }); } },
  spark() { if (AC) for (let i = 0; i < 4; i++) burst(ui(), { dur: 0.05, f: 5000, type: 'highpass', g: 0.3, at: i * 0.06 }); },
  beep(f) { if (AC) tone(ui(), { f, dur: 0.09, type: 'square', g: 0.07 }); },
  buzz() { if (AC) tone(ui(), { f: 110, dur: 0.45, type: 'sawtooth', g: 0.12 }); },
  chime() { if (AC) [523, 659, 784].forEach((f, i) => tone(radioOut, { f, dur: 0.35, type: 'square', g: 0.12, at: i * 0.14 })); },
  whoosh() { if (AC) burst(emitters.furnace, { dur: 1.4, f: 300, q: 0.5, g: 1.2, attack: 0.3 }); },
  step(bot) { if (AC && bot.emit) burst(bot.emit, { dur: 0.08, f: bot.isHost && bot.creep ? 180 : 260, q: 0.9, g: bot.isHost && bot.creep ? 0.35 : 0.7, rate: rand(0.8, 1.2) }); },
  thud(pos) { if (!AC) return; const e = makeEmitter(pos, 1.5); burst(e, { dur: 0.35, f: 90, g: 1.2 }); burst(e, { dur: 0.2, f: 700, g: 0.3, at: 0.05 }); },
  stinger() {
    if (!AC) return;
    const g = G.lowIntensity ? 0.08 : 0.32; const out = listener.getInput();
    [233, 247, 349, 370, 554].forEach((f) => tone(out, { f, f2: f * 0.5, dur: 1.6, type: 'sawtooth', g: g * 0.5 }));
    burst(out, { dur: 1.4, f: 1800, q: 0.4, g: g * 2.2, attack: 0.01 });
  },
  jingle() { if (!AC) return; [392, 523, 659, 587, 523, 784].forEach((f, i) => tone(emitters.radio, { f, dur: 0.3, type: 'square', g: 0.08, at: i * 0.28 })); },
};
// Radio "voice": garbled syllables made from oscillators. Text appears on the walkie screen.
function radioBabble(len) {
  if (!AC) return;
  const t = AC.currentTime;
  burst(radioOut, { dur: 0.07, f: 3200, type: 'highpass', g: 0.4 });
  const o = AC.createOscillator(); o.type = 'sawtooth';
  const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4;
  const env = AC.createGain(); env.gain.value = 0;
  let tt = t + 0.09; const end = t + 0.09 + len;
  while (tt < end) {
    const syl = rand(0.07, 0.17);
    o.frequency.setValueAtTime(rand(110, 230), tt); bp.frequency.setValueAtTime(rand(600, 2000), tt);
    env.gain.setTargetAtTime(0.35, tt, 0.012); env.gain.setTargetAtTime(0, tt + syl * 0.7, 0.02); tt += syl + rand(0, 0.06);
  }
  o.connect(bp).connect(env).connect(radioOut); o.start(t); o.stop(tt + 0.1);
  burst(radioOut, { dur: len + 0.25, f: 2600, q: 0.5, g: 0.06, attack: 0.05 });
  burst(radioOut, { dur: 0.12, f: 3200, type: 'highpass', g: 0.35, at: tt - t + 0.02 });
}
function setSilence(on) { if (listener) listener.gain.gain.setTargetAtTime(on ? 0 : 1, AC.currentTime, on ? 0.05 : 0.4); }

// ================================================================ PLAYER ITEMS
// Flashlight
const flashlight = new THREE.Group();
const flBody = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.026, 0.2, 10), M.darkMetal); flBody.rotation.x = Math.PI / 2; flashlight.add(flBody);
const flLens = new THREE.Mesh(new THREE.CircleGeometry(0.024, 10), new THREE.MeshBasicMaterial({ color: 0xfff4d0 })); flLens.position.z = -0.101; flLens.rotation.y = Math.PI; flashlight.add(flLens);
const spot = new THREE.SpotLight(0xfff0d0, 0, 16, 0.42, 0.5, 1.6); spot.position.set(0, 0, -0.1); flashlight.add(spot);
spot.target.position.set(0, 0, -2); flashlight.add(spot.target);
// Interaction ray (VR)
const rayLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]), new THREE.LineBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.35 }));
rayLine.visible = false;

// Camcorder: the one thing that never lies.
const camcorder = new THREE.Group();
const ccBody = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.09, 0.17), lam(0x2b2b2e)); ccBody.position.set(0, 0.0, -0.03); camcorder.add(ccBody);
const ccLens = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.032, 0.05, 12), M.black); ccLens.rotation.x = Math.PI / 2; ccLens.position.set(0, 0.005, -0.135); camcorder.add(ccLens);
const ccStrap = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.12), lam(0x55331e)); ccStrap.position.set(-0.045, -0.01, -0.03); camcorder.add(ccStrap);
const ccRT = new THREE.WebGLRenderTarget(256, 192);
const ccCam = new THREE.PerspectiveCamera(52, 4 / 3, 0.05, 30);
ccCam.layers.set(0); ccCam.layers.enable(4); // sees the truth, and nothing that isn't there
ccCam.position.set(0, 0.005, -0.16); camcorder.add(ccCam);
const ccScreenMat = vhsMat(ccRT.texture, { amount: 0.55, gain: 2.0, lift: 0.02, tint: 0xe6ffe6 }); // low-light boost = night vision
const ccScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.09), ccScreenMat);
ccScreen.position.set(0, 0.085, 0.045); ccScreen.rotation.x = -0.35; camcorder.add(ccScreen);
const ccOsdC = canvasTex(256, 192);
const ccOsd = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.09), new THREE.MeshBasicMaterial({ map: ccOsdC.tex, transparent: true, depthWrite: false }));
ccOsd.position.set(0, 0, 0.001); ccScreen.add(ccOsd);
const ccHome = { pos: new THREE.Vector3(3.6, 0.95, -11.55), rot: new THREE.Euler(0, 0.4, 0) };
function drawOsd() {
  const { ctx } = ccOsdC; ctx.clearRect(0, 0, 256, 192);
  ctx.font = `bold 16px ${FONT}`; ctx.fillStyle = '#fff'; ctx.shadowColor = '#000'; ctx.shadowBlur = 3;
  if (G.recording && Math.floor(G.t * 2) % 2 === 0) { ctx.fillStyle = '#f22'; ctx.beginPath(); ctx.arc(16, 18, 7, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#fff'; ctx.fillText(G.recording ? 'REC' : 'VIEW', 28, 24);
  const tl = Math.max(0, G.tape); ctx.fillText(`TAPE ${Math.floor(tl / 60)}:${String(Math.floor(tl % 60)).padStart(2, '0')}`, 150, 24);
  ctx.font = `bold 13px ${FONT}`; ctx.fillText(G.clockStr || '', 10, 182);
  if (G.evidence) { ctx.fillStyle = '#ff4'; ctx.font = `bold 15px ${FONT}`; ctx.fillText('EVIDENCE TAPE: BURN IT', 22, 160); }
  else if (G.evProg > 0) { ctx.fillStyle = '#f44'; ctx.fillText('ANOMALY ON TAPE', 10, 150); ctx.fillRect(10, 156, 236 * Math.min(1, G.evProg / 3), 8); ctx.strokeStyle = '#f44'; ctx.strokeRect(10, 156, 236, 8); }
  else if (!G.recording) { ctx.font = `12px ${FONT}`; ctx.fillText('HOLD TRIGGER TO RECORD', 46, 160); }
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ctx.strokeRect(100, 76, 56, 40);
  ccOsdC.tex.needsUpdate = true;
}

// Walkie-talkie screen (left wrist in VR, corner of view on desktop)
const wkC = canvasTex(320, 240);
const walkie = new THREE.Group();
const wkBody = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.095), lam(0x1b1d1f)); walkie.add(wkBody);
const wkScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.0825), new THREE.MeshBasicMaterial({ map: wkC.tex }));
wkScreen.rotation.x = -Math.PI / 2; wkScreen.position.y = 0.016; walkie.add(wkScreen);
function drawWalkie() {
  const { ctx } = wkC;
  ctx.fillStyle = '#9aae86'; ctx.fillRect(0, 0, 320, 240);
  ctx.fillStyle = '#14200e'; ctx.font = `bold 20px ${FONT}`;
  if (G.phase === 'reveal') {
    ctx.font = `bold 26px ${FONT}`; ctx.fillText('YOUR ROLE:', 70, 80); ctx.font = `bold 64px ${FONT}`; ctx.fillText('CREW', 82, 150);
    ctx.font = `bold 16px ${FONT}`; ctx.fillText('ONE OF THEM IS NOT.', 66, 196); wkC.tex.needsUpdate = true; return;
  }
  ctx.fillText(`CH9  ${G.clockStr || ''}`, 10, 26);
  for (let i = 0; i < 5; i++) { const on = i < G.bars; ctx.fillStyle = on ? '#14200e' : 'rgba(20,32,14,0.2)'; ctx.fillRect(238 + i * 15, 26 - (i + 1) * 4, 11, (i + 1) * 4); }
  ctx.fillStyle = '#14200e'; ctx.fillRect(10, 36, 300, 2);
  ctx.font = `bold 17px ${FONT}`;
  const tasks = [
    ['breaker', 'REWIRE BREAKER', 'BOILER'],
    ['code', 'ENTER CODE', 'CONTROL'],
    ['tape', `LOAD "${G.tapeLabel || ''}"`, 'CONTROL'],
  ];
  tasks.forEach(([k, l, r], i) => { const done = G.tasks[k]; ctx.fillText(`${done ? '[X]' : '[ ]'} ${l}`, 10, 62 + i * 22); });
  const n = Object.values(G.tasks).filter(Boolean).length;
  ctx.strokeStyle = '#14200e'; ctx.lineWidth = 2; ctx.strokeRect(10, 128, 300, 12); ctx.fillRect(10, 128, 300 * n / 3, 12);
  ctx.font = `bold 15px ${FONT}`;
  let status = n === 3 ? 'ON AIR! GET TO THE VAN' : G.evidence ? 'EVIDENCE! BURN IT: BOILER RM' : !G.hasCam ? 'GET CAMCORDER: CONTROL ROOM' : `TAPE ${Math.floor(G.tape)}s   X/Q: CALL CREW`;
  ctx.fillText(status, 10, 160);
  ctx.fillRect(10, 168, 300, 2);
  const msg = G.radioMsg;
  if (msg && G.t - msg.t < 9) {
    ctx.font = `bold 17px ${FONT}`; ctx.fillText(`> ${msg.from}:`, 10, 192);
    ctx.font = `bold 15px ${FONT}`; wrapText(ctx, msg.text, 10, 212, 300, 18);
  } else { ctx.font = `15px ${FONT}`; ctx.fillText('...static...', 10, 196); }
  wkC.tex.needsUpdate = true;
}

// Held-item helpers
const handR = new THREE.Group(), handL = new THREE.Group(); // logical hands; parented to VR controllers or the camera
function holdInHand(obj) { handR.add(obj); obj.position.set(0.0, -0.06, -0.1); obj.rotation.set(0, Math.PI / 2, 0); }

// Subtitle line for important moments (brief, then fades)
const subC = canvasTex(512, 64);
const sub = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.1), new THREE.MeshBasicMaterial({ map: subC.tex, transparent: true, depthTest: false }));
sub.renderOrder = 999; sub.position.set(0, -0.28, -1.2); camera.add(sub); sub.visible = false;
let subUntil = 0;
function say(text, secs = 3) {
  const { ctx } = subC; ctx.clearRect(0, 0, 512, 64);
  ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0, 6, 512, 52);
  ctx.fillStyle = '#fff3c8'; ctx.textAlign = 'center';
  let fs = 22; do { ctx.font = `bold ${fs}px ${FONT}`; fs--; } while (ctx.measureText(text).width > 500 && fs > 10);
  ctx.fillText(text, 256, 39); ctx.textAlign = 'left'; subC.tex.needsUpdate = true;
  sub.visible = true; subUntil = (G.t || 0) + secs;
}
function radio(from, text, { garble = false } = {}) {
  G.radioMsg = { from, text, t: G.t };
  radioBabble(garble ? 0.6 : Math.min(2.4, 0.25 + text.length * 0.045));
}

// Static overlay (only during a take) and end card
const staticMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0 }, op: { value: 0 } }, transparent: true, depthTest: false, depthWrite: false, side: THREE.BackSide,
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: 'uniform float time, op; varying vec2 vUv; float r(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);} void main(){ float n=r(floor(vUv*vec2(300.,150.))+fract(time*9.1)); gl_FragColor=vec4(vec3(n*0.8),op);}',
});
const staticSphere = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), staticMat);
staticSphere.renderOrder = 1000; staticSphere.visible = false; camera.add(staticSphere);
const endC = canvasTex(512, 320);
const endCard = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.625), vhsMat(endC.tex, { amount: 0.6 }));
endCard.material.depthTest = false; endCard.material.transparent = true; endCard.renderOrder = 1001; endCard.position.set(0, 0, -1.1); camera.add(endCard); endCard.visible = false;
