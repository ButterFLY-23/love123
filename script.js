const canvas = document.getElementById("scene");

const ctx = canvas.getContext("2d");

const countValue = document.getElementById("countValue");

const statusText = document.getElementById("statusText");

const revealBtn = document.getElementById("revealBtn");

const message = document.getElementById("message");

const againBtn = document.getElementById("againBtn");
const bgMusic = document.getElementById("bgMusic");
const musicToggle = document.getElementById("musicToggle");



const targetCount = 14;

const hearts = [];

const sparkles = [];

const keys = { left: false, right: false };

const collector = {

  x: 0,

  y: 0,

  width: 100,

  height: 40,

  speed: 420

};



const colors = ["#ff4d6d", "#ff758f", "#ff9f9f", "#ff6b6b", "#ffd166"];

const collectorSprite = new Image();

let collectorSpriteReady = false;

const spriteScaleFactor = 4.8;



collectorSprite.addEventListener("load", () => {

  collectorSpriteReady = true;

});

collectorSprite.src = "girl.png";



let width = 0;

let height = 0;

let lastTime = 0;

let lastSpawn = 0;

let pointerX = null;

let collected = 0;

let ready = false;

let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let musicIsPlaying = false;
let musicAutoEnabled = true;



function clamp(value, min, max) {

  return Math.min(Math.max(value, min), max);

}



function roundedRect(ctx, x, y, w, h, r) {

  const radius = Math.min(r, w / 2, h / 2);

  ctx.beginPath();

  ctx.moveTo(x + radius, y);

  ctx.arcTo(x + w, y, x + w, y + h, radius);

  ctx.arcTo(x + w, y + h, x, y + h, radius);

  ctx.arcTo(x, y + h, x, y, radius);

  ctx.arcTo(x, y, x + w, y, radius);

  ctx.closePath();

}



function drawHeart(x, y, size, color, rotation) {

  ctx.save();

  ctx.translate(x, y);

  ctx.rotate(rotation);

  ctx.fillStyle = color;

  ctx.beginPath();

  const top = size * -0.25;

  ctx.moveTo(0, top);

  ctx.bezierCurveTo(size * 0.5, top - size * 0.4, size, top + size * 0.3, 0, size);

  ctx.bezierCurveTo(-size, top + size * 0.3, -size * 0.5, top - size * 0.4, 0, top);

  ctx.closePath();

  ctx.fill();

  ctx.restore();

}



function setMusicState(isOn) {
  if (!musicToggle) {
    return;
  }
  musicToggle.textContent = isOn ? "Музыка: вкл" : "Музыка: выкл";
  musicToggle.setAttribute("aria-pressed", String(isOn));
}

function startMusic() {
  if (!bgMusic || musicIsPlaying) {
    return;
  }
  bgMusic.volume = 0.35;
  const playPromise = bgMusic.play();
  if (playPromise && typeof playPromise.then === "function") {
    playPromise
      .then(() => {
        musicIsPlaying = true;
        setMusicState(true);
      })
      .catch(() => {
        musicIsPlaying = false;
        setMusicState(false);
      });
  } else {
    musicIsPlaying = true;
    setMusicState(true);
  }
}

function tryStartMusic() {
  if (!musicAutoEnabled) {
    return;
  }
  startMusic();
}

function resize() {

  const rect = canvas.getBoundingClientRect();

  width = rect.width;

  height = rect.height;

  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.round(width * dpr);

  canvas.height = Math.round(height * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);



  collector.width = Math.max(90, width * 0.14);

  collector.height = Math.max(36, width * 0.055);

  collector.y = height - 70;

  if (!collector.x) {

    collector.x = width / 2;

  }

}



function spawnHeart() {

  const size = Math.random() * 12 + 16;

  hearts.push({

    x: Math.random() * width,

    y: -size - 20,

    size,

    speed: Math.random() * 70 + 90,

    drift: (Math.random() - 0.5) * 40,

    rotation: Math.random() * Math.PI,

    rotationSpeed: (Math.random() - 0.5) * 1.2,

    color: colors[Math.floor(Math.random() * colors.length)]

  });

}



function addSparkles(x, y, color) {

  const count = 6;

  for (let i = 0; i < count; i += 1) {

    sparkles.push({

      x,

      y,

      size: Math.random() * 5 + 4,

      vx: (Math.random() - 0.5) * 140,

      vy: -Math.random() * 120 - 40,

      life: 1,

      color

    });

  }

}



function updateCollector(dt) {

  if (pointerX !== null) {

    collector.x += (pointerX - collector.x) * 0.18;

  } else {

    let direction = 0;

    if (keys.left) direction -= 1;

    if (keys.right) direction += 1;

    collector.x += direction * collector.speed * dt;

  }



  const margin = getCollectorHalfWidth() + 6;

  collector.x = clamp(collector.x, margin, width - margin);

}



function getSpriteMetrics() {

  if (!collectorSpriteReady) {

    return null;

  }

  const targetHeight = collector.height * spriteScaleFactor;

  const scale = targetHeight / collectorSprite.height;

  const drawW = collectorSprite.width * scale;

  const drawH = collectorSprite.height * scale;

  const groundY = collector.y + collector.height * 0.6;

  return { drawW, drawH, groundY };

}



function getCollectorBounds() {

  const metrics = getSpriteMetrics();

  if (metrics) {

    const insetX = metrics.drawW * 0.12;

    const insetY = metrics.drawH * 0.08;

    return {

      left: collector.x - metrics.drawW / 2 + insetX,

      right: collector.x + metrics.drawW / 2 - insetX,

      top: metrics.groundY - metrics.drawH + insetY,

      bottom: metrics.groundY - insetY

    };

  }



  return {

    left: collector.x - collector.width * 0.35,

    right: collector.x + collector.width * 0.35,

    top: collector.y - collector.height * 0.8,

    bottom: collector.y + collector.height * 0.2

  };

}



function getCollectorHalfWidth() {

  const metrics = getSpriteMetrics();

  if (metrics) {

    return Math.max(metrics.drawW * 0.5, collector.width * 0.5);

  }

  return collector.width * 0.5;

}



function updateHearts(dt) {

  for (let i = hearts.length - 1; i >= 0; i -= 1) {

    const heart = hearts[i];

    heart.y += heart.speed * dt;

    heart.x += heart.drift * dt;

    heart.rotation += heart.rotationSpeed * dt;



    const bounds = getCollectorBounds();

    const hitX = heart.x > bounds.left - heart.size * 0.2 && heart.x < bounds.right + heart.size * 0.2;

    const hitY = heart.y > bounds.top - heart.size * 0.2 && heart.y < bounds.bottom + heart.size * 0.2;



    if (hitX && hitY && !ready) {

      hearts.splice(i, 1);

      collected += 1;

      countValue.textContent = String(collected);

      addSparkles(heart.x, heart.y, heart.color);



      if (collected >= targetCount) {

        ready = true;

        statusText.textContent = "Сердечки собраны. Нажми кнопку!";

        revealBtn.hidden = false;

      }

      continue;

    }



    if (heart.y - heart.size > height + 40) {

      hearts.splice(i, 1);

    }

  }

}



function updateSparkles(dt) {

  for (let i = sparkles.length - 1; i >= 0; i -= 1) {

    const spark = sparkles[i];

    spark.vy += 240 * dt;

    spark.x += spark.vx * dt;

    spark.y += spark.vy * dt;

    spark.life -= dt * 1.8;

    if (spark.life <= 0) {

      sparkles.splice(i, 1);

    }

  }

}



function drawGround() {

  const groundY = collector.y + collector.height * 0.6;

  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";

  ctx.fillRect(0, groundY, width, height - groundY);

  ctx.strokeStyle = "rgba(50, 31, 39, 0.15)";

  ctx.lineWidth = 2;

  ctx.beginPath();

  ctx.moveTo(0, groundY);

  ctx.lineTo(width, groundY);

  ctx.stroke();

}



function drawCollector() {

  const x = collector.x;

  const y = collector.y;

  const bodyW = collector.width * 0.6;

  const bodyH = collector.height * 1.15;

  const headR = collector.width * 0.18;

  const groundY = y + collector.height * 0.6;



  // Shadow

  ctx.fillStyle = "rgba(50, 20, 30, 0.12)";

  ctx.beginPath();

  ctx.ellipse(x, groundY, collector.width * 0.52, collector.height * 0.26, 0, 0, Math.PI * 2);

  ctx.fill();



  const metrics = getSpriteMetrics();
  if (metrics) {
    ctx.drawImage(
      collectorSprite,
      x - metrics.drawW / 2,
      metrics.groundY - metrics.drawH,
      metrics.drawW,
      metrics.drawH
    );
    return;
  }


  // Skirt

  ctx.fillStyle = "#ff6b8a";

  ctx.beginPath();

  ctx.moveTo(x - bodyW * 0.7, y - bodyH * 0.05);

  ctx.lineTo(x + bodyW * 0.7, y - bodyH * 0.05);

  ctx.lineTo(x + bodyW * 0.45, y + bodyH * 0.55);

  ctx.lineTo(x - bodyW * 0.45, y + bodyH * 0.55);

  ctx.closePath();

  ctx.fill();



  // Dress bodice

  ctx.fillStyle = "#ff3b5f";

  roundedRect(ctx, x - bodyW * 0.48, y - bodyH, bodyW * 0.96, bodyH * 0.75, 14);

  ctx.fill();



  // Neck

  ctx.fillStyle = "#ffd6c7";

  roundedRect(ctx, x - headR * 0.45, y - bodyH - headR * 0.1, headR * 0.9, headR * 0.6, 6);

  ctx.fill();



  // Hair (back)

  ctx.fillStyle = "#3d1a22";

  ctx.beginPath();

  ctx.ellipse(x, y - bodyH - headR * 0.15, headR * 1.08, headR * 1.2, 0, 0, Math.PI * 2);

  ctx.fill();



  // Face

  ctx.fillStyle = "#ffd6c7";

  ctx.beginPath();

  ctx.arc(x, y - bodyH - headR * 0.2, headR * 0.9, 0, Math.PI * 2);

  ctx.fill();



  // Hair (front bangs)

  ctx.fillStyle = "#4a1c26";

  ctx.beginPath();

  ctx.moveTo(x - headR * 0.9, y - bodyH - headR * 0.1);

  ctx.quadraticCurveTo(x - headR * 0.4, y - bodyH - headR * 1.1, x + headR * 0.2, y - bodyH - headR * 0.6);

  ctx.quadraticCurveTo(x + headR * 0.9, y - bodyH - headR * 0.2, x + headR * 0.6, y - bodyH + headR * 0.2);

  ctx.quadraticCurveTo(x, y - bodyH + headR * 0.5, x - headR * 0.9, y - bodyH - headR * 0.1);

  ctx.fill();



  // Heart detail

  drawHeart(x, y - bodyH * 0.5, collector.width * 0.12, "#ffd1dc", 0);

}



function draw() {

  ctx.clearRect(0, 0, width, height);

  drawGround();



  hearts.forEach((heart) => {

    drawHeart(heart.x, heart.y, heart.size, heart.color, heart.rotation);

  });



  sparkles.forEach((spark) => {

    ctx.globalAlpha = Math.max(spark.life, 0);

    drawHeart(spark.x, spark.y, spark.size, spark.color, 0);

    ctx.globalAlpha = 1;

  });



  drawCollector();

}



function loop(timestamp) {

  const now = timestamp / 1000;

  const dt = Math.min(now - lastTime, 0.033);

  lastTime = now;



  updateCollector(dt);



  if (!ready) {

    const spawnRate = reducedMotion ? 0.9 : 0.55;

    if (now - lastSpawn > spawnRate) {

      spawnHeart();

      lastSpawn = now;

    }

  }



  updateHearts(dt);

  updateSparkles(dt);

  draw();



  requestAnimationFrame(loop);

}



function resetGame() {

  collected = 0;

  ready = false;

  hearts.length = 0;

  sparkles.length = 0;

  countValue.textContent = "0";

  statusText.textContent = "Лови сердечки, пока они не коснулись земли.";

  revealBtn.hidden = true;

  message.hidden = true;

}



if (musicToggle) {
  setMusicState(false);
  musicToggle.addEventListener("click", () => {
    if (!bgMusic) {
      return;
    }
    if (bgMusic.paused) {
      musicAutoEnabled = true;
      startMusic();
    } else {
      bgMusic.pause();
      musicIsPlaying = false;
      musicAutoEnabled = false;
      setMusicState(false);
    }
  });
}

window.addEventListener("pointerdown", tryStartMusic, { passive: true });
window.addEventListener("keydown", tryStartMusic);

window.addEventListener("resize", resize);



function setPointer(event) {

  const rect = canvas.getBoundingClientRect();

  pointerX = event.clientX - rect.left;

}



canvas.addEventListener("pointermove", (event) => {

  setPointer(event);

});



canvas.addEventListener("pointerdown", (event) => {

  setPointer(event);

  if (canvas.setPointerCapture) {

    canvas.setPointerCapture(event.pointerId);

  }

});



canvas.addEventListener("pointerup", () => {

  pointerX = null;

});



canvas.addEventListener("pointercancel", () => {

  pointerX = null;

});



canvas.addEventListener("pointerleave", () => {

  pointerX = null;

});



window.addEventListener("keydown", (event) => {

  if (event.key === "ArrowLeft") keys.left = true;

  if (event.key === "ArrowRight") keys.right = true;

});



window.addEventListener("keyup", (event) => {

  if (event.key === "ArrowLeft") keys.left = false;

  if (event.key === "ArrowRight") keys.right = false;

});



revealBtn.addEventListener("click", () => {

  message.hidden = false;

});



againBtn.addEventListener("click", () => {

  resetGame();

});



resize();

requestAnimationFrame((timestamp) => {

  lastTime = timestamp / 1000;

  requestAnimationFrame(loop);

});

