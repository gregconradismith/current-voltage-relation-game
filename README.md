# The Current-Voltage Relation Game

A dependency-free browser version of `currentvoltagegame.m`, with mixed practice
or a selector for five topics:

- Reversal potential from the I–V zero crossing.
- Activation or deactivation with depolarization, inferred from the I–V curve.
- Half-maximal activation/deactivation voltage, read from the conductance curve.
- Maximum conductance (the high plateau of g(V)).
- Maximum positive slope conductance dI/dV over the displayed −150 to 150 mV interval.

Each answer reveals conductance, driving force, current, a topic-specific
explanation, and the reversal crossing. Half-max questions mark V½; slope
questions add a gold tangent at the maximum. Scores and recent history span topics.
Changing topics or pressing New skips a round without affecting accuracy.

## Model and units

The original gate `a(V) = 0.5 * (1 + tanh((V - V0) / V1))` is retained;
deactivating rounds use `1 - a(V)`. As in the earlier browser game, Curve
subtlety sets a small basal conductance and the gating amplitude. A randomized
conductance scale now gives `g(V) = floor + gain * a(V)` in nS, with voltage
in mV and `I = g(V) * (V - Erev)` in pA. Controls freeze subtlety after an answer.

V½ is V0: half of the voltage-dependent conductance change above baseline.
It is not half of peak current or, with nonzero baseline, half of total gmax.
V1 is a voltage width parameter, not a conductance. Activation/deactivation
here describes steady-state voltage dependence; the model has no time dynamics.

Slope conductance is `dI/dV = g + (V - Erev) * dg/dV`, distinct from chord
conductance g ([reference](https://pmc.ncbi.nlm.nih.gov/articles/PMC5662042/)).
The analytic derivative is sampled every 0.05 mV over the plotted interval;
answers are rounded to 0.1 nS. This is the largest signed slope, not the maximum
absolute slope. Numeric axes remain visible for estimation questions.

## Validation

Run `node --check app.js`, `node tests/model.cjs`, and `git diff --check`.
Preview desktop and mobile layouts and exercise all five topics.

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
