// Set up canvas and drawing context
const canvas = document.getElementById('soundCanvas');
const ctx = canvas.getContext('2d');
const dpr = window.devicePixelRatio || 1;

// Highlighting system for sequence playback
let highlightedCircles = new Map(); // Changed to Map to store timing info
let highlightAnimations = [];

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
  // Size the drawing buffer to match the canvas display size
  const cw = canvas.clientWidth;
  const ch = canvas.clientHeight;

  // Set canvas buffer size with device pixel ratio for crisp rendering
  canvas.width = cw * dpr;
  canvas.height = ch * dpr;

  ctx.resetTransform();

  // Scale the context to match the display size and account for device pixel ratio
  ctx.scale(dpr, dpr);

  // The artwork should fill the entire canvas, so we use the actual canvas size
  // as our coordinate system instead of the fixed BASE_WIDTH/BASE_HEIGHT
}

function drawPattern() {
  resizeCanvas();

  // Use canvas size as the coordinate system instead of fixed BASE_WIDTH/BASE_HEIGHT
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const cx = width / 2;
  const cy = height / 2;

  // Scale all dimensions relative to canvas size instead of fixed DESIGN_UNIT
  const size = Math.min(width, height);

  // Add a scale factor to make the artwork appropriately sized within the canvas
  const artworkScale = 0.4; // Scale down to 70% of the available space

  // Large center circle radius (scaled appropriately for the canvas)
  const R = size * 0.15 * artworkScale;
  // Small circles are 40% size of the large circle
  const r = R * 0.40;
  // Spacing between small circles along each direction
  const spacing = R + r + (size * 0.12 * artworkScale);

  // Clear entire canvas
  ctx.clearRect(0, 0, width, height);

  // Draw center ring (hollow circle)
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.lineWidth = r;

  // Check if center should be highlighted (using special index -1 for center)
  if (highlightedCircles.has(-1)) {
    const { startTime, duration } = highlightedCircles.get(-1);
    const intensity = getPulseIntensity(startTime, duration);
    if (intensity > 0) {
      const red = Math.floor(255 * intensity);
      const green = Math.floor(107 * intensity);
      const blue = Math.floor(107 * intensity);
      ctx.strokeStyle = `rgb(${red}, ${green}, ${blue})`;
    } else {
      // Theme-aware center ring color when highlight expires
      const effectiveTheme = window.themeManager ? window.themeManager.getEffectiveTheme() : 'light';
      ctx.strokeStyle = effectiveTheme === 'dark' ? '#fff' : '#000';
      highlightedCircles.delete(-1); // Remove expired highlight
    }
  } else {
    // Normal center ring - theme-aware color
    const effectiveTheme = window.themeManager ? window.themeManager.getEffectiveTheme() : 'light';
    ctx.strokeStyle = effectiveTheme === 'dark' ? '#fff' : '#000';
  }
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
  dirs.forEach((dir, dirIndex) => {
    for (let i = 1; i <= 3; i++) {
      const x = cx + dir.x * spacing * i;
      const y = cy + dir.y * spacing * i;

      // Calculate circle index (matching the sequence indexing)
      const circleIndex = dirIndex * 3 + (i - 1);

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);

      // Check if this circle should be highlighted
      if (highlightedCircles.has(circleIndex)) {
        const { startTime, duration } = highlightedCircles.get(circleIndex);
        const intensity = getPulseIntensity(startTime, duration);

        if (intensity > 0) {
          // Create a pulsing red highlight
          const red = Math.floor(255 * intensity);
          const green = Math.floor(107 * intensity);
          const blue = Math.floor(107 * intensity);
          ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
          ctx.fill();

          // Add a white outline for extra visibility
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          // Highlight expired, remove it and draw normal circle
          highlightedCircles.delete(circleIndex);
          // Theme-aware circle color
          const effectiveTheme = window.themeManager ? window.themeManager.getEffectiveTheme() : 'light';
          ctx.fillStyle = effectiveTheme === 'dark' ? '#fff' : '#000';
          ctx.fill();
        }
      } else {
        // Normal circle - theme-aware color
        const effectiveTheme = window.themeManager ? window.themeManager.getEffectiveTheme() : 'light';
        ctx.fillStyle = effectiveTheme === 'dark' ? '#fff' : '#000';
        ctx.fill();
      }
    }
  });
}

// Ripple animation setup and interactive loop
let ripples = [];
const EXPAND_SPEED_RATIO = 0.006; // Proportion of canvas size per frame
const FADE_SPEED = 0.016;

// Detect clicks within the center droplet and spawn ripples
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const cw = canvas.clientWidth;
  const ch = canvas.clientHeight;

  // Convert click coordinates to canvas coordinates
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Center coordinates and sizing based on current canvas size
  const cx = cw / 2;
  const cy = ch / 2;
  const size = Math.min(cw, ch);
  const artworkScale = 0.4; // Same scale factor as drawing
  const R = size * 0.15 * artworkScale;

  // Check center circle click
  if ((x - cx) ** 2 + (y - cy) ** 2 <= R * R) {
    ripples.push({ x: cx, y: cy, radius: R, alpha: 1 });
    dropletSound.currentTime = 0;
    dropletSound.play();
    return;
  }

  // Check small circles for click and play corresponding sound
  const rSmall = R * 0.40;
  const spacing = R + rSmall + (size * 0.12 * artworkScale);

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
  const size = Math.min(canvas.clientWidth, canvas.clientHeight);
  const expandSpeed = size * EXPAND_SPEED_RATIO;

  // Get effective theme for ripple colors
  const effectiveTheme = window.themeManager ? window.themeManager.getEffectiveTheme() : 'light';
  const rippleColor = effectiveTheme === 'dark' ? '255,255,255' : '0,0,0'; // White in dark, black in light

  ripples.forEach((ripple, idx) => {
    ctx.beginPath();
    ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${rippleColor},${ripple.alpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ripple.radius += expandSpeed;
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

// Functions to manage circle highlighting for sequence playback
function highlightCircle(circleIndex, duration = 500) {
  const startTime = Date.now();
  highlightedCircles.set(circleIndex, { startTime, duration });
}

function clearAllHighlights() {
  highlightedCircles.clear();
}

// Export highlighting functions globally for use by audio system
window.canvasHighlight = {
  highlightCircle,
  clearAllHighlights
};

// Function to create a pulsing highlight effect
function getPulseIntensity(startTime, duration) {
  const elapsed = Date.now() - startTime;
  const progress = Math.min(elapsed / duration, 1);

  // Create a pulsing effect using a sine wave
  const pulseSpeed = 4; // How fast the pulse oscillates
  const baseIntensity = Math.max(0, 1 - progress); // Fade out over time
  const pulse = Math.sin(elapsed * pulseSpeed / 100) * 0.3 + 0.7; // Oscillate between 0.4 and 1.0

  return baseIntensity * pulse;
}

// Start the main animation loop
animate();

// Export main canvas variables and functions
export {
  canvas,
  ctx,
  dpr,
  dropletSound,
  smallCircles,
  highlightedCircles,
  highlightAnimations,
  ripples,
  resizeCanvas,
  drawPattern,
  highlightCircle,
  clearAllHighlights,
  getPulseIntensity
};
