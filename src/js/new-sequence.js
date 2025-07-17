// Modal and sequence creation functionality
import { getSetting, setSetting, loadAllSequences, saveSequenceToDB, updateSequence } from './storage.js';
import { addSequenceThumbnail, hideTooltip } from './main.js';
import { smallCircles, dpr } from './main-canvas.js';
import { VisualFeedback, hapticFeedback } from './feedback.js';
import { tutorialManager } from './tutorial.js';

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
      // Add visual feedback for button press
      VisualFeedback.bounce(createBtn, 1.05, 150);

      // Add haptic feedback
      hapticFeedback.trigger('medium');

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
    if (!tutorialSeen) {
      tutorialManager.enableTutorialMode();
    } else {
      tutorialManager.disableTutorialMode();
    }

    // Reset modal state
    this.resetModalState();

    // Open modal
    this.showModal();
  }

  openEditMode(sequenceData, thumbnail) {
    this.isEditMode = true;
    this.editingThumbnail = thumbnail;
    this.originalSequenceData = JSON.parse(JSON.stringify(sequenceData)); // Deep copy

    modalTitle.textContent = 'Edit Sequence';

    // Hide tutorial in edit mode
    tutorialManager.disableTutorialMode();

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

    // Clean up tutorial state
    tutorialManager.cleanupTutorialState();
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

    // Reset modal focus to center
    modalCurrentFocus = -1;

    // Initialize modal circles
    this.initializeModalCircles();

    drawModal();
    animateModal();

    if (tutorialManager.isTutorialMode) {
      tutorialManager.updateTutorialUI(0);
    }

    updateButtonStates();

    // Focus the modal canvas for keyboard accessibility
    setTimeout(() => {
      modalCanvas.focus();
    }, 100);
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

    // Use same order as drawing and click detection (matching smallCircles order)
    const dirs = [
      { x: 0, y: -1 },     // top
      { x: 0, y: 1 },      // bottom
      { x: -1, y: 0 },     // left
      { x: 1, y: 0 },      // right
      { x: 1/Math.SQRT2, y: -1/Math.SQRT2 },   // top-right
      { x: -1/Math.SQRT2, y: -1/Math.SQRT2 },  // top-left
      { x: -1/Math.SQRT2, y: 1/Math.SQRT2 },   // bottom-left
      { x: 1/Math.SQRT2, y: 1/Math.SQRT2 }     // bottom-right
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

// Loop controls
const loopToggle = document.getElementById('loopToggle');
const loopInterval = document.getElementById('loopInterval');
const loopIntervalControls = document.getElementById('loopIntervalControls');

let modalCircles = [];

// Accessibility: Current focused element for modal keyboard navigation
let modalCurrentFocus = -1; // -1 = center, 0-23 = small circles (8 directions × 3 distances)

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

  // Accessibility: Draw focus indicator for center circle
  if (modalCurrentFocus === -1) {
    modalCtx.beginPath();
    modalCtx.arc(cx, cy, R + 4, 0, Math.PI * 2);
    // Theme-aware focus color - dark yellow for light theme, bright yellow for dark theme
    const effectiveTheme = window.themeManager ? window.themeManager.getEffectiveTheme() : 'light';
    modalCtx.strokeStyle = effectiveTheme === 'dark' ? '#FFF176' : '#F57F17'; // Bright yellow for dark, dark yellow for light
    modalCtx.lineWidth = 3;
    modalCtx.setLineDash([3, 3]);
    modalCtx.stroke();
    modalCtx.setLineDash([]); // Reset line dash
  }

  // Draw small circles (rings or filled) matching main pattern
  const r = R * 0.3; // Slightly larger relative to center for visibility
  const spacing = R + r * 2; // Very tight spacing
  const dirs = [
    { x: 0, y: -1 },     // top
    { x: 0, y: 1 },      // bottom
    { x: -1, y: 0 },     // left
    { x: 1, y: 0 },      // right
    { x: 1/Math.SQRT2, y: -1/Math.SQRT2 },   // top-right
    { x: -1/Math.SQRT2, y: -1/Math.SQRT2 },  // top-left
    { x: -1/Math.SQRT2, y: 1/Math.SQRT2 },   // bottom-left
    { x: 1/Math.SQRT2, y: 1/Math.SQRT2 }     // bottom-right
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

      // Accessibility: Draw focus indicator for small circles
      if (modalCurrentFocus === circleIndex) {
        modalCtx.beginPath();
        modalCtx.arc(x, y, r + 3, 0, Math.PI * 2);
        // Theme-aware focus color - dark yellow for light theme, bright yellow for dark theme
        const effectiveTheme = window.themeManager ? window.themeManager.getEffectiveTheme() : 'light';
        modalCtx.strokeStyle = effectiveTheme === 'dark' ? '#FFF176' : '#F57F17'; // Bright yellow for dark, dark yellow for light
        modalCtx.lineWidth = 2;
        modalCtx.setLineDash([2, 2]);
        modalCtx.stroke();
        modalCtx.setLineDash([]); // Reset line dash
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

  // Check each direction and ring position directly (matching smallCircles order)
  const dirs = [
    { x: 0, y: -1 },     // top
    { x: 0, y: 1 },      // bottom
    { x: -1, y: 0 },     // left
    { x: 1, y: 0 },      // right
    { x: 1/Math.SQRT2, y: -1/Math.SQRT2 },   // top-right
    { x: -1/Math.SQRT2, y: -1/Math.SQRT2 },  // top-left
    { x: -1/Math.SQRT2, y: 1/Math.SQRT2 },   // bottom-left
    { x: 1/Math.SQRT2, y: 1/Math.SQRT2 }     // bottom-right
  ];

  dirs.forEach((dir, di) => {
    for (let i = 1; i <= 3; i++) {
      const circleX = cx + dir.x * spacing * i;
      const circleY = cy + dir.y * spacing * i;
      const circleIndex = di * 3 + (i - 1);
      const circle = modalCircles[circleIndex];

      if (circle && (x - circleX)**2 + (y - circleY)**2 <= r*r) {
        // Toggle the circle's clicked state
        circle.clicked = !circle.clicked;

        // Add visual feedback for the interaction
        VisualFeedback.canvasRipple(modalCanvas, clickX, clickY);

        // Add haptic feedback
        hapticFeedback.trigger(circle.clicked ? 'medium' : 'light');

        // Play sound only when selecting (not deselecting)
        if (circle.clicked) {
          circle.audio.currentTime = 0;
          circle.audio.play();
        }

        // Update button states based on mode
        updateButtonStates();

        drawModal();
        return;
      }
    }
  });
});

// Accessibility: Keyboard navigation support for modal canvas
modalCanvas.addEventListener('keydown', (e) => {
  // Only handle keyboard events when modal is visible
  if (modal.classList.contains('hidden')) return;

  switch(e.key) {
    case 'ArrowUp':
      e.preventDefault();
      modalCurrentFocus = Math.max(-1, modalCurrentFocus - 8);
      announceModalPosition();
      drawModal();
      break;
    case 'ArrowDown':
      e.preventDefault();
      modalCurrentFocus = Math.min(23, modalCurrentFocus + 8);
      announceModalPosition();
      drawModal();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      if (modalCurrentFocus === -1) {
        modalCurrentFocus = 21; // Bottom-left area
      } else {
        modalCurrentFocus = (modalCurrentFocus - 1 + 24) % 24;
      }
      announceModalPosition();
      drawModal();
      break;
    case 'ArrowRight':
      e.preventDefault();
      if (modalCurrentFocus === -1) {
        modalCurrentFocus = 0; // Top area
      } else {
        modalCurrentFocus = (modalCurrentFocus + 1) % 24;
      }
      announceModalPosition();
      drawModal();
      break;
    case ' ':
    case 'Enter':
      e.preventDefault();
      activateModalCurrentSound();
      break;
    case 'Home':
      e.preventDefault();
      modalCurrentFocus = -1;
      announceModalPosition();
      drawModal();
      break;
  }
});

// Accessibility: Announce current position in modal to screen readers
function announceModalPosition() {
  const announcements = document.getElementById('canvas-announcements');
  if (!announcements) return;

  if (modalCurrentFocus === -1) {
    announcements.textContent = 'Center circle selected in sequence editor. Press space or enter to select/deselect.';
  } else {
    const direction = ['top', 'bottom', 'left', 'right', 'top-right', 'top-left', 'bottom-left', 'bottom-right'][modalCurrentFocus % 8];
    const distance = Math.floor(modalCurrentFocus / 8) + 1;
    const circle = modalCircles[modalCurrentFocus];
    const state = circle?.clicked ? 'selected' : 'unselected';
    announcements.textContent = `${direction} circle, ring ${distance} - currently ${state}. Press space or enter to toggle.`;
  }
}

// Accessibility: Activate currently focused sound in modal
function activateModalCurrentSound() {
  if (modalCurrentFocus === -1) {
    // Center circle - don't do anything in modal
    const announcements = document.getElementById('canvas-announcements');
    if (announcements) {
      announcements.textContent = 'Center circle cannot be selected in sequence editor.';
    }
  } else {
    // Small circle
    const circle = modalCircles[modalCurrentFocus];
    if (circle) {
      // Toggle selection
      circle.clicked = !circle.clicked;

      // Add haptic feedback
      hapticFeedback.trigger(circle.clicked ? 'medium' : 'light');

      // Play sound only when selecting
      if (circle.clicked) {
        circle.audio.currentTime = 0;
        circle.audio.play();
      }

      // Update button states and redraw
      updateButtonStates();
      drawModal();

      // Announce the change
      const announcements = document.getElementById('canvas-announcements');
      if (announcements) {
        const direction = ['top', 'bottom', 'left', 'right', 'top-right', 'top-left', 'bottom-left', 'bottom-right'][modalCurrentFocus % 8];
        const distance = Math.floor(modalCurrentFocus / 8) + 1;
        const state = circle.clicked ? 'selected' : 'deselected';
        announcements.textContent = `${direction} circle, ring ${distance} ${state}.`;
      }
    }
  }
}

// Helper function to update button states based on current mode and selections
function updateButtonStates() {
  const selectedCount = modalCircles.filter(c => c.clicked).length;

  // Let tutorial manager handle tutorial mode button states
  if (tutorialManager.updateButtonStates(selectedCount)) {
    return; // Tutorial manager handled it
  }

  // Non-tutorial mode: enable both buttons when any circles are selected
  if (selectedCount > 0) {
    testBtn.disabled = false;
    saveBtn.disabled = false; // Enable save directly without requiring test
  } else {
    testBtn.disabled = true;
    saveBtn.disabled = true;
  }
}

// Test sequence
testBtn.addEventListener('click', async e => {
  // Add visual feedback for button press
  VisualFeedback.press(testBtn, 0.95, 100);

  // Add haptic feedback
  hapticFeedback.trigger('medium');

  // Let tutorial manager handle tutorial-specific logic
  const handledByTutorial = await tutorialManager.handleTestClick();

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

      // Enable save button after testing (only needed in non-tutorial mode now)
      if (!tutorialManager.isTutorialMode) {
        saveBtn.disabled = false;
      }
    } catch (error) {
      console.error('Error playing test sequence:', error);
      // Fallback to just enabling save button in non-tutorial mode
      if (!tutorialManager.isTutorialMode) {
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

  // Don't call updateButtonStates() here as it can interfere with tutorial flow
  // The loop toggle state doesn't affect button availability - only selection count does
});

// Save sequence and close modal
saveBtn.addEventListener('click', async () => {
  // Add visual feedback for button press
  VisualFeedback.press(saveBtn, 0.95, 100);

  // Add haptic feedback
  hapticFeedback.trigger('success');

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
          if (window.audioSystem.isSequenceLooping(originalSeq, window.modalManager.editingThumbnail)) {
            const originalInterval = window.modalManager.originalSequenceData.loopInterval || 3;
            window.audioSystem.toggleLoopPlayback(originalSeq, originalInterval, window.modalManager.editingThumbnail);
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

    // Let tutorial manager handle tutorial completion
    await tutorialManager.handleSaveClick();

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

  // Clean up tutorial state
  tutorialManager.cleanupTutorialState();

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
closeBtn.addEventListener('click', () => {
  // Add visual feedback
  VisualFeedback.press(closeBtn, 0.9, 100);
  hapticFeedback.trigger('light');

  closeModal();
});

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
