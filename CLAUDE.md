# DEAD AIR: rules for Claude

DEAD AIR is a 4 to 8 player VR social-deduction horror game for Meta Quest. It's set in WKRT Channel 9, a 1994 TV station. One player is secretly the Host, which can wear a friend's face. The camcorder always shows the truth. Pitch: *easy to play, hard to trust.*

- Design doc (source of truth for rules and numbers): https://claude.ai/artifact/SPgEKf1ftrqq5Ha9bnjhek
- How we build: `docs/WORKFLOW.md`. Read it before starting any milestone.
- What we're building next: `docs/MILESTONES.md`. Work on the first milestone that isn't done.
- How it looks: `docs/STYLE.md`. How it sounds: `docs/AUDIO.md`.

## Where things live

| Path | What |
|---|---|
| `unity/DeadAir/` | The real game. Unity 6 LTS, Meta XR All-in-One SDK, URP, Android/Quest. |
| `art/blender/` | Blender source files (`.blend`). Exports go to `unity/DeadAir/Assets/Art/`. |
| `src/`, `index.html`, `build.sh` | WebXR prototype (three.js). Use it only to try an idea quickly. Don't port its code; port the *idea*. |
| `docs/` | Workflow, milestones, style, audio, playtest notes. |
| `.claude/agents/` | Critic reviewers: `tough-critic`, `scare-director`, `kid-check`. |

## Hard rules (never break these)

1. **No real voices are ever recorded, stored or replayed.** Kids play this. Voice is live-only. Mimicry uses the radio filter, a live voice changer and pre-made lure lines. Replays and clips carry no player voice.
2. **Original designs only.** Don't copy faces, characters, names, silhouettes, maps or music from existing games or analog horror series.
3. **Quest performance budget:** 72 fps on Quest 2 and 90 on Quest 3. Use baked lighting and low-poly rooms. VHS effects go on screens and the camcorder only, never full-view (it causes motion sickness).
4. **Use the Meta XR SDK's building blocks** (camera rig, hands, grab, locomotion) through the Meta MCP tools. Don't hand-write VR rigs or grab scripts.
5. **Kid-readable.** A new 10-year-old should understand any feature within one match, without reading text.
6. **No pay-to-win and no loot boxes.** Only cosmetics are for sale. Roles and Host types are earned.

## How to work

- **Plan first.** Before building a milestone, write or update its spec in `docs/MILESTONES.md`. Ask Brandon questions (with the ask-user-question tool) only for real choices, and make small decisions yourself.
- **Every milestone ends playable** in the headset. Don't stack two unfinished milestones.
- **Build your own debug tools first** (see the Debug panel in `docs/MILESTONES.md` M1). You can't play at 72 fps, so add ways to jump straight to any moment instead of playing up to it.
- **Check your own scenes.** After placing props, check from at least two camera angles that nothing floats, clips or sits at the wrong scale (1 Unity unit = 1 m; doors are 2.35 m on purpose).
- **Run the critics before calling a milestone done:** `tough-critic`, `scare-director` and `kid-check`. Fix what they flag or write down why not.
- **Explain bugs after fixing them,** in one or two lines in the commit message, so Brandon learns why it happened.
- **Keep the docs current.** If a decision changes, update the doc in the same commit.

## Commands

- Unity: drive the Editor through the Unity MCP tools (`Unity_ManageScene`, `Unity_ManageGameObject`, `Unity_ReadConsole` and others) and the Meta MCP extension tools.
- Blender: drive Blender through the Blender MCP tools. Save the `.blend` file before running code in Blender.
- WebXR prototype: `npm install && ./build.sh`, then open `index.html`.
