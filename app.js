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
  const erev = randomChoice(erevList);
  const v0 = randomChoice(v0List);
  const v1 = randomChoice(v1List);
  const reverse = Math.random() < 0.3;
  const subtlety = Number(els.noiseSlider.value) / 100;
  const conductanceFloor = 0.04 + subtlety * 0.08;
  const gain = 1 - subtlety * 0.25;
  const g = voltage.map(v => conductanceFloor + gain * gate(v, v0, v1, reverse));
  const driving = voltage.map(v => v - erev);
  const current = g.map((value, index) => value * driving[index]);
  const choices = shuffledChoices(erev);

  return { erev, v0, v1, reverse, g, driving, current, choices };
}

function shuffledChoices(answer) {
  const nearby = erevList.filter(value => value !== answer);
  const choices = [answer, ...nearby].sort(() => Math.random() - 0.5);
  return choices;
}

function startRound() {
  state.round += 1;
  state.revealed = false;
  state.roundData = generateRound();
  els.revealPanel.hidden = true;
  els.answerKey.hidden = true;
  els.revealPanel.className = 'reveal-panel';
  els.verdictBurst.className = 'verdict-burst';
  els.promptText.textContent = 'Estimate the reversal potential from the red I-V curve.';
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
    button.textContent = `${choice} mV`;
    button.addEventListener('click', () => answer(choice));
    els.answerGrid.appendChild(button);
  });
}

function answer(choice) {
  if (state.revealed) return;
  const gotIt = choice === state.roundData.erev;
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
    answer: `${state.roundData.erev} mV`,
  });
  state.history = state.history.slice(0, 6);

  [...els.answerGrid.children].forEach(button => {
    const value = Number(button.textContent.replace(' mV', ''));
    button.disabled = true;
    button.classList.toggle('correct', value === state.roundData.erev);
    button.classList.toggle('incorrect', value === choice && !gotIt);
  });

  els.resultLabel.textContent = gotIt ? 'Correct' : 'Not quite';
  els.resultText.textContent = gotIt ? 'Correct!' : 'Not quite';
  els.resultDetail.textContent = `The red curve crosses I = 0 at ${state.roundData.erev} mV.`;
  els.promptText.textContent = gotIt
    ? 'Right: reversal is where the driving force changes sign.'
    : 'Look for the zero-current crossing of the red curve.';
  els.revealPanel.classList.toggle('is-correct', gotIt);
  els.revealPanel.classList.toggle('is-incorrect', !gotIt);
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
  const direction = state.roundData.reverse ? 'decreases with voltage' : 'increases with voltage';
  els.erevText.textContent = `${state.roundData.erev} mV`;
  els.gateText.textContent = `${direction}; midpoint ${state.roundData.v0} mV, slope ${state.roundData.v1} mV`;
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
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(640, Math.floor(rect.width * ratio));
  canvas.height = Math.max(400, Math.floor(rect.height * ratio));
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const width = canvas.width / ratio;
  const height = canvas.height / ratio;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = colors.paper;
  ctx.fillRect(0, 0, width, height);

  if (state.revealed) {
    const topHeight = height * 0.48;
    drawPlot({
      x: voltage,
      series: [
        { values: state.roundData.g.map(value => value * maxAbs(state.roundData.current)), color: colors.blue, label: 'g(V) scaled' },
        { values: state.roundData.driving, color: colors.green, label: 'V - Erev' },
      ],
      rect: { x: 46, y: 28, width: width - 72, height: topHeight - 48 },
      title: 'g(V) and driving force',
    });
    drawPlot({
      x: voltage,
      series: [{ values: state.roundData.current, color: colors.red, label: 'Imem(V)' }],
      rect: { x: 46, y: topHeight + 24, width: width - 72, height: height - topHeight - 66 },
      title: 'Imem(V)',
      markerX: state.roundData.erev,
    });
  } else {
    drawPlot({
      x: voltage,
      series: [{ values: state.roundData.current, color: colors.red, label: 'Imem(V)' }],
      rect: { x: 46, y: 32, width: width - 76, height: height - 76 },
      title: 'Imem(V)',
    });
  }
}

function drawPlot({ x, series, rect, title, markerX = null }) {
  const allValues = series.flatMap(item => item.values);
  let yMin = Math.min(...allValues, 0);
  let yMax = Math.max(...allValues, 0);
  const margin = Math.max(1, (yMax - yMin) * 0.12);
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

  if (els.showTicksCheckbox.checked) {
    for (let value = -100; value <= 100; value += 50) {
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

  series.forEach(item => drawSeries(x, item.values, rect, xMin, xMax, yMin, yMax, item.color));

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
    ctx.fillText(`Erev ${markerX} mV`, Math.min(xPos + 8, rect.x + rect.width - 86), rect.y + 18);
  }

  ctx.fillStyle = colors.ink;
  ctx.font = '800 16px ui-sans-serif, system-ui';
  ctx.fillText(title, rect.x, rect.y - 10);
  drawLegend(series, rect);
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

els.nextButton.addEventListener('click', startRound);
els.newRoundButton.addEventListener('click', startRound);
els.resetButton.addEventListener('click', resetGame);
els.showAxesCheckbox.addEventListener('change', draw);
els.showTicksCheckbox.addEventListener('change', draw);
els.noiseSlider.addEventListener('input', () => {
  if (!state.revealed) {
    state.roundData = generateRound();
    renderChoices();
  }
  draw();
});
window.addEventListener('resize', draw);

resetGame();
