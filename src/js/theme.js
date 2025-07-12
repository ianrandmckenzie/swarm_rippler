// Theme management functionality
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
    const themeButtons = document.querySelectorAll('.theme-btn');

    themeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const theme = e.currentTarget.dataset.theme;
        this.setTheme(theme);
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
    const themeButtons = document.querySelectorAll('.theme-btn');

    themeButtons.forEach(button => {
      button.classList.remove('active');
      if (button.dataset.theme === this.currentTheme) {
        button.classList.add('active');
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
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.themeManager = new ThemeManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}
