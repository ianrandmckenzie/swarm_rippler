// main.js (2-space indentation)

// ----------------------------------------------------
//          THEME TOGGLE FUNCTIONALITY (dark | system | light)
// ----------------------------------------------------

// IndexedDB setup for persistent storage
class PersistentStorage {
  constructor() {
    this.dbName = 'ClickingGlossaliaDB';
    this.dbVersion = 2; // Increment version for new object store
    this.preferencesStore = 'preferences';
    this.sequencesStore = 'sequences';
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create preferences store if it doesn't exist
        if (!db.objectStoreNames.contains(this.preferencesStore)) {
          const preferencesStore = db.createObjectStore(this.preferencesStore, { keyPath: 'key' });
        }

        // Create sequences store if it doesn't exist
        if (!db.objectStoreNames.contains(this.sequencesStore)) {
          const sequencesStore = db.createObjectStore(this.sequencesStore, { keyPath: 'id', autoIncrement: true });
          sequencesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Theme methods
  async setTheme(theme) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.preferencesStore], 'readwrite');
      const store = transaction.objectStore(this.preferencesStore);
      const request = store.put({ key: 'themePreference', value: theme });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getTheme() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.preferencesStore], 'readonly');
      const store = transaction.objectStore(this.preferencesStore);
      const request = store.get('themePreference');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : 'system');
      };
    });
  }

  // Sequence methods
  async saveSequence(sequence) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.sequencesStore], 'readwrite');
      const store = transaction.objectStore(this.sequencesStore);
      const request = store.add({
        sequence: sequence,
        timestamp: Date.now()
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getSequences() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.sequencesStore], 'readonly');
      const store = transaction.objectStore(this.sequencesStore);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const sequences = request.result.map(item => ({
          id: item.id,
          sequence: item.sequence,
          timestamp: item.timestamp
        }));
        resolve(sequences);
      };
    });
  }

  async deleteSequence(id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.sequencesStore], 'readwrite');
      const store = transaction.objectStore(this.sequencesStore);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Tutorial methods
  async setTutorialStatus(completed) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.preferencesStore], 'readwrite');
      const store = transaction.objectStore(this.preferencesStore);
      const request = store.put({ key: 'tutorialCompleted', value: completed });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getTutorialStatus() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.preferencesStore], 'readonly');
      const store = transaction.objectStore(this.preferencesStore);
      const request = store.get('tutorialCompleted');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : false);
      };
    });
  }

  async setDontShowStatus(dontShow) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.preferencesStore], 'readwrite');
      const store = transaction.objectStore(this.preferencesStore);
      const request = store.put({ key: 'tutorialDontShow', value: dontShow });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getDontShowStatus() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.preferencesStore], 'readonly');
      const store = transaction.objectStore(this.preferencesStore);
      const request = store.get('tutorialDontShow');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : false);
      };
    });
  }

  // Tutorial step persistence methods
  async setTutorialStep(step) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.preferencesStore], 'readwrite');
      const store = transaction.objectStore(this.preferencesStore);
      const request = store.put({ key: 'tutorialCurrentStep', value: step });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getTutorialStep() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.preferencesStore], 'readonly');
      const store = transaction.objectStore(this.preferencesStore);
      const request = store.get('tutorialCurrentStep');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : 0);
      };
    });
  }

  async clearTutorialStep() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.preferencesStore], 'readwrite');
      const store = transaction.objectStore(this.preferencesStore);
      const request = store.delete('tutorialCurrentStep');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Migration method to transfer localStorage data to IndexedDB
  async migrateFromLocalStorage() {
    try {
      // Migrate theme preference
      const themePreference = localStorage.getItem('themePreference');
      if (themePreference) {
        await this.setTheme(themePreference);
        localStorage.removeItem('themePreference');
      }

      // Migrate sequences
      const clickWords = localStorage.getItem('clickWords');
      if (clickWords) {
        const sequences = JSON.parse(clickWords);
        for (const sequence of sequences) {
          await this.saveSequence(sequence);
        }
        localStorage.removeItem('clickWords');
      }
    } catch (error) {
      console.warn('Migration from localStorage failed:', error);
    }
  }
}

// Create global storage instance
const storage = new PersistentStorage();

async function initializeTheme() {
  try {
    // Initialize storage and migrate if needed
    await storage.init();
    await storage.migrateFromLocalStorage();

    // Get saved theme preference from IndexedDB
    const savedTheme = await storage.getTheme();
    applyTheme(savedTheme);
  } catch (error) {
    console.warn('Failed to load theme from IndexedDB, falling back to system:', error);
    // Fallback to localStorage if IndexedDB fails
    const fallbackTheme = localStorage.getItem('themePreference') || 'system';
    applyTheme(fallbackTheme);
  }
}

function applyTheme(theme) {
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Remove existing theme classes
  document.body.classList.remove('dark-mode', 'light-mode');

  switch(theme) {
    case 'dark':
      document.body.classList.add('dark-mode');
      break;
    case 'light':
      document.body.classList.add('light-mode');
      break;
    case 'system':
    default:
      // Follow system preference
      if (prefersDarkMode) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.add('light-mode');
      }
      break;
  }

  updateToggleIcon(theme);
}

async function toggleTheme() {
  try {
    const currentTheme = await storage.getTheme();
    let nextTheme;

    // Cycle through: system → light → dark → system
    switch(currentTheme) {
      case 'system':
        nextTheme = 'light';
        break;
      case 'light':
        nextTheme = 'dark';
        break;
      case 'dark':
        nextTheme = 'system';
        break;
      default:
        nextTheme = 'system';
    }

    // Save to IndexedDB
    await storage.setTheme(nextTheme);

    // Also save to localStorage as backup
    localStorage.setItem('themePreference', nextTheme);

    applyTheme(nextTheme);

    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('themeToggled', { detail: { theme: nextTheme } }));
  } catch (error) {
    console.warn('Failed to save theme to IndexedDB:', error);
    // Fallback to localStorage-only operation
    const currentTheme = localStorage.getItem('themePreference') || 'system';
    let nextTheme;

    switch(currentTheme) {
      case 'system':
        nextTheme = 'light';
        break;
      case 'light':
        nextTheme = 'dark';
        break;
      case 'dark':
        nextTheme = 'system';
        break;
      default:
        nextTheme = 'system';
    }

    localStorage.setItem('themePreference', nextTheme);
    applyTheme(nextTheme);
  }
}

function updateToggleIcon(theme) {
  const toggleButton = document.getElementById('themeToggle');
  if (toggleButton) {
    const toggleIcon = toggleButton.querySelector('.toggle-icon');
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    switch(theme) {
      case 'dark':
        toggleIcon.textContent = '☀️';
        toggleButton.title = 'Switch to system theme';
        break;
      case 'light':
        toggleIcon.textContent = '🌙';
        toggleButton.title = 'Switch to dark theme';
        break;
      case 'system':
      default:
        toggleIcon.textContent = prefersDarkMode ? '⚙️' : '⚙️';
        toggleButton.title = 'Switch to light theme';
        break;
    }
  }
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', async () => {
  await initializeTheme();
});

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async (e) => {
  try {
    // Only auto-switch if user is using system preference
    const currentTheme = await storage.getTheme();
    if (currentTheme === 'system') {
      applyTheme('system');
    }
  } catch (error) {
    // Fallback to localStorage check
    const currentTheme = localStorage.getItem('themePreference') || 'system';
    if (currentTheme === 'system') {
      applyTheme('system');
    }
  }
});

// ----------------------------------------------------
//          SCROLL FUNCTIONALITY
// ----------------------------------------------------
const bottomBar = document.getElementById("bottomBar");
const scrollLeft = document.getElementById("scrollLeft");
const scrollRight = document.getElementById("scrollRight");
const scrollAmount = 300; // Adjust scroll speed

scrollLeft.addEventListener("click", () => {
  bottomBar.scrollBy({ left: -scrollAmount, behavior: "smooth" });
});

scrollRight.addEventListener("click", () => {
  bottomBar.scrollBy({ left: scrollAmount, behavior: "smooth" });
});

// ----------------------------------------------------
//          WEB AUDIO API SETUP
// ----------------------------------------------------
const audioContext = new (window.AudioContext || window.webkitAudioContext)({
  latencyHint: "interactive" // helps reduce latency on mobile
});
const audioCache = {};

// Map your audio IDs to file paths
const audioFiles = {
  "1": "./audio/1.mp3",
  "2": "./audio/2.mp3",
  "3": "./audio/3.mp3",
  "4": "./audio/4.mp3",
  "5": "./audio/5.mp3",
  "6": "./audio/6.mp3",
  "7": "./audio/7.mp3",
  "8": "./audio/8.mp3",
  "9": "./audio/9.mp3"
};

// Preload all audio files into memory
Object.entries(audioFiles).forEach(([id, url]) => {
  preloadAudio(id, url);
});

// Asynchronously fetch & decode each audio file
async function preloadAudio(id, url) {
  try {
    if (audioCache[id]) return; // Skip if already in cache
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    audioCache[id] = audioBuffer;
  } catch (err) {
    console.error(`Error preloading audio ${id}:`, err);
  }
}

// Create a function to play a specific audio buffer from our cache
function playAudio(id, startDelay = 0) {
  // If the file isn't ready yet, skip
  if (!audioCache[id]) return;

  // Need to resume the context if it's suspended (iOS Safari behavior)
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  const source = audioContext.createBufferSource();
  source.buffer = audioCache[id];
  source.connect(audioContext.destination);

  // Start playback with a user-defined delay
  const startTime = audioContext.currentTime + startDelay;
  source.start(startTime);
}

// ----------------------------------------------------
//           LAYER SEQUENCING LOGIC
// ----------------------------------------------------
const layers = [
  ["5"],
  ["1", "2", "3", "4", "6", "7", "8", "9"],
  ["1", "2", "3", "4", "6", "7", "8", "9"],
  ["1", "2", "3", "4", "6", "7", "8", "9"]
];

// Sequencer: plays layers in a timed stagger
function playLayers(layersSequence) {
  // Immediately play audio-5 (if present)
  playAudio("5", 0);

  // Use setTimeout or scheduled offsets to color squares
  // The below uses 0.5s increments for each layer
  layersSequence.forEach((layer, index) => {
    // If a layer includes '5', we skip scheduling it again
    if (layer[0] !== "5") {
      layer.forEach(audioId => {
        const button = document.querySelector(
          `[data-layer="${index}"] button[data-audio="${audioId}"]`
        );

        // Flash the button in white, then back to primary color
        if (button) {
          setTimeout(() => {
            button.style.backgroundColor = "var(--color-click-highlight)";
          }, index * 500); // 500ms * layer index

          setTimeout(() => {
            button.style.backgroundColor = "var(--color-primary)";
          }, index * 750);
        }

        // Play each sound with a 0.5s offset per layer
        playAudio(audioId, index * 0.5);
      });
    }
  });
}

// Attach a click handler to buttons that have data-audio="5"
document.querySelectorAll(".grid button").forEach(button => {
  button.addEventListener("click", () => {
    if (button.dataset.audio === "5") {
      playLayers(layers);
    } else if (button.dataset.audio && button.dataset.audio !== "0") {
      // Play individual sounds for other buttons
      playAudio(button.dataset.audio);
    }
  });
});

// ----------------------------------------------------
//         LOADING & DELETING SAVED SEQUENCES
// ----------------------------------------------------
async function loadSavedSequences() {
  try {
    const savedSequences = await storage.getSequences();

    savedSequences.forEach((sequenceData) => {
      const sequence = sequenceData.sequence;
      const sequenceId = sequenceData.id;

      const miniGrid = document.createElement("div");
      miniGrid.classList.add("mini-grid", "clickableCircle", "relative");
      miniGrid.dataset.sequenceId = sequenceId;
      miniGrid.addEventListener("click", () => {
        playLayers(sequence);
        triggerRipple();
      });

      const deleteBtn = document.createElement('a');
      deleteBtn.className = 'delBtn';
      deleteBtn.textContent = 'ⅹ';
      deleteBtn.addEventListener('click', async function(event){
        event.stopPropagation(); // Prevent triggering the play sequence

        try {
          await storage.deleteSequence(sequenceId);
          bottomBar.removeChild(miniGrid);
        } catch (error) {
          console.warn('Failed to delete sequence from IndexedDB:', error);
          // Fallback to localStorage method
          const sequenceString = JSON.stringify(sequence);
          let storageString = localStorage.getItem("clickWords");
          if (storageString) {
            storageString = storageString.replace(sequenceString, '');
            storageString = storageString.trim();
            storageString = storageString.replace(',,', ',');
            storageString = storageString.replace('],]', ']]');
            storageString = storageString.replace('[,[', '[[');
            storageString = storageString.replace('[,]', '[]');
            localStorage.setItem("clickWords", storageString);
          }
          bottomBar.removeChild(miniGrid);
        }
      });

      // Define the correct structure, mirroring the original grid
      const gridStructure = [
        ["3-1", "3-0", "3-0", "3-2", "3-0", "3-0", "3-3"],
        ["3-0", "2-1", "2-0", "2-2", "2-0", "2-3", "3-0"],
        ["3-0", "2-0", "1-1", "1-2", "1-3", "2-0", "3-0"],
        ["3-4", "2-4", "1-4", "0-5", "1-6", "2-6", "3-6"],
        ["3-0", "2-0", "1-7", "1-8", "1-9", "2-0", "3-0"],
        ["3-0", "2-7", "2-0", "2-8", "2-0", "2-9", "3-0"],
        ["3-7", "3-0", "3-0", "3-8", "3-0", "3-0", "3-9"]
      ];

      // Generate the correct grid structure
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 7; col++) {
          const cell = document.createElement("div");
          const [layer, audio] = gridStructure[row][col].split("-");

          cell.dataset.layer = layer;
          cell.dataset.audio = audio;

          // Make inactive circles (data-audio="0") transparent
          if (audio === "0") {
            cell.style.opacity = "0";
          }

          // Check if the audio is part of the saved sequence
          sequence.forEach((sequenceLayer, sequenceIndex) => {
            if (layer == sequenceIndex) {
              sequenceLayer.forEach((layerAudio, audioIndex) => {
                if (audio == layerAudio) {
                  cell.style.opacity = "1"; // Make active circles visible
                }
              })
            }
          });

          if (col === 3 && row === 3) cell.style.opacity = "1";
          if (col === 3 && row === 3) cell.classList.add("mini-droplet");

          miniGrid.appendChild(cell);
        }
      }

      bottomBar.appendChild(miniGrid);
      miniGrid.appendChild(deleteBtn);
    });
  } catch (error) {
    console.warn('Failed to load sequences from IndexedDB, falling back to localStorage:', error);
    // Fallback to localStorage
    const savedSequences = JSON.parse(localStorage.getItem("clickWords")) || [];

    savedSequences.forEach((sequence, index) => {
      const miniGrid = document.createElement("div");
      miniGrid.classList.add("mini-grid", "clickableCircle", "relative");
      miniGrid.dataset.index = index;
      miniGrid.addEventListener("click", () => {
        playLayers(sequence);
        triggerRipple();
      });

      const deleteBtn = document.createElement('a');
      deleteBtn.className = 'delBtn';
      deleteBtn.textContent = 'ⅹ';
      deleteBtn.addEventListener('click', function(){
        bottomBar.removeChild(miniGrid);
        const sequenceString = JSON.stringify(sequence);
        let storageString = localStorage.getItem("clickWords");
        if (storageString) {
          storageString = storageString.replace(sequenceString, '');
          storageString = storageString.trim();
          storageString = storageString.replace(',,', ',');
          storageString = storageString.replace('],]', ']]');
          storageString = storageString.replace('[,[', '[[');
          storageString = storageString.replace('[,]', '[]');
          localStorage.setItem("clickWords", storageString);
        }
      });

      // Define the correct structure, mirroring the original grid
      const gridStructure = [
        ["3-1", "3-0", "3-0", "3-2", "3-0", "3-0", "3-3"],
        ["3-0", "2-1", "2-0", "2-2", "2-0", "2-3", "3-0"],
        ["3-0", "2-0", "1-1", "1-2", "1-3", "2-0", "3-0"],
        ["3-4", "2-4", "1-4", "0-5", "1-6", "2-6", "3-6"],
        ["3-0", "2-0", "1-7", "1-8", "1-9", "2-0", "3-0"],
        ["3-0", "2-7", "2-0", "2-8", "2-0", "2-9", "3-0"],
        ["3-7", "3-0", "3-0", "3-8", "3-0", "3-0", "3-9"]
      ];

      // Generate the correct grid structure
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 7; col++) {
          const cell = document.createElement("div");
          const [layer, audio] = gridStructure[row][col].split("-");

          cell.dataset.layer = layer;
          cell.dataset.audio = audio;

          // Make inactive circles (data-audio="0") transparent
          if (audio === "0") {
            cell.style.opacity = "0";
          }

          // Check if the audio is part of the saved sequence
          sequence.forEach((sequenceLayer, sequenceIndex) => {
            if (layer == sequenceIndex) {
              sequenceLayer.forEach((layerAudio, audioIndex) => {
                if (audio == layerAudio) {
                  cell.style.opacity = "1"; // Make active circles visible
                }
              })
            }
          });

          if (col === 3 && row === 3) cell.style.opacity = "1";
          if (col === 3 && row === 3) cell.classList.add("mini-droplet");

          miniGrid.appendChild(cell);
        }
      }

      bottomBar.appendChild(miniGrid);
      miniGrid.appendChild(deleteBtn);
    });
  }
}

// Load sequences on page load (async)
(async () => {
  await loadSavedSequences();
})();

// ----------------------------------------------------
//       RIPPLE CLICK EFFECT (for droplet circle)
// ----------------------------------------------------
function triggerRipple() {
  const circle = document.getElementById("clickableCircle");
  if (!circle) return;
  const ripple = document.createElement("span");
  ripple.classList.add("ripple");

  setTimeout(() => {
    circle.appendChild(ripple);
  }, 500);

  setTimeout(() => {
    ripple.remove();
  }, 2500);
}

document.querySelectorAll(".clickableCircle").forEach(clickableElement => {
  clickableElement.addEventListener("click", function () {
    triggerRipple();
    // If it's the main droplet button, also play the layers
    if (clickableElement.dataset.audio === "5") {
      playLayers(layers);
    }
  });
});

// ----------------------------------------------------
//            TOOLTIP BEHAVIOR
// ----------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const tooltip = document.getElementById("tooltip");
  let activeElement = null;

  document.addEventListener("click", event => {
    const target = event.target.closest("[data-tooltip]");

    if (target) {
      event.stopPropagation();

      if (activeElement === target && tooltip.classList.contains("visible")) {
        hideTooltip(); // toggle off if same element
      } else {
        activeElement = target;
        showTooltip(target);
      }
    } else if (!tooltip.contains(event.target)) {
      hideTooltip();
    }
  });

  function showTooltip(target) {
    const tooltipData = target.getAttribute("data-tooltip");
    if (!tooltipData) return;

    // Split your data-tooltip into title||content
    const [title, content] = tooltipData.split("||");

    tooltip.innerHTML = `
      <div style="position: relative;">
        <button
          id="close-tooltip"
          style="position: absolute; top: 5px; right: 5px;
                 border: none; background: transparent;
                 font-size: 16px; cursor: pointer; color: white;"
        >
          &times;
        </button>
        <h4>${title || "Tooltip"}</h4>
        ${content || ""}
      </div>
    `;

    tooltip.classList.add("visible");
    positionTooltip(target);

    document.getElementById("close-tooltip").addEventListener("click", event => {
      event.stopPropagation();
      hideTooltip();
    });
  }

  function positionTooltip(target) {
    const rect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let left = rect.left + window.scrollX + rect.width / 2 - tooltipRect.width / 2;
    let top = rect.top + window.scrollY - tooltipRect.height - 10;

    // If there's not enough room above, place it below
    if (top < window.scrollY) {
      top = rect.bottom + window.scrollY + 10;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function hideTooltip() {
    tooltip.classList.remove("visible");
    activeElement = null;
  }
});
