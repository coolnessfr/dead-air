# DEAD AIR milestones (Unity build)

Every milestone ends with something you can **play in the headset**. Follow the loop in `docs/WORKFLOW.md` (spec, grey-box, debug hooks, self-check, critics, playtest, lock). Work top to bottom. The order follows the design doc's "order of work". The **Gates** are real playtests: if a gate fails, fix it before moving on.

Status key: `[ ]` not started, `[~]` in progress, `[x]` done.

---

## Phase 1: Prove the fear (grey boxes only)

### [ ] M0. Project setup
Do Part A of `docs/WORKFLOW.md`: a Unity 6 URP project at `unity/DeadAir`, Meta XR SDK, OpenXR + Quest, Unity MCP + Meta MCP extension, Blender MCP, Git LFS.
**Done when:** Claude can list the Unity and Meta MCP tools, an empty scene runs in the Quest over Link, and `.gitattributes` tracks `*.fbx *.blend *.png *.wav *.ogg *.psd` with LFS.

### [ ] M1. One player in a grey-box station + debug panel
- Meta camera rig, hands and controllers, smooth and snap turning, a comfort vignette option (all from the Meta building blocks).
- Grey-box WKRT layout: lobby, hallway, studio, control room, basement (cubes only, doors 2.35 m).
- Grabbable flashlight, walkie-talkie on the chest, camcorder.
- **Debug panel** (wrist menu in VR, plus F-keys in the Editor). Every later milestone adds buttons here:
  - Teleport to room (lobby, studio, control room, basement, tower)
  - Become Host / become Crew / become Static
  - Set Signal Decay (0, 30, 50, 70, 90)
  - Force power stage 1, 2 or 3, and skip the clock to 5:58 AM
  - Trigger any hallucination, any Broadcast Rule, or the take on the nearest bot
  - Show FPS and frame time
**Done when:** you can walk the station in the headset, grab all three devices, and every debug button you can already use works.

### [ ] M2. Two players, synced (networking choice locked)
- Pick **Photon Fusion + Photon Voice** (the design doc's pick) or Unity Netcode + Vivox, and record the choice here.
- Two headsets in one room: heads, hands and held devices synced. Live proximity voice. Nothing recorded.
- Lobby join by room code.
**Done when:** two friends can join with a code, see each other's hands, pass the camcorder back and forth, and talk.

### [ ] M3. The take + Static
- The Host can take a crew member only when nobody else has line of sight. Both-hands grab, hold 1.5 s.
- The victim sees the true face for one frame, then their view tunes to static. No body is left behind.
- The victim becomes **Static**: floats, sees the Host, picks Haunt or Hollow, and can whisper (heavy filter that drops 2 of every 3 words) and flicker lights.
**Done when:** in a 3-player test, a take happens out of sight and the other player doesn't know until they look for their friend.

### [ ] M4. Skin swap + camcorder truth
- The Host wears the victim's avatar, cosmetics and name tag, and swaps by touching its face out of sight (3 s).
- The camcorder renders through a second camera on its own layer: the true Host face, no hallucinations, Static trails visible.
- Recording burns tape (90 s), and 3 s of true face makes an **Evidence Tape**.
**Done when:** a player raises the camcorder at their "friend" and sees what's really there. This is the signature clip, so it should get a real reaction.

### [ ] M5. Radio + safe voice tricks
- Walkie: squeeze to talk, callsign on the LCD, 90s radio filter (band-pass, crackle, squelch clicks) on every transmission.
- The Host talks on a stolen callsign, with a live pitch and formant shift plus tape warble on proximity voice while skinned.
- Lure line radial menu (placeholder text-to-speech for now, real lines in M10).
- **Check:** nothing writes voice audio to disk or to a server. Add a code comment and a test that proves it.
**Done when:** on the radio, testers can't tell voices apart, and the Host can fool someone with "It's me, open up."

### [ ] M6. Three tasks + progress + win/lose
- Rewire the breaker, read the code (radio the code to the keypad), find the tape (tape shelf to deck). Ideas are proven in the WebXR prototype. Rebuild them in Unity.
- Shared progress bar on the walkie screen, updating every 20 s.
- Fake tasks for the Host. Lockout vote (3 players point and hold 3 s). Furnace burn win. Dawn at 6:00 AM.
- End-of-match replay built from movement data only (no voice).

> **GATE 1: First friends match.** 4+ players, grey boxes, 3 matches in a row. Pass if people argue about who the Host is and want to play again. Fail if it feels like tag. Write notes with `docs/PLAYTEST.md`.

---

## Phase 2: Make it look and sound like DEAD AIR

### [ ] M7. Style lock
- Claude builds **3 or 4 style mock-up rooms** in Unity (same break room each time) with a turntable of one crew avatar and the Host's resting, borrowed and true faces.
  - Suggested looks: *PS1 Jitter* (vertex wobble, affine textures), *VHS Workplace* (flat, low-res, sodium and fluorescent light), *Grounded 94* (realistic proportions, baked light), plus one wild card.
- Brandon picks one. Claude fills in `docs/STYLE.md` and marks it **LOCKED**.
**Done when:** `docs/STYLE.md` is locked and the break room is rebuilt in the chosen style at 72 fps on Quest 2.

### [ ] M8. Art pass (Blender via MCP)
- Rooms and props for all 12 rooms. Crew avatar (chunky, realistic proportions, WKRT windbreaker and lanyard). Host head with blank, printed-face and true-face states.
- Baked lighting, occlusion culling, and texture atlases.
**Done when:** every room in the map has final art, and the game holds its frame budget on Quest 2 in the busiest room with 8 players.

### [ ] M9. Signal Decay + Broadcast Rules
- Hidden per-player Decay meter (rates from the design doc), capped at 30 in stage 1.
- The six hallucinations: the stare, long hallway, your own callsign, the figure, silence, false ending. Max one every 45 s, and all of them vanish through the camcorder.
- Lobby Safety Broadcast CRT with 4 to 5 rules, one of them false, plus the six MVP Broadcast Rules.
- Scare ideas to try: the station clock stuck on one minute in one room, a studio phone ringing on a dead line, frost near the Host, and control-room monitors that show you a beat late.

### [ ] M10. Audio + pre-made voices
Follow `docs/AUDIO.md`: station hum, spatial footsteps above, breathing behind the ear, the one sting (the take), 12 lure lines, and the Safety Broadcast presenter.

> **GATE 2: Scare test.** Play with people who haven't seen it. Pass if they jump at least once, go quiet in the silence, and the camcorder reveal gets a reaction. Run `scare-director` on the playtest notes.

---

## Phase 3: Make it safe, full and shippable

### [ ] M11. Full map + 3 power stages
Basement (4 tasks), Studios (5 tasks), Tower (3 two-person tasks). Monitors show players from behind in stage 3.

### [ ] M12. Safety and moderation
Mute, block and report within 2 clicks from the wrist. Personal space bubble (30 cm). Auto-mute after 3 reports. Name filter. Under-13 accounts get friends-only voice by default (Meta age signals). Lower Intensity toggle.

### [ ] M13. Tutorial: Orientation Tape
A 5-minute friendly training video with bots that teaches tasks, radio and camcorder. Then one bot turns out to be the Host.

### [ ] M14. Accounts, cosmetics, store
Meta Platform SDK (login, friends, in-app purchases), a PlayFab-style backend, Reels and Tapes, 10 to 15 starter cosmetics. Real-money prices are shown and there are no loot boxes.

> **GATE 3: Closed beta.** 20+ outside players on a private Horizon Store channel for a week. Track matches, session length, win rates and where people quit. Fix the top 3 problems.

### [ ] M15. Launch prep
Store page, trailer from the clip moments, creator keys for 10 to 20 VR YouTubers and TikTokers, and a privacy policy review.

---

## Decisions log
Write small decisions Claude made on its own here, with the date, so Brandon can review them.

- 2026-11-20: Real game moves to Unity 6 + Meta XR SDK, with art in Blender. The WebXR build stays as a quick idea sandbox.
