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
import { VisualFeedback, hapticFeedback } from './feedback.js';

// Tutorial constants
const TUTORIAL_TARGET_COUNT = 5;

// Tutorial state management
class TutorialManager {
  constructor() {
    this.tutorialMode = false;
    this.isActive = false;
    this.currentStep = 0; // For mobile swipe steps
    this.elements = this.initializeElements();

    // Set up welcome modal event listener
    this.setupWelcomeModal();

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
      tutorialOverlay: document.getElementById('tutorialOverlay'),
      welcomeModal: document.getElementById('tutorialWelcomeModal'),
      beginBtn: document.getElementById('beginTutorialBtn'),
      beginBtnMobile: document.getElementById('beginTutorialBtnMobile'),
      welcomeSteps: document.getElementById('welcomeSteps'),
      welcomeStepsContainer: document.getElementById('welcomeStepsContainer'),
      dots: [
        document.getElementById('dot0'),
        document.getElementById('dot1'),
        document.getElementById('dot2')
      ]
    };
  }

  // Set up welcome modal event listeners
  setupWelcomeModal() {
    // Desktop begin button
    if (this.elements.beginBtn) {
      this.elements.beginBtn.addEventListener('click', () => {
        this.handleBeginClick(this.elements.beginBtn);
      });
    }

    // Mobile begin button
    if (this.elements.beginBtnMobile) {
      this.elements.beginBtnMobile.addEventListener('click', () => {
        this.handleBeginClick(this.elements.beginBtnMobile);
      });
    }

    // Set up mobile swipe functionality
    this.setupMobileSwipe();

    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isWelcomeModalOpen()) {
        this.closeWelcomeModal();
        this.startMainTutorial();
      }
    });
  }

  // Handle begin button click (both desktop and mobile)
  handleBeginClick(button) {
    // Add visual feedback for button press
    VisualFeedback.press(button, 0.95, 150);

    // Add haptic feedback
    hapticFeedback.trigger('medium');

    this.closeWelcomeModal();
    this.startMainTutorial();
  }

  // Set up mobile swipe functionality
  setupMobileSwipe() {
    if (!this.elements.welcomeStepsContainer) return;

    let startX = 0;
    let startY = 0;
    let isMoving = false;

    const handleStart = (e) => {
      startX = e.touches ? e.touches[0].clientX : e.clientX;
      startY = e.touches ? e.touches[0].clientY : e.clientY;
      isMoving = true;
    };

    const handleMove = (e) => {
      if (!isMoving) return;
      e.preventDefault();
    };

    const handleEnd = (e) => {
      if (!isMoving) return;
      isMoving = false;

      const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
      const endY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
      const deltaX = startX - endX;
      const deltaY = Math.abs(startY - endY);

      // Only register horizontal swipes (ignore vertical)
      if (Math.abs(deltaX) > 50 && deltaY < 100) {
        if (deltaX > 0) {
          // Swipe left (next step)
          this.nextStep();
        } else {
          // Swipe right (previous step)
          this.previousStep();
        }
      }
    };

    // Touch events
    this.elements.welcomeStepsContainer.addEventListener('touchstart', handleStart, { passive: false });
    this.elements.welcomeStepsContainer.addEventListener('touchmove', handleMove, { passive: false });
    this.elements.welcomeStepsContainer.addEventListener('touchend', handleEnd, { passive: false });

    // Mouse events for desktop testing
    this.elements.welcomeStepsContainer.addEventListener('mousedown', handleStart);
    this.elements.welcomeStepsContainer.addEventListener('mousemove', handleMove);
    this.elements.welcomeStepsContainer.addEventListener('mouseup', handleEnd);
  }

  // Navigate to next step
  nextStep() {
    if (this.currentStep < 2) {
      this.currentStep++;
      this.updateStepDisplay();
    }
  }

  // Navigate to previous step
  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.updateStepDisplay();
    }
  }

  // Update the step display and dots
  updateStepDisplay() {
    if (this.elements.welcomeSteps) {
      const translateX = -this.currentStep * 100;
      this.elements.welcomeSteps.style.transform = `translateX(${translateX}%)`;
    }

    // Update dot indicators
    this.elements.dots.forEach((dot, index) => {
      if (dot) {
        if (index === this.currentStep) {
          dot.classList.remove('opacity-50');
          dot.classList.add('opacity-100');
        } else {
          dot.classList.remove('opacity-100');
          dot.classList.add('opacity-50');
        }
      }
    });
  }

  // Check if tutorial should be shown and initialize it
  async checkAndShowTutorial() {
    try {
      const tutorialSeen = await getSetting('tutorialSeen');
      const savedSequences = await loadAllSequences();      // Show tutorial if never seen AND no sequences exist
      if (!tutorialSeen && savedSequences.length === 0) {
        this.showWelcomeModal();
      }
    } catch (error) {
      console.log('Could not check tutorial state:', error);
    }
  }  // Show the welcome modal
  showWelcomeModal() {
    if (this.elements.welcomeModal) {
      this.elements.welcomeModal.classList.remove('hidden');
      this.elements.welcomeModal.classList.add('flex');
      this.elements.welcomeModal.setAttribute('aria-hidden', 'false');

      // Reset mobile steps to beginning
      this.currentStep = 0;
      this.updateStepDisplay();

      // Focus the appropriate begin button for accessibility
      setTimeout(() => {
        const isMobile = window.innerWidth < 640;
        const targetButton = isMobile ? this.elements.beginBtnMobile : this.elements.beginBtn;
        if (targetButton && this.currentStep === 2) {
          targetButton.focus();
        }
      }, 100);
    }
  }

  // Close the welcome modal
  closeWelcomeModal() {
    if (this.elements.welcomeModal) {
      this.elements.welcomeModal.classList.add('hidden');
      this.elements.welcomeModal.classList.remove('flex');
      this.elements.welcomeModal.setAttribute('aria-hidden', 'true');

      // Reset mobile steps
      this.currentStep = 0;
      this.updateStepDisplay();
    }
  }

  // Check if welcome modal is open
  isWelcomeModalOpen() {
    return this.elements.welcomeModal && !this.elements.welcomeModal.classList.contains('hidden');
  }

  // Start the main tutorial experience (highlighting button)
  startMainTutorial() {
    this.isActive = true;
    document.body.classList.add('tutorial-active');
    this.elements.createBtn.classList.add('highlight-once');

    // Show initial tooltip
    if (window.showTooltip) {
      window.showTooltip('Start playing by clicking New Sequence!', this.elements.createBtn);
    }
  }

  // Start the tutorial experience (now just shows welcome modal)
  startTutorial() {
    this.showWelcomeModal();
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

      // Close welcome modal if still open
      this.closeWelcomeModal();
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
      }      if (this.elements.modalInstruction) {
        this.elements.modalInstruction.classList.add('hidden');
      }

      // Close welcome modal if still open
      this.closeWelcomeModal();

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
  TutorialManager
};

// Make available globally for backward compatibility and dev tools
window.tutorialManager = tutorialManager;
