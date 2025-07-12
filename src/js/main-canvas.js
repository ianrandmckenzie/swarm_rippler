// Set up canvas and drawing context
const canvas = document.getElementById('soundCanvas');
const ctx = canvas.getContext('2d');
const dpr = window.devicePixelRatio || 1;
// Preload droplet click sound
const dropletSound = new Audio('./assets/5.mp3');
// Preload small-circle sounds with their direction vectors
const smallCircles = [
  { dirX: 0, dirY: -1, audio: new Audio('./assets/2.mp3') }, // top
  { dirX: 0, dirY: 1,  audio: new Audio('./assets/8.mp3') }, // bottom
  { dirX: -1, dirY: 0, audio: new Audio('./assets/4.mp3') }, // left
  { dirX: 1, dirY: 0,  audio: new Audio('./assets/6.mp3') }, // right
  { dirX: 1/Math.SQRT2, dirY: -1/Math.SQRT2, audio: new Audio('./assets/3.mp3') }, // top-right
  { dirX: -1/Math.SQRT2, dirY: -1/Math.SQRT2, audio: new Audio('./assets/1.mp3') },// top-left
  { dirX: -1/Math.SQRT2, dirY: 1/Math.SQRT2,  audio: new Audio('./assets/7.mp3') },// bottom-left
  { dirX: 1/Math.SQRT2, dirY: 1/Math.SQRT2,   audio: new Audio('./assets/9.mp3') } // bottom-right
];

// Design-space units and full canvas dimensions (6×6 grid of units)
const DESIGN_UNIT = 100;
const BASE_WIDTH = DESIGN_UNIT * 6;
const BASE_HEIGHT = DESIGN_UNIT * 6;

function resizeCanvas() {
  // Size the drawing buffer to the base design dimensions
  const cw = canvas.clientWidth;
  const ch = canvas.clientHeight;
  canvas.width = BASE_WIDTH * dpr;
  canvas.height = BASE_HEIGHT * dpr;
  ctx.resetTransform();
  // Scale design-space to fill canvas responsively, preserving aspect
  const scaleX = cw / BASE_WIDTH;
  const scaleY = ch / BASE_HEIGHT;
  const scale = Math.min(scaleX, scaleY);
  ctx.scale(dpr * scale, dpr * scale);
}

function drawPattern() {
  resizeCanvas();
  const width = DESIGN_UNIT;
  const height = DESIGN_UNIT;
  const cx = width * 3;
  const cy = height * 3;

  // Large center circle radius (40% of smaller dimension)
  const R = Math.min(width, height) * 0.4;
  // Small circles are 40% size of the large circle
  const r = R * 0.40;
  // Spacing between small circles along each direction
  const spacing = R + r + 24;

  // Clear entire design-space buffer
  ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

  // Draw center ring (hollow circle)
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.lineWidth = r;
  ctx.strokeStyle = '#000';
  ctx.stroke();

  // Directions: up, down, left, right, and diagonals
  const dirs = [
    { x: 0, y: -1 }, // up
    { x: 0, y: 1 },  // down
    { x: -1, y: 0 }, // left
    { x: 1, y: 0 },  // right
    { x: 1/Math.SQRT2, y: -1/Math.SQRT2 }, // up-right
    { x: -1/Math.SQRT2, y: -1/Math.SQRT2 },// up-left
    { x: 1/Math.SQRT2, y: 1/Math.SQRT2 },  // down-right
    { x: -1/Math.SQRT2, y: 1/Math.SQRT2 }  // down-left
  ];

  // Draw small solid circles along each direction
  ctx.fillStyle = '#000';
  dirs.forEach(dir => {
    for (let i = 1; i <= 3; i++) {
      const x = cx + dir.x * spacing * i;
      const y = cy + dir.y * spacing * i;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// Ripple animation setup and interactive loop
const ripples = [];
const EXPAND_SPEED = 7;
const FADE_SPEED = 0.032;

// Detect clicks within the center droplet and spawn ripples
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const cw = canvas.clientWidth;
  const ch = canvas.clientHeight;
  const scale = Math.min(cw / BASE_WIDTH, ch / BASE_HEIGHT);
  const x = (e.clientX - rect.left) / scale;
  const y = (e.clientY - rect.top) / scale;
  const cx = DESIGN_UNIT * 3;
  const cy = DESIGN_UNIT * 3;
  const R = Math.min(DESIGN_UNIT, DESIGN_UNIT) * 0.4;
  if ((x - cx) ** 2 + (y - cy) ** 2 <= R * R) {
    ripples.push({ x: cx, y: cy, radius: R, alpha: 1 });
    dropletSound.currentTime = 0;
    dropletSound.play();
    return;
  }
  // Check small circles for click and play corresponding sound
  const rSmall = R * 0.40;
  const spacing = R + rSmall + 24;
  for (const { dirX, dirY, audio } of smallCircles) {
    for (let i = 1; i <= 3; i++) {
      const sx = cx + dirX * spacing * i;
      const sy = cy + dirY * spacing * i;
      if ((x - sx) ** 2 + (y - sy) ** 2 <= rSmall * rSmall) {
        audio.currentTime = 0;
        audio.play();
        return;
      }
    }
  }
});

// Draw and update active ripples
function drawRipples() {
  ripples.forEach((ripple, idx) => {
    ctx.beginPath();
    ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0,0,0,${ripple.alpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ripple.radius += EXPAND_SPEED;
    ripple.alpha -= FADE_SPEED;
    if (ripple.alpha <= 0) ripples.splice(idx, 1);
  });
}

// Animation loop: draw static pattern plus ripples
function animate() {
  drawPattern();
  drawRipples();
  requestAnimationFrame(animate);
}

// Start the main animation loop
animate();
