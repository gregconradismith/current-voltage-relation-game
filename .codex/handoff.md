# The Current-Voltage Relation Game Codex Handoff

Date: 2026-06-22

## Repository

Local folder:

```text
/Users/gregconradismith/Git/current-voltage-relation-game
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

## Migration Readiness Snapshot

- Checked on 2026-06-21 before moving computers.
- Non-interactive `git fetch --all --prune` completed successfully.
- Root `README.md` points to `.codex/handoff.md` when a root README exists.

Pre-edit Git state after fetch:

```bash
## main...origin/main
```


## 2026-09-22: Expanded practice questions

Current checkout: `/Users/greg/Git/current-voltage-relation-game`.
Added mixed practice and a selector for reversal potential, activation versus
deactivation, half-maximal voltage, maximum conductance, and maximum positive
slope conductance over the plotted voltage interval. Reveals show conductance,
driving force, current, and topic-specific feedback. Conductance questions show
g(V) before answering; slope questions reveal a tangent. Units are mV, pA, nS.

Half-max means half of the voltage-dependent conductance change above baseline.
Slope conductance uses the analytic dI/dV, sampled at 0.05 mV spacing. The model
retains its tanh gate and basal conductance with randomized conductance scale.

Verification: `node --check app.js`, `node tests/model.cjs` (600 cases), and
`git diff --check` passed. Browser checks covered all five topics, scoring,
next/reset, desktop and narrow-screen plots. Local preview uses port 8766.

Publication: user authorized commit and push to origin/main. Initial push found
an upstream coordination-guidance commit; rebased onto it without conflicts.
Final push and remote-equality verification follow this handoff update.
No known implementation blockers; GitHub Pages deployment has not been verified.
