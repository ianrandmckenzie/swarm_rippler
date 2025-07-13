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
const tutorialCounter = document.getElementById('tutorialCounter');
const targetCountEl = document.getElementById('targetCount');
const selectedCountEl = document.getElementById('selectedCount');

let modalCircles = [];
let tutorialMode = false;
const TUTORIAL_TARGET_COUNT = 5;

// Prepare tutorial state
async function checkAndShowTutorial() {
  try {
    const tutorialSeen = await getSetting('tutorialSeen');
    const savedSequences = await loadAllSequences();

    // Show tutorial if never seen AND no sequences exist
    if (!tutorialSeen && savedSequences.length === 0) {
      document.body.classList.add('tutorial-active');
      createBtn.classList.add('highlight-once');
      showTooltip('Start playing by clicking New Sequence!', createBtn, 0);
    }
  } catch (error) {
    console.log('Could not check tutorial state:', error);
  }
}

// Initialize tutorial check after a brief delay to ensure all dependencies are loaded
setTimeout(checkAndShowTutorial, 100);

// Open modal
createBtn.addEventListener('click', async () => {
  hideTooltip();
  createBtn.classList.remove('highlight-once');
  document.body.classList.remove('tutorial-active');

  // Check if this is a first-time user for tutorial mode
  const tutorialSeen = await getSetting('tutorialSeen');
  tutorialMode = !tutorialSeen;

  if (tutorialMode) {
    tutorialCounter.classList.remove('hidden');
    targetCountEl.textContent = TUTORIAL_TARGET_COUNT;
    selectedCountEl.textContent = '0';
    // Initial tutorial tooltip will be set by updateTutorialUI after modal setup
  } else {
    tutorialCounter.classList.add('hidden');
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  modal.setAttribute('aria-hidden', 'false');
  // initialize modal circles using the same coordinate system as drawModal
  const w = modalCanvas.clientWidth;
  const h = modalCanvas.clientHeight;
  const S = 250; // Fixed size used in drawing
  const offsetX = (w - S) / 2;
  const offsetY = (h - S) / 2;
  const cx = S / 2;
  const cy = S / 2;
  const R = S * 0.12; // Match the drawing function
  const r = R * 0.3; // Match the drawing function
  const spacing = R + r * 2; // Match the drawing function

  // Use same order as drawing and click detection
  const dirs = [
    { x: 0, y: -1 },     // top
    { x: 0, y: 1 },      // bottom
    { x: -1, y: 0 },     // left
    { x: 1, y: 0 },      // right
    { x: 1/Math.SQRT2, y: -1/Math.SQRT2 },   // top-right
    { x: -1/Math.SQRT2, y: -1/Math.SQRT2 },  // top-left
    { x: 1/Math.SQRT2, y: 1/Math.SQRT2 },    // bottom-right
    { x: -1/Math.SQRT2, y: 1/Math.SQRT2 }    // bottom-left
  ];

  modalCircles = [];
  dirs.forEach((dir, di) => {
    // Map the dirs array index to the correct smallCircles index
    // dirs: [top, bottom, left, right, top-right, top-left, bottom-right, bottom-left]
    // smallCircles: [top, bottom, left, right, top-right, top-left, bottom-left, bottom-right]
    const smallCirclesMapping = [0, 1, 2, 3, 4, 5, 7, 6]; // Fix the swap
    const audio = smallCircles[smallCirclesMapping[di]].audio;

    for (let i = 1; i <= 3; i++) {
      modalCircles.push({
        x: offsetX + cx + dir.x * spacing * i,
        y: offsetY + cy + dir.y * spacing * i,
        r,
        audio,
        clicked: false
      });
    }
  });
  drawModal();

  // Initialize tutorial UI if in tutorial mode
  if (tutorialMode) {
    updateTutorialUI();
  }
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
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  // Transform click coordinates to match the drawing coordinate system
  const w = modalCanvas.clientWidth;
  const h = modalCanvas.clientHeight;
  const S = 250; // Fixed size used in drawing
  const offsetX = (w - S) / 2;
  const offsetY = (h - S) / 2;

  // Translate click coordinates to the drawing space
  const x = clickX - offsetX;
  const y = clickY - offsetY;

  // Drawing parameters (match drawModal exactly)
  const cx = S / 2;
  const cy = S / 2;
  const R = S * 0.12;
  const r = R * 0.3;
  const spacing = R + r * 2;

  // Check each direction and ring position directly
  const dirs = [
    { x: 0, y: -1 },     // top
    { x: 0, y: 1 },      // bottom
    { x: -1, y: 0 },     // left
    { x: 1, y: 0 },      // right
    { x: 1/Math.SQRT2, y: -1/Math.SQRT2 },   // top-right
    { x: -1/Math.SQRT2, y: -1/Math.SQRT2 },  // top-left
    { x: 1/Math.SQRT2, y: 1/Math.SQRT2 },    // bottom-right
    { x: -1/Math.SQRT2, y: 1/Math.SQRT2 }    // bottom-left
  ];

  dirs.forEach((dir, di) => {
    for (let i = 1; i <= 3; i++) {
      const circleX = cx + dir.x * spacing * i;
      const circleY = cy + dir.y * spacing * i;
      const circleIndex = di * 3 + (i - 1);
      const circle = modalCircles[circleIndex];

      if (circle && !circle.clicked && (x - circleX)**2 + (y - circleY)**2 <= r*r) {
        circle.clicked = true;
        circle.audio.currentTime = 0;
        circle.audio.play();

        // Update tutorial counter and progression
        if (tutorialMode) {
          updateTutorialUI();
        } else {
          // Non-tutorial mode - enable test button after any selection
          testBtn.disabled = false;
        }

        drawModal();
        return;
      }
    }
  });
});

// Helper function to update tutorial UI
function updateTutorialUI() {
  if (!tutorialMode) return;

  const selectedCount = modalCircles.filter(c => c.clicked).length;
  selectedCountEl.textContent = selectedCount;

  // Update progress messaging
  if (selectedCount === 0) {
    showTooltip('Click the empty circles to form your sequence', modalCanvas, 340);
  } else if (selectedCount < TUTORIAL_TARGET_COUNT) {
    const remaining = TUTORIAL_TARGET_COUNT - selectedCount;
    showTooltip(`Select ${remaining} more circle${remaining === 1 ? '' : 's'}`, modalCanvas);
  } else if (selectedCount === TUTORIAL_TARGET_COUNT) {
    hideTooltip();
    testBtn.disabled = false;
    testBtn.classList.add('highlight-once');
    console.log('🎯 Tutorial: Added highlight-once class to test button');
    showTooltip('Click Test to hear what your sequence sounds like!', testBtn);
  }
}

// Test sequence
testBtn.addEventListener('click', async e => {
  hideTooltip();
  testBtn.classList.remove('highlight-once');
  // Get the current sequence of clicked circles
  const sequence = modalCircles.map((c, index) => c.clicked ? index : null).filter(i => i !== null);

  if (sequence.length > 0) {
    try {
      // Use the audioSystem playback function
      if (window.audioSystem && window.audioSystem.playSequence) {
        await window.audioSystem.playSequence(sequence);
      } else {
        console.warn('Audio system not available, falling back to basic feedback');
      }

      // Enable save button after testing
      saveBtn.disabled = false;

      // Complete tutorial if in tutorial mode
      if (tutorialMode) {
        await setSetting('tutorialSeen', true);
        tutorialMode = false;
      }
    } catch (error) {
      console.error('Error playing test sequence:', error);
      // Fallback to just enabling save button
      saveBtn.disabled = false;
    }
  }
});


// Save sequence and close modal
saveBtn.addEventListener('click', async () => {
  // Save indices of clicked circles instead of audio sources
  const seq = modalCircles.map((c, index) => c.clicked ? index : null).filter(i => i !== null);
  await saveSequenceToDB(seq);
  addSequenceThumbnail(seq);

  // Complete tutorial if in tutorial mode
  if (tutorialMode) {
    await setSetting('tutorialSeen', true);
  }

  closeModal();
});

// Close modal functionality
function closeModal() {
  hideTooltip();
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  modal.setAttribute('aria-hidden', 'true');

  // Reset modal state
  modalCircles.forEach(circle => circle.clicked = false);
  testBtn.disabled = true;
  testBtn.classList.remove('highlight-once');
  saveBtn.disabled = true;
  tutorialCounter.classList.add('hidden');
  tutorialMode = false;

  drawModal();
}

// Close button event listener
const closeBtn = document.getElementById('closeModalBtn');
closeBtn.addEventListener('click', closeModal);

// Close modal when clicking on overlay (but not on modal content)
modal.addEventListener('click', (e) => {
  // Only close if clicking on the modal backdrop, not the content
  if (e.target === modal) {
    closeModal();
  }
});

// Prevent modal content clicks from bubbling up to the overlay
const modalContent = document.getElementById('modalContent');
modalContent.addEventListener('click', (e) => {
  e.stopPropagation();
});

// ESC key to close modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
    closeModal();
  }
});
