// Accessibility enhancements for Swarm Rippler
// High contrast mode and other accessibility features

class AccessibilityManager {
  constructor() {
    this.highContrastMode = localStorage.getItem('swarm-high-contrast') === 'true';
    this.init();
  }

  init() {
    // Initialize high contrast mode if enabled
    if (this.highContrastMode) {
      this.enableHighContrast();
    }

    // Add event listener for high contrast button
    const highContrastBtn = document.getElementById('highContrastBtn');
    if (highContrastBtn) {
      highContrastBtn.addEventListener('click', () => {
        this.toggleHighContrast();
      });
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl+Alt+C for high contrast toggle
      if (e.ctrlKey && e.altKey && e.key === 'c') {
        e.preventDefault();
        this.toggleHighContrast();
      }
    });

    // Announce keyboard shortcuts to screen readers on focus
    this.addKeyboardShortcutInstructions();
  }

  toggleHighContrast() {
    this.highContrastMode = !this.highContrastMode;
    localStorage.setItem('swarm-high-contrast', this.highContrastMode.toString());

    if (this.highContrastMode) {
      this.enableHighContrast();
    } else {
      this.disableHighContrast();
    }

    // Announce the change to screen readers
    this.announceContrastChange();
  }

  enableHighContrast() {
    document.body.classList.add('high-contrast');
    const btn = document.getElementById('highContrastBtn');
    if (btn) {
      btn.setAttribute('aria-pressed', 'true');
      btn.title = 'Disable high contrast mode';
    }
  }

  disableHighContrast() {
    document.body.classList.remove('high-contrast');
    const btn = document.getElementById('highContrastBtn');
    if (btn) {
      btn.setAttribute('aria-pressed', 'false');
      btn.title = 'Enable high contrast mode';
    }
  }

  announceContrastChange() {
    const announcements = document.getElementById('canvas-announcements');
    if (announcements) {
      announcements.textContent = this.highContrastMode
        ? 'High contrast mode enabled'
        : 'High contrast mode disabled';
    }
  }

  addKeyboardShortcutInstructions() {
    // Add keyboard shortcut information that screen readers can access
    const shortcutInfo = document.createElement('div');
    shortcutInfo.className = 'sr-only';
    shortcutInfo.innerHTML = `
      <h3>Keyboard Shortcuts</h3>
      <ul>
        <li>Ctrl+Alt+C: Toggle high contrast mode</li>
        <li>Arrow keys: Navigate sound grid</li>
        <li>Space/Enter: Activate sounds</li>
        <li>Home: Return to center circle</li>
        <li>Tab: Navigate interface elements</li>
        <li>Escape: Close modals</li>
      </ul>
    `;
    document.body.appendChild(shortcutInfo);
  }
}

// Initialize accessibility manager when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.accessibilityManager = new AccessibilityManager();
  });
} else {
  window.accessibilityManager = new AccessibilityManager();
}

export { AccessibilityManager };
