/**
 * Tutorial System for Clicking Glossolalia
 *
 * This module contains all tutorial-related logic that was previously scattered across:
 * - new-sequence.js (tutorial mode, updateTutorialUI, checkAndShowTutorial)
 * - sidenav.js (resetTutorial functionality)
 * - dev-tools.js (resetTutorial dev helper)
 *
 * Features:
 * - Automatic detection of first-time users
 * - Step-by-step guidance through sequence creation
 * - Progress tracking and UI updates
 * - Tutorial state management and cleanup
 * - Reset functionality for testing and user preference
 *
 * Usage:
 * - Import { tutorialManager } from './tutorial.js'
 * - Call tutorialManager methods from other modules
 * - Tutorial automatically initializes on app load
 */

// Tutorial system for guiding first-time users
import { getSetting, setSetting, loadAllSequences } from './storage.js';

// Tutorial constants
const TUTORIAL_TARGET_COUNT = 5;

// Tutorial state management
class TutorialManager {
  constructor() {
    this.tutorialMode = false;
    this.isActive = false;
    this.elements = this.initializeElements();

    // Initialize tutorial system after a brief delay to ensure all dependencies are loaded
    setTimeout(() => this.checkAndShowTutorial(), 100);
  }

  initializeElements() {
    return {
      createBtn: document.getElementById('createSequenceBtn'),
      tutorialCounter: document.getElementById('tutorialCounter'),
      targetCountEl: document.getElementById('targetCount'),
      selectedCountEl: document.getElementById('selectedCount'),
      modalInstruction: document.getElementById('modalInstruction'),
      testBtn: document.getElementById('testSequenceBtn'),
      saveBtn: document.getElementById('saveSequenceBtn'),
      tutorialOverlay: document.getElementById('tutorialOverlay')
    };
  }

  // Check if tutorial should be shown and initialize it
  async checkAndShowTutorial() {
    try {
      const tutorialSeen = await getSetting('tutorialSeen');
      const savedSequences = await loadAllSequences();

      // Show tutorial if never seen AND no sequences exist
      if (!tutorialSeen && savedSequences.length === 0) {
        this.startTutorial();
      }
    } catch (error) {
      console.log('Could not check tutorial state:', error);
    }
  }

  // Start the tutorial experience
  startTutorial() {
    this.isActive = true;
    document.body.classList.add('tutorial-active');
    this.elements.createBtn.classList.add('highlight-once');

    // Show initial tooltip
    if (window.showTooltip) {
      window.showTooltip('Start playing by clicking New Sequence!', this.elements.createBtn);
    }
  }

  // Enable tutorial mode for the modal
  enableTutorialMode() {
    this.tutorialMode = true;

    if (this.elements.tutorialCounter) {
      this.elements.tutorialCounter.classList.remove('hidden');
      this.elements.targetCountEl.textContent = TUTORIAL_TARGET_COUNT;
      this.elements.selectedCountEl.textContent = '0';
    }
  }

  // Disable tutorial mode
  disableTutorialMode() {
    this.tutorialMode = false;

    if (this.elements.tutorialCounter) {
      this.elements.tutorialCounter.classList.add('hidden');
    }
  }

  // Update tutorial UI based on current selection count
  updateTutorialUI(selectedCount) {
    if (!this.tutorialMode) return;

    // Update selected count display
    if (this.elements.selectedCountEl) {
      this.elements.selectedCountEl.textContent = selectedCount;
    }

    // Update progress messaging using inline instruction
    if (this.elements.modalInstruction) {
      if (selectedCount === 0) {
        this.elements.modalInstruction.textContent = 'Click the empty circles to form your sequence';
        this.elements.modalInstruction.classList.remove('hidden');
        this.hideTooltip(); // Hide any existing tooltip
      } else if (selectedCount < TUTORIAL_TARGET_COUNT) {
        const remaining = TUTORIAL_TARGET_COUNT - selectedCount;
        this.elements.modalInstruction.textContent = `Select ${remaining} more circle${remaining === 1 ? '' : 's'}`;
        this.elements.modalInstruction.classList.remove('hidden');
        this.hideTooltip(); // Hide any existing tooltip
      } else if (selectedCount === TUTORIAL_TARGET_COUNT) {
        this.elements.modalInstruction.classList.add('hidden');
        this.hideTooltip(); // Hide any existing tooltip
        // Button state is handled in updateButtonStates()
      }
    }
  }

  // Update button states in tutorial mode
  updateButtonStates(selectedCount) {
    if (!this.tutorialMode) return false; // Not handled by tutorial system

    if (selectedCount === TUTORIAL_TARGET_COUNT) {
      if (this.elements.testBtn) {
        this.elements.testBtn.disabled = false;
        this.elements.testBtn.classList.add('highlight-once');
        if (window.showTooltip) {
          window.showTooltip('Click Test to hear what your sequence sounds like!', this.elements.testBtn);
        }
      }
    } else {
      if (this.elements.testBtn) {
        this.elements.testBtn.disabled = true;
        this.elements.testBtn.classList.remove('highlight-once');
        this.hideTooltip();
      }
    }

    // Update tutorial UI
    this.updateTutorialUI(selectedCount);

    return true; // Handled by tutorial system
  }

  // Handle test button click in tutorial mode
  async handleTestClick() {
    if (!this.tutorialMode) return false; // Not handled by tutorial system

    // Remove highlight and tooltip
    this.hideTooltip();
    if (this.elements.testBtn) {
      this.elements.testBtn.classList.remove('highlight-once');
    }

    // Enable save button after testing
    if (this.elements.saveBtn) {
      this.elements.saveBtn.disabled = false;
    }

    // Complete tutorial
    await this.completeTutorial();

    return true; // Handled by tutorial system
  }

  // Handle save button click in tutorial mode
  async handleSaveClick() {
    if (!this.tutorialMode) return false; // Not handled by tutorial system

    // Complete tutorial if in tutorial mode
    await this.completeTutorial();

    return true; // Handled by tutorial system
  }

  // Complete the tutorial and mark it as seen
  async completeTutorial() {
    try {
      await setSetting('tutorialSeen', true);
      this.tutorialMode = false;
      this.isActive = false;

      // Clean up tutorial UI
      document.body.classList.remove('tutorial-active');
      if (this.elements.createBtn) {
        this.elements.createBtn.classList.remove('highlight-once');
      }
    } catch (error) {
      console.error('Error completing tutorial:', error);
    }
  }

  // Reset tutorial state (for testing or user request)
  async resetTutorial() {
    try {
      await setSetting('tutorialSeen', false);
      this.tutorialMode = false;
      this.isActive = false;

      // Clean up any existing tutorial state
      document.body.classList.remove('tutorial-active');
      if (this.elements.createBtn) {
        this.elements.createBtn.classList.remove('highlight-once');
      }
      if (this.elements.tutorialCounter) {
        this.elements.tutorialCounter.classList.add('hidden');
      }
      if (this.elements.modalInstruction) {
        this.elements.modalInstruction.classList.add('hidden');
      }

      console.log('✅ Tutorial state reset');
      return true;
    } catch (error) {
      console.error('❌ Error resetting tutorial:', error);
      return false;
    }
  }

  // Clean up tutorial state when modal closes
  cleanupTutorialState() {
    this.tutorialMode = false;

    if (this.elements.tutorialCounter) {
      this.elements.tutorialCounter.classList.add('hidden');
    }
    if (this.elements.modalInstruction) {
      this.elements.modalInstruction.classList.add('hidden');
    }
    if (this.elements.testBtn) {
      this.elements.testBtn.classList.remove('highlight-once');
    }

    this.hideTooltip();
  }

  // Utility method to hide tooltip
  hideTooltip() {
    if (window.hideTooltip) {
      window.hideTooltip();
    }
  }

  // Getters for external access
  get isTutorialMode() {
    return this.tutorialMode;
  }

  get isTutorialActive() {
    return this.isActive;
  }

  get targetCount() {
    return TUTORIAL_TARGET_COUNT;
  }
}

// Create and export tutorial manager instance
const tutorialManager = new TutorialManager();

// Export for use by other modules
export {
  tutorialManager,
  TutorialManager,
  TUTORIAL_TARGET_COUNT
};

// Make available globally for backward compatibility and dev tools
window.tutorialManager = tutorialManager;
