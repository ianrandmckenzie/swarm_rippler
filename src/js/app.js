// Main application entry point
// This file imports all the modules to initialize the application

// Import core modules
import './storage.js';
import './theme.js';
import './main-canvas.js';
import './audio.js';
import './main.js';
import './context-menu.js';
import './new-sequence.js';

// Only import dev tools in development
if (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:') {
  import('./dev-tools.js').catch(err => {
    console.log('Dev tools not loaded (production build)');
  });
}

console.log('🎵 Click Ripple app initialized');
