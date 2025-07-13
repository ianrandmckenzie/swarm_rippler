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
      // In modal, position relative to modal content, not viewport
      const modalContent = document.getElementById('modalContent');
      const modalRect = modalContent.getBoundingClientRect();
      left = modalRect.left + (modalRect.width - tooltipWidth) / 2;
      top = rect.bottom + 8; // Closer spacing in modal
    } else {
      // Small screen, center horizontally
      left = (viewportWidth - tooltipWidth) / 2;
      top = rect.bottom + 8;
    }

    // Ensure tooltip doesn't go off screen
    left = Math.max(8, Math.min(left, viewportWidth - tooltipWidth - 8));
    top = Math.max(8, Math.min(top, viewportHeight - 50)); // Leave room for tooltip height
  } else {
    // Original positioning for larger screens
    left = (rect.left / 2 + rect.width / 2) + offset;
    top = rect.bottom + 16;
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

// Sequence thumbnails bar append
async function addSequenceThumbnail(seq) {
  const bar = document.getElementById('sequenceBar');
  const size = 80;
  const thumb = document.createElement('canvas');
  thumb.width = size * dpr;
  thumb.height = size * dpr;
  thumb.style.width = size + 'px';
  thumb.style.height = size + 'px';
  const tctx = thumb.getContext('2d');
  tctx.scale(dpr, dpr);

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
  tctx.fillStyle = '#000';
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
        tctx.fillStyle = '#000';
        tctx.strokeStyle = '#fff';
        tctx.lineWidth = 0.5;
        if (fill) tctx.fill(); else tctx.stroke();
      }
    }
  });
  bar.appendChild(thumb);
}

// Populate sequence bar on initial load - wait for all dependencies
function initializeSequenceBar() {
  // Check if all required dependencies are available
  if (typeof loadAllSequences === 'undefined' ||
      typeof smallCircles === 'undefined' ||
      typeof dpr === 'undefined') {
    // Retry after a short delay if dependencies aren't ready
    setTimeout(initializeSequenceBar, 10);
    return;
  }

  loadAllSequences().then(seqs => {
    seqs.forEach(seq => addSequenceThumbnail(seq));
    console.log(`✅ Loaded ${seqs.length} saved sequences`);
  }).catch(error => {
    console.error('Failed to load sequences:', error);
  });
}

// Initialize when DOM is ready and all scripts have loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSequenceBar);
} else {
  // DOM is already loaded
  initializeSequenceBar();
}
