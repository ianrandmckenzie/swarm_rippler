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

  // Check if we're running in Tauri (desktop app)
  const isTauri = window.__TAURI__ !== undefined;

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

    // Tauri-specific adjustment: In desktop app, ensure tooltip stays within bounds
    if (isTauri) {
      // In Tauri, be more conservative with positioning
      const tooltipWidth = tooltipEl.offsetWidth || 200;
      const tooltipHeight = tooltipEl.offsetHeight || 40;

      // Keep tooltip well within viewport bounds
      left = Math.max(16, Math.min(left, viewportWidth - tooltipWidth - 16));
      top = Math.max(16, Math.min(top, viewportHeight - tooltipHeight - 16));

      // If tooltip would be too far from target, position it closer
      const targetCenterX = rect.left + (rect.width / 2);
      const maxDistance = 100; // Maximum distance from target center

      if (Math.abs(left + tooltipWidth/2 - targetCenterX) > maxDistance) {
        left = targetCenterX - tooltipWidth/2;
        left = Math.max(16, Math.min(left, viewportWidth - tooltipWidth - 16));
      }
    } else {
      // Web browser positioning
      const tooltipWidth = tooltipEl.offsetWidth || 200;
      left = Math.max(8, Math.min(left, viewportWidth - tooltipWidth - 8));
    }
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

// Robust theme detection helper function
function getRobustCurrentTheme() {
  // Method 1: Check theme manager if available
  if (window.themeManager) {
    const effectiveTheme = window.themeManager.getEffectiveTheme();
    // Double-check that DOM state matches
    const isDarkInDOM = document.documentElement.classList.contains('dark');
    if ((effectiveTheme === 'dark' && isDarkInDOM) || (effectiveTheme === 'light' && !isDarkInDOM)) {
      return effectiveTheme;
    }
  }

  // Method 2: Check DOM classes directly
  if (document.documentElement.classList.contains('dark')) {
    return 'dark';
  } else if (document.documentElement.classList.contains('light')) {
    return 'light';
  }

  // Method 3: Check system preference as fallback
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  // Final fallback
  return 'light';
}

// Sequence thumbnails bar append
async function addSequenceThumbnail(sequenceData, sequenceIndex = null) {
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

  // Theme-aware center circle color with robust detection
  const effectiveTheme = getRobustCurrentTheme();
  const centerColor = effectiveTheme === 'dark' ? '#fff' : '#000';

  // Debug logging for theme detection
  if (window.location.hostname === 'localhost') {
    console.log('Thumbnail generation - Effective theme:', effectiveTheme, 'Center color:', centerColor,
      'DOM dark class:', document.documentElement.classList.contains('dark'),
      'Theme manager available:', !!window.themeManager,
      'Theme manager theme:', window.themeManager?.getEffectiveTheme());
  }

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

        // Theme-aware small circle colors with robust detection
        const effectiveTheme = getRobustCurrentTheme();
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
  thumb.sequenceIndex = sequenceIndex; // Store the index for editing/deleting

  // Check if this sequence is currently looping and apply appropriate styling
  if (window.audioSystem && window.audioSystem.isSequenceLooping && window.audioSystem.isSequenceLooping(seq, thumb)) {
    const effectiveTheme = getRobustCurrentTheme();
    const isDark = effectiveTheme === 'dark';
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
    seqs.forEach((sequenceData, index) => addSequenceThumbnail(sequenceData, index));
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
    seqs.forEach((sequenceData, index) => addSequenceThumbnail(sequenceData, index));
  }).catch(error => {
    console.error('Failed to reload sequences after theme change:', error);
  });
}

// Listen for theme changes
function setupThemeChangeListener() {
  if (window.themeManager && window.themeManager.initialized) {
    // Theme manager is already ready, set up override
    const originalSetTheme = window.themeManager.setTheme.bind(window.themeManager);
    window.themeManager.setTheme = async function(theme) {
      await originalSetTheme(theme);
      onThemeChange();
    };
  } else {
    // Wait for theme manager to be ready
    window.addEventListener('themeManagerReady', () => {
      const originalSetTheme = window.themeManager.setTheme.bind(window.themeManager);
      window.themeManager.setTheme = async function(theme) {
        await originalSetTheme(theme);
        onThemeChange();
      };
    }, { once: true });
  }
}

document.addEventListener('DOMContentLoaded', setupThemeChangeListener);

// Initialize when DOM is ready and theme is properly loaded
function waitForThemeAndInitialize() {
  function checkThemeAndInit() {
    if (window.themeManager && window.themeManager.initialized) {
      // Double-check that the effective theme matches DOM state
      const effectiveTheme = window.themeManager.getEffectiveTheme();
      const hasDarkClass = document.documentElement.classList.contains('dark');
      const hasLightClass = document.documentElement.classList.contains('light');

      // Ensure DOM state matches the effective theme
      if ((effectiveTheme === 'dark' && hasDarkClass) ||
          (effectiveTheme === 'light' && (hasLightClass || (!hasDarkClass && !hasLightClass)))) {
        // Theme state is consistent, proceed with initialization
        initializeSequenceBar();
      } else {
        // Theme state is inconsistent, wait one more frame
        requestAnimationFrame(checkThemeAndInit);
      }
    } else {
      // Theme manager not ready yet
      window.addEventListener('themeManagerReady', () => {
        requestAnimationFrame(checkThemeAndInit);
      }, { once: true });
    }
  }

  checkThemeAndInit();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForThemeAndInitialize);
} else {
  // DOM is already loaded
  waitForThemeAndInitialize();
}

// Export main functions
export {
  showTooltip,
  hideTooltip,
  addSequenceThumbnail,
  initializeSequenceBar,
  onThemeChange,
  getRobustCurrentTheme
};
