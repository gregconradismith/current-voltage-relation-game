'use strict';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const els = {
  roundLabel: document.getElementById('roundLabel'),
  scoreLabel: document.getElementById('scoreLabel'),
  streakLabel: document.getElementById('streakLabel'),
  scorePercent: document.getElementById('scorePercent'),
  correctCount: document.getElementById('correctCount'),
  attemptCount: document.getElementById('attemptCount'),
  currentStreak: document.getElementById('currentStreak'),
  bestStreak: document.getElementById('bestStreak'),
  promptText: document.getElementById('promptText'),
  answerGrid: document.getElementById('answerGrid'),
  nextButton: document.getElementById('nextButton'),
  newRoundButton: document.getElementById('newRoundButton'),
  resetButton: document.getElementById('resetButton'),
  revealPanel: document.getElementById('revealPanel'),
  verdictBurst: document.getElementById('verdictBurst'),
  resultLabel: document.getElementById('resultLabel'),
  resultText: document.getElementById('resultText'),
  resultDetail: document.getElementById('resultDetail'),
  showAxesCheckbox: document.getElementById('showAxesCheckbox'),
  showTicksCheckbox: document.getElementById('showTicksCheckbox'),
  noiseSlider: document.getElementById('noiseSlider'),
  answerKey: document.getElementById('answerKey'),
  erevText: document.getElementById('erevText'),
  gateText: document.getElementById('gateText'),
  topicSelect: document.getElementById('topicSelect'),
  slopeText: document.getElementById('slopeText'),
  historyList: document.getElementById('historyList'),
};

const colors = {
  blue: '#2557c7',
  green: '#23834f',
  red: '#d33838',
  ink: '#20242a',
  muted: '#6a6f78',
  axis: '#a99f91',
  grid: '#ebe3d7',
  paper: '#fffdf8',
  amber: '#94651d',
};

const voltage = makeRange(-150, 150, 1);
const erevList = [-100, -80, 0, 60, 120];
const v0List = [-80, -60, -40, -20];
const v1List = [10, 20, 30];

const topics = ['reversal', 'direction', 'midpoint', 'maximum', 'slope'];

const state = {
  round: 0,
  attempts: 0,
  correct: 0,
  streak: 0,
  bestStreak: 0,
  revealed: false,
  history: [],
  roundData: null,
};

function makeRange(start, stop, step) {
  const values = [];
  for (let value = start; value <= stop + step / 2; value += step) {
    values.push(Number(value.toFixed(8)));
  }
  return values;
}

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function gate(v, v0, v1, reverse) {
  const value = 0.5 * (1 + Math.tanh((v - v0) / v1));
  return reverse ? 1 - value : value;
}

function generateRound() {
  return buildRound({
    erev: randomChoice(erevList), v0: randomChoice(v0List),
    v1: randomChoice(v1List), reverse: Math.random() < 0.5,
    scale: randomChoice([0.5, 1, 1.5, 2]),
    topic: els.topicSelect.value === 'mixed' ? randomChoice(topics) : els.topicSelect.value,
  });
}

function conductanceAt(v, r) {
  return r.floor + r.gain * gate(v, r.v0, r.v1, r.reverse);
}

function slopeAt(v, r) {
  const t = Math.tanh((v - r.v0) / r.v1);
  const derivative = r.gain * (r.reverse ? -1 : 1) * (1 - t * t) / (2 * r.v1);
  return conductanceAt(v, r) + (v - r.erev) * derivative;
}

function buildRound({ erev, v0, v1, reverse, scale = 1, topic = 'reversal' }) {
  const subtlety = Number(els.noiseSlider.value) / 100;
  const r = { erev, v0, v1, reverse, scale, topic,
    floor: scale * (0.04 + subtlety * 0.08), gain: scale * (1 - subtlety * 0.25) };
  r.g = voltage.map(v => conductanceAt(v, r));
  r.driving = voltage.map(v => v - erev);
  r.current = r.g.map((g, i) => g * r.driving[i]);
  // Dense sampling of the analytic derivative over the displayed voltage interval.
  r.peakV = -150;
  r.peakSlope = slopeAt(-150, r);
  for (let i = 1; i <= 6000; i += 1) {
    const v = -150 + i * 0.05;
    const slope = slopeAt(v, r);
    if (slope > r.peakSlope) { r.peakSlope = slope; r.peakV = v; }
  }
  r.question = makeQuestion(r);
  r.choices = shuffle(r.question.options);
  return r;
}

function shuffle(values) {
  const choices = values.slice();
  for (let i = choices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}

function makeQuestion(r) {
  const direction = r.reverse ? 'Deactivating' : 'Activating';
  const mv = v => `${v} mV`;
  const numeric = (value, label, prompt, detail) => {
    const rounded = Math.round(value * 10) / 10;
    const options = [0.4, 0.7, 1, 1.4, 1.8].map(f => (Math.max(0.1, Math.round(rounded * f * 10) / 10)).toFixed(1) + ' nS');
    return { label, prompt, detail, answer: rounded.toFixed(1) + ' nS', options: [...new Set(options)] };
  };
  if (r.topic === 'direction') return {
    label: 'Gating', answer: direction, options: ['Activating', 'Deactivating'],
    prompt: 'Does this conductance activate or deactivate with depolarization? Infer from the red I–V curve.',
    detail: `${direction}: g(V) ${r.reverse ? 'decreases' : 'increases'} as voltage rises. Activation describes conductance, not the sign or magnitude of current. This model describes steady-state voltage dependence, not kinetics.`,
  };
  if (r.topic === 'midpoint') return {
    label: 'Half-max', answer: mv(r.v0), options: v0List.map(mv),
    prompt: 'Estimate the half-maximal activation/deactivation voltage from the blue conductance curve.',
    detail: `V½ = ${r.v0} mV: g(V) is halfway between its low and high plateaus (${(r.floor + r.gain / 2).toFixed(2)} nS). With basal conductance, this is half of the voltage-dependent change, not half the total maximum or half the peak current.`,
  };
  if (r.topic === 'maximum') return numeric(r.floor + r.gain, 'Max g',
    'Estimate the maximum conductance g(V), in nS, from the blue curve. Choose the nearest value.',
    `The high-conductance plateau is ${(r.floor + r.gain).toFixed(2)} nS. This is gmax; the I–V slope also includes the effect of voltage-dependent gating.`);
  if (r.topic === 'slope') return numeric(r.peakSlope, 'Max slope',
    'Estimate the largest positive I–V slope over −150 to 150 mV. Choose the nearest value (pA/mV = nS).',
    `Maximum dI/dV ≈ ${r.peakSlope.toFixed(2)} nS at ${r.peakV.toFixed(1)} mV on this interval. dI/dV = g(V) + (V − Erev) dg/dV. The gold segment shows the tangent there; this is a signed maximum, not the largest absolute slope.`);
  return { label: 'Reversal', answer: mv(r.erev), options: erevList.map(mv),
    prompt: 'Estimate the reversal potential from the red I–V curve.',
    detail: `The red curve crosses I = 0 at Erev = ${r.erev} mV, where the driving force changes sign.` };
}

function startRound() {
  state.round += 1;
  state.revealed = false;
  state.roundData = generateRound();
  els.revealPanel.hidden = true;
  els.answerKey.hidden = true;
  els.revealPanel.className = 'reveal-panel';
  els.verdictBurst.className = 'verdict-burst';
  els.promptText.textContent = state.roundData.question.prompt;
  els.noiseSlider.disabled = false;
  els.showTicksCheckbox.disabled = state.roundData.topic !== 'direction';
  renderChoices();
  updateLabels();
  draw();
}

function resetGame() {
  state.round = 0;
  state.attempts = 0;
  state.correct = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.history = [];
  renderHistory();
  startRound();
}

function renderChoices() {
  els.answerGrid.innerHTML = '';
  state.roundData.choices.forEach(choice => {
    const button = document.createElement('button');
    button.className = 'answer-button';
    button.type = 'button';
    button.textContent = choice;
    button.addEventListener('click', () => answer(choice));
    els.answerGrid.appendChild(button);
  });
}

function answer(choice) {
  if (state.revealed) return;
  const gotIt = choice === state.roundData.question.answer;
  state.revealed = true;
  state.attempts += 1;
  if (gotIt) {
    state.correct += 1;
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
  } else {
    state.streak = 0;
  }

  state.history.unshift({
    round: state.round,
    gotIt,
    answer: `${state.roundData.question.label}: ${state.roundData.question.answer}`,
  });
  state.history = state.history.slice(0, 6);

  [...els.answerGrid.children].forEach(button => {
    const value = button.textContent;
    button.disabled = true;
    button.classList.toggle('correct', value === state.roundData.question.answer);
    button.classList.toggle('incorrect', value === choice && !gotIt);
  });

  els.resultLabel.textContent = gotIt ? 'Correct' : 'Not quite';
  els.resultText.textContent = gotIt ? 'Correct!' : 'Not quite';
  els.resultDetail.textContent = state.roundData.question.detail;
  els.promptText.textContent = state.roundData.question.prompt;
  els.noiseSlider.disabled = true;
  els.revealPanel.classList.toggle('is-correct', gotIt);
  els.revealPanel.classList.toggle('is-incorrect', !gotIt);
  els.verdictBurst.classList.toggle('is-correct', gotIt);
  els.verdictBurst.classList.toggle('is-incorrect', !gotIt);
  els.answerKey.hidden = false;
  els.revealPanel.hidden = false;
  renderAnswerKey();
  renderHistory();
  updateLabels();
  draw();
}

function updateLabels() {
  els.roundLabel.textContent = `Round ${state.round}`;
  els.scoreLabel.textContent = `${state.correct} / ${state.attempts}`;
  els.streakLabel.textContent = `Streak ${state.streak}`;
  els.correctCount.textContent = state.correct;
  els.attemptCount.textContent = state.attempts;
  els.currentStreak.textContent = state.streak;
  els.bestStreak.textContent = state.bestStreak;
  els.scorePercent.textContent = state.attempts === 0
    ? '0%'
    : `${Math.round((state.correct / state.attempts) * 100)}%`;
}

function renderAnswerKey() {
  els.slopeText.textContent = `${state.roundData.peakSlope.toFixed(2)} nS; gmax ${(state.roundData.floor + state.roundData.gain).toFixed(2)} nS`;
  const direction = state.roundData.reverse ? 'decreases with voltage' : 'increases with voltage';
  els.erevText.textContent = `${state.roundData.erev} mV`;
  els.gateText.textContent = `${direction}; midpoint ${state.roundData.v0} mV, width parameter ${state.roundData.v1} mV`;
}

function renderHistory() {
  els.historyList.innerHTML = '';
  state.history.forEach(item => {
    const li = document.createElement('li');
    li.className = item.gotIt ? 'correct' : 'incorrect';
    li.textContent = `Round ${item.round}: ${item.answer}`;
    els.historyList.appendChild(li);
  });
}

function draw() {
  canvas.classList.toggle('revealed', state.revealed);
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const width = rect.width;
  const height = rect.height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = colors.paper;
  ctx.fillRect(0, 0, width, height);
  const r = state.roundData;
  const showG = state.revealed || ['midpoint', 'maximum'].includes(r.topic);
  const area = (y, h) => ({ x: 52, y, width: width - 72, height: h });
  const split = state.revealed ? 0.32 : 0.44;
  if (showG) {
    drawPlot({ x: voltage, series: [{ values: r.g, color: colors.blue, label: 'g(V)' }],
      rect: area(28, height * split - 48), title: 'Conductance (nS)',
      markerX: state.revealed && r.topic === 'midpoint' ? r.v0 : null, markerLabel: 'V½' });
  }
  if (state.revealed) {
    drawPlot({ x: voltage, series: [{ values: r.driving, color: colors.green, label: 'V − Erev' }],
      rect: area(height * split + 28, height * split - 60), title: 'Driving force (mV)' });
  }
  const currentStart = state.revealed ? 0.64 : 0.44;
  drawPlot({ x: voltage, series: [{ values: r.current, color: colors.red, label: 'I(V)' }],
    rect: showG ? area(height * currentStart + 28, height * (1 - currentStart) - 64) : area(32, height - 72),
    title: 'Current (pA)', markerX: state.revealed ? r.erev : null,
    tangent: state.revealed && r.topic === 'slope' ? r : null });
}

function drawPlot({ x, series, rect, title, markerX = null, markerLabel = 'Erev', tangent = null }) {
  const allValues = series.flatMap(item => item.values);
  let yMin = Math.min(...allValues, 0);
  let yMax = Math.max(...allValues, 0);
  const margin = Math.max(0.01, (yMax - yMin) * 0.12);
  yMin -= margin;
  yMax += margin;
  const xMin = x[0];
  const xMax = x[x.length - 1];

  ctx.save();
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = rect.y + (i / 4) * rect.height;
    ctx.beginPath();
    ctx.moveTo(rect.x, y);
    ctx.lineTo(rect.x + rect.width, y);
    ctx.stroke();
  }

  if (els.showTicksCheckbox.checked || state.roundData.topic !== 'direction') {
    for (let value = -100; value <= 100; value += (rect.width < 250 ? 100 : 50)) {
      const xPos = xToCanvas(value, rect, xMin, xMax);
      ctx.beginPath();
      ctx.moveTo(xPos, rect.y);
      ctx.lineTo(xPos, rect.y + rect.height);
      ctx.stroke();
      ctx.fillStyle = colors.muted;
      ctx.font = '12px ui-monospace, Menlo, monospace';
      ctx.fillText(String(value), xPos - 10, rect.y + rect.height + 17);
    }
  }

  ctx.strokeStyle = colors.axis;
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  if (els.showAxesCheckbox.checked) {
    drawAxisLine(rect, xMin, xMax, yMin, yMax, 0, 'x');
    drawAxisLine(rect, xMin, xMax, yMin, yMax, 0, 'y');
  }

  ctx.fillStyle = colors.muted;
  ctx.font = '11px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i += 1) {
    const value = yMin + (yMax - yMin) * i / 4;
    ctx.fillText(value.toFixed(yMax < 10 ? 1 : 0), rect.x - 6, yToCanvas(value, rect, yMin, yMax) + 4);
  }
  ctx.textAlign = 'right';
  ctx.fillText('V (mV)', rect.x + rect.width, rect.y + rect.height + 30);
  ctx.textAlign = 'left';
  series.forEach(item => drawSeries(x, item.values, rect, xMin, xMax, yMin, yMax, item.color));
  if (tangent) {
    const v = tangent.peakV;
    const center = conductanceAt(v, tangent) * (v - tangent.erev);
    const halfWidth = Math.min(18, (yMax - yMin) * 0.15 / tangent.peakSlope);
    const ends = [Math.max(-150, v - halfWidth), Math.min(150, v + halfWidth)];
    drawSeries(ends, ends.map(x => center + (x - v) * tangent.peakSlope), rect, xMin, xMax, yMin, yMax, colors.amber);
  }

  if (markerX !== null) {
    const xPos = xToCanvas(markerX, rect, xMin, xMax);
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xPos, rect.y);
    ctx.lineTo(xPos, rect.y + rect.height);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = colors.ink;
    ctx.font = '700 13px ui-sans-serif, system-ui';
    ctx.fillText(`${markerLabel} ${markerX} mV`, Math.min(xPos + 8, rect.x + rect.width - 86), rect.y + 36);
  }

  ctx.fillStyle = colors.ink;
  ctx.font = '800 16px ui-sans-serif, system-ui';
  ctx.fillText(title, rect.x, rect.y - 10);
  if (rect.width >= 250) drawLegend(series, rect);
  ctx.restore();
}

function drawAxisLine(rect, xMin, xMax, yMin, yMax, value, axis) {
  ctx.save();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  if (axis === 'x') {
    const y = yToCanvas(value, rect, yMin, yMax);
    ctx.moveTo(rect.x, y);
    ctx.lineTo(rect.x + rect.width, y);
  } else {
    const x = xToCanvas(value, rect, xMin, xMax);
    ctx.moveTo(x, rect.y);
    ctx.lineTo(x, rect.y + rect.height);
  }
  ctx.stroke();
  ctx.restore();
}

function drawSeries(x, values, rect, xMin, xMax, yMin, yMax, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  values.forEach((value, index) => {
    const xPos = xToCanvas(x[index], rect, xMin, xMax);
    const yPos = yToCanvas(value, rect, yMin, yMax);
    if (index === 0) ctx.moveTo(xPos, yPos);
    else ctx.lineTo(xPos, yPos);
  });
  ctx.stroke();
  ctx.restore();
}

function drawLegend(series, rect) {
  let x = rect.x + rect.width - 110;
  const y = rect.y + 18;
  ctx.font = '700 12px ui-sans-serif, system-ui';
  series.forEach(item => {
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 18, y);
    ctx.stroke();
    ctx.fillStyle = colors.muted;
    ctx.fillText(item.label, x + 24, y + 4);
    x -= 130;
  });
}

function xToCanvas(value, rect, xMin, xMax) {
  return rect.x + ((value - xMin) / (xMax - xMin)) * rect.width;
}

function yToCanvas(value, rect, yMin, yMax) {
  return rect.y + (1 - (value - yMin) / (yMax - yMin)) * rect.height;
}

function maxAbs(values) {
  return Math.max(...values.map(value => Math.abs(value)), 1);
}

els.topicSelect.addEventListener('change', startRound);
els.nextButton.addEventListener('click', startRound);
els.newRoundButton.addEventListener('click', startRound);
els.resetButton.addEventListener('click', resetGame);
els.showAxesCheckbox.addEventListener('change', draw);
els.showTicksCheckbox.addEventListener('change', draw);
els.noiseSlider.addEventListener('input', () => {
  if (state.revealed) return;
  state.roundData = buildRound(state.roundData);
  renderChoices();
  draw();
});
window.addEventListener('resize', draw);

resetGame();
