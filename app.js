
"use strict";

/* ASTROLINK - GAME DATA */

const PROMPTS = [
  {
    question: "Name an Astrocade creator",
    answers: {
      "hiquality": 100,
      "pikaapi": 85,
      "toxic": 60,
      "j.j.max": 85,
      "nazmul": 60,
      "simpy": 60,
      "korynn": 60,
      "mimoko": 60,
      "djam": 60,
      "lilsnapes": 85,
      "nox": 30,
      "cardsharkman": 85,
      "erika": 30,
      "belittle": 85,
      "axel": 30,
      "sturmjager": 85,
      "theramlerblman": 100,
      "blackwidowink": 85,
      "stargazer": 60,
      "angelclaw": 85,
      "vibecreai": 85
    }
  },
  {
    question: "Name a video game genre",
    answers: {
      "platformer": 10,
      "rpg": 15,
      "role playing game": 15,
      "horror": 10,
      "racing": 10,
      "simulation": 15,
      "simulator": 15,
      "roguelike": 60,
      "metroidvania": 85,
      "visual novel": 60,
      "deckbuilder": 85,
      "bullet hell": 85,
      "rhythm game": 30
    }
  },
  {
    question: "Name something you collect in a game",
    answers: {
      "coins": 10,
      "coin": 10,
      "gems": 15,
      "gem": 15,
      "stars": 10,
      "badges": 30,
      "badge": 30,
      "cards": 15,
      "card": 15,
      "pets": 10,
      "pet": 10,
      "artifacts": 60,
      "artifact": 60,
      "relics": 85,
      "relic": 85,
      "stickers": 30,
      "sticker": 30
    }
  },
  {
    question: "Name a creature that could live in a fantasy game",
    answers: {
      "dragon": 10,
      "goblin": 15,
      "slime": 30,
      "fairy": 15,
      "unicorn": 10,
      "griffin": 60,
      "phoenix": 30,
      "mimic": 85,
      "basilisk": 85,
      "wyvern": 60,
      "dryad": 100,
      "kelpie": 100,
      "gryphon": 60
    }
  },
  {
    question: "Name a feature in a video game",
    answers: {
      "multiplayer": 10,
      "leaderboard": 15,
      "leaderboards": 15,
      "skins": 10,
      "skin": 10,
      "achievements": 15,
      "achievement": 15,
      "crafting": 30,
      "skill tree": 60,
      "fast travel": 30,
      "photo mode": 60,
      "procedural generation": 85,
      "cross save": 85,
      "daily quests": 30
    }
  },
  {
    question: "Name a colour",
    answers: {
      "red": 10,
      "blue": 10,
      "green": 10,
      "yellow": 10,
      "purple": 15,
      "orange": 10,
      "turquoise": 30,
      "magenta": 30,
      "lavender": 15,
      "indigo": 60,
      "chartreuse": 100,
      "vermilion": 85,
      "periwinkle": 85,
      "cerulean": 60
    }
  },
  {
    question: "Name an object you might find in a game world",
    answers: {
      "key": 10,
      "treasure chest": 15,
      "chest": 10,
      "potion": 10,
      "map": 10,
      "lantern": 15,
      "compass": 15,
      "hourglass": 60,
      "telescope": 30,
      "music box": 60,
      "crystal ball": 85,
      "pocket watch": 85,
      "snow globe": 100
    }
  }
];

/* SCORING TIERS */

const TIERS = {
  10: { name: "PLANKTON", message: "A familiar answer. Every dive starts somewhere.", color: "#7dabb5" },
  15: { name: "TOO CLEVER", message: "A nice choice, but not the deepest find.", color: "#e5b45d" },
  30: { name: "SCHOOLER", message: "A solid answer. You're getting deeper.", color: "#65c8bc" },
  60: { name: "RARE", message: "That's a less obvious answer!", color: "#42a9e8" },
  85: { name: "DEEP CUT", message: "An excellent discovery. Very deep!", color: "#a78bfa" },
  100: { name: "ONE IN A KRILLION", message: "An incredible find!", color: "#f6d365" }
};

const $ = id => document.getElementById(id);

const today = () => {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
};

const DAILY_KEY = "astrolink-daily-" + today();
const STATS_KEY = "astrolink-stats";

let currentMode = "daily";
let currentPrompts = [];
let currentRound = 0;
let currentScore = 0;
let currentResults = [];
let timerInterval = null;
let timeLeft = 25;
let roundLocked = false;
let dailyAlreadyPlayed = false;

/* STORAGE */

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn("Could not save game data.");
  }
}

function getStats() {
  return readStorage(STATS_KEY, {
    dives: 0,
    best: 0,
    streak: 0,
    lastPlayed: "",
    totalScore: 0
  });
}

function checkDaily() {
  const saved = readStorage(DAILY_KEY, null);
  dailyAlreadyPlayed = Boolean(saved && saved.finished);

  $("dailyBtn").disabled = dailyAlreadyPlayed;
  $("dailyBtn").style.opacity = dailyAlreadyPlayed ? ".45" : "1";

  $("dailyStatus").textContent = dailyAlreadyPlayed
    ? "You have already completed today's Daily Dive. Try Unlimited!"
    : "Today's challenge is ready.";
}

/* SCREEN NAVIGATION */

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.add("hidden");
  });

  $(screenId).classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goHome() {
  stopTimer();
  checkDaily();
  showScreen("homeScreen");
}

/* STARTING A GAME */

function startGame(mode) {
  if (mode === "daily") {
    const saved = readStorage(DAILY_KEY, null);

    if (saved && saved.finished) {
      alert("You have already completed today's Daily Dive. Try Unlimited!");
      return;
    }

    currentPrompts = PROMPTS.map((prompt, index) => ({
      ...prompt,
      originalIndex: index
    }));

  } else {
    currentPrompts = [...PROMPTS]
      .sort(() => Math.random() - 0.5)
      .map(prompt => ({ ...prompt }));
  }

  currentMode = mode;
  currentRound = 0;
  currentScore = 0;
  currentResults = [];

  showScreen("gameScreen");
  startRound();
}

/* ROUND */

function startRound() {
  stopTimer();

  if (currentRound >= currentPrompts.length) {
    finishGame();
    return;
  }

  roundLocked = false;
  timeLeft = 25;

  const prompt = currentPrompts[currentRound];

  $("roundNumber").textContent =
    `${currentRound + 1} / ${currentPrompts.length}`;

  $("scoreValue").textContent = currentScore;
  $("depthValue").textContent = `${currentScore * 10} m`;
  $("promptText").textContent = prompt.question;

  $("answerInput").value = "";
  $("answerInput").disabled = false;
  $("submitBtn").disabled = false;
  $("feedback").textContent = "";
  $("feedback").style.color = "";

  $("seaCreature").style.top =
    `${35 + Math.min(currentScore / 10, 40)}px`;

  updateZone();
  renderDots();
  updateTimerDisplay();

  $("answerInput").focus();

  timerInterval = setInterval(() => {
    timeLeft = Math.max(0, timeLeft - 0.1);
    updateTimerDisplay();

    if (timeLeft <= 0) {
      stopTimer();
      timeOut();
    }
  }, 100);
}

function updateZone() {
  const depth = currentScore * 10;

  let zone = "SUNLIGHT ZONE";

  if (depth >= 1000) zone = "TWILIGHT ZONE";
  if (depth >= 3000) zone = "MIDNIGHT ZONE";
  if (depth >= 5000) zone = "ABYSSAL ZONE";
  if (depth >= 6500) zone = "HADAL ZONE";

  $("zoneLabel").textContent = zone;
}

function renderDots() {
  const container = $("progressDots");
  container.innerHTML = "";

  for (let i = 0; i < 7; i++) {
    const dot = document.createElement("span");
    dot.className = "progress-dot";

    if (i < currentResults.length) {
      dot.classList.add(
        currentResults[i].points > 0 ? "done" : "missed"
      );
    } else if (i === currentRound) {
      dot.classList.add("current");
    }

    container.appendChild(dot);
  }
}

/* TIMER */

function stopTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  const seconds = Math.ceil(timeLeft);

  $("timerText").textContent = seconds;
  $("timerBar").style.width =
    `${Math.max(0, (timeLeft / 25) * 100)}%`;

  if (timeLeft <= 8) {
    $("timerBar").style.background = "#f07878";
  } else {
    $("timerBar").style.background = "#65e5d3";
  }
}

/* ANSWER CHECKING */

function normalizeAnswer(value) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ");
}

function submitAnswer(event) {
  if (event) event.preventDefault();

  if (roundLocked) return;

  const rawAnswer = $("answerInput").value.trim();

  if (!rawAnswer) {
    $("feedback").textContent = "Type an answer first!";
    return;
  }

  const prompt = currentPrompts[currentRound];
  const normalized = normalizeAnswer(rawAnswer);

  let points = null;
  let acceptedAnswer = null;

  for (const [answer, score] of Object.entries(prompt.answers)) {
    if (normalizeAnswer(answer) === normalized) {
      points = score;
      acceptedAnswer = answer;
      break;
    }
  }

  if (points === null) {
    $("feedback").textContent =
      "That answer isn't in our answer bank. Try another!";
    $("answerInput").select();
    $("answerInput").classList.remove("shake");
    void $("answerInput").offsetWidth;
    $("answerInput").classList.add("shake");
    return;
  }

  resolveRound({
    answer: rawAnswer,
    acceptedAnswer,
    points,
    timedOut: false
  });
}

function timeOut() {
  if (roundLocked) return;

  const typed = $("answerInput").value.trim();

  if (typed) {
    const prompt = currentPrompts[currentRound];
    const normalized = normalizeAnswer(typed);

    for (const [answer, score] of Object.entries(prompt.answers)) {
      if (normalizeAnswer(answer) === normalized) {
        resolveRound({
          answer: typed,
          acceptedAnswer: answer,
          points: score,
          timedOut: true
        });
        return;
      }
    }
  }

  resolveRound({
    answer: typed || "Passed",
    acceptedAnswer: null,
    points: 0,
    timedOut: true
  });
}

function passRound() {
  if (roundLocked) return;

  resolveRound({
    answer: "Passed",
    acceptedAnswer: null,
    points: 0,
    timedOut: false
  });
}

/* ROUND RESULT */

function resolveRound(result) {
  if (roundLocked) return;

  roundLocked = true;
  stopTimer();

  $("answerInput").disabled = true;
  $("submitBtn").disabled = true;

  currentResults.push(result);
  currentScore += result.points;

  const tier = TIERS[result.points];

  $("landingTier").textContent =
    tier ? tier.name : "NO SCORE";

  $("landingTier").style.color =
    tier ? tier.color : "#f07878";

  $("landingAnswer").textContent =
    result.acceptedAnswer
      ? `Your answer: ${result.acceptedAnswer}`
      : result.timedOut
        ? "Time's up! No answer landed."
        : "You passed this prompt.";

  $("landingPoints").textContent = result.points;

  $("landingMessage").textContent =
    tier ? tier.message : "No points this time. Keep diving!";

  $("continueBtn").textContent =
    currentRound === 6 ? "SURFACE ↑" : "CONTINUE DESCENT ↓";

  showScreen("landingScreen");
}

function continueGame() {
  currentRound++;

  if (currentRound >= currentPrompts.length) {
    finishGame();
  } else {
    showScreen("gameScreen");
    startRound();
  }
}

/* FINISH AND SAVE */

function finishGame() {
  stopTimer();

  const depth = currentScore * 10;

  $("finalScore").textContent = currentScore;
  $("finalDepth").textContent = `${depth.toLocaleString()} METRES DEEP`;

  const rows = $("resultRows");
  rows.innerHTML = "";

  currentResults.forEach((result, index) => {
    const row = document.createElement("div");
    row.className = "result-row";

    const left = document.createElement("span");
    const right = document.createElement("strong");
    const small = document.createElement("small");

    left.textContent = `${index + 1}. ${result.answer}`;
    right.textContent = `+${result.points}`;
    small.textContent = result.points
      ? TIERS[result.points].name
      : "MISSED";

    row.append(left, small, right);
    rows.appendChild(row);
  });

  if (currentMode === "daily") {
    saveStorage(DAILY_KEY, {
      finished: true,
      score: currentScore,
      results: currentResults
    });

    updateStats(currentScore);
  }

  showScreen("resultScreen");
  checkDaily();
}

function updateStats(score) {
  const stats = getStats();
  const previousDay = stats.lastPlayed;

  if (previousDay !== today()) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayString = [
      yesterday.getFullYear(),
      String(yesterday.getMonth() + 1).padStart(2, "0"),
      String(yesterday.getDate()).padStart(2, "0")
    ].join("-");

    stats.streak = previousDay === yesterdayString
      ? stats.streak + 1
      : 1;
  }

  stats.dives++;
  stats.best = Math.max(stats.best, score);
  stats.totalScore += score;
  stats.lastPlayed = today();

  saveStorage(STATS_KEY, stats);
}

/* STATISTICS */

function showStats() {
  const stats = getStats();

  $("statDives").textContent = stats.dives;
  $("statBest").textContent = stats.best;
  $("statStreak").textContent = stats.streak;

  showScreen("statsScreen");
}

/* SHARE */

async function shareResult() {
  const symbols = currentResults.map(result => {
    if (result.points >= 100) return "🟨";
    if (result.points >= 85) return "🟪";
    if (result.points >= 60) return "🟦";
    if (result.points >= 30) return "🟩";
    if (result.points > 0) return "🟫";
    return "⬛";
  }).join("");

  const text =
    `✦ ASTROLINK DAILY DIVE\n` +
    `Score: ${currentScore}/700\n` +
    `Depth: ${currentScore * 10}m\n` +
    `${symbols}\n` +
    `Play AstroLink!`;

  try {
    await navigator.clipboard.writeText(text);
    $("shareMessage").textContent = "Result copied!";
  } catch {
    $("shareMessage").textContent =
      "Copy is unavailable in this browser.";
  }
}

/* BUTTONS AND INPUT */

$("dailyBtn").addEventListener("click", () => startGame("daily"));
$("unlimitedBtn").addEventListener("click", () => startGame("unlimited"));

$("answerForm").addEventListener("submit", submitAnswer);
$("passBtn").addEventListener("click", passRound);
$("continueBtn").addEventListener("click", continueGame);

$("statsBtn").addEventListener("click", showStats);
$("helpBtn").addEventListener("click", () => showScreen("helpScreen"));

$("homeBtn").addEventListener("click", goHome);
$("shareBtn").addEventListener("click", shareResult);

document.querySelectorAll("[data-home]").forEach(button => {
  button.addEventListener("click", goHome);
});

/* STARTUP */

checkDaily();
