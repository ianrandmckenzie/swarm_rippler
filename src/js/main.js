// Main application logic and tooltip management
import { loadAllSequences } from './storage.js';
import { smallCircles, dpr } from './main-canvas.js';

// Tooltip helper
const tooltipEl = document.getElementById('tooltip');
function showTooltip(text, targetEl, offset = 0) {
  const rect = targetEl.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  tooltipEl.textContent = text;

  // Check if we're in a modal context
  const isInModal = targetEl.closest('#sequenceModal') !== null;

  let left, top;

  if (isInModal || viewportWidth < 640) { // Small screens or modal context
    // For small screens and modal, center the tooltip and position it more carefully
    const tooltipWidth = tooltipEl.offsetWidth || 200; // Estimate if not rendered yet

    if (isInModal) {
      // In modal, position above the modal content to avoid interference
      const modalContent = document.getElementById('modalContent');
      const modalRect = modalContent.getBoundingClientRect();
      left = modalRect.left + (modalRect.width - tooltipWidth) / 2;

      // Position tooltip above the modal with some spacing
      top = modalRect.top - 40; // Position above modal

      // If there's not enough space above, position at the very top of the modal
      if (top < 16) {
        top = modalRect.top + 8; // Small padding from top of modal
      }
    } else {
      // Small screen, center horizontally
      left = (viewportWidth - tooltipWidth) / 2;
      top = rect.bottom + 8;
    }

    // Ensure tooltip doesn't go off screen
    left = Math.max(8, Math.min(left, viewportWidth - tooltipWidth - 8));
    top = Math.max(8, Math.min(top, viewportHeight - 50)); // Leave room for tooltip height
  } else {
    // Original positioning for larger screens - center under the target element
    left = rect.left + (rect.width / 2) - (tooltipEl.offsetWidth / 2) + offset;
    top = rect.bottom + 16;

    // Ensure tooltip doesn't go off screen
    const tooltipWidth = tooltipEl.offsetWidth || 200;
    left = Math.max(8, Math.min(left, viewportWidth - tooltipWidth - 8));
  }

  tooltipEl.style.left = left + 'px';
  tooltipEl.style.top = top + 'px';
  tooltipEl.classList.remove('hidden');
  tooltipEl.removeAttribute('aria-hidden');
}
function hideTooltip() {
  tooltipEl.classList.add('hidden');
  tooltipEl.setAttribute('aria-hidden', 'true');
}

// Expose tooltip functions globally for use by other modules
window.showTooltip = showTooltip;
window.hideTooltip = hideTooltip;

// Expose tooltip functions globally for use by other modules
window.showTooltip = showTooltip;
window.hideTooltip = hideTooltip;

// Sequence thumbnails bar append
async function addSequenceThumbnail(sequenceData) {
  const bar = document.getElementById('sequenceBar');
  const size = 80;
  const thumb = document.createElement('canvas');
  thumb.width = size * dpr;
  thumb.height = size * dpr;
  thumb.style.width = size + 'px';
  thumb.style.height = size + 'px';
  const tctx = thumb.getContext('2d');
  tctx.scale(dpr, dpr);

  // Normalize sequence data format for backward compatibility
  let seq, isLoop, loopInterval;
  if (Array.isArray(sequenceData)) {
    // Legacy format: just an array of indices
    seq = sequenceData;
    isLoop = false;
    loopInterval = 3;
  } else {
    // New format: object with sequence and loop settings
    seq = sequenceData.sequence || sequenceData;
    isLoop = sequenceData.isLoop || false;
    loopInterval = sequenceData.loopInterval || 3;
  }

  // Use even smaller proportions and add margin to ensure everything fits
  const margin = 3; // Leave 3px margin on all sides
  const usableSize = size - (margin);
  const cx = size / 2;
  const cy = size / 2;
  const R = usableSize * 0.08; // Center circle
  const r = R * 0.35; // Small circles
  const spacing = R * 1.8; // Tighter spacing to fit all 3 rings

  // center ring
  tctx.beginPath();
  tctx.arc(cx, cy, R, 0, 2 * Math.PI);

  // Theme-aware center circle color
  const effectiveTheme = window.themeManager ? window.themeManager.getEffectiveTheme() : 'light';
  const centerColor = effectiveTheme === 'dark' ? '#fff' : '#000';
  tctx.fillStyle = centerColor;
  tctx.fill();

  // Draw all 3 rings of small circles (24 total)
  smallCircles.forEach(({dirX, dirY, audio}, dirIndex) => {
    for (let ring = 1; ring <= 3; ring++) {
      // Map smallCircles index to correct modal index
      // smallCircles: [top, bottom, left, right, top-right, top-left, bottom-left, bottom-right]
      // modal dirs: [top, bottom, left, right, top-right, top-left, bottom-right, bottom-left]
      const modalDirMapping = [0, 1, 2, 3, 4, 5, 7, 6]; // Fix the bottom-left/bottom-right swap
      const modalDirIndex = modalDirMapping.indexOf(dirIndex);
      const modalCircleIndex = modalDirIndex * 3 + (ring - 1);

      // Check if this specific circle index was saved in the sequence
      const fill = seq.includes(modalCircleIndex);

      const x = cx + dirX * spacing * ring;
      const y = cy + dirY * spacing * ring;

      // Only draw if circle would be within bounds
      if (x - r >= margin && x + r <= size - margin &&
          y - r >= margin && y + r <= size - margin) {
        tctx.beginPath();
        tctx.arc(x, y, r, 0, 2 * Math.PI);

        // Theme-aware small circle colors
        const effectiveTheme = window.themeManager ? window.themeManager.getEffectiveTheme() : 'light';
        const circleColor = effectiveTheme === 'dark' ? '#fff' : '#000';
        const strokeColor = effectiveTheme === 'dark' ? '#000' : '#fff';

        tctx.fillStyle = circleColor;
        tctx.strokeStyle = strokeColor;
        tctx.lineWidth = 0.5;
        if (fill) tctx.fill(); else tctx.stroke();
      }
    }
  });

  // Store sequence data on the canvas element for click handling
  thumb.sequenceData = { seq, isLoop, loopInterval };

  // Check if this sequence is currently looping and apply appropriate styling
  if (window.audioSystem && window.audioSystem.isSequenceLooping && window.audioSystem.isSequenceLooping(seq)) {
    const isDark = document.documentElement.classList.contains('dark');
    thumb.classList.add('rounded-full', 'transition-colors', 'duration-300', 'ease-in-out', 'p-2');

    if (isDark) {
      thumb.classList.add('bg-swarmshadow-50');
    } else {
      thumb.classList.add('bg-swarmstripe-200/50');
    }

    thumb.style.animation = 'loop-pulse 2s ease-in-out infinite';
  }

  bar.appendChild(thumb);
}

// Populate sequence bar on initial load - wait for all dependencies
function initializeSequenceBar() {
  loadAllSequences().then(seqs => {
    seqs.forEach(sequenceData => addSequenceThumbnail(sequenceData));
    console.log(`✅ Loaded ${seqs.length} saved sequences`);
  }).catch(error => {
    console.error('Failed to load sequences:', error);
  });
}

// Theme change listener to update thumbnails
function onThemeChange() {
  // Clear existing thumbnails
  const bar = document.getElementById('sequenceBar');
  const thumbnails = bar.querySelectorAll('canvas');
  thumbnails.forEach(thumb => thumb.remove());

  // Regenerate all thumbnails with new theme
  loadAllSequences().then(seqs => {
    seqs.forEach(sequenceData => addSequenceThumbnail(sequenceData));
  }).catch(error => {
    console.error('Failed to reload sequences after theme change:', error);
  });
}

// Listen for theme changes
document.addEventListener('DOMContentLoaded', () => {
  if (window.themeManager) {
    // Override the theme manager's setTheme method to include thumbnail updates
    const originalSetTheme = window.themeManager.setTheme.bind(window.themeManager);
    window.themeManager.setTheme = async function(theme) {
      await originalSetTheme(theme);
      onThemeChange();
    };
  }
});

// Initialize when DOM is ready and all scripts have loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSequenceBar);
} else {
  // DOM is already loaded
  initializeSequenceBar();
}

// Export main functions
export {
  showTooltip,
  hideTooltip,
  addSequenceThumbnail,
  initializeSequenceBar,
  onThemeChange
};
