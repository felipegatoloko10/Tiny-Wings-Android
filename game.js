// Tiny Wings Web Engine - Canvas 2D Physics Simulator

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width, height;
function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Áudios
let sndBgm, sndCoin, sndFever, sndPlop;

function initAudio() {
  try {
    sndBgm = new Audio('audio/bgm.mp3');
    sndBgm.loop = true;
    sndCoin = new Audio('audio/coin.mp3');
    sndFever = new Audio('audio/feverBoom.mp3');
    sndPlop = new Audio('audio/chargePlop.mp3');
  } catch(e) {
    console.warn("Audio init error:", e);
  }
}

function playSound(snd) {
  if (!snd) return;
  try {
    snd.currentTime = 0;
    const p = snd.play();
    if (p && p.catch) p.catch(() => {});
  } catch(e) {}
}

// Parâmetros do Jogo & Física
const GRAVITY = 0.28;
const DIVE_GRAVITY = 0.85;
const FRICTION = 0.992;
const HILL_SEGMENT_WIDTH = 1200;

let isDiving = false;
let gameRunning = false;
let score = 0;
let island = 1;
let feverMultiplier = 1;
let perfectSlides = 0;
let dayTime = 100; // Tempo do dia (100% até 0%)

const bird = {
  x: 150,
  y: 300,
  vx: 3,
  vy: 0,
  radius: 16,
  rotation: 0,
  onGround: false,
  fever: false
};

// Geração de Colinas
function getHillY(x) {
  const hillHeight = 160;
  const hillWidth = 850;
  // Mistura senoidal procedural
  const wave1 = Math.sin(x / (hillWidth / Math.PI)) * (hillHeight / 2);
  const wave2 = Math.cos(x / ((hillWidth * 1.5) / Math.PI)) * 40;
  return height * 0.65 + wave1 + wave2;
}

function getHillSlope(x) {
  const dx = 2;
  const y1 = getHillY(x - dx);
  const y2 = getHillY(x + dx);
  return (y2 - y1) / (dx * 2);
}

// Moedas ao longo do relevo
const coins = [];
function spawnCoins() {
  coins.length = 0;
  for (let x = 400; x < 20000; x += 180 + Math.random() * 200) {
    const hy = getHillY(x);
    coins.push({
      x: x,
      y: hy - 30 - Math.random() * 120,
      radius: 10,
      collected: false
    });
  }
}

// Controles (Mouse, Touch e Teclado)
function setDive(state) {
  if (!gameRunning) return;
  isDiving = state;
}

window.addEventListener('mousedown', (e) => {
  if (e.target && (e.target.id === 'btn-start' || e.target.id === 'btn-restart')) return;
  setDive(true);
});
window.addEventListener('mouseup', () => setDive(false));
window.addEventListener('touchstart', (e) => {
  if (e.target && (e.target.id === 'btn-start' || e.target.id === 'btn-restart')) return;
  e.preventDefault();
  setDive(true);
}, { passive: false });
window.addEventListener('touchend', (e) => {
  if (e.target && (e.target.id === 'btn-start' || e.target.id === 'btn-restart')) return;
  e.preventDefault();
  setDive(false);
}, { passive: false });
window.addEventListener('keydown', (e) => { if (e.code === 'Space') setDive(true); });
window.addEventListener('keyup', (e) => { if (e.code === 'Space') setDive(false); });

// Loop do Jogo
function update() {
  if (!gameRunning) return;

  // Consumo do tempo do dia
  dayTime -= 0.035;
  if (dayTime <= 0) {
    dayTime = 0;
    gameOver();
    return;
  }
  document.getElementById('sun-bar').style.width = dayTime + '%';

  // Gravidade
  const g = isDiving ? DIVE_GRAVITY : GRAVITY;
  bird.vy += g;

  // Movimento
  bird.x += bird.vx;
  bird.y += bird.vy;

  // Interação com o solo (Colinas)
  const groundY = getHillY(bird.x);
  const slope = getHillSlope(bird.x);

  if (bird.y + bird.radius >= groundY) {
    bird.onGround = true;

    // Se estiver mergulhando: cola no chão e ganha aceleração nas descidas
    if (isDiving) {
      bird.y = groundY - bird.radius;
      if (slope > 0) {
        // Descida: aceleração forte baseada na inclinação
        bird.vx += slope * 1.5 + 0.3;
        if (bird.vx > 22) bird.vx = 22;
        perfectSlides++;
        if (perfectSlides > 3 && feverMultiplier === 1) {
          feverMultiplier = 2;
          playSound(sndFever);
        }
      } else {
        // Subida mergulhando: perde velocidade por bater na subida
        bird.vx *= 0.96;
        perfectSlides = 0;
        feverMultiplier = 1;
      }
      bird.vy = slope * bird.vx;
    } else {
      // NÃO ESTÁ MERGULHANDO: se atingir uma rampa ascendente ou tiver velocidade, é lançado aos ares!
      if (slope < 0 || bird.vy < 0) {
        // Lançamento balístico nos vales/subidas
        const launchPower = Math.abs(slope) * bird.vx * 1.6;
        bird.vy = -Math.max(launchPower, bird.vx * 0.7);
        bird.y = groundY - bird.radius - 4; // Descola imediatamente do chão
        bird.onGround = false;
        playSound(sndPlop);
      } else {
        // Está deslizando suavemente no plano
        bird.y = groundY - bird.radius;
        bird.vy = slope * bird.vx;
      }
    }

    bird.rotation = Math.atan(slope);
  } else {
    bird.onGround = false;
    bird.rotation = Math.atan2(bird.vy, bird.vx);
  }

  // Fricção do ar
  bird.vx *= FRICTION;
  if (bird.vx < 2) bird.vx = 2;

  // Pontuação baseada em distância percorrida
  score += Math.floor(bird.vx * 0.2 * feverMultiplier);
  document.getElementById('hud-score').textContent = score;
  document.getElementById('hud-fever').textContent = `FEVER: x${feverMultiplier}`;

  // Avanço de ilhas
  const currentIsland = Math.floor(bird.x / 4000) + 1;
  if (currentIsland !== island) {
    island = currentIsland;
    document.getElementById('hud-island').textContent = island;
    // Bônus de tempo ao alcançar nova ilha
    dayTime = Math.min(100, dayTime + 18);
  }

  // Coleta de moedas
  for (const c of coins) {
    if (!c.collected && Math.hypot(bird.x - c.x, bird.y - c.y) < bird.radius + c.radius) {
      c.collected = true;
      score += 50 * feverMultiplier;
      playSound(sndCoin);
    }
  }
}

function render() {
  ctx.clearRect(0, 0, width, height);

  // Céu gradiente dinâmico baseado na hora do dia
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  if (dayTime > 50) {
    skyGrad.addColorStop(0, '#4fc3f7');
    skyGrad.addColorStop(1, '#e1f5fe');
  } else if (dayTime > 20) {
    skyGrad.addColorStop(0, '#ff9800');
    skyGrad.addColorStop(1, '#ffcc80');
  } else {
    skyGrad.addColorStop(0, '#311b92');
    skyGrad.addColorStop(1, '#f57c00');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Câmera segue o pássaro
  const camX = bird.x - width * 0.25;
  const targetCamY = bird.y - height * 0.65;
  const camY = Math.min(targetCamY, height * 0.2);

  ctx.save();
  ctx.translate(-camX, -camY * 0.5);

  // Renderizar Sol
  const sunX = camX + width * 0.8;
  const sunY = height * 0.2 + (100 - dayTime) * 3;
  ctx.fillStyle = '#ffeb3b';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 32, 0, Math.PI * 2);
  ctx.fill();

  // Renderizar Colinas (Terreno com faixas coloridas estilizadas)
  ctx.beginPath();
  ctx.moveTo(camX - 50, height * 1.5);
  for (let x = camX - 50; x < camX + width + 50; x += 15) {
    ctx.lineTo(x, getHillY(x));
  }
  ctx.lineTo(camX + width + 50, height * 1.5);
  ctx.closePath();

  // Gradiente do terreno
  const hillGrad = ctx.createLinearGradient(0, height * 0.5, 0, height * 1.2);
  hillGrad.addColorStop(0, '#8bc34a');
  hillGrad.addColorStop(0.3, '#4caf50');
  hillGrad.addColorStop(1, '#2e7d32');
  ctx.fillStyle = hillGrad;
  ctx.fill();

  // Desenhar Moedas
  for (const c of coins) {
    if (!c.collected && c.x > camX - 50 && c.x < camX + width + 50) {
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ff9800';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // Renderizar o Pássaro (Tiny Wing)
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);

  // Corpo
  ctx.fillStyle = feverMultiplier > 1 ? '#ff5722' : '#00bcd4';
  ctx.beginPath();
  ctx.ellipse(0, 0, bird.radius * 1.2, bird.radius, 0, 0, Math.PI * 2);
  ctx.fill();

  // Olho
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(bird.radius * 0.5, -4, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(bird.radius * 0.6, -4, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Bico
  ctx.fillStyle = '#ff9800';
  ctx.beginPath();
  ctx.moveTo(bird.radius * 0.9, -2);
  ctx.lineTo(bird.radius * 1.5, 2);
  ctx.lineTo(bird.radius * 0.8, 6);
  ctx.closePath();
  ctx.fill();

  // Asa (Animação de bater asas quando solta o toque)
  ctx.fillStyle = '#ffeb3b';
  ctx.beginPath();
  const wingY = isDiving ? 4 : Math.sin(Date.now() * 0.02) * 8 - 4;
  ctx.ellipse(-4, wingY, 10, 6, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  ctx.restore();
}

function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

// Iniciar e Reiniciar
window.handleStartClick = function(e) {
  if (e) {
    if (e.stopPropagation) e.stopPropagation();
    if (e.preventDefault) e.preventDefault();
  }
  const startEl = document.getElementById('start-screen');
  if (startEl) startEl.style.display = 'none';
  startGame();
};

window.handleRestartClick = function(e) {
  if (e) {
    if (e.stopPropagation) e.stopPropagation();
    if (e.preventDefault) e.preventDefault();
  }
  const overEl = document.getElementById('game-over-screen');
  if (overEl) overEl.style.display = 'none';
  startGame();
};

const btnStart = document.getElementById('btn-start');
if (btnStart) {
  btnStart.addEventListener('click', handleStartClick);
  btnStart.addEventListener('touchend', handleStartClick);
}

const btnRestart = document.getElementById('btn-restart');
if (btnRestart) {
  btnRestart.addEventListener('click', handleRestartClick);
  btnRestart.addEventListener('touchend', handleRestartClick);
}

function startGame() {
  initAudio();
  bird.x = 150;
  bird.y = 200;
  bird.vx = 7;
  bird.vy = -5;
  score = 0;
  island = 1;
  dayTime = 100;
  feverMultiplier = 1;
  perfectSlides = 0;
  spawnCoins();
  gameRunning = true;
  if (sndBgm) {
    try {
      sndBgm.currentTime = 0;
      const p = sndBgm.play();
      if (p && p.catch) p.catch(() => {});
    } catch(e){}
  }
}

function gameOver() {
  gameRunning = false;
  document.getElementById('final-stats').textContent = `Você chegou à Ilha ${island} com ${score} pontos!`;
  document.getElementById('game-over-screen').style.display = 'flex';
}

gameLoop();
