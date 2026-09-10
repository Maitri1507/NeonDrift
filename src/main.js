import './style.css';

const canvas = document.querySelector('#game-canvas');
const context = canvas.getContext('2d');
const stage = document.querySelector('.game-stage');
const scoreElement = document.querySelector('#score');
const bestElement = document.querySelector('#best');
const livesElement = document.querySelector('#lives');
const startPanel = document.querySelector('#start-panel');
const gameOverPanel = document.querySelector('#game-over-panel');
const finalScoreElement = document.querySelector('#final-score');
const startButton = document.querySelector('#start-button');
const restartButton = document.querySelector('#restart-button');

const BEST_SCORE_KEY = 'neon-drift-best';
function readBestScore() {
  try { return Number(localStorage.getItem(BEST_SCORE_KEY) || 0); } catch { return 0; }
}
function writeBestScore(value) {
  try { localStorage.setItem(BEST_SCORE_KEY, String(value)); } catch { /* Persistence is optional. */ }
}
const state = { running: false, score: 0, lives: 3, best: readBestScore(), speed: 1, spawnTimer: 0, shardTimer: 0, lastTime: 0 };
const keys = { left: false, right: false };
const player = { x: 0, y: 0, width: 25, height: 34, targetX: 0, tilt: 0, invulnerable: 0 };
let stars = [];
let hazards = [];
let shards = [];
let particles = [];
let width = 0;
let height = 0;

bestElement.textContent = formatScore(state.best);

function formatScore(value) { return String(Math.floor(value)).padStart(6, '0'); }
function random(min, max) { return min + Math.random() * (max - min); }
function resize() {
  const ratio = window.devicePixelRatio || 1;
  const bounds = stage.getBoundingClientRect();
  width = bounds.width; height = bounds.height;
  canvas.width = width * ratio; canvas.height = height * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  player.y = height - 72;
  if (!player.x) player.x = width / 2;
  player.x = Math.min(width - 28, Math.max(28, player.x));
  if (!stars.length) createStars();
}
function createStars() {
  stars = Array.from({ length: 100 }, () => ({ x: random(0, width), y: random(0, height), size: random(.4, 1.7), speed: random(.3, 1.9), alpha: random(.2, .85) }));
}
function resetGame() {
  state.score = 0; state.lives = 3; state.speed = 1; state.spawnTimer = 0; state.shardTimer = .7;
  hazards = []; shards = []; particles = []; player.x = width / 2; player.targetX = player.x; player.invulnerable = 0;
  updateHud();
}
function updateHud() {
  scoreElement.textContent = formatScore(state.score);
  livesElement.innerHTML = Array.from({ length: 3 }, (_, index) => `<i class="${index >= state.lives ? 'empty' : ''}"></i>`).join('');
}
function beginGame() { resetGame(); state.running = true; startPanel.classList.add('is-hidden'); gameOverPanel.classList.add('is-hidden'); state.lastTime = performance.now(); requestAnimationFrame(loop); }
function endGame() {
  state.running = false;
  state.best = Math.max(state.best, Math.floor(state.score));
  writeBestScore(state.best);
  bestElement.textContent = formatScore(state.best); finalScoreElement.textContent = formatScore(state.score);
  gameOverPanel.classList.remove('is-hidden');
}
function addBurst(x, y, color, amount = 12) {
  for (let index = 0; index < amount; index++) particles.push({ x, y, vx: random(-2.5, 2.5), vy: random(-2.5, 2.5), life: 1, size: random(1, 3), color });
}
function spawnHazard() { hazards.push({ x: random(27, width - 27), y: -30, size: random(13, 22), rotation: random(0, Math.PI), spin: random(-.04, .04) }); }
function spawnShard() { shards.push({ x: random(25, width - 25), y: -25, size: 8, pulse: random(0, Math.PI * 2) }); }
function intersects(a, b, padding = 0) { return Math.abs(a.x - b.x) < a.width / 2 + b.size - padding && Math.abs(a.y - b.y) < a.height / 2 + b.size - padding; }
function update(delta) {
  const frame = Math.min(delta / 16.67, 2);
  state.speed = Math.min(2.45, state.speed + delta * .000012);
  state.score += delta * .012 * state.speed;
  state.spawnTimer -= delta / 1000; state.shardTimer -= delta / 1000;
  if (state.spawnTimer <= 0) { spawnHazard(); state.spawnTimer = Math.max(.26, .78 - state.speed * .16) * random(.8, 1.25); }
  if (state.shardTimer <= 0) { spawnShard(); state.shardTimer = random(1.1, 1.9); }
  const direction = (keys.left ? -1 : 0) + (keys.right ? 1 : 0);
  player.targetX += direction * 7 * frame;
  player.targetX = Math.min(width - 25, Math.max(25, player.targetX));
  player.x += (player.targetX - player.x) * .18;
  player.tilt += (direction * .08 - player.tilt) * .12;
  player.invulnerable = Math.max(0, player.invulnerable - delta / 1000);
  stars.forEach((star) => { star.y += star.speed * state.speed * frame; if (star.y > height) { star.y = -2; star.x = random(0, width); } });
  hazards.forEach((hazard) => { hazard.y += 3.8 * state.speed * frame; hazard.rotation += hazard.spin * frame; });
  shards.forEach((shard) => { shard.y += 3.2 * state.speed * frame; shard.pulse += .08 * frame; });
  hazards = hazards.filter((hazard) => hazard.y < height + 40);
  shards = shards.filter((shard) => shard.y < height + 40);
  const ship = { x: player.x, y: player.y, width: player.width, height: player.height };
  hazards.forEach((hazard) => { if (player.invulnerable <= 0 && intersects(ship, hazard, 5)) { state.lives--; player.invulnerable = 1.2; addBurst(player.x, player.y, '#ff7657', 20); updateHud(); if (!state.lives) endGame(); } });
  shards = shards.filter((shard) => { if (intersects(ship, shard, 7)) { state.score += 80; addBurst(shard.x, shard.y, '#83f5d7', 11); return false; } return true; });
  particles.forEach((particle) => { particle.x += particle.vx * frame; particle.y += particle.vy * frame; particle.vy += .03 * frame; particle.life -= .035 * frame; });
  particles = particles.filter((particle) => particle.life > 0);
  updateHud();
}
function draw() {
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#07131e'; context.fillRect(0, 0, width, height);
  stars.forEach((star) => { context.globalAlpha = star.alpha; context.fillStyle = '#b9e8e0'; context.fillRect(star.x, star.y, star.size, star.size * 3); }); context.globalAlpha = 1;
  context.strokeStyle = '#74dec5'; context.globalAlpha = .12; context.beginPath(); context.moveTo(width * .25, 0); context.lineTo(width * .25, height); context.moveTo(width * .75, 0); context.lineTo(width * .75, height); context.stroke(); context.globalAlpha = 1;
  shards.forEach((shard) => drawShard(shard)); hazards.forEach((hazard) => drawHazard(hazard)); particles.forEach((particle) => { context.globalAlpha = particle.life; context.fillStyle = particle.color; context.fillRect(particle.x, particle.y, particle.size, particle.size); }); context.globalAlpha = 1;
  if (state.running) drawPlayer();
}
function drawShard(shard) { const glow = 11 + Math.sin(shard.pulse) * 3; context.shadowBlur = glow; context.shadowColor = '#78f5d6'; context.fillStyle = '#a9ffe5'; context.beginPath(); context.moveTo(shard.x, shard.y - shard.size); context.lineTo(shard.x + shard.size * .65, shard.y); context.lineTo(shard.x, shard.y + shard.size); context.lineTo(shard.x - shard.size * .65, shard.y); context.closePath(); context.fill(); context.shadowBlur = 0; }
function drawHazard(hazard) { context.save(); context.translate(hazard.x, hazard.y); context.rotate(hazard.rotation); context.shadowBlur = 12; context.shadowColor = '#ff6848'; context.fillStyle = '#ff6848'; context.beginPath(); for (let index = 0; index < 7; index++) { const angle = index * Math.PI * 2 / 7; const radius = hazard.size * (index % 2 ? .75 : 1.1); context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius); } context.closePath(); context.fill(); context.shadowBlur = 0; context.fillStyle = '#ffb08e'; context.globalAlpha = .55; context.fillRect(-2, -2, 4, 4); context.restore(); }
function drawPlayer() { if (player.invulnerable > 0 && Math.floor(player.invulnerable * 12) % 2 === 0) return; context.save(); context.translate(player.x, player.y); context.rotate(player.tilt); context.shadowBlur = 18; context.shadowColor = '#72f1d0'; context.fillStyle = '#b8ffea'; context.beginPath(); context.moveTo(0, -23); context.lineTo(12, 13); context.lineTo(4, 10); context.lineTo(0, 19); context.lineTo(-4, 10); context.lineTo(-12, 13); context.closePath(); context.fill(); context.shadowBlur = 0; context.fillStyle = '#2e9f9a'; context.beginPath(); context.moveTo(0, -11); context.lineTo(5, 5); context.lineTo(-5, 5); context.closePath(); context.fill(); context.fillStyle = '#ffb666'; context.globalAlpha = .9; context.beginPath(); context.moveTo(-4, 13); context.lineTo(0, 25 + Math.random() * 8); context.lineTo(4, 13); context.closePath(); context.fill(); context.restore(); }
function loop(timestamp) { if (!state.running) { draw(); return; } const delta = timestamp - state.lastTime; state.lastTime = timestamp; update(delta); draw(); requestAnimationFrame(loop); }
function setKey(event, value) { if (['ArrowLeft', 'a', 'A'].includes(event.key)) keys.left = value; if (['ArrowRight', 'd', 'D'].includes(event.key)) keys.right = value; if (value && ['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(event.key)) event.preventDefault(); }
window.addEventListener('keydown', (event) => setKey(event, true)); window.addEventListener('keyup', (event) => setKey(event, false));
function touchDirection(event) { const bounds = stage.getBoundingClientRect(); keys.left = event.clientX - bounds.left < bounds.width / 2; keys.right = !keys.left; }
stage.addEventListener('pointerdown', (event) => { if (state.running) touchDirection(event); }); stage.addEventListener('pointermove', (event) => { if (state.running && event.buttons) touchDirection(event); }); window.addEventListener('pointerup', () => { keys.left = false; keys.right = false; });
startButton.addEventListener('click', beginGame); restartButton.addEventListener('click', beginGame); window.addEventListener('resize', resize); resize(); draw();
