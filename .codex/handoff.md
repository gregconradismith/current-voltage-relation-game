# The Current-Voltage Relation Game Codex Handoff

Date: 2026-06-18

## Repository

Local folder:

```text
/Users/greg/Library/CloudStorage/Dropbox/Main/Git/current-voltage-relation-game
```

Expected GitHub Pages URL:

```text
https://gregconradismith.github.io/current-voltage-relation-game/
```

## What The App Is

This is a static HTML version of `currentvoltagegame.m`. It preserves the
original model:

```text
g(V) = 0.5 * (1 + tanh((V - V0) / V1))
I_mem(V) = g(V) * (V - Erev)
```

Rounds randomize `Erev`, `V0`, `V1`, and whether the conductance is reversed.
The player estimates `Erev` from the red I-V curve. After answering, the app
reveals `g(V)`, `V - Erev`, and the correct zero-current crossing.

## Important Files

- `index.html`: browser game shell.
- `styles.css`: responsive app styling.
- `app.js`: game generation, scoring, canvas plotting, and reveal logic.
- `currentvoltagegame.m`: original MATLAB reference.
- `README.md`: user-facing notes and the Pages URL.
- `.gitignore`: ignores `.DS_Store`.

## Validation

Useful checks after editing:

```sh
node --check app.js
git diff --check
python3 -m http.server 8765
```

Then open:

```text
http://127.0.0.1:8765/
```
