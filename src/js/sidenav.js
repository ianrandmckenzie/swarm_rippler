// Sidenav management functionality
import { setSetting } from './storage.js';

class SidenavManager {
  constructor() {
    this.sidenav = document.getElementById('sidenav');
    this.toggleBtn = document.getElementById('sidenavToggle');
    this.closeBtn = document.getElementById('sidenavClose');
    this.infoBtn = document.getElementById('infoBtn');
    this.resetTutorialBtn = document.getElementById('resetTutorialBtn');
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
      this.toggle();
    });

    // Close button
    this.closeBtn.addEventListener('click', () => {
      this.close();
    });

    // Info button (placeholder for now)
    this.infoBtn.addEventListener('click', () => {
      if (window.showTooltip) {
        window.showTooltip('App information - Coming soon!', this.infoBtn);
        setTimeout(() => {
          if (window.hideTooltip) {
            window.hideTooltip();
          }
        }, 2000);
      }
    });

    // Reset tutorial button
    this.resetTutorialBtn.addEventListener('click', () => {
      this.resetTutorial();
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
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
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
      await setSetting('tutorialSeen', false);

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
