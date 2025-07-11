// Tutorial functionality for Clicking Glossolalia
//
// CUSTOMIZATION GUIDE:
// 1. Edit the content in the `updateTutorialContent()` method to change tutorial text
// 2. Modify the CSS in tutorial.css to adjust styling
// 3. Update the step logic in each case statement to match your specific needs
// 4. Use the debug commands in the browser console:
//    - tutorialDebug.start() - manually start the tutorial
//    - tutorialDebug.reset() - reset tutorial status
//    - tutorialDebug.status() - check current status
//    - tutorialDebug.step(n) - jump to specific step (0-3)

class Tutorial {
  constructor() {
    this.currentStep = 0;
    this.maxSteps = 4; // intro, step1, step2, step3
    this.selectedCircles = new Set();
    this.isActive = false;
    this.storage = null;
    this.tutorialKey = 'tutorial_completed';
    this.dontShowKey = 'tutorial_dont_show';

    this.init();
  }

  async init() {
    // Initialize storage - use the global storage instance if available
    try {
      if (typeof storage !== 'undefined') {
        this.storage = storage;
      } else {
        // Create our own instance if global one doesn't exist
        this.storage = new PersistentStorage();
        await this.storage.init();
      }
    } catch (error) {
      console.warn('Tutorial storage initialization failed, using localStorage fallback');
      this.storage = {
        getTutorialStatus: () => Promise.resolve(localStorage.getItem(this.tutorialKey) === 'true'),
        setTutorialStatus: (status) => {
          localStorage.setItem(this.tutorialKey, status);
          return Promise.resolve();
        },
        getDontShowStatus: () => Promise.resolve(localStorage.getItem(this.dontShowKey) === 'true'),
        setDontShowStatus: (status) => {
          localStorage.setItem(this.dontShowKey, status);
          return Promise.resolve();
        },
        getTutorialStep: () => Promise.resolve(parseInt(localStorage.getItem('tutorial_step') || '0')),
        setTutorialStep: (step) => {
          localStorage.setItem('tutorial_step', step.toString());
          return Promise.resolve();
        },
        clearTutorialStep: () => {
          localStorage.removeItem('tutorial_step');
          return Promise.resolve();
        }
      };
    }

    this.createTutorialElements();
    this.bindEvents();

    // Check if we should show the tutorial
    await this.checkShouldShowTutorial();
  }

  createTutorialElements() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'tutorial-overlay';
    overlay.id = 'tutorial-overlay';
    document.body.appendChild(overlay);

    // Create sidebar
    const sidebar = document.createElement('div');
    sidebar.className = 'tutorial-sidebar';
    sidebar.id = 'tutorial-sidebar';

    sidebar.innerHTML = `
      <div class="tutorial-step-counter" id="tutorial-step-counter">Step 1 of 4</div>
      <div class="tutorial-progress" id="tutorial-progress">
        <div class="tutorial-progress-dot active"></div>
        <div class="tutorial-progress-dot"></div>
        <div class="tutorial-progress-dot"></div>
        <div class="tutorial-progress-dot"></div>
      </div>
      <h2 id="tutorial-title">Welcome to Clicking Glossolalia!</h2>
      <div class="tutorial-content" id="tutorial-content">
        <p>This is a brief tutorial to help you get started with creating your own clicking word sequences.</p>
        <p>Would you like to take a quick tour or skip straight to exploring?</p>
      </div>
      <div class="tutorial-buttons" id="tutorial-buttons">
        <button class="tutorial-button" id="tutorial-begin">Begin Tutorial</button>
        <button class="tutorial-button secondary" id="tutorial-skip">Skip Tutorial</button>
      </div>
      <div class="tutorial-checkbox-container">
        <input type="checkbox" class="tutorial-checkbox" id="tutorial-dont-show">
        <label for="tutorial-dont-show" class="tutorial-checkbox-label">Don't show this tutorial again</label>
      </div>
    `;

    document.body.appendChild(sidebar);
  }

  bindEvents() {
    // Button events
    document.getElementById('tutorial-begin').addEventListener('click', () => this.nextStep());
    document.getElementById('tutorial-skip').addEventListener('click', () => this.skipTutorial());

    // Checkbox for don't show again
    document.getElementById('tutorial-dont-show').addEventListener('change', (e) => {
      this.storage.setDontShowStatus(e.target.checked);
    });

    // Close tutorial when clicking overlay (only in final step)
    document.getElementById('tutorial-overlay').addEventListener('click', () => {
      if (this.currentStep === this.maxSteps - 1) {
        this.closeTutorial();
      }
    });
  }

  async checkShouldShowTutorial() {
    try {
      const dontShow = await this.storage.getDontShowStatus();
      const completed = await this.storage.getTutorialStatus();
      const savedStep = await this.storage.getTutorialStep();

      console.log('Tutorial: Checking status -', { dontShow, completed, savedStep });

      if (dontShow) {
        console.log('Tutorial: User opted out, not showing');
        return;
      }

      if (completed) {
        console.log('Tutorial: Already completed, not showing');
        return;
      }

      // If there's a saved step and tutorial is in progress, resume from that step
      if (savedStep > 0) {
        console.log(`Tutorial: Resuming from step ${savedStep}`);
        this.currentStep = savedStep;
        // Show tutorial after a short delay
        setTimeout(() => this.showTutorial(), 1000);
      } else {
        console.log('Tutorial: Starting from beginning');
        // Show tutorial from the beginning after a short delay
        setTimeout(() => this.showTutorial(), 1000);
      }
    } catch (error) {
      console.warn('Error checking tutorial status:', error);
      // Default to showing tutorial from beginning
      setTimeout(() => this.showTutorial(), 1000);
    }
  }

  showTutorial() {
    this.isActive = true;
    // Don't reset currentStep here since it might be loaded from storage
    this.updateTutorialContent();

    const overlay = document.getElementById('tutorial-overlay');
    const sidebar = document.getElementById('tutorial-sidebar');

    overlay.classList.add('active');
    sidebar.classList.add('active');

    // Prevent scrolling while tutorial is active
    document.body.style.overflow = 'hidden';

    console.log(`Tutorial: Showing tutorial at step ${this.currentStep}`);
  }

  hideTutorial() {
    const overlay = document.getElementById('tutorial-overlay');
    const sidebar = document.getElementById('tutorial-sidebar');

    overlay.classList.remove('active');
    sidebar.classList.remove('active');

    // Restore scrolling
    document.body.style.overflow = '';

    this.isActive = false;
  }

  nextStep() {
    if (this.currentStep < this.maxSteps - 1) {
      this.currentStep++;
      // Save the current step to storage
      this.storage.setTutorialStep(this.currentStep).catch(error => {
        console.warn('Tutorial: Failed to save step to storage', error);
      });
      this.updateTutorialContent();
      console.log(`Tutorial: Advanced to step ${this.currentStep}`);
    }
  }

  skipTutorial() {
    const dontShow = document.getElementById('tutorial-dont-show').checked;
    if (dontShow) {
      this.storage.setDontShowStatus(true);
    }
    // Clear the step when skipping
    this.storage.clearTutorialStep().catch(error => {
      console.warn('Tutorial: Failed to clear step from storage', error);
    });
    console.log('Tutorial: Skipped by user');
    this.closeTutorial();
  }

  async closeTutorial() {
    await this.storage.setTutorialStatus(true);
    // Clear the step when completing tutorial
    await this.storage.clearTutorialStep().catch(error => {
      console.warn('Tutorial: Failed to clear step from storage', error);
    });
    console.log('Tutorial: Completed and closed');
    this.hideTutorial();
    this.cleanup();
  }

  cleanup() {
    // Remove any highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });

    // Remove overlay pointer events
    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) {
      overlay.style.pointerEvents = 'none';
    }
  }

  updateTutorialContent() {
    const title = document.getElementById('tutorial-title');
    const content = document.getElementById('tutorial-content');
    const buttons = document.getElementById('tutorial-buttons');
    const stepCounter = document.getElementById('tutorial-step-counter');
    const progressDots = document.querySelectorAll('.tutorial-progress-dot');
    const overlay = document.getElementById('tutorial-overlay');
    const checkbox = document.querySelector('.tutorial-checkbox-container');

    // Validate current step based on current page
    const isNewWordPage = window.location.pathname.includes('new_word') ||
                         window.location.pathname.includes('new-word') ||
                         window.location.pathname.endsWith('new_word.html') ||
                         document.getElementById('save') !== null;

    // Step validation: adjust step based on page context
    if (this.currentStep === 1 && isNewWordPage) {
      // User clicked "Create New Word" and is now on new word page, advance to step 2
      console.log('Tutorial: Detected navigation to new word page, advancing to step 2');
      this.currentStep = 2;
      this.storage.setTutorialStep(this.currentStep).catch(error => {
        console.warn('Tutorial: Failed to save step adjustment', error);
      });
    } else if (this.currentStep === 2 && !isNewWordPage) {
      // User is on step 2 but not on new word page, go back to step 1
      console.log('Tutorial: On index page but step 2, going back to step 1');
      this.currentStep = 1;
      this.storage.setTutorialStep(this.currentStep).catch(error => {
        console.warn('Tutorial: Failed to save step adjustment', error);
      });
    }

    // Update progress dots
    progressDots.forEach((dot, index) => {
      dot.classList.remove('active', 'completed');
      if (index < this.currentStep) {
        dot.classList.add('completed');
      } else if (index === this.currentStep) {
        dot.classList.add('active');
      }
    });

    // Update step counter
    stepCounter.textContent = `Step ${this.currentStep + 1} of ${this.maxSteps}`;

    switch (this.currentStep) {
      case 0: // Introduction
        title.textContent = 'Welcome to Clicking Glossolalia!';
        content.innerHTML = `
          <p>This tutorial will guide you through creating your first clicking word sequence.</p>
          <p><em>Note: This is a temporary tutorial that you can customize with your own content later.</em></p>
          <p>Would you like to take a quick tour or skip straight to exploring?</p>
        `;
        buttons.innerHTML = `
          <button class="tutorial-button" id="tutorial-begin">Begin Tutorial</button>
          <button class="tutorial-button secondary" id="tutorial-skip">Skip Tutorial</button>
        `;
        checkbox.style.display = 'flex';
        overlay.style.pointerEvents = 'none';
        this.cleanup();
        break;

      case 1: // Step 1 - New Word button (only show on index page)
        if (!isNewWordPage) {
          title.textContent = 'Step 1: Create a New Word';
          content.innerHTML = `
            <p>Let's start by creating a new word sequence. Click the <strong>"Create New Word"</strong> button to begin.</p>
            <p>This will take you to the word creation page where you can build your own unique clicking sequence.</p>
            <p><em>You can customize this tutorial content to match your specific needs.</em></p>
          `;
          buttons.innerHTML = `
            <button class="tutorial-button secondary" id="tutorial-skip">Skip Tutorial</button>
          `;
          checkbox.style.display = 'flex';
          overlay.style.pointerEvents = 'auto';
          this.highlightNewWordButton();
        } else {
          // If somehow on new word page but step 1, advance to step 2
          this.currentStep = 2;
          this.updateTutorialContent();
          return;
        }
        break;

      case 2: // Step 2 - Select circles (only show on new word page)
        if (isNewWordPage) {
          title.textContent = 'Step 2: Select Your Sounds';
          content.innerHTML = `
            <p>Now click on at least <strong>5 circles</strong> with thinner borders to create your word sequence.</p>
            <p>Each circle represents a different clicking sound. Try different combinations to create unique words!</p>
            <p><strong>Selected sounds:</strong> <span id="selected-count">0</span>/5 minimum</p>
            <p><em>The highlighted circles are the ones you can select.</em></p>
          `;
          buttons.innerHTML = `
            <button class="tutorial-button secondary" id="tutorial-skip">Skip Tutorial</button>
          `;
          checkbox.style.display = 'flex';
          overlay.style.pointerEvents = 'auto';
          this.highlightSelectableCircles();
        } else {
          // If somehow on index page but step 2, go back to step 1
          this.currentStep = 1;
          this.updateTutorialContent();
          return;
        }
        break;

      case 3: // Step 3 - Save and finish
        title.textContent = 'Congratulations!';
        content.innerHTML = `
          <p>🎉 Great job! You've created your first clicking word sequence.</p>
          <p>Your selection is now ready to be saved. Click the <strong>"Save Sequence"</strong> button to store your creation.</p>
          <p>You can create as many unique sequences as you like and experiment with different combinations.</p>
          <p><em>Remember: You can customize all of this tutorial content with your own writing!</em></p>
        `;
        buttons.innerHTML = `
          <button class="tutorial-button" id="tutorial-close">Close Tutorial</button>
        `;
        checkbox.style.display = 'none';
        overlay.style.pointerEvents = 'none';
        // Check the don't show checkbox automatically
        document.getElementById('tutorial-dont-show').checked = true;
        this.storage.setDontShowStatus(true);
        this.highlightNewWord();
        break;
    }

    // Re-bind events for new buttons
    this.bindButtonEvents();
  }

  bindButtonEvents() {
    const beginBtn = document.getElementById('tutorial-begin');
    const skipBtn = document.getElementById('tutorial-skip');
    const closeBtn = document.getElementById('tutorial-close');

    if (beginBtn) {
      beginBtn.addEventListener('click', () => this.nextStep());
    }
    if (skipBtn) {
      skipBtn.addEventListener('click', () => this.skipTutorial());
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeTutorial());
    }
  }

  highlightNewWordButton() {
    this.cleanup();
    const newWordBtn = document.querySelector('.new-sequence-button, a[href*="new_word"]');
    if (newWordBtn) {
      // Preserve original positioning
      const originalPos = window.getComputedStyle(newWordBtn).position;
      newWordBtn.classList.add('tutorial-highlight');
      // If this element was fixed, restore its fixed positioning
      if (originalPos === 'fixed') {
        newWordBtn.style.position = 'fixed';
      }
    }
  }

  highlightSelectableCircles() {
    this.cleanup();
    // Find circles that are selectable (have audio data and are not "0")
    const selectableCircles = document.querySelectorAll('.grid div div');
    let highlightedCount = 0;

    selectableCircles.forEach(circle => {
      // Check if this circle has audio data by looking at its parent
      const parent = circle.parentElement;
      if (parent && parent.dataset.audio && parent.dataset.audio !== "0") {
        circle.classList.add('tutorial-highlight');
        highlightedCount++;
      }
    });

    console.log(`Highlighted ${highlightedCount} selectable circles`);

    // Monitor circle selection
    this.monitorCircleSelection();
  }

  highlightNewWord() {
    this.cleanup();
    const saveBtn = document.getElementById('save');
    const newWordDisplay = document.querySelector('.new-word-display, .sequence-display');

    if (saveBtn) {
      saveBtn.classList.add('tutorial-highlight');
    }
    if (newWordDisplay) {
      newWordDisplay.classList.add('tutorial-highlight');
    }
  }

  monitorCircleSelection() {
    // Check if we're on the new word page
    const isNewWordPage = window.location.pathname.includes('new_word') ||
                         window.location.pathname.includes('new-word') ||
                         window.location.pathname.endsWith('new_word.html') ||
                         document.getElementById('save') !== null; // Alternative check

    if (isNewWordPage) {
      console.log('Tutorial: Monitoring circle selection on new word page');

      // Monitor the circle selections
      const updateSelectionCount = () => {
        const selectedCircles = document.querySelectorAll('.grid div div.clicked');
        const count = selectedCircles.length;

        console.log(`Tutorial: ${count} circles selected`);

        // Update the tutorial content to show current selection count
        const countSpan = document.getElementById('selected-count');
        if (countSpan) {
          countSpan.textContent = count;
        }

        // Enable/disable save button based on selection count
        const saveBtn = document.getElementById('save');
        if (saveBtn) {
          if (count >= 5) {
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
            saveBtn.style.cursor = 'pointer';
            // Move to next step when 5+ circles are selected
            if (this.currentStep === 2 && count >= 5) {
              console.log('Tutorial: Moving to final step');
              // Auto-advance to the next step after a short delay
              setTimeout(() => {
                this.nextStep();
              }, 1500);
            }
          } else {
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.5';
            saveBtn.style.cursor = 'not-allowed';
          }
        }
      };

      // Listen for clicks on grid cells
      const gridCells = document.querySelectorAll('.grid div div');
      console.log(`Tutorial: Found ${gridCells.length} grid cells to monitor`);

      gridCells.forEach(cell => {
        cell.addEventListener('click', () => {
          // Small delay to let the clicked class be added/removed
          setTimeout(updateSelectionCount, 50);
        });
      });

      // Initial count
      updateSelectionCount();
    } else {
      console.log('Tutorial: Not on new word page, skipping circle selection monitoring');
    }
  }

  // Method to manually trigger tutorial steps (for testing)
  triggerStep(step) {
    if (step >= 0 && step < this.maxSteps) {
      this.currentStep = step;
      this.updateTutorialContent();
      if (!this.isActive) {
        this.showTutorial();
      }
    }
  }

  // Method to reset tutorial status
  async resetTutorial() {
    try {
      await this.storage.setTutorialStatus(false);
      await this.storage.setDontShowStatus(false);
      await this.storage.clearTutorialStep();
      console.log('Tutorial: Status and step reset successfully');
    } catch (error) {
      console.warn('Tutorial: Failed to reset status', error);
    }
  }

  // Method to manually start tutorial (for testing)
  startTutorial() {
    console.log('Tutorial: Manually starting tutorial');
    this.currentStep = 0;
    this.storage.setTutorialStep(0).catch(error => {
      console.warn('Tutorial: Failed to save initial step', error);
    });
    this.showTutorial();
  }

  // Method to get current tutorial status (for debugging)
  async getTutorialStatus() {
    try {
      const completed = await this.storage.getTutorialStatus();
      const dontShow = await this.storage.getDontShowStatus();
      const currentStep = await this.storage.getTutorialStep();
      return { completed, dontShow, currentStep };
    } catch (error) {
      console.warn('Tutorial: Failed to get status', error);
      return { completed: false, dontShow: false, currentStep: 0 };
    }
  }
}

// Initialize tutorial when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Tutorial: DOM loaded, initializing tutorial...');
  // Small delay to ensure other scripts are loaded
  setTimeout(() => {
    console.log('Tutorial: Creating tutorial instance');
    window.tutorial = new Tutorial();

    // Add some debugging helpers to the window object
    window.tutorialDebug = {
      start: () => window.tutorial.startTutorial(),
      reset: () => window.tutorial.resetTutorial(),
      status: () => window.tutorial.getTutorialStatus(),
      step: (n) => window.tutorial.triggerStep(n)
    };

    console.log('Tutorial: Available debug commands:', Object.keys(window.tutorialDebug));
  }, 500);
});

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Tutorial;
}
