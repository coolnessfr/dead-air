# DEAD AIR audio and voice

## Player voice: live only, never saved

- Proximity voice and walkie voice stream live through the voice service (Photon Voice or Vivox). **Nothing is written to disk or a server, ever.** Clips and the end-of-match replay have no player voice.
- All processing runs on the device in real time:
  - **Radio filter** on every walkie transmission: band-pass about 300 Hz to 3 kHz, light distortion, compression, crackle bed, and a squelch click at the start and end.
  - **Host voice changer** while it wears a stolen skin: pitch and formant shift toward a neutral voice, plus a faint tape warble. It should never be perfect, because the slight wrongness is a tell players can learn.
  - **Static whisper:** heavy noise gate that drops about 2 of every 3 words.
- Under-13 accounts get friends-only voice by default.

## Pre-made voice lines (made once, shipped as files)

| Set | Count | Notes |
|---|---|---|
| Lure lines | 12 (MVP), then 6 more for the Mimic | "Over here." "It's me, open up." "I found something." Several neutral voices, all played through the radio filter. |
| Safety Broadcast presenter | about 20 lines | Public-access host who is too calm and slightly off-sync. Reads the rules, including one false rule. |
| Orientation Tape narrator | about 30 lines | Friendly training-video voice for the tutorial. |
| Station announcer and jingles | about 10 | Sign-on and sign-off, the WKRT-9 station ID. |

**How to make them:** either hire voice actors (about $150 to $400 on freelance sites, per the design doc) or use an AI voice service (ElevenLabs or a local open-source TTS) with **stock or designed voices only, never cloned from a real person.** Claude writes the script to `audio/scripts/`, generates or collects takes, and builds a simple **listening page** (`audio/audition.html`) that groups every line, sound and music cue so Brandon can audition and pick. Approved files go to `unity/DeadAir/Assets/Audio/`.

## Sound design rules

- **No music during play.** Only diegetic sound: the boiler, a radio playing an old jingle, a TV left on.
- **The station hum is constant,** so when it cuts out, players freeze. Silence is a weapon.
- **Spatial audio everywhere** (Meta XR Audio SDK): breathing just behind your ear, footsteps in the room above.
- **Walkie signal tone** wavers more as the Host gets near.
- **Sting budget:** at most one loud sting per match (the take). Loud noises get boring and quiet ones don't.
- **Lower Intensity** mode: no sting, shorter silences.
- All sound effects and music must be original, licensed or generated. Write each source in `audio/LICENSES.md`.
