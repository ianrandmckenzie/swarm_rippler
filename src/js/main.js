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
const EXPAND_SPEED = 4;
const FADE_SPEED = 0.02;

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

// ------------ Tutorial and Sequence Modal Logic ------------
// IndexedDB setup
const DB_NAME = 'clickRippleDB';
const DB_VERSION = 1;
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings');
      if (!db.objectStoreNames.contains('sequences')) db.createObjectStore('sequences', { autoIncrement: true });
    };
    request.onsuccess = e => resolve(e.target.result);
    request.onerror = e => reject(e.target.error);
  });
}
async function getSetting(key) {
  const db = await openDB();
  return new Promise(res => {
    const tx = db.transaction('settings', 'readonly');
    const req = tx.objectStore('settings').get(key);
    req.onsuccess = () => res(req.result);
    req.onerror = () => res(null);
  });
}
async function setSetting(key, value) {
  const db = await openDB();
  const tx = db.transaction('settings', 'readwrite');
  tx.objectStore('settings').put(value, key);
}
async function saveSequenceToDB(seq) {
  const db = await openDB();
  const tx = db.transaction('sequences', 'readwrite');
  tx.objectStore('sequences').add(seq);
}

// Load all sequences from IndexedDB
async function loadAllSequences() {
  const db = await openDB();
  return new Promise(res => {
    const tx = db.transaction('sequences', 'readonly');
    const req = tx.objectStore('sequences').getAll();
    req.onsuccess = () => res(req.result || []);
    req.onerror = () => res([]);
  });
}

// Tooltip helper
const tooltipEl = document.getElementById('tooltip');
function showTooltip(text, targetEl) {
  const rect = targetEl.getBoundingClientRect();
  tooltipEl.textContent = text;
  tooltipEl.style.left = (rect.left + rect.width/2) + 'px';
  tooltipEl.style.top = (rect.bottom + 8) + 'px';
  tooltipEl.removeAttribute('aria-hidden');
}
function hideTooltip() {
  tooltipEl.setAttribute('aria-hidden', 'true');
}

// Modal elements
const createBtn = document.getElementById('createSequenceBtn');
const modal = document.getElementById('sequenceModal');
const modalCanvas = document.getElementById('sequenceCanvas');
const modalCtx = modalCanvas.getContext('2d');
// Ensure modal canvas buffer matches its CSS size
function resizeModalCanvas() {
  const cw = modalCanvas.clientWidth;
  const ch = modalCanvas.clientHeight;
  modalCanvas.width = cw * dpr;
  modalCanvas.height = ch * dpr;
  modalCtx.resetTransform();
  modalCtx.scale(dpr, dpr);
}
const testBtn = document.getElementById('testSequenceBtn');
const saveBtn = document.getElementById('saveSequenceBtn');
let modalCircles = [];
// Prepare tutorial state
getSetting('tutorialSeen').then(seen => {
  if (!seen) {
    document.body.classList.add('modal-open');
    createBtn.classList.add('highlight-once');
    showTooltip('Start playing by clicking here!', createBtn);
  }
});

// Open modal
createBtn.addEventListener('click', async () => {
  hideTooltip();
  createBtn.classList.remove('highlight-once');
  document.body.classList.remove('modal-open');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  modal.setAttribute('aria-hidden', 'false');
  // initialize modal circles using the same coordinate system as drawModal
  const w = modalCanvas.clientWidth;
  const h = modalCanvas.clientHeight;
  const S = Math.min(w, h);
  const offsetX = (w - S) / 2;
  const offsetY = (h - S) / 2;
  const cx = S / 2;
  const cy = S / 2;
  const R = S * 0.12; // Match the drawing function - much smaller
  const r = R * 0.6;
  const spacing = R + r * 0.8;
  modalCircles = smallCircles.map(({dirX, dirY, audio}) => ({dirX, dirY, audio})).flatMap(d => {
    return [1,2,3].map(i => ({
      x: offsetX + cx + d.dirX*spacing*i,
      y: offsetY + cy + d.dirY*spacing*i,
      r,
      audio: d.audio,
      clicked: false
    }));
  });
  drawModal();
});

function drawModal() {
  // Resize buffer then clear and compute square region
  resizeModalCanvas();
  const w = modalCanvas.clientWidth;
  const h = modalCanvas.clientHeight;
  const S = Math.min(250, 250);
  // clear full buffer
  modalCtx.clearRect(0, 0, w, h);
  // center square drawing area
  modalCtx.save();
  const offsetX = (w - S) / 2;
  const offsetY = (h - S) / 2;
  modalCtx.translate(offsetX, offsetY);
  // centered square side S
  const cx = S / 2;
  const cy = S / 2;
  // Draw solid center circle - much smaller to fit nicely in modal
  const R = S * 0.12; // Much smaller center circle (was 0.25)
  modalCtx.beginPath();
  modalCtx.arc(cx, cy, R, 0, 2 * Math.PI);
  modalCtx.fillStyle = '#000';
  modalCtx.fill();
  // Draw small circles (rings or filled) matching main pattern
  const r = R * 0.3; // Slightly larger relative to center for visibility
  const spacing = R + r * 2; // Very tight spacing
  const dirs = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 1/Math.SQRT2, y: -1/Math.SQRT2 },
    { x: -1/Math.SQRT2, y: -1/Math.SQRT2 },
    { x: 1/Math.SQRT2, y: 1/Math.SQRT2 },
    { x: -1/Math.SQRT2, y: 1/Math.SQRT2 }
  ];
  dirs.forEach((dir, di) => {
    for (let i = 1; i <= 3; i++) {
      const x = cx + dir.x * spacing * i;
      const y = cy + dir.y * spacing * i;
      modalCtx.beginPath();
      modalCtx.arc(x, y, r, 0, 2 * Math.PI);
      const clicked = modalCircles[di * 3 + (i - 1)]?.clicked;
      if (clicked) {
        modalCtx.fill();
      } else {
        modalCtx.lineWidth = 2;
        modalCtx.stroke();
      }
    }
  });
  // restore transform
  modalCtx.restore();
}

// Modal canvas clicks
modalCanvas.addEventListener('click', async e => {
  const rect = modalCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  for (const c of modalCircles) {
    if (!c.clicked && (x-c.x)**2+(y-c.y)**2 <= c.r*c.r) {
      c.clicked = true;
      c.audio.currentTime=0; c.audio.play();
      testBtn.disabled = false;
      if (!await getSetting('tutorialSeen')) {
        testBtn.classList.add('highlight-once');
        showTooltip('Test what your click-sound sequence will sound like before saving!', testBtn);
        await setSetting('tutorialSeen', true);
      }
      drawModal();
      return;
    }
  }
});

// Test sequence
testBtn.addEventListener('click', e => {
  hideTooltip();
  testBtn.classList.remove('highlight-once');
  alert('Sequence test placeholder');
  saveBtn.disabled = false;
});

// Sequence thumbnails bar append
async function addSequenceThumbnail(seq) {
  const bar = document.getElementById('sequenceBar');
  const size = 40;
  const thumb = document.createElement('canvas');
  thumb.width = size * dpr;
  thumb.height = size * dpr;
  thumb.style.width = size + 'px';
  thumb.style.height = size + 'px';
  const tctx = thumb.getContext('2d');
  tctx.scale(dpr, dpr);

  // Use even smaller proportions and add margin to ensure everything fits
  const margin = 3; // Leave 3px margin on all sides
  const usableSize = size - (margin * 2);
  const cx = size / 2;
  const cy = size / 2;
  const R = usableSize * 0.2; // Much smaller center circle
  const r = R * 0.5; // Much smaller outer circles
  const spacing = R + r * 0.8; // Very tight spacing  // center ring
  tctx.beginPath();
  tctx.arc(cx, cy, R, 0, 2 * Math.PI);
  tctx.lineWidth = r * 0.3; // Much thinner line
  tctx.strokeStyle = '#000';
  tctx.stroke();

  // small circles by direction - only show closest ring to fit in thumbnail
  smallCircles.forEach(({dirX, dirY, audio}) => {
    const fill = seq.includes(audio.src);
    const x = cx + dirX * spacing;
    const y = cy + dirY * spacing;
    // Only draw if circle would be within bounds
    if (x - r >= margin && x + r <= size - margin &&
        y - r >= margin && y + r <= size - margin) {
      tctx.beginPath();
      tctx.arc(x, y, r, 0, 2 * Math.PI);
      tctx.fillStyle = '#000';
      tctx.strokeStyle = '#000';
      tctx.lineWidth = 0.5;
      if (fill) tctx.fill(); else tctx.stroke();
    }
  });
  bar.appendChild(thumb);
}

// Save sequence and close modal
saveBtn.addEventListener('click', async () => {
  const seq = modalCircles.filter(c => c.clicked).map(c => c.audio.src);
  await saveSequenceToDB(seq);
  addSequenceThumbnail(seq);
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  modal.setAttribute('aria-hidden','true');
});

// Populate sequence bar on initial load
loadAllSequences().then(seqs => {
  seqs.forEach(seq => addSequenceThumbnail(seq));
});
