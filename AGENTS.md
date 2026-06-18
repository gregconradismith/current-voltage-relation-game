# Agent Instructions

This repository is a static browser game published with GitHub Pages:

https://gregconradismith.github.io/current-voltage-relation-game/

It is a MATLAB-free version of `currentvoltagegame.m`. Preserve the model
relationship and teaching goal:

```text
g(V) = 0.5 * (1 + tanh((V - V0) / V1))
I_mem(V) = g(V) * (V - Erev)
```

Rounds randomize `Erev`, `V0`, `V1`, and whether conductance is reversed. The
player estimates `Erev` from the red I-V curve, then the app reveals the
conductance curve, driving force, and zero-current crossing.

Important files:

- `index.html` is the static app shell.
- `styles.css` contains responsive styling.
- `app.js` contains round generation, scoring, plotting, and reveal logic.
- `currentvoltagegame.m` is the original MATLAB reference.
- `.github/workflows/pages.yml` deploys the repository root to GitHub Pages on
  pushes to `main`.

Keep the app dependency-free unless Greg explicitly asks otherwise. Use relative
paths so the app works from the project Pages URL.

For JavaScript changes, run:

```bash
node --check app.js
git diff --check
```

For UI, layout, plotting, or interaction changes, preview locally:

```bash
python3 -m http.server 8765
```

Then open `http://127.0.0.1:8765/` and verify the canvas is nonblank, answer
buttons work, reveal state is clear, and the layout behaves at desktop and
mobile widths.

Do not commit local noise such as `.DS_Store`, editor files, or generated
temporary artifacts.
