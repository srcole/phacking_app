const STARTING_VALUES = [0, 2, 4, 5, 6, 8, 10];
const LABELS = ["A", "B", "C", "D", "E", "F", "G"];
const CONTEXTS = [
  { title: "Coffee flavor", options: ["Starbucks", "Luckin"], yAxis: "Coffee quality" },
  { title: "Cancer incidence", options: ["Coffee drinkers", "Tea drinkers"], yAxis: "Cancer incidence" },
  { title: "Handsomeness of men", options: ["San Francisco", "New York"], yAxis: "Handsomeness" },
  { title: "Productivity", options: ["Early risers", "Night owls"], yAxis: "Tasks completed" },
  { title: "Dog happiness", options: ["Hikers", "Couch potatoes"], yAxis: "Tail-wag intensity" },
  { title: "Pizza satisfaction", options: ["Folded slices", "Flat slices"], yAxis: "Delight rating" },
  { title: "Plant growth", options: ["Classical music", "Heavy metal"], yAxis: "Leaf growth" },
  { title: "Meeting efficiency", options: ["Standing meetings", "Seated meetings"], yAxis: "Decisions per minute" },
  { title: "Detective skill", options: ["Cat owners", "Dog owners"], yAxis: "Mysteries solved" },
  { title: "Memory", options: ["Paper planners", "Phone calendars"], yAxis: "Details recalled" },
  { title: "Karaoke confidence", options: ["Shower singers", "Car singers"], yAxis: "Power-ballad confidence" },
  { title: "Sandwich quality", options: ["Diagonal cutters", "Rectangle cutters"], yAxis: "Sandwich excellence" },
  { title: "Trivia performance", options: ["Team names with puns", "Team names without puns"], yAxis: "Questions answered" },
  { title: "Sleep quality", options: ["Sock wearers", "Barefoot sleepers"], yAxis: "Restfulness" },
  { title: "Cookie crispness", options: ["Chilled dough", "Room-temperature dough"], yAxis: "Crunch score" },
  { title: "Navigation", options: ["Window-seat travelers", "Aisle-seat travelers"], yAxis: "Wrong turns avoided" },
  { title: "Desk focus", options: ["Plant owners", "Desk-lamp enthusiasts"], yAxis: "Focus score" },
  { title: "Pancake fluffiness", options: ["Whisk mixers", "Fork mixers"], yAxis: "Fluff height" },
  { title: "Typing speed", options: ["Mechanical-keyboard users", "Laptop-keyboard users"], yAxis: "Words per minute" },
  { title: "Movie enjoyment", options: ["Popcorn sharers", "Popcorn hoarders"], yAxis: "Enjoyment rating" },
  { title: "Morning cheer", options: ["Tea drinkers", "Hot-chocolate drinkers"], yAxis: "Cheerfulness" },
  { title: "Puzzle completion", options: ["Edge-first puzzlers", "Color-first puzzlers"], yAxis: "Pieces placed" },
  { title: "Beach relaxation", options: ["Book readers", "Sandcastle builders"], yAxis: "Relaxation score" },
];
const PLAYER_NAMES = [
  "Dr. Data McDataface", "Professor P. Hackerman", "Count Statula", "Chi Squaredini", "The Null Terminator",
  "Ada Lovelace Jr.", "Bayes McBayesface", "Captain Confidence Interval", "T. Testington", "Mean Gene",
  "Variance Van Winkle", "Madame Median", "Sir Rounds-a-Lot", "Pip Value", "The Sample Whisperer",
  "Major Outlier", "Fisher Price", "Doctor Significance", "Marge Inoferror", "Randy Randomizer",
  "The Correlation Kid", "Miss Leading Variable", "Baron von Bonferroni", "A. B. Test", "Sally Scatterplot",
  "Regression Reggie", "Cathy Causation", "Polly Gon", "The Spreadsheet Sorcerer", "Nora Maldistribution",
  "Dexter Dataset", "Olive Overfit", "Harvey Hypothesis", "Bella Bellcurve", "Manny Manipulation",
  "Stan Darderror", "Quinn Quantile", "Ivy Inference", "Wally Wald", "Pat Pending Results",
];
const CARD_COUNTS = { rounding: 30, contaminated: 10, outlier: 10, swap: 10, audit: 10, copy: 5, challenge: 5, decrease: 2 };
const CARD_NAMES = {
  rounding: "Rounding error", contaminated: "Contaminated sample", outlier: "Outlier removal; Collect new data",
  swap: "Swap labels", audit: "Audit", copy: "Copy", challenge: "Challenge", decrease: "Decrease significance threshold",
};
const CARD_IMAGES = {
  rounding: "images/card_rounding_error.png", contaminated: "images/card_contaminated_sample.png",
  outlier: "images/card_outlier_removal.png", swap: "images/card_swap_labels.png",
  audit: "images/card_audit.png", decrease: "images/card_decrease_significance_threshold.png",
};
const COPY_BLOCKED = new Set(["challenge", "decrease"]);
const app = document.querySelector("#app");
let state = null;

function randomDie() { return Math.floor(Math.random() * 11); }
function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}
function buildDeck() { return shuffle(Object.entries(CARD_COUNTS).flatMap(([type, count]) => Array(count).fill(type))); }
function randomPlayerNames() { return shuffle(PLAYER_NAMES).slice(0, 2); }
function draw(player) {
  if (!state.deck.length) return null;
  const card = state.deck.pop();
  state.hands[player].push(card);
  return card;
}
function cloneBoard() { return { samples: structuredClone(state.samples), threshold: state.threshold }; }
function currentPlayer() { return state.players[state.current]; }
function colorForPlayer(player) { return state.redPlayer === player ? "red" : "blue"; }
function contextRole(player) { return `Researcher for ${state.context.options[colorForPlayer(player) === "red" ? 0 : 1]}`; }
function labelFor(color, index) { return `${color[0].toUpperCase()}${color.slice(1)}-${LABELS[index]}`; }

function makeGame(players, context) {
  let firstRoll = randomDie();
  let secondRoll = randomDie();
  while (firstRoll === secondRoll) { firstRoll = randomDie(); secondRoll = randomDie(); }
  const deck = buildDeck();
  state = {
    players, redPlayer: firstRoll > secondRoll ? 0 : 1, current: firstRoll > secondRoll ? 0 : 1, context,
    samples: { red: [...STARTING_VALUES], blue: [...STARTING_VALUES] }, threshold: 4, deck, hands: [[], []],
    history: [], moves: [], pending: null, result: null, handVisible: false, dieResult: null,
  };
  for (let index = 0; index < 5; index += 1) { draw(0); draw(1); }
}
function flatten() { return ["red", "blue"].flatMap((color) => state.samples[color].map((value, index) => ({ color, value, index }))); }
function qualifyingSamples(sorted, requiredColor) {
  const chosen = sorted.slice(0, state.threshold);
  return chosen.length === state.threshold && chosen.every((sample) => sample.color === requiredColor)
    && (state.threshold === sorted.length || chosen.at(-1).value !== sorted[state.threshold].value) ? chosen : [];
}
function playerForColor(color) { return state.players[color === "red" ? state.redPlayer : 1 - state.redPlayer]; }
function evaluateResult(cardType = null) {
  const high = flatten().sort((a, b) => b.value - a.value);
  const low = [...high].reverse();
  const evidence = new Map();
  for (const color of ["red", "blue"]) {
    const qualifying = [...qualifyingSamples(high, color), ...qualifyingSamples(low, color === "red" ? "blue" : "red")];
    if (qualifying.length) evidence.set(color, qualifying);
  }
  const winners = new Set(evidence.keys());
  if (winners.size === 1) {
    const color = [...winners][0];
    const opponent = color === "red" ? "blue" : "red";
    state.result = {
      type: "win", player: playerForColor(color), color,
      finding: `${state.context.title} of ${state.context.options[color === "red" ? 0 : 1]} is greater than ${state.context.options[opponent === "red" ? 0 : 1]}.`,
      highlighted: evidence.get(color),
    };
  }
  else if (winners.size > 1) state.result = cardType === "decrease" ? { type: "win", player: currentPlayer(), highlighted: [...evidence.values()].flat(), finding: "The reduced significance threshold produced a significant result." } : { type: "null" };
  else if (!state.deck.length && !state.hands[0].length && !state.hands[1].length) state.result = { type: "null" };
}
function lastOpponentAction() { return [...state.history].reverse().find((action) => action.player !== state.current); }
function addMove(text) { state.moves.unshift(text); }
function startTurn() { state.current = state.current === 0 ? 1 : 0; state.handVisible = false; }

function selectCard(type, cardIndex) {
  if (state.result || !state.handVisible) return;
  if (type === "copy") {
    const target = lastOpponentAction();
    if (!target || COPY_BLOCKED.has(target.effect)) return alert("Copy needs a previous opponent action that is not Challenge or Decrease significance threshold.");
    state.pending = { type, effect: target.effect, cardIndex };
  } else if (type === "challenge") {
    const target = lastOpponentAction();
    if (!target || target.effect === "decrease") return alert("Challenge needs a previous opponent action that is not Decrease significance threshold.");
    commit(type, "challenge", null, target, cardIndex); return;
  } else if (type === "decrease") {
    if (state.threshold <= 2) return alert("The significance threshold cannot go below 2.");
    commit(type, "decrease", null, null, cardIndex); return;
  } else state.pending = { type, effect: type, cardIndex };
  render();
}
function chooseSample(color, index) {
  if (!state.pending || state.pending.effect === "rounding" || state.pending.effect === "swap") return;
  commit(state.pending.type, state.pending.effect, { color, index });
}
function chooseColumn(index) { if (state.pending?.effect === "swap") commit(state.pending.type, state.pending.effect, { index }); }
function beginRoundingDrag(event, color, index) {
  if (state.pending?.effect !== "rounding") return;
  event.currentTarget.setPointerCapture?.(event.pointerId);
  state.pending.target = { color, index, startY: event.clientY };
}
function finishRoundingDrag(event) {
  const target = state.pending?.target;
  if (!target || state.pending.effect !== "rounding") return;
  const distance = event.clientY - target.startY;
  if (Math.abs(distance) < 16) { state.pending.target = null; return; }
  const delta = distance < 0 ? 1 : -1;
  const next = state.samples[target.color][target.index] + delta;
  if (next < 0 || next > 10) { alert("That sample must remain between 0 and 10."); state.pending.target = null; return; }
  commit(state.pending.type, state.pending.effect, { color: target.color, index: target.index, delta });
}
function describeMove(actor, type, effect, target, before, challengeTarget) {
  const prefix = `${actor} — ${CARD_NAMES[type]}${type === "copy" ? ` (${CARD_NAMES[effect]})` : ""}`;
  if (["rounding", "contaminated", "audit"].includes(effect)) return `${prefix}: ${labelFor(target.color, target.index)}, ${before.samples[target.color][target.index]}→${state.samples[target.color][target.index]}`;
  if (effect === "outlier") return `${prefix}: ${labelFor(target.color, target.index)}, ${before.samples[target.color][target.index]}→${state.samples[target.color][target.index]}`;
  if (effect === "swap") return `${prefix}: column ${LABELS[target.index]} — Red ${before.samples.red[target.index]}↔Blue ${before.samples.blue[target.index]}`;
  if (effect === "decrease") return `${prefix}: significance level ${before.threshold}→${state.threshold}`;
  if (effect === "challenge") return `${prefix}: undid ${state.players[challengeTarget.player]}’s ${CARD_NAMES[challengeTarget.type]}`;
  return prefix;
}
function commit(type, effect, target = null, challengeTarget = null, selectedCardIndex = null) {
  const handIndex = selectedCardIndex ?? state.pending?.cardIndex ?? state.hands[state.current].indexOf(type);
  if (handIndex < 0) return;
  const before = cloneBoard(); const actor = currentPlayer(); state.dieResult = null;
  if (effect === "rounding") state.samples[target.color][target.index] += target.delta;
  if (effect === "contaminated") state.samples[target.color][target.index] = 5;
  if (effect === "outlier") { state.samples[target.color][target.index] = randomDie(); state.dieResult = `Outlier-removal die roll: ${state.samples[target.color][target.index]}`; }
  if (effect === "swap") [state.samples.red[target.index], state.samples.blue[target.index]] = [state.samples.blue[target.index], state.samples.red[target.index]];
  if (effect === "audit") state.samples[target.color][target.index] = STARTING_VALUES[target.index];
  if (effect === "decrease") state.threshold -= 1;
  if (effect === "challenge") { state.samples = structuredClone(challengeTarget.before.samples); state.threshold = challengeTarget.before.threshold; }
  state.hands[state.current].splice(handIndex, 1);
  const drawnCard = draw(state.current);
  state.history.push({ player: state.current, type, effect, before, handIndex, drawnCard });
  addMove(describeMove(actor, type, effect, target, before, challengeTarget));
  state.pending = null; evaluateResult(effect); if (!state.result) startTurn(); render();
}
function undoLastMove() {
  const last = state.history.at(-1);
  if (!last || state.handVisible || state.result) return;
  state.samples = structuredClone(last.before.samples);
  state.threshold = last.before.threshold;
  if (last.drawnCard !== null) {
    const drawnIndex = state.hands[last.player].lastIndexOf(last.drawnCard);
    if (drawnIndex >= 0) state.hands[last.player].splice(drawnIndex, 1);
    state.deck.push(last.drawnCard);
  }
  state.hands[last.player].splice(last.handIndex, 0, last.type);
  state.history.pop();
  state.moves.shift();
  state.current = last.player;
  state.handVisible = true;
  state.pending = null;
  state.dieResult = null;
  render();
}
function rulesReminder() {
  return `<details class="rules-reminder"><summary>Rules reminder</summary><div class="rules-copy">
    <h3>Context</h3><p>You are rival researchers collaborating on one dataset. Prove that your population has significantly higher values to win publication, funding, and academic survival.</p>
    <h3>Components</h3><p>A board; seven red and seven blue samples; an 11-sided die (0–10); 20 flavor-only context cards; and 82 action cards.</p>
    <h3>Setup & play</h3><ol><li>Randomly choose a context.</li><li>Place samples at 0, 2, 4, 5, 6, 8, and 10.</li><li>Each researcher starts with five cards, then rolls the 11-sided die. The higher roll researches red and takes the first turn.</li><li>On each turn, play one card and choose its effect. Players may target either color. When the draw pile is empty, continue playing cards normally.</li></ol>
    <h3>Winning & null result</h3><p>At significance level N, a player wins if either the top N samples are all their color or the bottom N are all their opponent’s color. Ties do not count. If every card is played without a winner, both players lose with a null result. If decreasing significance triggers both thresholds, the player who lowered it wins.</p>
    <h3>Action cards</h3><ol><li><strong>Rounding error:</strong> Move one sample up or down one point.</li><li><strong>Contaminated sample:</strong> Move one sample to 5.</li><li><strong>Outlier removal; Collect new data:</strong> Reroll one sample (0–10).</li><li><strong>Swap label:</strong> Swap the red and blue values in one column.</li><li><strong>Audit:</strong> Return one sample to its starting point.</li><li><strong>Copy:</strong> Copy the opponent’s last action ability, except Challenge or Decrease significance threshold.</li><li><strong>Challenge:</strong> Undo the opponent’s last card, except Decrease significance threshold.</li><li><strong>Decreased significance threshold:</strong> Lower significance by one.</li></ol>
    <h3>Example contexts</h3><p>Coffee flavor of Starbucks vs. Luckin; cancer incidence in coffee drinkers vs. tea drinkers; and handsomeness of men in San Francisco vs. New York.</p>
  </div></details>`;
}
function setupScreen() {
  const defaultNames = randomPlayerNames();
  const renderSetup = (selected) => {
    app.innerHTML = `<section class="setup"><h1>P-Hacking: The Game</h1><p>Manipulate the data, defend your theory, and reach significance before your rival does.</p>
      <section class="context-picker"><span class="eyebrow">Research context</span><strong>${selected.title}: ${selected.options[0]} vs. ${selected.options[1]}</strong><button type="button" class="ghost" data-random-context>Choose another random context</button></section>
      <form id="setup-form"><div class="setup-grid"><label>Player 1 name <input name="one" maxlength="30" value="${defaultNames[0]}" required /></label><label>Player 2 name <input name="two" maxlength="30" value="${defaultNames[1]}" required /></label></div><button type="submit">Begin study</button></form>${rulesReminder()}</section>`;
    app.querySelector("[data-random-context]").addEventListener("click", () => {
      let next = selected; while (next === selected && CONTEXTS.length > 1) next = CONTEXTS[Math.floor(Math.random() * CONTEXTS.length)]; renderSetup(next);
    });
    app.querySelector("#setup-form").addEventListener("submit", (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); makeGame([form.get("one").trim(), form.get("two").trim()], selected); render(); });
  };
  renderSetup(CONTEXTS[Math.floor(Math.random() * CONTEXTS.length)]);
}
function boardPopulation(color) {
  const title = state.context.options[color === "red" ? 0 : 1]; const cells = [];
  for (let value = 10; value >= 0; value -= 1) {
    cells.push(`<span class="axis-value">${value}</span>`);
    for (let index = 0; index < 7; index += 1) {
      const hasToken = state.samples[color][index] === value;
      const isStartingCell = STARTING_VALUES[index] === value;
      const isSignificant = hasToken && state.result?.highlighted?.some((sample) => sample.color === color && sample.index === index);
      const sampleAction = state.pending && ["rounding", "contaminated", "outlier", "audit"].includes(state.pending.effect);
      const swapAction = state.pending?.effect === "swap"; const selectable = (sampleAction && hasToken) || swapAction;
      cells.push(`<button class="cell ${isStartingCell ? "starting-cell" : ""} ${hasToken ? `token-${color}` : ""} ${isSignificant ? "significant" : ""} ${selectable ? "selectable" : ""}" data-sample="${color}:${index}" data-column="${index}" aria-label="${title} sample ${LABELS[index]}, value ${value}" ${selectable ? "" : "disabled"}></button>`);
    }
  }
  cells.push("<span></span>", ...LABELS.map((label, index) => state.pending?.effect === "swap" ? `<button class="sample-label selectable" data-column="${index}">${label}</button>` : `<span class="sample-label">${label}</span>`));
  return `<section class="population ${color}"><h2>${title}</h2><div class="grid">${cells.join("")}</div></section>`;
}
function controls() {
  if (!state.pending) return "";
  const prompt = state.pending.effect === "rounding" ? "Drag a filled point up or down by one square." : state.pending.effect === "swap" ? "Click any square or label in the column to swap." : `Choose a filled point for ${CARD_NAMES[state.pending.effect]}.`;
  return `<div class="action-controls"><p>${prompt}</p><button class="ghost" data-cancel>Cancel</button></div>`;
}
function hand() {
  const cards = state.hands[state.current];
  return `<section class="hand"><h2>${currentPlayer()}’s cards</h2><p class="muted">Choose one card, then follow the highlighted board interaction.</p><div class="cards">${cards.map((type, index) => `<button class="card ${state.pending?.cardIndex === index ? "selected" : ""}" data-card="${type}" data-card-index="${index}">${CARD_IMAGES[type] ? `<img src="${CARD_IMAGES[type]}" alt="" />` : `<span class="card-placeholder" aria-hidden="true">${type === "copy" ? "↗" : "↶"}</span>`}<span class="card-title">${CARD_NAMES[type]}</span></button>`).join("") || "<p>No cards remain.</p>"}</div>${controls()}</section>`;
}
function recentMoves() { return `<section class="panel"><h2>Recent moves</h2>${state.moves.length ? `<ol class="moves">${state.moves.slice(0, 10).map((move, index) => `<li class="${index === 0 ? "latest" : ""}">${move}</li>`).join("")}</ol>` : "<p class=\"muted\">No moves yet.</p>"}</section>`; }
function render() {
  if (!state) return setupScreen();
  const result = state.result ? `<div class="notice ${state.result.type}">${state.result.type === "win" ? `<strong>${state.result.player} wins the publication.</strong> ${state.result.finding}` : "<strong>Null result.</strong> No researcher achieved a significant result."}</div>` : "";
  const passScreen = !state.result && !state.handVisible ? `<section class="pass-screen"><p>Pass the device to <strong>${currentPlayer()}</strong>.</p><div class="pass-actions"><button data-show-hand>Show ${currentPlayer()}’s cards</button>${state.history.length ? "<button class=\"ghost\" data-undo>Undo last move</button>" : ""}</div></section>` : "";
  app.innerHTML = `<div class="shell"><header class="masthead"><div><h1>P-Hacking: The Game</h1><p class="subtitle">A two-researcher race to statistical significance.</p></div><button class="ghost" data-new>New game</button></header>
    <section class="status"><div class="status-card"><strong>${state.result ? "Study concluded" : `${currentPlayer()}’s turn`}</strong><span>${state.result ? "" : contextRole(state.current)}</span></div><div class="status-card"><strong>${state.deck.length}</strong><span>cards in draw pile</span></div></section>${result}${state.dieResult ? `<div class="die-result">🎲 ${state.dieResult}</div>` : ""}
    <section class="game-layout"><div class="board-wrap"><div class="board-area"><div class="y-axis-label">${state.context.yAxis}</div><div class="board">${boardPopulation("red")}${boardPopulation("blue")}</div></div></div><aside class="sidebar"><section class="panel"><h2>Significance level</h2><div class="threshold">${[4, 3, 2].map((level) => `<span class="level ${state.threshold === level ? "active" : ""}">${level}</span>`).join("")}</div></section>${recentMoves()}</aside></section>${passScreen}${state.handVisible && !state.result ? hand() : ""}${rulesReminder()}</div>`;
  app.querySelector("[data-new]")?.addEventListener("click", () => { state = null; render(); });
  app.querySelector("[data-show-hand]")?.addEventListener("click", () => { state.handVisible = true; render(); });
  app.querySelector("[data-undo]")?.addEventListener("click", undoLastMove);
  app.querySelectorAll("[data-card]").forEach((button) => button.addEventListener("click", () => selectCard(button.dataset.card, Number(button.dataset.cardIndex))));
  app.querySelectorAll("[data-sample]").forEach((button) => {
    button.addEventListener("click", () => { const [color, index] = button.dataset.sample.split(":"); if (state.pending?.effect === "swap") chooseColumn(Number(index)); else chooseSample(color, Number(index)); });
    button.addEventListener("pointerdown", (event) => { const [color, index] = button.dataset.sample.split(":"); beginRoundingDrag(event, color, Number(index)); });
    button.addEventListener("pointerup", finishRoundingDrag);
  });
  app.querySelectorAll("[data-column]").forEach((button) => button.addEventListener("click", () => chooseColumn(Number(button.dataset.column))));
  app.querySelector("[data-cancel]")?.addEventListener("click", () => { state.pending = null; render(); });
}
render();
