# The Current-Voltage Relation Game

A MATLAB-free browser version of `currentvoltagegame.m`. The game shows an
`I_mem(V)` curve and asks for the reversal potential. After each answer it
reveals the conductance curve, the driving force, and the relation
`I_mem = g(V)(V - Erev)`.

## GitHub Pages

Live app: [The Current-Voltage Relation Game](https://gregconradismith.github.io/current-voltage-relation-game/)

Publish this folder as the root of a GitHub Pages repository. The app uses
relative paths, so it can also run from a project Pages URL.

## Local Preview

From this directory:

```sh
python3 -m http.server 8765
```

Then open:

```text
http://127.0.0.1:8765/
```

## Codex Coordination

Codex session state is tracked in `.codex/handoff.md`; durable decisions and task history may also appear in `.codex/` when useful.
