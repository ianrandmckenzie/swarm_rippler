// Visual and haptic feedback utilities
// Provides enhanced user feedback for interactions across the application

/**
 * Haptic feedback utility for supported devices
 */
class HapticFeedback {
  constructor() {
    this.isSupported = this.checkSupport();
  }

  checkSupport() {
    // Check for various haptic APIs
    return !!(
      navigator.vibrate ||                    // Standard vibration API
      window.DeviceMotionEvent ||            // iOS Safari
      window.TapticEngine ||                 // Tauri desktop
      window.__TAURI__?.invoke               // Tauri native calls
    );
  }

  /**
   * Trigger haptic feedback for different interaction types
   * @param {string} type - Type of feedback: 'light', 'medium', 'heavy', 'radian'
   * @param {number} intensity - Intensity 0-1 (optional)
   */
  trigger(type = 'light', intensity = 0.5) {
    if (!this.isSupported) return;

    const patterns = {
      light: [10],           // Quick tap
      medium: [20],          // Medium tap
      heavy: [40],           // Strong tap
      radian: [15, 10, 15],  // Rhythmic pattern for radians
      select: [8],           // Light selection feedback
      success: [25, 15, 25]  // Success pattern
    };

    const pattern = patterns[type] || patterns.light;

    try {
      // Try different haptic methods in order of preference
      if (navigator.vibrate) {
        navigator.vibrate(pattern);
      } else if (window.TapticEngine) {
        // iOS Safari
        window.TapticEngine.impact({ style: type });
      } else if (window.__TAURI__?.invoke) {
        // Tauri desktop - could implement native haptics
        window.__TAURI__.invoke('haptic_feedback', { type, intensity });
      }
    } catch (error) {
      console.debug('Haptic feedback not available:', error);
    }
  }

  /**
   * Trigger haptic feedback for sequence radian playback
   * @param {number} radianIndex - Index of the radian being played
   */
  radianFeedback(radianIndex) {
    // Vary intensity based on radian (inner rings = lighter, outer = stronger)
    const intensities = [0.3, 0.5, 0.7]; // Ring 1, 2, 3
    const ringIndex = radianIndex % 3;

    this.trigger('radian', intensities[ringIndex]);
  }
}

/**
 * Visual feedback utility for button/element interactions
 */
class VisualFeedback {
  /**
   * Add a scale bounce effect to an element
   * @param {HTMLElement} element - Target element
   * @param {number} scale - Scale factor (default: 1.05)
   * @param {number} duration - Animation duration in ms (default: 150)
   */
  static bounce(element, scale = 1.05, duration = 150) {
    if (!element) return;

    element.style.transition = `transform ${duration}ms cubic-bezier(0.68, -0.55, 0.265, 1.55)`;
    element.style.transform = `scale(${scale})`;

    setTimeout(() => {
      element.style.transform = 'scale(1)';

      // Clean up after animation
      setTimeout(() => {
        element.style.transition = '';
        element.style.transform = '';
      }, duration);
    }, duration);
  }

  /**
   * Add a press down effect to an element
   * @param {HTMLElement} element - Target element
   * @param {number} scale - Scale factor (default: 0.95)
   * @param {number} duration - Animation duration in ms (default: 100)
   */
  static press(element, scale = 0.95, duration = 100) {
    if (!element) return;

    element.style.transition = `transform ${duration}ms ease-out`;
    element.style.transform = `scale(${scale})`;

    setTimeout(() => {
      element.style.transform = 'scale(1)';

      // Clean up after animation
      setTimeout(() => {
        element.style.transition = '';
        element.style.transform = '';
      }, duration);
    }, duration);
  }

  /**
   * Add a pulsing glow effect to an element
   * @param {HTMLElement} element - Target element
   * @param {string} color - Glow color (default: theme-aware)
   * @param {number} duration - Pulse duration in ms (default: 300)
   */
  static pulse(element, color = null, duration = 300) {
    if (!element) return;

    // Auto-detect theme-appropriate color if not specified
    if (!color) {
      const isDark = document.documentElement.classList.contains('dark');
      color = isDark ? 'rgba(255, 241, 118, 0.6)' : 'rgba(255, 235, 59, 0.6)';
    }

    const originalBoxShadow = element.style.boxShadow;

    element.style.transition = `box-shadow ${duration}ms ease-out`;
    element.style.boxShadow = `0 0 20px 4px ${color}`;

    setTimeout(() => {
      element.style.boxShadow = originalBoxShadow;

      // Clean up after animation
      setTimeout(() => {
        element.style.transition = '';
      }, duration);
    }, duration);
  }

  /**
   * Create a temporary ripple effect on canvas at specific coordinates
   * @param {HTMLCanvasElement} canvas - Target canvas
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {string} color - Ripple color (optional)
   */
  static canvasRipple(canvas, x, y, color = null) {
    if (!canvas) return;

    // Auto-detect theme-appropriate color if not specified
    if (!color) {
      const effectiveTheme = window.themeManager ? window.themeManager.getEffectiveTheme() : 'light';
      color = effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
    }

    // Create temporary visual ripple effect
    const ripple = document.createElement('div');
    ripple.style.position = 'absolute';
    ripple.style.left = `${x - 10}px`;
    ripple.style.top = `${y - 10}px`;
    ripple.style.width = '20px';
    ripple.style.height = '20px';
    ripple.style.borderRadius = '50%';
    ripple.style.background = color;
    ripple.style.pointerEvents = 'none';
    ripple.style.animation = 'feedback-ripple 0.6s ease-out forwards';
    ripple.style.zIndex = '1000';

    // Add CSS animation if not already present
    if (!document.getElementById('feedback-styles')) {
      const style = document.createElement('style');
      style.id = 'feedback-styles';
      style.textContent = `
        @keyframes feedback-ripple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Get canvas container for positioning
    const container = canvas.closest('[id*="container"]') || canvas.parentElement;
    if (container) {
      container.style.position = 'relative';
      container.appendChild(ripple);

      // Remove ripple after animation
      setTimeout(() => {
        if (ripple.parentElement) {
          ripple.parentElement.removeChild(ripple);
        }
      }, 600);
    }
  }
}

// Create global instances
const hapticFeedback = new HapticFeedback();

// Export for use by other modules
export { HapticFeedback, VisualFeedback, hapticFeedback };

// Make globally available
window.feedbackSystem = {
  haptic: hapticFeedback,
  visual: VisualFeedback
};
