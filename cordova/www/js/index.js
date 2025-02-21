// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
  // Cordova is now initialized. Have fun!
  console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
  document.getElementById('deviceready').classList.add('ready');
}

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
        const square = document.querySelector(
          `[data-layer="${index}"] div[data-audio="${audioId}"]`
        );

        // Flash the square in white, then back to dark
        if (square) {
          setTimeout(() => {
            square.style.backgroundColor = "#ffffff";
          }, index * 500); // 500ms * layer index

          setTimeout(() => {
            square.style.backgroundColor = "#2D2A2A";
          }, index * 750);
        }

        // Play each sound with a 0.5s offset per layer
        playAudio(audioId, index * 0.5);
      });
    }
  });
}

// Attach a click handler to squares that have data-audio="5"
document.querySelectorAll(".grid div").forEach(square => {
  square.addEventListener("click", () => {
    if (square.dataset.audio === "5") {
      playLayers(layers);
    }
  });
});

// ----------------------------------------------------
//         LOADING & DELETING SAVED SEQUENCES
// ----------------------------------------------------
function loadSavedSequences() {
  const savedSequences = JSON.parse(localStorage.getItem("clickWords")) || [];

  savedSequences.forEach((sequence, index) => {
    const miniGrid = document.createElement("div");
    miniGrid.classList.add("mini-grid", "clickableCircle", "relative");
    miniGrid.dataset.index = index;
    miniGrid.addEventListener("click", () => playLayers(sequence));

    const deleteBtn = document.createElement('a');
    deleteBtn.className = 'delBtn';
    deleteBtn.textContent = 'ⅹ';
    deleteBtn.addEventListener('click', function(){
      bottomBar.removeChild(miniGrid);
      const sequenceString = JSON.stringify(sequence);
      let storageString = localStorage.getItem("clickWords");
      if (storageString) {
        storageString = storageString.replace(sequenceString, '');
        // Optionally, trim any leading/trailing whitespace
        storageString = storageString.trim();
        // Also, delete double commas
        storageString = storageString.replace(',,', ',');
        storageString = storageString.replace('],]', ']]');
        storageString = storageString.replace('[,[', '[[');
        storageString = storageString.replace('[,]', '[]');
        
        // Save the updated string back to localStorage
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

loadSavedSequences();

// ----------------------------------------------------
//       RIPPLE CLICK EFFECT (for droplet circle)
// ----------------------------------------------------
document.querySelectorAll(".clickableCircle").forEach(clickableCircle => {
  clickableCircle.addEventListener("click", function () {
    const circle = document.getElementById("clickableCircle");
    if (!circle) return;
    const ripple = document.createElement("span");

    setTimeout(() => {
      ripple.classList.add("ripple");
      circle.appendChild(ripple);
    }, 500);

    setTimeout(() => {
      ripple.remove();
    }, 3000);
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
