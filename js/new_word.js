// IndexedDB storage for sequences
class SequenceStorage {
  constructor() {
    this.dbName = 'ClickingGlossaliaDB';
    this.dbVersion = 2;
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
        if (!db.objectStoreNames.contains(this.sequencesStore)) {
          const sequencesStore = db.createObjectStore(this.sequencesStore, { keyPath: 'id', autoIncrement: true });
          sequencesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

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
}

const sequenceStorage = new SequenceStorage();

const grid = document.getElementById("grid");
const saveButton = document.getElementById("save");

// Grid structure based on the original document (7x7)
const gridStructure = [
  ["3-1", "3-0", "3-0", "3-2", "3-0", "3-0", "3-3"],
  ["3-0", "2-1", "2-0", "2-2", "2-0", "2-3", "3-0"],
  ["3-0", "2-0", "1-1", "1-2", "1-3", "2-0", "3-4"],
  ["3-0", "2-4", "1-4", "0-5", "1-6", "2-6", "3-6"],
  ["3-0", "2-0", "1-7", "1-8", "1-9", "2-0", "3-0"],
  ["3-0", "2-7", "2-0", "2-8", "2-0", "2-9", "3-0"],
  ["3-7", "3-0", "3-0", "3-8", "3-0", "3-0", "3-9"]
];

// Generate the 7x7 grid based on the predefined structure
for (let row = 0; row < 7; row++) {
  for (let col = 0; col < 7; col++) {
    const button = document.querySelector(`#grid div[data-row="${row}"][data-col="${col}"] button`)
    if (button !== null) {
      button.addEventListener("click", toggleClick);
      button.addEventListener("keydown", (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleClick(e);
        }
      });
    }
  }
}

function toggleClick(event) {
  const button = event.target;
  if (button.classList.contains("clicked")) {
    button.classList.remove("clicked");
  } else {
    button.classList.add("clicked");
  }

  // Announce the change to screen readers
  const ariaLabel = button.getAttribute('aria-label') || 'Sound button';
  const action = button.classList.contains("clicked") ? 'selected' : 'deselected';
  if (typeof AccessibilityUtils !== 'undefined') {
    AccessibilityUtils.announce(`${ariaLabel} ${action}`);
  }
}

async function saveClickWords() {
  try {
    const newSequence = [];
    newSequence.push(["5"]); // Ensure "5" is always in the first layer

    const layerData = { 1: [], 2: [], 3: [] };

    document.querySelectorAll(".grid div .sound-button.clicked").forEach(button => {
      const parentDiv = button.parentElement;
      let layer = parentDiv.dataset.layer;
      let audio = parentDiv.dataset.audio;
      if (audio !== "0") {
        if (!layerData[layer]) {
          layerData[layer] = [];
        }
        if (!layerData[layer].includes(audio)) {
          layerData[layer].push(audio);
        }
      }
    });

    // Sort layers numerically and add to newSequence
    Object.keys(layerData).sort((a, b) => a - b).forEach(layer => {
      newSequence.push(layerData[layer]);
    });

    // Save to IndexedDB
    await sequenceStorage.saveSequence(newSequence);

    window.location.href = '/';
  } catch (error) {
    console.warn('Failed to save sequence to IndexedDB, falling back to localStorage:', error);

    // Fallback to localStorage
    const clickWords = JSON.parse(localStorage.getItem("clickWords")) || [];

    const newSequence = [];
    newSequence.push(["5"]); // Ensure "5" is always in the first layer

    const layerData = { 1: [], 2: [], 3: [] };

    document.querySelectorAll(".grid div .sound-button.clicked").forEach(button => {
      const parentDiv = button.parentElement;
      let layer = parentDiv.dataset.layer;
      let audio = parentDiv.dataset.audio;
      if (audio !== "0") {
        if (!layerData[layer]) {
          layerData[layer] = [];
        }
        if (!layerData[layer].includes(audio)) {
          layerData[layer].push(audio);
        }
      }
    });

    // Sort layers numerically and add to newSequence
    Object.keys(layerData).sort((a, b) => a - b).forEach(layer => {
      newSequence.push(layerData[layer]);
    });

    clickWords.push(newSequence);
    localStorage.setItem("clickWords", JSON.stringify(clickWords));

    window.location.href = '/';
  }
}

saveButton.addEventListener("click", saveClickWords);
