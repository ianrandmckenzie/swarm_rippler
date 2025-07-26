// Sidenav management functionality
import { VisualFeedback, hapticFeedback } from './feedback.js';
import { tutorialManager } from './tutorial.js';

class SidenavManager {
  constructor() {
    this.sidenav = document.getElementById('sidenav');
    this.toggleBtn = document.getElementById('sidenavToggle');
    this.closeBtn = document.getElementById('sidenavClose');
    this.infoBtn = document.getElementById('infoBtn');
    this.resetTutorialBtn = document.getElementById('resetTutorialBtn');
    this.appInfoModal = document.getElementById('appInfoModal');
    this.closeAppInfoBtn = document.getElementById('closeAppInfoBtn');
    this.isOpen = false;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupTooltips();
  }

  setupEventListeners() {
    // Toggle button
    this.toggleBtn.addEventListener('click', () => {
      VisualFeedback.bounce(this.toggleBtn, 1.1, 120);
      hapticFeedback.trigger('light');
      this.toggle();
    });

    // Close button
    this.closeBtn.addEventListener('click', () => {
      VisualFeedback.press(this.closeBtn, 0.9, 100);
      hapticFeedback.trigger('light');
      this.close();
    });

    // Info button (opens app info modal)
    this.infoBtn.addEventListener('click', () => {
      VisualFeedback.bounce(this.infoBtn, 1.1, 120);
      hapticFeedback.trigger('light');
      this.openAppInfoModal();
    });

    // Reset tutorial button
    this.resetTutorialBtn.addEventListener('click', () => {
      VisualFeedback.bounce(this.resetTutorialBtn, 1.1, 120);
      hapticFeedback.trigger('medium');
      this.resetTutorial();
    });

    // App info modal close button
    this.closeAppInfoBtn.addEventListener('click', () => {
      VisualFeedback.press(this.closeAppInfoBtn, 0.95, 100);
      hapticFeedback.trigger('light');
      this.closeAppInfoModal();
    });

    // Close modal when clicking outside
    this.appInfoModal.addEventListener('click', (e) => {
      // Check if clicked element is the modal background (not the modal content)
      if (e.target === this.appInfoModal) {
        this.closeAppInfoModal();
      }
    });

    // Close sidenav when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isOpen &&
          !this.sidenav.contains(e.target) &&
          !this.toggleBtn.contains(e.target)) {
        this.close();
      }
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.appInfoModal && !this.appInfoModal.classList.contains('hidden')) {
          this.closeAppInfoModal();
        } else if (this.isOpen) {
          this.close();
        }
      }
    });
  }

  setupTooltips() {
    // Info button tooltip
    this.infoBtn.addEventListener('mouseenter', () => {
      if (window.showTooltip && window.innerWidth >= 640) {
        window.showTooltip('App information', this.infoBtn);
      }
    });

    this.infoBtn.addEventListener('mouseleave', () => {
      if (window.hideTooltip && window.innerWidth >= 640) {
        window.hideTooltip();
      }
    });

    // Reset tutorial button tooltip
    this.resetTutorialBtn.addEventListener('mouseenter', () => {
      if (window.showTooltip && window.innerWidth >= 640) {
        window.showTooltip('Reset tutorial', this.resetTutorialBtn);
      }
    });

    this.resetTutorialBtn.addEventListener('mouseleave', () => {
      if (window.hideTooltip && window.innerWidth >= 640) {
        window.hideTooltip();
      }
    });

    // Toggle button tooltip
    this.toggleBtn.addEventListener('mouseenter', () => {
      if (window.showTooltip && window.innerWidth >= 640) {
        const text = this.isOpen ? 'Close side panel' : 'Open side panel';
        window.showTooltip(text, this.toggleBtn);
      }
    });

    this.toggleBtn.addEventListener('mouseleave', () => {
      if (window.hideTooltip && window.innerWidth >= 640) {
        window.hideTooltip();
      }
    });

    // Close button tooltip
    this.closeBtn.addEventListener('mouseenter', () => {
      if (window.showTooltip && window.innerWidth >= 640) {
        window.showTooltip('Close side panel', this.closeBtn);
      }
    });

    this.closeBtn.addEventListener('mouseleave', () => {
      if (window.hideTooltip && window.innerWidth >= 640) {
        window.hideTooltip();
      }
    });
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this.sidenav.classList.remove('translate-x-full');
    this.sidenav.classList.add('translate-x-0');

    // Update toggle button icon and tooltip
    this.updateToggleButton();
  }

  close() {
    this.isOpen = false;
    this.sidenav.classList.remove('translate-x-0');
    this.sidenav.classList.add('translate-x-full');

    // Update toggle button icon and tooltip
    this.updateToggleButton();

    // Hide any tooltips when closing
    if (window.hideTooltip) {
      window.hideTooltip();
    }
  }

  updateToggleButton() {
    const icon = this.toggleBtn.querySelector('svg path');
    if (this.isOpen) {
      // Change to left arrow (close)
      icon.setAttribute('d', 'M15 19l-7-7 7-7');
      this.toggleBtn.setAttribute('title', 'Close side panel');
      this.toggleBtn.setAttribute('aria-label', 'Close side panel');
    } else {
      // Change to right arrow (open)
      icon.setAttribute('d', 'M9 5l7 7-7 7');
      this.toggleBtn.setAttribute('title', 'Open side panel');
      this.toggleBtn.setAttribute('aria-label', 'Open side panel');
    }
  }

  async resetTutorial() {
    try {
      const success = await tutorialManager.resetTutorial();

      if (success) {
        // Show confirmation tooltip
        if (window.showTooltip) {
          window.showTooltip('Tutorial reset! Reload page to see tutorial.', this.resetTutorialBtn);
          setTimeout(() => {
            if (window.hideTooltip) {
              window.hideTooltip();
            }
          }, 3000);
        }

        // Optional: Ask if user wants to reload
        setTimeout(() => {
          const shouldReload = confirm('Tutorial has been reset! Would you like to reload the page to see the tutorial?');
          if (shouldReload) {
            window.location.reload();
          }
        }, 500);
      } else {
        throw new Error('Failed to reset tutorial');
      }
    } catch (error) {
      console.error('Error resetting tutorial:', error);

      if (window.showTooltip) {
        window.showTooltip('Error resetting tutorial. Please try again.', this.resetTutorialBtn);
        setTimeout(() => {
          if (window.hideTooltip) {
            window.hideTooltip();
          }
        }, 3000);
      }
    }
  }

  openAppInfoModal() {
    if (this.appInfoModal) {
      this.appInfoModal.classList.remove('hidden');
      this.appInfoModal.classList.add('flex');
      this.appInfoModal.setAttribute('aria-hidden', 'false');

      // Close the sidenav when opening the modal
      this.close();

      // Focus management for accessibility
      setTimeout(() => {
        this.closeAppInfoBtn.focus();
      }, 100);
    }
  }

  closeAppInfoModal() {
    if (this.appInfoModal) {
      this.appInfoModal.classList.add('hidden');
      this.appInfoModal.classList.remove('flex');
      this.appInfoModal.setAttribute('aria-hidden', 'true');

      // Return focus to the info button
      this.infoBtn.focus();
    }
  }
}

// Initialize sidenav when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.sidenavManager = new SidenavManager();
  });
} else {
  window.sidenavManager = new SidenavManager();
}

export { SidenavManager };
