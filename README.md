# DEAD AIR

VR social-deduction horror for Meta Quest. The real game is built in **Unity 6 + Meta XR SDK** (`unity/DeadAir/`, set up at milestone M0) with art made in **Blender** (`art/blender/`). Start with `docs/WORKFLOW.md`, then `docs/MILESTONES.md`. Claude reads `CLAUDE.md` automatically.

## WebXR prototype (idea sandbox)

Single-player WebXR prototype of DEAD AIR, a VR social-deduction horror game set in WKRT Channel 9, a 1994 TV station. Three bot crew mates, one of them secretly the Host. Only the camcorder shows its real face.

**Play:** open the GitHub Pages link in the Meta Quest browser and press ENTER VR (or play on desktop with mouse and keyboard).

**Build:** `npm install`, then `./build.sh`. It concatenates `src/*.js`, bundles three.js with esbuild, and inlines everything into `index.html` (one self-contained file).

All art and audio are generated in code. No real voices are recorded or played.
