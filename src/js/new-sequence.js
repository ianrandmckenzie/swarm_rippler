// Modal and sequence creation functionality
import { getSetting, setSetting, loadAllSequences, saveSequenceToDB, updateSequence } from './storage.js';
import { addSequenceThumbnail } from './main.js';
import { smallCircles, dpr } from './main-canvas.js'

// Modal elements
const createBtn = document.getElementById('createSequenceBtn');
const modal = document.getElementById('sequenceModal');
const modalCanvas = document.getElementById('sequenceCanvas');
const modalCtx = modalCanvas.getContext('2d');
const modalTitle = document.getElementById('modalTitle');

// Modal highlighting and animation system
let modalHighlightedCircles = new Map();
let modalRipples = [];
const MODAL_EXPAND_SPEED = 4;
const MODAL_FADE_SPEED = 0.04;

// Modal manager class to handle create and edit modes
class ModalManager {
  constructor() {
    this.isEditMode = false;
    this.editingThumbnail = null;
    this.originalSequenceData = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Create new sequence button
    createBtn.addEventListener('click', () => {
      this.openCreateMode();
    });
  }

  async openCreateMode() {
    hideTooltip();
    createBtn.classList.remove('highlight-once');
    document.body.classList.remove('tutorial-active');

    this.isEditMode = false;
    this.editingThumbnail = null;
    this.originalSequenceData = null;

    modalTitle.textContent = 'Create New Sequence';

    // Check if this is a first-time user for tutorial mode
    const tutorialSeen = await getSetting('tutorialSeen');
    tutorialMode = !tutorialSeen;

    if (tutorialMode) {
      tutorialCounter.classList.remove('hidden');
      targetCountEl.textContent = TUTORIAL_TARGET_COUNT;
      selectedCountEl.textContent = '0';
    } else {
      tutorialCounter.classList.add('hidden');
    }

    // Reset modal state
    this.resetModalState();

    // Open modal
    this.showModal();
  }  openEditMode(sequenceData, thumbnail) {
    this.isEditMode = true;
    this.editingThumbnail = thumbnail;
    this.originalSequenceData = JSON.parse(JSON.stringify(sequenceData)); // Deep copy

    modalTitle.textContent = 'Edit Sequence';

    // Hide tutorial in edit mode
    tutorialMode = false;
    tutorialCounter.classList.add('hidden');

    // Reset modal state first
    this.resetModalState();

    // Open modal and initialize circles
    this.showModal();

    // THEN load sequence data after circles are initialized
    this.loadSequenceIntoModal(sequenceData);

    // Redraw and update buttons
    drawModal();
    updateButtonStates();
  }

  resetModalState() {
    // Clear selected circles
    modalCircles.forEach(circle => {
      circle.clicked = false;
    });

    // Reset loop controls
    loopToggle.checked = false;
    loopInterval.value = 3;
    loopIntervalControls.style.opacity = '0.5';
    loopInterval.disabled = true;

    // Clear highlights and ripples
    modalHighlightedCircles.clear();
    modalRipples.length = 0;

    // Hide inline instruction by default
    const modalInstruction = document.getElementById('modalInstruction');
    if (modalInstruction) {
      modalInstruction.classList.add('hidden');
    }
  }

  loadSequenceIntoModal(sequenceData) {
    const seq = Array.isArray(sequenceData) ? sequenceData :
                (sequenceData.seq || sequenceData.sequence || []);
    const isLoop = sequenceData.isLoop || false;
    const loopIntervalValue = sequenceData.loopInterval || 3;

    // Set loop controls
    loopToggle.checked = isLoop;
    loopInterval.value = loopIntervalValue;

    if (isLoop) {
      loopIntervalControls.style.opacity = '1';
      loopInterval.disabled = false;
    }

    // Mark circles as clicked based on sequence
    seq.forEach(circleIndex => {
      if (modalCircles[circleIndex]) {
        modalCircles[circleIndex].clicked = true;
      }
    });
  }

  showModal() {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.setAttribute('aria-hidden', 'false');

    // Initialize modal circles
    this.initializeModalCircles();

    drawModal();
    animateModal();

    if (tutorialMode) {
      updateTutorialUI();
    }

    updateButtonStates();
  }

  initializeModalCircles() {
    const w = modalCanvas.clientWidth;
    const h = modalCanvas.clientHeight;
    const S = 250; // Fixed size used in drawing
    const offsetX = (w - S) / 2;
    const offsetY = (h - S) / 2;
    const cx = S / 2;
    const cy = S / 2;
    const R = S * 0.09; // Match the drawing function
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
  }
}

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

// Loop controls
const loopToggle = document.getElementById('loopToggle');
const loopInterval = document.getElementById('loopInterval');
const loopIntervalControls = document.getElementById('loopIntervalControls');

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
      showTooltip('Start playing by clicking New Sequence!', createBtn);
    }
  } catch (error) {
    console.log('Could not check tutorial state:', error);
  }
}

// Initialize tutorial check after a brief delay to ensure all dependencies are loaded
setTimeout(checkAndShowTutorial, 100);

// Create modal manager instance
const modalManager = new ModalManager();

// Export modal manager for use by context menu
window.modalManager = modalManager;

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

  // Draw ripples first (behind everything)
  drawModalRipples(cx, cy, offsetX, offsetY);

  // Draw solid center circle - much smaller to fit nicely in modal
  const R = S * 0.09; // Much smaller center circle (was 0.25)
  modalCtx.beginPath();
  modalCtx.arc(cx, cy, R, 0, 2 * Math.PI);

  // Check if center should be highlighted (using special index -1 for center)
  if (modalHighlightedCircles.has(-1)) {
    const { startTime, duration } = modalHighlightedCircles.get(-1);
    const intensity = getModalPulseIntensity(startTime, duration);
    if (intensity > 0) {
      const red = Math.floor(255 * intensity);
      const green = Math.floor(107 * intensity);
      const blue = Math.floor(107 * intensity);
      modalCtx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
    } else {
      // Theme-aware center circle color
      const effectiveTheme = window.themeManager ? window.themeManager.getEffectiveTheme() : 'light';
      modalCtx.fillStyle = effectiveTheme === 'dark' ? '#fff' : '#000';
      modalHighlightedCircles.delete(-1); // Remove expired highlight
    }
  } else {
    // Theme-aware center circle color
    const effectiveTheme = window.themeManager ? window.themeManager.getEffectiveTheme() : 'light';
    modalCtx.fillStyle = effectiveTheme === 'dark' ? '#fff' : '#000';
  }
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
      const circleIndex = di * 3 + (i - 1);

      modalCtx.beginPath();
      modalCtx.arc(x, y, r, 0, 2 * Math.PI);

      const clicked = modalCircles[circleIndex]?.clicked;

      // Check if this circle should be highlighted
      if (modalHighlightedCircles.has(circleIndex)) {
        const { startTime, duration } = modalHighlightedCircles.get(circleIndex);
        const intensity = getModalPulseIntensity(startTime, duration);

        if (intensity > 0) {
          // Create a pulsing red highlight
          const red = Math.floor(255 * intensity);
          const green = Math.floor(107 * intensity);
          const blue = Math.floor(107 * intensity);
          modalCtx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
          modalCtx.fill();

          // Add a white outline for extra visibility
          modalCtx.strokeStyle = '#fff';
          modalCtx.lineWidth = 2;
          modalCtx.stroke();
        } else {
          // Highlight expired, remove it and draw normal circle
          modalHighlightedCircles.delete(circleIndex);
          // Theme-aware colors
          const effectiveTheme = window.themeManager ? window.themeManager.getEffectiveTheme() : 'light';
          const circleColor = effectiveTheme === 'dark' ? '#fff' : '#000';

          if (clicked) {
            modalCtx.fillStyle = circleColor;
            modalCtx.fill();
          } else {
            modalCtx.strokeStyle = circleColor;
            modalCtx.lineWidth = 2;
            modalCtx.stroke();
          }
        }
      } else {
        // Normal circle - theme-aware colors
        const effectiveTheme = window.themeManager ? window.themeManager.getEffectiveTheme() : 'light';
        const circleColor = effectiveTheme === 'dark' ? '#fff' : '#000';

        if (clicked) {
          modalCtx.fillStyle = circleColor;
          modalCtx.fill();
        } else {
          modalCtx.strokeStyle = circleColor;
          modalCtx.lineWidth = 2;
          modalCtx.stroke();
        }
      }
    }
  });
  // restore transform
  modalCtx.restore();
}

// Draw and update modal ripples
function drawModalRipples(cx, cy, offsetX, offsetY) {
  // Get effective theme for modal ripple colors
  const effectiveTheme = window.themeManager ? window.themeManager.getEffectiveTheme() : 'light';
  const rippleColor = effectiveTheme === 'dark' ? '255,255,255' : '0,0,0'; // White in dark, black in light

  modalRipples.forEach((ripple, idx) => {
    modalCtx.beginPath();
    modalCtx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
    modalCtx.strokeStyle = `rgba(${rippleColor},${ripple.alpha})`;
    modalCtx.lineWidth = 2;
    modalCtx.stroke();
    ripple.radius += MODAL_EXPAND_SPEED;
    ripple.alpha -= MODAL_FADE_SPEED;
    if (ripple.alpha <= 0) modalRipples.splice(idx, 1);
  });
}

// Functions to manage modal highlighting and ripples
function highlightModalCircle(circleIndex, duration = 600) {
  const startTime = Date.now();
  modalHighlightedCircles.set(circleIndex, { startTime, duration });
}

function clearModalHighlights() {
  modalHighlightedCircles.clear();
}

function createModalRipple() {
  // Use modal coordinate system
  const S = 250;
  const cx = S / 2;
  const cy = S / 2;
  const R = S * 0.09;
  modalRipples.push({ x: cx, y: cy, radius: R, alpha: 1 });
}

// Animation loop for modal
function animateModal() {
  if (!modal.classList.contains('hidden')) {
    drawModal();
    requestAnimationFrame(animateModal);
  }
}

// Export modal highlighting functions globally
window.modalHighlight = {
  highlightModalCircle,
  clearModalHighlights,
  createModalRipple,
  startAnimation: animateModal
};

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
  const R = S * 0.09;
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

        // Update button states based on mode
        updateButtonStates();

        drawModal();
        return;
      }
    }
  });
});

// Helper function to update button states based on current mode and selections
function updateButtonStates() {
  const selectedCount = modalCircles.filter(c => c.clicked).length;

  if (tutorialMode) {
    // Tutorial mode: require specific count and testing
    if (selectedCount === TUTORIAL_TARGET_COUNT) {
      testBtn.disabled = false;
      testBtn.classList.add('highlight-once');
      showTooltip('Click Test to hear what your sequence sounds like!', testBtn);
    } else {
      testBtn.disabled = true;
      testBtn.classList.remove('highlight-once');
    }
    // Save is only enabled after testing in tutorial mode
    updateTutorialUI();
  } else {
    // Non-tutorial mode: enable both buttons when any circles are selected
    if (selectedCount > 0) {
      testBtn.disabled = false;
      saveBtn.disabled = false; // Enable save directly without requiring test
    } else {
      testBtn.disabled = true;
      saveBtn.disabled = true;
    }
  }
}

// Helper function to update tutorial UI
function updateTutorialUI() {
  if (!tutorialMode) return;

  const selectedCount = modalCircles.filter(c => c.clicked).length;
  selectedCountEl.textContent = selectedCount;

  const modalInstruction = document.getElementById('modalInstruction');

  // Update progress messaging using inline instruction instead of floating tooltip
  if (selectedCount === 0) {
    modalInstruction.textContent = 'Click the empty circles to form your sequence';
    modalInstruction.classList.remove('hidden');
    hideTooltip(); // Hide any existing tooltip
  } else if (selectedCount < TUTORIAL_TARGET_COUNT) {
    const remaining = TUTORIAL_TARGET_COUNT - selectedCount;
    modalInstruction.textContent = `Select ${remaining} more circle${remaining === 1 ? '' : 's'}`;
    modalInstruction.classList.remove('hidden');
    hideTooltip(); // Hide any existing tooltip
  } else if (selectedCount === TUTORIAL_TARGET_COUNT) {
    modalInstruction.classList.add('hidden');
    hideTooltip(); // Hide any existing tooltip
    // Button state is handled in updateButtonStates()
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
        await window.audioSystem.playSequence(sequence, { inModal: true });
      } else {
        console.warn('Audio system not available, falling back to basic feedback');
      }

      // Enable save button after testing (only needed in tutorial mode)
      if (tutorialMode) {
        saveBtn.disabled = false;
      }

      // Complete tutorial if in tutorial mode
      if (tutorialMode) {
        await setSetting('tutorialSeen', true);
        tutorialMode = false;
      }
    } catch (error) {
      console.error('Error playing test sequence:', error);
      // Fallback to just enabling save button in tutorial mode
      if (tutorialMode) {
        saveBtn.disabled = false;
      }
    }
  }
});

// Loop controls event listeners
loopToggle.addEventListener('change', () => {
  const isEnabled = loopToggle.checked;
  loopInterval.disabled = !isEnabled;

  if (isEnabled) {
    loopIntervalControls.classList.remove('opacity-50');
  } else {
    loopIntervalControls.classList.add('opacity-50');
  }
});

// Save sequence and close modal
saveBtn.addEventListener('click', async () => {
  // Get sequence data
  const seq = modalCircles.map((c, index) => c.clicked ? index : null).filter(i => i !== null);

  // Get loop settings
  const isLoop = loopToggle.checked;
  const interval = parseInt(loopInterval.value) || 3;

  // Create sequence data object
  const sequenceData = {
    sequence: seq,
    isLoop: isLoop,
    loopInterval: interval
  };

  try {
    if (window.modalManager.isEditMode) {
      // Edit mode: update existing sequence
      const allSequences = await loadAllSequences();

      // Get the original sequence properly
      const originalSeq = Array.isArray(window.modalManager.originalSequenceData) ?
                         window.modalManager.originalSequenceData :
                         (window.modalManager.originalSequenceData.sequence || window.modalManager.originalSequenceData.seq);

      // Find the sequence index
      const sequenceIndex = allSequences.findIndex(seq => {
        const seqData = Array.isArray(seq) ? seq : (seq.sequence || seq.seq);
        return JSON.stringify(seqData) === JSON.stringify(originalSeq);
      });

      if (sequenceIndex !== -1) {
        // Update the sequence in storage
        await updateSequence(sequenceIndex, sequenceData);

        // Stop any active loop for the old sequence
        if (window.audioSystem && window.audioSystem.isSequenceLooping) {
          if (window.audioSystem.isSequenceLooping(originalSeq)) {
            const originalInterval = window.modalManager.originalSequenceData.loopInterval || 3;
            window.audioSystem.toggleLoopPlayback(originalSeq, originalInterval);
          }
        }

        // Remove editing attribute and update thumbnail
        window.modalManager.editingThumbnail.removeAttribute('data-editing');
        window.modalManager.editingThumbnail.remove();
        addSequenceThumbnail(sequenceData);

        console.log('✅ Sequence updated successfully');
      } else {
        throw new Error('Original sequence not found in storage');
      }
    } else {
      // Create mode: save new sequence
      await saveSequenceToDB(sequenceData);
      addSequenceThumbnail(sequenceData);
      console.log('✅ New sequence saved successfully');
    }

    // Complete tutorial if in tutorial mode
    if (tutorialMode) {
      await setSetting('tutorialSeen', true);
    }

    closeModal();
  } catch (error) {
    console.error('❌ Failed to save sequence:', error);
    alert('Failed to save sequence. Please try again.');
  }
});

// Close modal functionality
function closeModal() {
  hideTooltip();
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  modal.setAttribute('aria-hidden', 'true');

  // Reset modal manager state
  if (window.modalManager.isEditMode && window.modalManager.editingThumbnail) {
    window.modalManager.editingThumbnail.removeAttribute('data-editing');
  }
  window.modalManager.isEditMode = false;
  window.modalManager.editingThumbnail = null;
  window.modalManager.originalSequenceData = null;

  // Reset modal state
  modalCircles.forEach(circle => circle.clicked = false);
  testBtn.disabled = true;
  testBtn.classList.remove('highlight-once');
  saveBtn.disabled = true;
  tutorialCounter.classList.add('hidden');
  tutorialMode = false;

  // Hide inline instruction
  const modalInstruction = document.getElementById('modalInstruction');
  if (modalInstruction) {
    modalInstruction.classList.add('hidden');
  }

  // Reset loop controls
  loopToggle.checked = false;
  loopInterval.value = 3;
  loopInterval.disabled = true;
  loopIntervalControls.style.opacity = '0.5';

  // Clear modal highlights and ripples
  if (window.modalHighlight) {
    window.modalHighlight.clearModalHighlights();
  }
  modalRipples.length = 0;

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

// Function to create a pulsing highlight effect for modal
function getModalPulseIntensity(startTime, duration) {
  const elapsed = Date.now() - startTime;
  const progress = Math.min(elapsed / duration, 1);

  // Create a pulsing effect using a sine wave
  const pulseSpeed = 4; // How fast the pulse oscillates
  const baseIntensity = Math.max(0, 1 - progress); // Fade out over time
  const pulse = Math.sin(elapsed * pulseSpeed / 100) * 0.3 + 0.7; // Oscillate between 0.4 and 1.0

  return baseIntensity * pulse;
}

// Export modal manager and utility functions
export {
  ModalManager,
  getModalPulseIntensity
};

// Initialize modal manager
window.modalManager = new ModalManager();
