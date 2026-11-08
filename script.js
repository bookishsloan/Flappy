const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- 基础参数 ---
const groundY = 300;
let gameSpeed = 7.5;
let maxGameSpeed = 11.5;
let distanceScore = 0;
let coinCount = 0;
let ammo = 5;
let killCount = 0;           // 击杀怪物总数统计

// --- 帧率控制变量 (锁定 60 FPS) ---
let lastTime = 0;
const fps = 60;
const interval = 1000 / fps; // 约 16.67 毫秒

// --- 主角小鸟 ---
const bird = {
  x: 100,
  y: 250,
  width: 38,
  height: 34,
  velocityY: 0,
  gravity: 1.15,
  jumpPower: -12.5,
  isGrounded: false,
  isDucking: false
};

let obstacles = [];
let coins = [];
let playerBullets = [];
let enemyBullets = [];

let obstacleTimer = 0;
let coinPatternTimer = 0;
let gameOver = false;

// --- 键盘与点击/触摸监听 ---
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') jump();
  if (e.code === 'ArrowDown' || e.code === 'KeyS') setDuck(true);
  if (e.code === 'KeyJ' || e.code === 'KeyF') shoot();
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowDown' || e.code === 'KeyS') setDuck(false);
});

canvas.addEventListener('click', jump);

function jump() {
  if (gameOver) {
    resetGame();
    return;
  }
  if (bird.isGrounded && !bird.isDucking) {
    bird.velocityY = bird.jumpPower;
    bird.isGrounded = false;
  }
}

function setDuck(ducking) {
  if (gameOver) return;
  bird.isDucking = ducking;
}

function shoot() {
  if (gameOver || ammo <= 0) return;
  ammo--;
  const bulletY = bird.isDucking ? groundY - 14 : bird.y + 12;
  playerBullets.push({ x: bird.x + bird.width, y: bulletY, vx: 12, r: 5 });
}

function resetGame() {
  bird.y = groundY - bird.height;
  bird.velocityY = 0;
  bird.isDucking = false;
  obstacles = [];
  coins = [];
  playerBullets = [];
  enemyBullets = [];
  obstacleTimer = 0;
  coinPatternTimer = 0;
  distanceScore = 0;
  coinCount = 0;
  killCount = 0;
  ammo = 5;
  gameSpeed = 7.5;
  gameOver = false;
  lastTime = 0; // 重置帧率计时
  requestAnimationFrame(animate);
}

// --- 绘制小鸟 ---
function drawBird(x, y) {
  ctx.save();
  const currentY = bird.isDucking ? groundY - 18 : y;
  const currentH = bird.isDucking ? 18 : 34;

  ctx.fillStyle = '#fef08a';
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x + 19, currentY + currentH / 2, 18, Math.max(currentH / 2, 4), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(x + 27, currentY + (bird.isDucking ? 6 : 12), 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fb923c';
  ctx.beginPath();
  ctx.arc(x + 34, currentY + (bird.isDucking ? 9 : 17), 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// --- 绘制障碍物与怪物 ---
function drawSingleTree(x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#b45309';
  ctx.fillRect(x + w * 0.35, y + h * 0.5, w * 0.3, h * 0.5);

  ctx.fillStyle = '#4ade80';
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h * 0.35, w * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawCloud(x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y + h * 0.3, w, h * 0.7, 10);
  ctx.arc(x + w * 0.3, y + h * 0.3, h * 0.4, 0, Math.PI * 2);
  ctx.arc(x + w * 0.7, y + h * 0.4, h * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawGroundMonster(x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#a855f7';
  ctx.strokeStyle = '#7e22ce';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, [8, 8, 2, 2]);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + 10, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + 10, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFlyingBat(x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#f43f5e';
  ctx.strokeStyle = '#be123c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#e11d48';
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + h / 2);
  ctx.lineTo(x - 6, y - 2);
  ctx.lineTo(x + 4, y + h * 0.6);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + h / 2);
  ctx.lineTo(x + w + 6, y - 2);
  ctx.lineTo(x + w - 4, y + h * 0.6);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x + 8, y + h / 2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(x + 7, y + h / 2, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// --- 金币阵型生成器 ---
function spawnCoinPattern() {
  const patternType = Math.floor(Math.random() * 3);
  const startX = canvas.width + 20;

  if (patternType === 0) {
    for (let i = 0; i < 5; i++) {
      coins.push({ x: startX + i * 32, y: groundY - 14, r: 8.5 });
    }
  } else if (patternType === 1) {
    const arcHeights = [groundY - 18, groundY - 55, groundY - 80, groundY - 55, groundY - 18];
    for (let i = 0; i < arcHeights.length; i++) {
      coins.push({ x: startX + i * 30, y: arcHeights[i], r: 8.5 });
    }
  } else if (patternType === 2) {
    for (let i = 0; i < 4; i++) {
      coins.push({ x: startX + i * 35, y: 200, r: 8.5 });
    }
  }
}

// --- 实体更新与绘制 ---
function handleGameEntities() {
  // 1. 障碍物生成
  obstacleTimer++;
  const minObstacleInterval = Math.max(50, 85 - gameSpeed * 2.0);

  if (obstacleTimer > minObstacleInterval + Math.random() * 35) {
    const rand = Math.random();

    if (rand < 0.15) {
      obstacles.push({ x: canvas.width, y: groundY - 45, w: 28, h: 45, type: 'tree' });
    } else if (rand < 0.30) {
      obstacles.push({ x: canvas.width, y: groundY - 26, w: 18, h: 26, type: 'tree' });
      obstacles.push({ x: canvas.width + 22, y: groundY - 26, w: 18, h: 26, type: 'tree' });
    } else if (rand < 0.45) {
      obstacles.push({ x: canvas.width, y: groundY - 42, w: 26, h: 42, type: 'tree' });
      obstacles.push({ x: canvas.width + 30, y: groundY - 26, w: 18, h: 26, type: 'tree' });
    } else if (rand < 0.60) {
      obstacles.push({ x: canvas.width, y: groundY - 34, w: 26, h: 34, type: 'groundMonster', isEnemy: true });
    } else if (rand < 0.78) {
      obstacles.push({ x: canvas.width, y: 200, w: 30, h: 24, type: 'flyingBat', shootTimer: 0, isEnemy: true });
    } else {
      obstacles.push({ x: canvas.width, y: 215, w: 42, h: 22, type: 'cloud' });
    }

    obstacleTimer = 0;
  }

  // 2. 金币生成
  coinPatternTimer++;
  if (coinPatternTimer > 70 + Math.random() * 40) {
    spawnCoinPattern();
    coinPatternTimer = 0;
  }

  // 3. 处理金币
  for (let i = coins.length - 1; i >= 0; i--) {
    let c = coins[i];
    c.x -= gameSpeed;

    ctx.save();
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(c.x - 2, c.y - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const birdCurrentY = bird.isDucking ? groundY - 18 : bird.y;
    const birdCurrentH = bird.isDucking ? 18 : bird.height;

    if (
      bird.x < c.x + c.r + 4 &&
      bird.x + bird.width > c.x - c.r - 4 &&
      birdCurrentY < c.y + c.r + 4 &&
      birdCurrentY + birdCurrentH > c.y - c.r - 4
    ) {
      coinCount++;
      ammo += 1;
      coins.splice(i, 1);
      continue;
    }

    if (c.x + c.r < 0) coins.splice(i, 1);
  }

  // 4. 处理玩家子弹
  for (let i = playerBullets.length - 1; i >= 0; i--) {
    let pb = playerBullets[i];
    pb.x += pb.vx;

    ctx.save();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(pb.x, pb.y, pb.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    for (let j = obstacles.length - 1; j >= 0; j--) {
      let obs = obstacles[j];
      if (
        pb.x + pb.r > obs.x &&
        pb.x - pb.r < obs.x + obs.w &&
        pb.y + pb.r > obs.y &&
        pb.y - pb.r < obs.y + obs.h
      ) {
        if (obs.isEnemy) killCount++;
        obstacles.splice(j, 1);
        playerBullets.splice(i, 1);
        break;
      }
    }

    if (pb.x > canvas.width) playerBullets.splice(i, 1);
  }

  // 5. 处理障碍物与怪兽
  for (let i = obstacles.length - 1; i >= 0; i--) {
    let obs = obstacles[i];
    obs.x -= gameSpeed;

    if (obs.type === 'tree') {
      drawSingleTree(obs.x, obs.y, obs.w, obs.h);
    } else if (obs.type === 'cloud') {
      drawCloud(obs.x, obs.y, obs.w, obs.h);
    } else if (obs.type === 'groundMonster') {
      drawGroundMonster(obs.x, obs.y, obs.w, obs.h);
    } else if (obs.type === 'flyingBat') {
      drawFlyingBat(obs.x, obs.y, obs.w, obs.h);

      obs.shootTimer = (obs.shootTimer || 0) + 1;
      if (obs.shootTimer > 60) {
        enemyBullets.push({ x: obs.x, y: obs.y + obs.h / 2, vx: gameSpeed + 2.5, r: 4.5 });
        obs.shootTimer = 0;
      }
    }

    const birdCurrentY = bird.isDucking ? groundY - 18 : bird.y;
    const birdCurrentH = bird.isDucking ? 18 : bird.height;

    const isColliding =
      bird.x + 5 < obs.x + obs.w &&
      bird.x + bird.width - 5 > obs.x &&
      birdCurrentY + 3 < obs.y + obs.h &&
      birdCurrentY + birdCurrentH - 2 > obs.y;

    if (isColliding) {
      if (obs.type === 'groundMonster' && bird.velocityY > 0 && bird.y + bird.height - bird.velocityY <= obs.y + 10) {
        bird.velocityY = -10.0;
        killCount++;
        obstacles.splice(i, 1);
        continue;
      }
      gameOver = true;
    }

    if (obs.x + obs.w < 0) obstacles.splice(i, 1);
  }

  // 6. 处理敌方子弹
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    let eb = enemyBullets[i];
    eb.x -= eb.vx;

    ctx.save();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(eb.x, eb.y, eb.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const birdCurrentY = bird.isDucking ? groundY - 18 : bird.y;
    const birdCurrentH = bird.isDucking ? 18 : bird.height;

    if (
      eb.x + eb.r > bird.x + 4 &&
      eb.x - eb.r < bird.x + bird.width - 4 &&
      eb.y + eb.r > birdCurrentY + 2 &&
      eb.y - eb.r < birdCurrentY + birdCurrentH
    ) {
      gameOver = true;
    }

    if (eb.x < 0) enemyBullets.splice(i, 1);
  }
}

// --- 单帧物理更新逻辑 ---
function updateGameStep() {
  distanceScore += gameSpeed * 0.01;
  if (gameSpeed < maxGameSpeed) gameSpeed += 0.0015;

  bird.velocityY += bird.gravity;
  bird.y += bird.velocityY;

  const currentH = bird.isDucking ? 18 : bird.height;
  if (bird.y + currentH >= groundY) {
    bird.y = groundY - currentH;
    bird.velocityY = 0;
    bird.isGrounded = true;
  }
}

// --- 画面渲染逻辑 ---
function renderFrame() {
  if (gameOver) {
    ctx.fillStyle = 'rgba(244, 114, 182, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over! 行驶距离: ' + Math.floor(distanceScore) + 'm', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '16px sans-serif';
    ctx.fillText('金币收益: ' + coinCount + ' | 击杀怪兽: ' + killCount + ' 个', canvas.width / 2, canvas.height / 2 + 15);
    ctx.fillText('按【空格键】重新挑战', canvas.width / 2, canvas.height / 2 + 45);
    return;
  }

  canvas.style.backgroundColor = '#fce7f3';
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 绘制地面
  ctx.fillStyle = '#f472b6';
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(canvas.width, groundY);
  ctx.stroke();

  drawBird(bird.x, bird.y);
  handleGameEntities();

  // 右上角 HUD 栏
  ctx.fillStyle = '#8b5cf6';
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('DIST : ' + String(Math.floor(distanceScore)).padStart(4, '0') + 'm', canvas.width - 20, 25);
  ctx.fillText('COINS: ' + coinCount, canvas.width - 20, 45);

  ctx.fillStyle = '#ef4444';
  ctx.fillText('KILLS: ' + killCount, canvas.width - 20, 65);

  ctx.fillStyle = '#0284c7';
  ctx.fillText('AMMO : ' + ammo + ' [J/F发]', canvas.width - 20, 85);
}

// --- 带 60 FPS 时间平滑的主循环 ---
function animate(timestamp) {
  if (gameOver) {
    renderFrame();
    return;
  }

  if (!lastTime) lastTime = timestamp;
  const deltaTime = timestamp - lastTime;

  // 严格按 16.67ms (60FPS) 步长更新与渲染，防止高刷屏加速
  if (deltaTime >= interval) {
    lastTime = timestamp - (deltaTime % interval);
    updateGameStep();
    renderFrame();
  }

  requestAnimationFrame(animate);
}

resetGame();
