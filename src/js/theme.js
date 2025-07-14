// Theme management functionality
import { getPreferences, savePreferences } from './storage.js';
import { VisualFeedback, hapticFeedback } from './feedback.js';

class ThemeManager {
  constructor() {
    this.themes = ['light', 'dark', 'system'];
    this.currentTheme = 'system';
    this.init();
  }

  async init() {
    // Load theme preference from storage
    await this.loadThemePreference();

    // Apply initial theme
    this.applyTheme(this.currentTheme);

    // Set up event listeners
    this.setupEventListeners();

    // Listen for system theme changes
    this.setupSystemThemeListener();

    // Update UI to reflect current theme
    this.updateThemeButtons();

    // Wait a small amount to ensure all theme changes are applied
    await new Promise(resolve => setTimeout(resolve, 50));

    // Signal that theme manager is fully initialized
    this.initialized = true;
    window.dispatchEvent(new CustomEvent('themeManagerReady'));
  }

  async loadThemePreference() {
    try {
      const preferences = await getPreferences();
      this.currentTheme = preferences.theme || 'system';
    } catch (error) {
      console.log('No stored theme preference, using system default');
      this.currentTheme = 'system';
    }
  }

  async saveThemePreference(theme) {
    try {
      const preferences = await getPreferences();
      preferences.theme = theme;
      await savePreferences(preferences);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }

  setupEventListeners() {
    const themeButtons = document.querySelectorAll('button[data-theme]');

    themeButtons.forEach(button => {
      const theme = button.dataset.theme;

      // Click handler
      button.addEventListener('click', (e) => {
        const clickedTheme = e.currentTarget.dataset.theme;

        // Add visual and haptic feedback
        VisualFeedback.bounce(button, 1.08, 150);
        hapticFeedback.trigger('light');

        this.setTheme(clickedTheme);

        // Show mobile tooltip temporarily after selection
        if (window.innerWidth < 640) {
          this.showMobileTooltip(button, clickedTheme);
        }
      });

      // Hover tooltips for desktop
      button.addEventListener('mouseenter', (e) => {
        // Only show hover tooltips on larger screens
        if (window.innerWidth >= 640) {
          this.showThemeTooltip(e.currentTarget, theme);
        }
      });

      button.addEventListener('mouseleave', () => {
        if (window.innerWidth >= 640) {
          this.hideTooltip();
        }
      });
    });
  }

  setupSystemThemeListener() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    mediaQuery.addEventListener('change', () => {
      if (this.currentTheme === 'system') {
        this.applySystemTheme();
      }
    });
  }

  async setTheme(theme) {
    if (!this.themes.includes(theme)) return;

    this.currentTheme = theme;
    await this.saveThemePreference(theme);
    this.applyTheme(theme);
    this.updateThemeButtons();
  }

  applyTheme(theme) {
    const html = document.documentElement;

    // Remove existing theme classes
    html.classList.remove('dark', 'light');

    if (theme === 'dark') {
      html.classList.add('dark');
    } else if (theme === 'light') {
      html.classList.add('light');
    } else if (theme === 'system') {
      this.applySystemTheme();
    }

    // Update meta theme-color for mobile browsers
    this.updateMetaThemeColor(theme);

    // Update loop-related UI elements after theme change
    if (window.audioSystem && window.audioSystem.updateThumbnailLoopStates) {
      window.audioSystem.updateThumbnailLoopStates();
    }
  }

  applySystemTheme() {
    const html = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    html.classList.remove('dark', 'light');

    if (prefersDark) {
      html.classList.add('dark');
    } else {
      html.classList.add('light');
    }

    // Update loop-related UI elements after system theme change
    if (window.audioSystem && window.audioSystem.updateThumbnailLoopStates) {
      window.audioSystem.updateThumbnailLoopStates();
    }
  }

  updateMetaThemeColor(theme) {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const metaTileColor = document.querySelector('meta[name="msapplication-TileColor"]');

    let color;
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      color = '#232323'; // swarmshadow-50
    } else {
      color = '#1F1F1F'; // swarmshadow-200
    }

    if (metaThemeColor) metaThemeColor.setAttribute('content', color);
    if (metaTileColor) metaTileColor.setAttribute('content', color);
  }

  updateThemeButtons() {
    const themeButtons = document.querySelectorAll('button[data-theme]');

    themeButtons.forEach(button => {
      // Remove all active state classes
      button.classList.remove(
        'bg-swarmshadow-200', 'text-swarmlight-100', 'ring-2', 'ring-swarmlight-300',
        'bg-swarmlight-300', 'text-swarmshadow-200', 'ring-swarmshadow-200',
        'bg-swarmlight-200', 'text-black', 'text-white', 'font-semibold'
      );

      // Remove the old 'active' class for backward compatibility
      button.classList.remove('active');

      if (button.dataset.theme === this.currentTheme) {
        const theme = button.dataset.theme;
        const isDark = document.documentElement.classList.contains('dark');

        // Add active state classes based on theme and current mode
        if (theme === 'dark') {
          button.classList.add('bg-swarmshadow-200', 'text-swarmlight-100');
        } else if (theme === 'light') {
          button.classList.add('bg-swarmlight-300', 'text-swarmshadow-200');
        } else if (theme === 'system') {
          // System theme gets special gradient treatment via CSS
          button.classList.add('ring-2', 'font-semibold');
          if (isDark) {
            button.classList.add('text-white', 'ring-swarmlight-600', 'dark:hover:text-swarmlight-50');
            button.classList.remove('dark:hover:text-black');
          } else {
            button.classList.add('text-black', 'ring-swarmlight-300');
          }
          // Set gradient background via style since Tailwind can't handle complex gradients inline
          if (isDark) {
            button.style.background = 'linear-gradient(45deg, #706A43 50%, #232323 50%)';
          } else {
            button.style.background = 'linear-gradient(45deg, #FFFDE7 50%, #FFEE58 50%)';
          }
        }

        // Add ring for non-system themes based on current mode
        if (theme !== 'system') {
          button.classList.add('ring-2');
          if (isDark) {
            button.classList.add('ring-swarmlight-600');
          } else {
            button.classList.add('ring-swarmlight-300');
          }
        }
      } else {
        // Clear any custom background for non-active system buttons
        if (button.dataset.theme === 'system') {
          button.classList.add('dark:hover:text-black');
          button.classList.remove('dark:hover:text-swarmlight-50');
          button.style.background = '';
        }
      }
    });
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  getEffectiveTheme() {
    if (this.currentTheme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return this.currentTheme;
  }

  getThemeDescription(theme) {
    switch(theme) {
      case 'light':
        return 'Light theme - bright interface';
      case 'dark':
        return 'Dark theme - dark interface';
      case 'system':
        return 'System theme - follows your device settings';
      default:
        return 'Theme option';
    }
  }

  showThemeTooltip(button, theme) {
    const description = this.getThemeDescription(theme);
    if (window.showTooltip) {
      // For desktop theme tooltip, position directly under the theme toggle
      const themeSwitcher = button.closest('.theme-switcher');
      const targetElement = themeSwitcher || button;

      window.showTooltip(description, targetElement, 0);
    }
  }

  showMobileTooltip(button, theme) {
    const description = this.getThemeDescription(theme);
    if (window.showTooltip) {
      // For mobile theme tooltip, use special positioning
      const themeSwitcher = button.closest('.theme-switcher');
      const targetElement = themeSwitcher || button;

      window.showTooltip(description, targetElement, 0);
      // Auto-hide after 2 seconds on mobile
      setTimeout(() => {
        if (window.hideTooltip) {
          window.hideTooltip();
        }
      }, 2000);
    }
  }

  hideTooltip() {
    if (window.hideTooltip) {
      window.hideTooltip();
    }
  }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.themeManager = new ThemeManager();
});

// Export theme manager class
export { ThemeManager };
