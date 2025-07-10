// Accessibility enhancements for main.js

// Accessibility utilities
const AccessibilityUtils = {
  // Announce to screen readers
  announce: function(message, priority = 'polite') {
    const announcer = document.getElementById('announcements');
    if (announcer) {
      announcer.setAttribute('aria-live', priority);
      announcer.textContent = message;

      // Clear the announcement after a delay to allow for re-announcements
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  },

  // Track keyboard navigation state
  isKeyboardUser: false,

  // Initialize keyboard navigation detection
  initKeyboardDetection: function() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.isKeyboardUser = true;
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      this.isKeyboardUser = false;
      document.body.classList.remove('keyboard-navigation');
    });
  },

  // Add keyboard event handlers to sound buttons
  initSoundButtonAccessibility: function() {
    const soundButtons = document.querySelectorAll('.sound-button');

    soundButtons.forEach(button => {
      // Add keyboard support
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          button.click();
        }
      });

      // Add focus/blur handlers for tooltips
      button.addEventListener('focus', (e) => {
        const tooltip = button.getAttribute('data-tooltip');
        if (tooltip) {
          this.showTooltip(e, tooltip);
        }
      });

      button.addEventListener('blur', () => {
        this.hideTooltip();
      });

      // Enhance click feedback for screen readers
      button.addEventListener('click', (e) => {
        const audioId = button.getAttribute('data-audio');
        const ariaLabel = button.getAttribute('aria-label');

        if (audioId && audioId !== '0') {
          this.announce(`Playing ${ariaLabel || 'sound ' + audioId}`);

          // Add visual feedback for all users
          button.classList.add('playing');
          setTimeout(() => {
            button.classList.remove('playing');
          }, 500);
        } else {
          this.announce('Empty sound slot');
        }
      });
    });
  },

  // Enhanced tooltip functionality
  showTooltip: function(event, tooltipContent) {
    if (!tooltipContent) return;

    const tooltip = document.getElementById('tooltip');
    if (!tooltip) return;

    // Parse tooltip content (title||description format)
    const [title, description] = tooltipContent.split('||');

    tooltip.innerHTML = `
      <div class="tooltip-header">
        <h3>${title}</h3>
        <button id="close-tooltip" aria-label="Close tooltip">×</button>
      </div>
      <div class="tooltip-content">${description || ''}</div>
    `;

    tooltip.style.display = 'block';
    tooltip.setAttribute('aria-hidden', 'false');

    // Position tooltip
    const rect = event.target.getBoundingClientRect();
    tooltip.style.left = rect.left + rect.width / 2 + 'px';
    tooltip.style.top = rect.bottom + 10 + 'px';

    // Add close button functionality
    const closeBtn = document.getElementById('close-tooltip');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideTooltip());
    }

    // Announce tooltip content to screen readers
    this.announce(`Tooltip: ${title}. ${description ? 'Press escape to close.' : ''}`);
  },

  hideTooltip: function() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
      tooltip.setAttribute('aria-hidden', 'true');
      tooltip.innerHTML = '';
    }
  },

  // Add escape key handler for tooltips
  initTooltipKeyboard: function() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideTooltip();
      }
    });
  },

  // Enhance theme toggle accessibility
  initThemeToggleAccessibility: function() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        // Get current theme state for announcement
        setTimeout(() => {
          const isDark = document.body.classList.contains('dark-mode');
          const theme = isDark ? 'dark' : 'light';
          this.announce(`Switched to ${theme} theme`);
        }, 100);
      });

      // Add keyboard support if not already present
      themeToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          themeToggle.click();
        }
      });
    }
  },

  // Enhance navigation controls
  initNavigationAccessibility: function() {
    const scrollLeft = document.getElementById('scrollLeft');
    const scrollRight = document.getElementById('scrollRight');
    const bottomBar = document.getElementById('bottomBar');

    if (scrollLeft) {
      scrollLeft.addEventListener('click', () => {
        this.announce('Scrolled left in sequence list');
      });
    }

    if (scrollRight) {
      scrollRight.addEventListener('click', () => {
        this.announce('Scrolled right in sequence list');
      });
    }

    // Add keyboard navigation for sequence bar
    if (bottomBar) {
      bottomBar.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          if (scrollLeft) scrollLeft.click();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          if (scrollRight) scrollRight.click();
        }
      });
    }
  },

  // Add grid navigation with arrow keys
  initGridNavigation: function() {
    const soundButtons = Array.from(document.querySelectorAll('.sound-button'));
    let currentFocusIndex = -1;

    // Create a 2D array representing the grid layout
    const gridLayout = this.createGridLayout(soundButtons);

    document.addEventListener('keydown', (e) => {
      // Only handle arrow keys when a sound button is focused
      const activeElement = document.activeElement;
      if (!activeElement || !activeElement.classList.contains('sound-button')) {
        return;
      }

      currentFocusIndex = soundButtons.indexOf(activeElement);
      if (currentFocusIndex === -1) return;

      let newIndex = currentFocusIndex;

      switch(e.key) {
        case 'ArrowUp':
          e.preventDefault();
          newIndex = this.findButtonAbove(currentFocusIndex, gridLayout);
          break;
        case 'ArrowDown':
          e.preventDefault();
          newIndex = this.findButtonBelow(currentFocusIndex, gridLayout);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          newIndex = this.findButtonLeft(currentFocusIndex, gridLayout);
          break;
        case 'ArrowRight':
          e.preventDefault();
          newIndex = this.findButtonRight(currentFocusIndex, gridLayout);
          break;
      }

      if (newIndex !== currentFocusIndex && newIndex >= 0 && newIndex < soundButtons.length) {
        soundButtons[newIndex].focus();
        this.announce(`Navigated to ${soundButtons[newIndex].getAttribute('aria-label')}`);
      }
    });
  },

  // Helper function to create grid layout mapping
  createGridLayout: function(buttons) {
    // This is a simplified version - you might need to adjust based on your actual grid layout
    const grid = [];
    const buttonPositions = new Map();

    buttons.forEach((button, index) => {
      const rect = button.getBoundingClientRect();
      buttonPositions.set(index, { x: rect.left, y: rect.top });
    });

    return buttonPositions;
  },

  // Navigation helper functions
  findButtonAbove: function(currentIndex, gridLayout) {
    const currentPos = gridLayout.get(currentIndex);
    if (!currentPos) return currentIndex;

    let closestIndex = currentIndex;
    let closestDistance = Infinity;

    for (let [index, pos] of gridLayout) {
      if (pos.y < currentPos.y && Math.abs(pos.x - currentPos.x) < 50) {
        const distance = Math.abs(pos.y - currentPos.y);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      }
    }

    return closestIndex;
  },

  findButtonBelow: function(currentIndex, gridLayout) {
    const currentPos = gridLayout.get(currentIndex);
    if (!currentPos) return currentIndex;

    let closestIndex = currentIndex;
    let closestDistance = Infinity;

    for (let [index, pos] of gridLayout) {
      if (pos.y > currentPos.y && Math.abs(pos.x - currentPos.x) < 50) {
        const distance = Math.abs(pos.y - currentPos.y);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      }
    }

    return closestIndex;
  },

  findButtonLeft: function(currentIndex, gridLayout) {
    const currentPos = gridLayout.get(currentIndex);
    if (!currentPos) return currentIndex;

    let closestIndex = currentIndex;
    let closestDistance = Infinity;

    for (let [index, pos] of gridLayout) {
      if (pos.x < currentPos.x && Math.abs(pos.y - currentPos.y) < 50) {
        const distance = Math.abs(pos.x - currentPos.x);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      }
    }

    return closestIndex;
  },

  findButtonRight: function(currentIndex, gridLayout) {
    const currentPos = gridLayout.get(currentIndex);
    if (!currentPos) return currentIndex;

    let closestIndex = currentIndex;
    let closestDistance = Infinity;

    for (let [index, pos] of gridLayout) {
      if (pos.x > currentPos.x && Math.abs(pos.y - currentPos.y) < 50) {
        const distance = Math.abs(pos.x - currentPos.x);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      }
    }

    return closestIndex;
  },

  // Initialize all accessibility features
  init: function() {
    this.initKeyboardDetection();
    this.initSoundButtonAccessibility();
    this.initTooltipKeyboard();
    this.initThemeToggleAccessibility();
    this.initNavigationAccessibility();
    this.initGridNavigation();

    // Announce page load
    this.announce('Sound grid interface loaded. Use Tab to navigate, Enter or Space to activate sounds.');
  }
};

// Initialize accessibility features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  AccessibilityUtils.init();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AccessibilityUtils;
}
