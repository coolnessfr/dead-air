# DEAD AIR style rulebook

**Status: DRAFT. Not locked.** This page locks at milestone M7, after Brandon picks one of the style mock-ups. Until then, everything below "Locked look" is a placeholder. The **fixed rules** apply no matter which look wins.

## Fixed rules (from the design doc)

- **The idea:** a normal 1994 workplace, filmed badly, with one thing wrong. Fear comes from low detail, wrong details and silence.
- **Palette:** sodium orange `#ff9a3a`, fluorescent green-white `#e9f2dc`, CRT blue `#2b3a6b`. Darkness is a real black `#000000`.
- **Type:** Courier-style monospace for every slate, label, LCD and menu, like a 1994 typewriter or station slate.
- **Wrong details:** doors are 2.35 m (10% too tall). Some family photos have smudged faces. One hallway is a step too long. One clock reads 3:33. A break-room photo gains one more crew member after each take.
- **The Host is original.** Resting form: a smooth, pale, slightly glossy mannequin head with faint dents for eyes. Borrowed face: a low-res copy pressed on like a printed photo, slightly too wide, eyes a few pixels off, edges not meeting the hairline. True face (camcorder only): the print peels, and the blank head splits into a mouth that opens far too wide with too many small teeth. Eyes stay empty. It never blinks, holds smiles too long, and turns its head a beat after its body.
- **Avatars:** chunky and simple (a Gorilla Tag-era audience), but with realistic proportions so that stretching reads as wrong. Stolen skins are 3 to 5% too tall, with slightly long arms.
- **VHS layer:** grain, tracking lines, chroma bleed and the timestamp `NOV 19 1994 11:47 PM`, on screens and the camcorder only. Never on the player's full view.
- **Don't copy** any existing analog horror character, face, mascot or logo.

## Quest budgets

| Thing | Budget |
|---|---|
| Frame time | 13.8 ms (72 fps) on Quest 2, 11.1 ms (90 fps) on Quest 3 |
| Draw calls in view | under 150 |
| Triangles in view | under 300k |
| Crew avatar | about 5k triangles, one 512 px texture atlas |
| Host head | about 3k triangles, with separate materials for the borrowed and true face |
| Room prop | 50 to 1,500 triangles, sharing 1k atlases per room |
| Lighting | baked lightmaps, with at most 1 or 2 real-time lights (flashlight + one effect) |

## Mock-up candidates (for M7)

Claude builds the same break room in each style, plus a turntable of one crew avatar and the Host in its 3 states.

1. **PS1 Jitter:** vertex snapping, affine texture wobble, 256 px textures, no texture filtering. Instantly "found tape" and cheap to run.
2. **VHS Workplace:** flat-shaded low poly, soft baked light pools, harsh fluorescent tubes and sodium spill through windows. Clean but eerie.
3. **Grounded 94:** realistic proportions and materials, low texture resolution, heavy baked shadows. Scariest uncanny valley, and the hardest to hit on budget.
4. **Wild card:** Claude's pick, explained in one line.

## Locked look

*(Filled in at M7: chosen style, shader settings, material list, lighting recipe, prop modelling rules, menu and UI look, reference screenshots.)*
