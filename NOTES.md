# Design notes
- Hero: "Wiggle", a round pink creature with one big ear. Ear wiggles faster and glows yellow the closer the nearest sound is (hearing radar, range 260px).
- 3 sounds on screen at once; each one collected spawns another away from the player. 10 = win, then Play again.
- Input priority: drag > keyboard/buttons. Web Audio beeps only after a user gesture.
- Test hook: `window.OEW` exposes state for Playwright.

# Next ideas
- Levels (forest, beach, city) with new sound types
- "Quiet" sounds only found when the ear is glowing (hide-and-seek)
- Sound collection book / sticker page
- Two-player mode on one screen
