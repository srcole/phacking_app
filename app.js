const STARTING_VALUES = [0, 2, 4, 5, 6, 8, 10];
const LABELS = ["A", "B", "C", "D", "E", "F", "G"];
const CONTEXTS = [
  "Coffee flavor of Starbucks vs. Luckin",
  "Cancer incidence in coffee drinkers vs. tea drinkers",
  "Handsomeness of men in San Francisco vs. New York",
];
const CARD_COUNTS = {
  rounding: 30, contaminated: 10, outlier: 10, swap: 10,
  audit: 10, copy: 5, challenge: 5, decrease: 2,
};
const CARD_NAMES = {
  rounding: "Rounding error", contaminated: "Contaminated sample",
  outlier: "Outlier removal; Collect new data", swap: "Swap labels",
  audit: "Audit", copy: "Copy", challenge: "Challenge",
  decrease: "Decrease significance threshold",
};
const COPY_BLOCKED = new Set(["challenge", "decrease"]);

let state = null;
const app = document.querySelector("#app");

function randomDie() { return Math.floor(Math.random() * 11); }
function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}
function buildDeck() {
  return shuffle(Object.entries(CARD_COUNTS).flatMap(([type, count]) => Array(count).fill(type)));
}
function cloneBoard() { return { samples: structuredClone(state.samples), threshold: state.threshold }; }
function draw(player) { if (state.deck.length) state.hands[player].push(state.deck.pop()); }
function makeGame(players) {
  let firstRoll = randomDie();
  let secondRoll = randomDie();
  while (firstRoll === secondRoll) { firstRoll = randomDie(); secondRoll = randomDie(); }
  const redPlayer = firstRoll > secondRoll ? 0 : 1;
  const deck = buildDeck();
  state = {
    players, redPlayer, rolls: [firstRoll, secondRoll], current: redPlayer,
    context: CONTEXTS[Math.floor(Math.random() * CONTEXTS.length)],
    samples: { red: [...STARTING_VALUES], blue: [...STARTING_VALUES] },
    threshold: 4, deck, hands: [[], []], history: [], log: [], pending: null,
    result: null,
  };
  draw(0); draw(0); draw(0); draw(0); draw(0);
  draw(1); draw(1); draw(1); draw(1); draw(1);
  log(`${players[redPlayer]} rolled ${state.rolls[redPlayer]} and starts as the red-theory researcher.`);
}
function log(message) { state.log.unshift(message); }
function colorForPlayer(player) { return state.redPlayer === player ? "red" : "blue"; }
function currentPlayer() { return state.players[state.current]; }
function evaluateResult(cardType = null) {
  const rankedHigh = flatten().sort((a, b) => b.value - a.value);
  const rankedLow = [...rankedHigh].reverse();
  const winners = new Set();
  for (const color of ["red", "blue"]) {
    if (qualifies(rankedHigh, color)) winners.add(color);
    if (qualifies(rankedLow, color === "red" ? "blue" : "red")) winners.add(color);
  }
  if (winners.size === 1) {
    const color = [...winners][0];
    state.result = { type: "win", player: state.players[state.redPlayer === 0 ? (color === "red" ? 0 : 1) : (color === "red" ? 1 : 0)] };
  } else if (winners.size > 1) {
    if (cardType === "decrease") state.result = { type: "win", player: currentPlayer() };
    else state.result = { type: "null" };
  } else if (!state.deck.length && !state.hands[0].length && !state.hands[1].length) state.result = { type: "null" };
}
function flatten() { return ["red", "blue"].flatMap((color) => state.samples[color].map((value, index) => ({ color, value, index }))); }
function qualifies(sorted, requiredColor) {
  const n = state.threshold;
  const chosen = sorted.slice(0, n);
  if (chosen.length < n || !chosen.every((sample) => sample.color === requiredColor)) return false;
  // A tie across the significance boundary has no unambiguous Nth observation.
  return n === sorted.length || chosen[n - 1].value !== sorted[n].value;
}
function startTurn() {
  state.current = state.current === 0 ? 1 : 0;
  draw(state.current);
  log(`${currentPlayer()}'s turn${state.deck.length ? ". A card was drawn." : ". The draw pile is empty."}`);
}
function lastOpponentAction() {
  return [...state.history].reverse().find((action) => action.player !== state.current);
}
function selectCard(type) {
  if (state.result || state.current === null) return;
  if (type === "copy") {
    const target = lastOpponentAction();
    if (!target || COPY_BLOCKED.has(target.effect)) return alert("Copy needs a previous opponent action that is not Challenge or Decrease significance threshold.");
    state.pending = { type, effect: target.effect };
  } else if (type === "challenge") {
    const target = lastOpponentAction();
    if (!target || target.effect === "decrease") return alert("Challenge needs a previous opponent action that is not Decrease significance threshold.");
    commit(type, "challenge", null, target);
  } else if (type === "decrease") {
    if (state.threshold <= 2) return alert("The significance threshold cannot go below 2.");
    commit(type, "decrease");
  } else state.pending = { type, effect: type };
  render();
}
function chooseSample(color, index) {
  if (!state.pending) return;
  const { type, effect } = state.pending;
  if (effect === "rounding") {
    state.pending.target = { color, index };
    render();
  } else commit(type, effect, { color, index });
}
function chooseDirection(delta) {
  const { type, effect, target } = state.pending;
  const next = state.samples[target.color][target.index] + delta;
  if (next < 0 || next > 10) return alert("That sample must remain between 0 and 10.");
  commit(type, effect, { ...target, delta });
}
function chooseLabel(index) { const { type, effect } = state.pending; commit(type, effect, { index }); }
function commit(type, effect, target = null, challengeTarget = null) {
  const handIndex = state.hands[state.current].indexOf(type);
  if (handIndex < 0) return;
  const before = cloneBoard();
  const actor = currentPlayer();
  if (effect === "rounding") state.samples[target.color][target.index] += target.delta;
  if (effect === "contaminated") state.samples[target.color][target.index] = 5;
  if (effect === "outlier") state.samples[target.color][target.index] = randomDie();
  if (effect === "swap") {
    const index = target.index;
    [state.samples.red[index], state.samples.blue[index]] = [state.samples.blue[index], state.samples.red[index]];
  }
  if (effect === "audit") state.samples[target.color][target.index] = STARTING_VALUES[target.index];
  if (effect === "decrease") state.threshold -= 1;
  if (effect === "challenge") {
    state.samples = structuredClone(challengeTarget.before.samples);
    state.threshold = challengeTarget.before.threshold;
  }
  state.hands[state.current].splice(handIndex, 1);
  state.history.push({ player: state.current, type, effect, before });
  const detail = effect === "outlier" ? `; new value: ${state.samples[target.color][target.index]}` : "";
  log(`${actor} played ${CARD_NAMES[type]}${type === "copy" ? ` (copying ${CARD_NAMES[effect]})` : ""}${detail}.`);
  state.pending = null;
  evaluateResult(effect);
  if (!state.result) startTurn();
  render();
}
function setupScreen() {
  app.innerHTML = `<section class="setup">
    <h1>P-Hacking: The Game</h1>
    <p>Manipulate the data, defend your theory, and reach significance before your rival does.</p>
    <p class="muted">This is a local pass-and-play game. The high die roll researches the <strong>red</strong> population and takes the first turn.</p>
    <form id="setup-form"><div class="setup-grid">
      <label>Researcher one <input name="one" maxlength="30" value="Researcher One" required /></label>
      <label>Researcher two <input name="two" maxlength="30" value="Researcher Two" required /></label>
    </div><button type="submit">Begin study</button></form>
    <details class="reference"><summary>View the supplied game-board reference</summary><img src="game_board.png" alt="Original game board reference" /></details>
  </section>`;
  document.querySelector("#setup-form").addEventListener("submit", (event) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    makeGame([form.get("one").trim(), form.get("two").trim()]); render();
  });
}
function boardPopulation(color) {
  const title = color === "red" ? "Red population" : "Blue population";
  const cells = [];
  for (let value = 10; value >= 0; value -= 1) {
    cells.push(`<span class="axis-value">${value}</span>`);
    for (let index = 0; index < 7; index += 1) {
      const hasToken = state.samples[color][index] === value;
      const selectable = state.pending && hasToken && (["rounding", "contaminated", "outlier", "audit"].includes(state.pending.effect));
      cells.push(`<button class="cell ${hasToken ? `token-${color}` : ""} ${selectable ? "selectable" : ""}" data-sample="${color}:${index}" aria-label="${color} sample ${LABELS[index]}, value ${value}" ${selectable ? "" : "disabled"}></button>`);
    }
  }
  cells.push("<span></span>", ...LABELS.map((label) => `<span class="sample-label">${label}</span>`));
  return `<section class="population ${color}"><h2>${title}</h2><div class="grid">${cells.join("")}</div></section>`;
}
function hand() {
  const grouped = Object.keys(CARD_NAMES).filter((type) => state.hands[state.current].includes(type)).map((type) => ({ type, count: state.hands[state.current].filter((card) => card === type).length }));
  return `<section class="hand"><h2>${currentPlayer()}'s hand</h2><p class="muted">Choose a card, then follow the highlighted choices.</p><div class="cards">${grouped.map(({ type, count }) => `<button class="card ${state.pending?.type === type ? "selected" : ""}" data-card="${type}"><span>${CARD_NAMES[type]}</span><span class="count">${count} card${count === 1 ? "" : "s"}</span></button>`).join("") || "<p>No cards remain.</p>"}</div>${controls()}</section>`;
}
function controls() {
  if (!state.pending) return "";
  const { effect, target } = state.pending;
  if (effect === "rounding" && target) return `<div class="action-controls"><p>Move ${target.color} ${LABELS[target.index]} one point:</p><button class="choice" data-direction="1">Up</button><button class="choice" data-direction="-1">Down</button></div>`;
  if (effect === "swap") return `<div class="action-controls"><p>Choose a column to swap:</p>${LABELS.map((label, index) => `<button class="choice" data-label="${index}">${label}</button>`).join("")}</div>`;
  const prompt = effect === "rounding" ? "Choose any sample, then choose a direction." : `Choose any sample for ${CARD_NAMES[effect]}.`;
  return `<div class="action-controls"><p>${prompt}</p><button class="ghost" data-cancel>Cancel</button></div>`;
}
function render() {
  if (!state) return setupScreen();
  const result = state.result ? `<div class="notice ${state.result.type}">${state.result.type === "win" ? `<strong>${state.result.player} wins the publication.</strong> Their theory reached significance.` : "<strong>Null result.</strong> No researcher achieved a significant result."}</div>` : "";
  app.innerHTML = `<div class="shell"><header class="masthead"><div><h1>P-Hacking: The Game</h1><p class="subtitle">A two-researcher race to statistical significance.</p></div><button class="ghost" data-new>New game</button></header>
    <section class="status"><div class="status-card"><strong>${state.result ? "Study concluded" : `${currentPlayer()}'s turn`}</strong><span>${state.result ? "" : `${colorForPlayer(state.current) === "red" ? "Red" : "Blue"}-theory researcher`}</span></div><div class="status-card"><strong>${state.deck.length}</strong><span>cards in draw pile</span></div><div class="status-card"><strong>${state.hands[0].length} / ${state.hands[1].length}</strong><span>cards in hand</span></div><div class="status-card"><strong>${state.rolls[0]} / ${state.rolls[1]}</strong><span>opening rolls</span></div></section>${result}
    <section class="game-layout"><div class="board-wrap"><div class="board">${boardPopulation("red")}${boardPopulation("blue")}</div></div><aside class="sidebar"><section class="panel"><h2>Significance level</h2><div class="threshold">${[4,3,2].map((level) => `<span class="level ${state.threshold === level ? "active" : ""}">${level}</span>`).join("")}</div></section><section class="panel context"><h2>Research context</h2>${state.context}</section><section class="panel"><h2>Study log</h2><ol class="log">${state.log.slice(0, 6).map((entry) => `<li>${entry}</li>`).join("")}</ol></section></aside></section>
    ${state.result ? "" : hand()}<details class="reference"><summary>Rules reference artwork</summary><img src="cards.png" alt="Reference illustrations for the action cards" /></details></div>`;
  app.querySelector("[data-new]")?.addEventListener("click", () => { state = null; render(); });
  app.querySelectorAll("[data-card]").forEach((button) => button.addEventListener("click", () => selectCard(button.dataset.card)));
  app.querySelectorAll("[data-sample]").forEach((button) => button.addEventListener("click", () => { const [color, index] = button.dataset.sample.split(":"); chooseSample(color, Number(index)); }));
  app.querySelectorAll("[data-direction]").forEach((button) => button.addEventListener("click", () => chooseDirection(Number(button.dataset.direction))));
  app.querySelectorAll("[data-label]").forEach((button) => button.addEventListener("click", () => chooseLabel(Number(button.dataset.label))));
  app.querySelector("[data-cancel]")?.addEventListener("click", () => { state.pending = null; render(); });
}
render();
