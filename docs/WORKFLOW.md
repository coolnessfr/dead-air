# How we build DEAD AIR

This workflow combines four Claude Code game-dev tutorials (Peter Yang's milestone and spec method, Leon van Zyl's ten-step "real game" pipeline with critic agents, Valem's Unity and Meta MCP setup for VR, and Mikey's "ship small, measure, listen" advice) and adapts them to a multiplayer Quest game built in Unity and Blender.

The one rule behind all of it: **get a scary match with friends working in grey boxes before making anything pretty.**

---

## Part A. One-time setup (on Brandon's PC)

Do this once. Claude Code runs on the PC, so it can drive Unity and Blender directly.

### A1. Tools to install

| Tool | Why | Notes |
|---|---|---|
| Unity Hub + **Unity 6 LTS** | Game engine | Add the **Android Build Support** module (with OpenJDK and SDK/NDK). |
| **Blender 4.x** | Props, rooms, avatars, the Host | You already have it for thumbnails. |
| Meta Quest Link (PC app) + Developer Mode on the headset | Play in the headset straight from the Editor | Turn on Developer Mode in the Meta Horizon phone app. |
| Git + **Git LFS** | Big binary files (models, textures, audio) | Run `git lfs install` once. |
| Claude Code (desktop app or CLI) | Builds the game | Open it in the repo folder. It reads `CLAUDE.md` automatically. |
| `uv` | Runs the Blender MCP server | Windows: `powershell -c "irm https://astral.sh/uv/install.ps1 \| iex"` |

### A2. Connect Claude to Unity (the Valem setup)

1. Create the project: Unity Hub, then **New project**, then the **Universal 3D (URP)** template, saved at `unity/DeadAir`.
2. Install **Meta XR All-in-One SDK** from the Asset Store (Window > Package Manager > My Assets).
3. Edit > Project Settings > **XR Plug-in Management**. Tick **OpenXR** on both the PC and Android tabs. Under OpenXR, add the interaction profiles *Oculus Touch*, *Meta Quest Touch Plus* and *Meta Quest Touch Pro*. On the Android tab, enable **Meta Quest Support**.
4. Meta XR > **Project Setup Tool** > **Apply All** on both PC and Android.
5. **Unity MCP** (Unity's official one, so Claude can control the Editor): install Unity's official Claude Code plugin from the Claude plugin directory (https://claude.com/plugins/unity, docs at https://docs.unity.com/en-us/ai/unity-plugin/claude-code). It brings Unity skills and the MCP server. Then in Unity go to Edit > Project Settings > AI > Unity MCP, check that **Unity Bridge = Running**, and click **Accept** when Claude connects the first time.
6. **Meta MCP extension** (this is the part that made Valem's VR rig work properly): Window > Package Manager > **+** > *Install package from git URL* > `https://github.com/meta-quest/Unity-Mcp-Extensions.git`.
7. **Restart Claude Code** so it loads the new tools. Ask it: *"Are you connected to the Unity MCP and the Meta XR MCP extension? List the Meta tools."*

> Why step 6 matters: without the Meta tools, Claude wrote its own grab and hand scripts and VR came out broken. With them, it used Meta's real camera rig, hands and grabbables, and everything worked the first time.

### A3. Connect Claude to Blender

1. `claude mcp add blender uvx mcp-for-blender`
2. `uvx mcp-for-blender install-addon`, then in Blender go to Edit > Preferences > Add-ons and enable **MCP for Blender**.
3. In the 3D viewport, press **N** > **MCP for Blender** tab > **Start MCP Server**.
4. Safety: the add-on runs Python inside Blender and has no password, so keep it on localhost only. **Save your `.blend` before asking Claude to run code.** Set `BLENDER_MCP_SAFE_MODE=1` for normal work and `DISABLE_TELEMETRY=true` to switch off usage reporting.

### A4. Choose multiplayer and voice once (and don't switch)

The design doc recommends **Photon Fusion** (networking) and **Photon Voice** (live voice with on-device radio filter and voice changer). Vivox is the Unity-native alternative, and the Unity plugin has a `/setup-vivox-voice-chat` skill. Decide at milestone M2 and write the choice in `docs/MILESTONES.md`.

---

## Part B. The loop for every milestone

Each milestone in `docs/MILESTONES.md` goes through these seven steps. Small milestones take an evening. Big ones take a week or more.

### 1. Spec it
Tell Claude: *"Spec milestone Mx. Ask me questions with the ask-user-question tool if you need to."* Claude writes the goal, what's in and out, and a **"done when"** test anyone can check in the headset. Cut anything that isn't needed to pass that test. (Claude tends to over-build specs, so trim them.)

### 2. Grey-box it
Build it with cubes, capsules and placeholder sounds. No final art. Claude uses the Unity MCP to make scenes and objects and the Meta MCP for anything VR.

### 3. Debug hooks
Every new feature gets a debug panel button (see M1) so it can be triggered instantly, for example "become Host", "spawn the take", "Signal Decay to 70" or "skip to Tower stage". This is the boss hotkey from the space-shooter video, made standard.

### 4. Self-check
Claude checks scenes from two or more angles for floating or clipping props, reads the Unity console for errors, and runs the Quest performance check (frame time in the Profiler, under 13.8 ms on Quest 2).

### 5. Critic pass
Run the three reviewers in `.claude/agents/`:
- `tough-critic`: bugs, gameplay feel, performance, comfort, code quality.
- `scare-director`: is it actually scary? Pacing, silence, the one loud sting, no cheap jump-scare loops.
- `kid-check`: would a 10-year-old get it in one match? Is it safe (no voice recording, moderation, no pressure to buy)?

Prompt: *"Run tough-critic, scare-director and kid-check on milestone Mx and fix everything they mark MUST."*

### 6. Headset playtest
Brandon plays it on Quest via Link (or a sideloaded APK). For multiplayer milestones, play with friends, ideally the real audience (kids 10 to 15). Write notes in `docs/playtests/YYYY-MM-DD.md` using `docs/PLAYTEST.md`. Vague feedback like "too boring, make it more frantic" is fine. Claude turns it into fixes. Paste screenshots or headset recordings when something looks wrong.

### 7. Lock it
When the "done when" test passes, tick the milestone, commit, push, and post a short dev clip (horror reveals do well as vertical videos).

**Letting Claude run long.** For big build steps, tell Claude: *"Don't wait for me on small decisions. Write them in the milestone notes."* That way it keeps going while you're at school or asleep, and you review the decisions after.

---

## Part C. Asset pipeline

### Art (Blender to Unity)
1. **Style first.** Before any final art (milestone M7), Claude builds **3 or 4 style mock-up rooms** in Unity (for example *PS1 Jitter*, *VHS Workplace* and *Grounded 94*) with a turntable of one crew avatar and the Host. Brandon picks one, and Claude writes it into `docs/STYLE.md` as the locked rulebook.
2. **Model in Blender via MCP.** Claude creates low-poly props, rooms and avatars to the rulebook's polygon and texture budgets. Source files go in `art/blender/<category>/<name>.blend`.
3. **Export.** FBX (or glTF) to `unity/DeadAir/Assets/Art/<category>/`, scale 1 unit = 1 m, +Y up, origin at the base of the object, applied transforms.
4. **Import check in Unity.** Right scale next to a 1.8 m capsule, colliders added, static flags set for baked lighting, and LODs only if needed.
5. Bought or free asset packs are fine for 90s office props. Write each one's license in `art/LICENSES.md`.

### Audio and voice
See `docs/AUDIO.md`. In short: the voice-actor or AI-voice **pre-made lines** (Safety Broadcast presenter, 12 lure lines, announcer) are made once, auditioned on one listening page, and saved as files. Player voice is live only and never saved.

---

## Part D. Shipping and growing

- **Test builds:** sideload APKs to friends with Meta Quest Developer Hub. Later, use a private release channel on the Meta Horizon Store (Alpha or Beta) so testers get updates automatically.
- **WebXR prototype** stays on GitHub Pages for quick "try this idea in your Quest browser" links. It is not the real game.
- **Measure:** add simple analytics from the first public build (matches played, how long people stay, how often crew vs Host wins, where people quit). Change the game based on data and players, not guesses.
- **Don't polish what isn't fun yet.** If a playtest gate fails, fix that milestone before moving on.
- **Retention ideas to schedule after MVP:** *Daily Broadcast* (the same Broadcast Rule for everyone each day), weekend *Cursed Broadcast* events, creator custom lobbies and tournaments, cosmetic packs.
