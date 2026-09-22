// Exercise the math and scoring without requiring browser dependencies.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const elements = new Map();
function element(id) {
  if (!elements.has(id)) elements.set(id, { value: id === 'topicSelect' ? 'mixed' : '35', children: [],
    classList: { toggle() {} }, addEventListener() {}, appendChild(e) { this.children.push(e); },
    set innerHTML(v) { this.children = []; }, get innerHTML() { return ''; } });
  return elements.get(id);
}
const ctx = vm.createContext({ document: { getElementById: element, createElement: () => ({classList: {toggle() {}}, addEventListener() {}}) }, window: {addEventListener() {}}, Math });
element('gameCanvas').getContext = () => ({});
let source = fs.readFileSync('app.js', 'utf8').replace(/resetGame\(\);\s*$/, '');
vm.runInContext(source + '\ndraw = () => {};', ctx);
vm.runInContext(`
  for (const reverse of [false, true]) for (const erev of erevList)
  for (const v0 of v0List) for (const v1 of v1List) for (const topic of topics) {
    const r = buildRound({erev, v0, v1, reverse, topic});
    if (!r.choices.includes(r.question.answer)) throw Error('Missing correct answer');
    if (new Set(r.choices).size !== r.choices.length) throw Error('Duplicate choices');
    if (Math.abs(conductanceAt(v0, r) - (r.floor + r.gain / 2)) > 1e-12) throw Error('Midpoint');
    for (const v of [-100, v0, 0, 100]) {
      const h = 0.0001;
      const current = x => conductanceAt(x, r) * (x - erev);
      const fd = (current(v + h) - current(v - h)) / (2 * h);
      if (Math.abs(fd - slopeAt(v, r)) > 1e-7) throw Error('Derivative');
    }
    state.roundData = r; state.revealed = false;
    renderChoices(); const before = state.attempts;
    answer(r.question.answer); answer(r.question.answer);
    if (state.attempts !== before + 1) throw Error('Double scoring');
    if (state.correct !== state.attempts) throw Error('Correct scoring');
  }
  const before = state.correct;
  state.revealed = false; answer('wrong');
  if (state.correct !== before || state.streak !== 0) throw Error('Incorrect scoring');
  resetGame();
  if (state.attempts !== 0 || state.history.length !== 0 || state.round !== 1) throw Error('Reset');
`, ctx);
assert.ok(true);
console.log('600 model/question cases passed; finite-difference derivative, scoring, repeat-answer guard, and reset verified.');
