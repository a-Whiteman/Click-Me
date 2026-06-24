const loginScreen = document.getElementById('loginScreen');
const gameScreen = document.getElementById('gameScreen');
const loginForm = document.getElementById('loginForm');
const playerNameInput = document.getElementById('playerNameInput');
const loginMessage = document.getElementById('loginMessage');
const startBtn = document.getElementById('startBtn');
const target = document.getElementById('target');
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const bestEl = document.getElementById('best');
const messageEl = document.getElementById('message');
const playerNameEl = document.getElementById('playerName');
const leaderboardList = document.getElementById('leaderboardList');

const leaderboardKey = 'clickArenaLeaderboard';
const playerNameKey = 'clickArenaPlayerName';

let score = 0;
let timeLeft = 15; // Fixed: Matches 15 seconds in HTML text
let timer;
let gameActive = false;
let playerName = localStorage.getItem(playerNameKey) || '';
let playerEntry = null;
let leaderboard = loadLeaderboard();
let audioContext;

function loadLeaderboard() {
  const stored = localStorage.getItem(leaderboardKey);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveLeaderboard() {
  localStorage.setItem(leaderboardKey, JSON.stringify(leaderboard));
}

function ensureAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

function playTone(freq, duration, type = 'sine', volume = 0.04) {
  ensureAudio();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = freq;
  gainNode.gain.value = volume;
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
  gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + duration);
}

function updateScore() {
  scoreEl.textContent = score;
}

function updateTime() {
  timeEl.textContent = timeLeft;
}

function updateBest() {
  bestEl.textContent = playerEntry ? playerEntry.bestScore : 0;
}

function renderLeaderboard() {
  leaderboard.sort((a, b) => b.bestScore - a.bestScore);
  leaderboardList.innerHTML = '';

  if (!leaderboard.length) {
    leaderboardList.innerHTML = '<li>No scores yet</li>';
    return;
  }

  const visible = leaderboard.slice(0, 8);
  visible.forEach((entry, index) => {
    const listItem = document.createElement('li');
    const isCurrentPlayer = playerName && entry.name.toLowerCase() === playerName.toLowerCase();
    const displayScore = isCurrentPlayer && gameActive ? score : entry.bestScore;
    listItem.innerHTML = `<span>${index + 1}. ${entry.name}</span><strong>${displayScore}</strong>`;
    leaderboardList.appendChild(listItem);
  });
}

function ensurePlayerEntry() {
  const trimmedName = playerName.trim();
  const normalized = trimmedName.toLowerCase();
  let existing = leaderboard.find((entry) => entry.name.toLowerCase() === normalized);

  if (!existing) {
    existing = { name: trimmedName, bestScore: 0 };
    leaderboard.push(existing);
    saveLeaderboard();
  }

  playerEntry = existing;
  return existing;
}

function startGame() {
  score = 0;
  timeLeft = 15; // Fixed: Matches 15 seconds in HTML text
  gameActive = true;
  updateScore();
  updateTime();
  messageEl.textContent = 'Go!';
  startBtn.classList.add('hidden');
  target.classList.remove('hidden');
  renderLeaderboard();
  playTone(523, 0.12, 'triangle', 0.05);

  clearInterval(timer);
  timer = setInterval(() => {
    timeLeft -= 1;
    updateTime();

    if (timeLeft <= 0) {
      clearInterval(timer);
      gameActive = false;
      target.classList.add('hidden');
      startBtn.classList.remove('hidden');
      startBtn.textContent = 'Play Again';

      // Fixed: Check high score condition BEFORE overwriting the property value
      const isNewBest = playerEntry && score > playerEntry.bestScore;

      if (playerEntry) {
        playerEntry.bestScore = Math.max(playerEntry.bestScore, score);
        saveLeaderboard();
      }

      updateBest();
      renderLeaderboard();
      
      messageEl.textContent = isNewBest 
        ? `New best! ${score}` 
        : `Time is up! Final score: ${score}`;
        
      playTone(220, 0.2, 'sawtooth', 0.05);
    }
  }, 1000);
}

target.addEventListener('click', () => {
  if (!gameActive) return;
  score += 1;
  updateScore();
  renderLeaderboard();
  playTone(660 + score * 8, 0.04, 'square', 0.03);
});

startBtn.addEventListener('click', startGame);

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = playerNameInput.value.trim();
  if (!name) {
    loginMessage.textContent = 'Please enter your name.';
    return;
  }

  playerName = name;
  localStorage.setItem(playerNameKey, playerName);
  ensurePlayerEntry();
  playerNameEl.textContent = playerName;
  loginScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  loginMessage.textContent = '';
  updateBest();
  renderLeaderboard();
  playTone(880, 0.1, 'triangle', 0.04);
});

if (playerName) {
  playerNameInput.value = playerName;
}

renderLeaderboard();