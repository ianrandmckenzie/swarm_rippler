// Context menu functionality for sequence thumbnails
import { loadAllSequences, deleteSequence } from './storage.js';

class ContextMenuManager {
  constructor() {
    this.contextMenu = null;
    this.currentThumbnail = null;
    this.init();
  }

  init() {
    this.contextMenu = document.getElementById('contextMenu');
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Hide context menu when clicking elsewhere
    document.addEventListener('click', (e) => {
      if (!this.contextMenu.contains(e.target)) {
        this.hideContextMenu();
      }
    });

    // Hide context menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideContextMenu();
      }
    });

    // Setup context menu actions
    document.getElementById('editSequence').addEventListener('click', () => {
      this.editSequence();
      this.hideContextMenu();
    });

    document.getElementById('deleteSequence').addEventListener('click', () => {
      this.deleteSequence();
      this.hideContextMenu();
    });

    // Setup right-click listener for sequence bar (using event delegation)
    const sequenceBar = document.getElementById('sequenceBar');
    if (sequenceBar) {
      sequenceBar.addEventListener('contextmenu', (e) => {
        // Find the clicked canvas thumbnail
        const canvas = e.target.closest('canvas');
        if (canvas && canvas.sequenceData) {
          e.preventDefault();
          this.showContextMenu(e, canvas);
        }
      });
    }
  }  showContextMenu(event, thumbnail) {
    this.currentThumbnail = thumbnail;

    // Make menu visible temporarily to get accurate dimensions
    this.contextMenu.style.visibility = 'hidden';
    this.contextMenu.classList.remove('hidden');

    // Get menu dimensions after it's rendered
    const menuRect = this.contextMenu.getBoundingClientRect();
    const menuWidth = menuRect.width;
    const menuHeight = menuRect.height;

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Get initial cursor position
    let x = event.clientX;
    let y = event.clientY;

    // Add some padding from screen edges
    const padding = 8;

    // Check horizontal overflow and adjust
    if (x + menuWidth + padding > viewportWidth) {
      // Try to position to the left of cursor
      x = x - menuWidth;

      // If that also overflows, clamp to the right edge
      if (x < padding) {
        x = viewportWidth - menuWidth - padding;
      }
    }

    // Ensure minimum left margin
    x = Math.max(padding, x);

    // Check vertical overflow and adjust
    if (y + menuHeight + padding > viewportHeight) {
      // Try to position above cursor
      y = y - menuHeight;

      // If that also overflows, clamp to the bottom edge
      if (y < padding) {
        y = viewportHeight - menuHeight - padding;
      }
    }

    // Ensure minimum top margin
    y = Math.max(padding, y);

    // Special handling for bottom bar context (sequence thumbnails are at bottom)
    const sequenceBar = document.getElementById('sequenceBar');
    if (sequenceBar) {
      const barRect = sequenceBar.getBoundingClientRect();

      // If we're in the sequence bar area and menu would overlap, position above
      if (event.clientY >= barRect.top && y + menuHeight > barRect.top) {
        y = Math.max(padding, barRect.top - menuHeight - 4);
      }
    }

    // Apply final position
    this.contextMenu.style.left = x + 'px';
    this.contextMenu.style.top = y + 'px';
    this.contextMenu.style.visibility = 'visible';
  }

  hideContextMenu() {
    this.contextMenu.classList.add('hidden');
    this.contextMenu.style.visibility = '';
    this.currentThumbnail = null;
  }

  editSequence() {
    if (!this.currentThumbnail || !this.currentThumbnail.sequenceData) return;

    const sequenceData = this.currentThumbnail.sequenceData;

    // Store reference to the thumbnail being edited
    this.currentThumbnail.setAttribute('data-editing', 'true');

    // Open modal in edit mode
    if (window.modalManager) {
      window.modalManager.openEditMode(sequenceData, this.currentThumbnail);
    }
  }

  async deleteSequence() {
    if (!this.currentThumbnail || !this.currentThumbnail.sequenceData) return;

    // Store references before any async operations to prevent them from being nullified
    const thumbnailToDelete = this.currentThumbnail;
    const sequenceData = this.currentThumbnail.sequenceData;

    // Show confirmation dialog
    const confirmed = confirm('Are you sure you want to delete this sequence? This action cannot be undone.');

    if (confirmed) {
      try {
        // Find the sequence index in storage
        const allSequences = await loadAllSequences();
        const sequenceIndex = allSequences.findIndex(seq => {
          // Normalize both sequences for comparison
          const storedSeq = Array.isArray(seq) ? seq : (seq.sequence || seq.seq);
          const currentSeq = Array.isArray(sequenceData) ? sequenceData :
                           (sequenceData.sequence || sequenceData.seq);
          return JSON.stringify(storedSeq) === JSON.stringify(currentSeq);
        });

        if (sequenceIndex !== -1) {
          // Delete from storage
          await deleteSequence(sequenceIndex);

          // Remove thumbnail from DOM using our stored reference
          thumbnailToDelete.remove();

          // Stop loop playback if this sequence was looping
          if (window.audioSystem && window.audioSystem.isSequenceLooping) {
            const seqToCheck = Array.isArray(sequenceData) ? sequenceData :
                              (sequenceData.sequence || sequenceData.seq);
            if (window.audioSystem.isSequenceLooping(seqToCheck)) {
              const interval = sequenceData.loopInterval || 3;
              window.audioSystem.toggleLoopPlayback(seqToCheck, interval);
            }
          }

          console.log('✅ Sequence deleted successfully');
        } else {
          console.error('❌ Sequence not found in storage');
          alert('Sequence not found in storage. It may have already been deleted.');
        }
      } catch (error) {
        console.error('❌ Failed to delete sequence:', error);
        alert('Failed to delete sequence. Please try again.');
      }
    }
  }
}

// Initialize context menu when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.contextMenuManager = new ContextMenuManager();
});

// Export context menu manager
export { ContextMenuManager };
