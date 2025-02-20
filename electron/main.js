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

const layers = [
  ["5"],
  ["1", "2", "3", "4", "6", "7", "8", "9"],
  ["1", "2", "3", "4", "6", "7", "8", "9"],
  ["1", "2", "3", "4", "6", "7", "8", "9"]
];

function playLayers(layers) {
  let audioId = `audio-5`;
  let audioElement = document.getElementById(audioId);
  audioElement.currentTime = 0;
  audioElement.play();
  setTimeout(() => {
    layers.forEach((layer, index) => {
      if (layer[0] !== "5") {
        setTimeout(() => {
          layer.forEach(num => {
            let audioToPlay = document.getElementById(`audio-${num}`);
            let square = document.querySelector(`[data-layer="${index}"] div[data-audio="${num}"]`);
            if (audioToPlay && square) {
              square.style.backgroundColor = "#ffffff";
              audioToPlay.currentTime = 0;
              audioToPlay.play();
            }
          });
        }, index * 500);
        setTimeout(() => {
          layer.forEach(num => {
            let square = document.querySelector(`[data-layer="${index}"] div[data-audio="${num}"]`);
            if (square) {
              square.style.backgroundColor = "#2D2A2A";
            }
          });
        }, index * 750);
      }
    });
  }, 0);
}

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

document.querySelectorAll(".grid div").forEach(square => {
  square.addEventListener("click", () => {
    if (square.dataset.audio === "5") {
      playLayers(layers);
    }
  });
});

loadSavedSequences();

document.querySelectorAll(".clickableCircle").forEach(clickableCircle => {
  clickableCircle.addEventListener("click", function (event) {
    const circle = document.getElementById('clickableCircle');
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

document.addEventListener("DOMContentLoaded", () => {
  const tooltip = document.getElementById("tooltip");
  let activeElement = null;

  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-tooltip]");

    if (target) {
      event.stopPropagation(); // Prevent immediate closing when clicking the tooltip trigger
      if (activeElement === target && tooltip.classList.contains("visible")) {
        hideTooltip();
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

    const [title, content] = tooltipData.split("||");

    tooltip.innerHTML = `
      <div style="position: relative;">
        <button id="close-tooltip" style="position: absolute; top: 5px; right: 5px; border: none; background: transparent; font-size: 16px; cursor: pointer; color: white;">&times;</button>
        <h4>${title || "Tooltip"}</h4>
        ${content || ""}
      </div>
    `;

    tooltip.classList.add("visible");
    positionTooltip(target);

    document.getElementById("close-tooltip").addEventListener("click", (event) => {
      event.stopPropagation();
      hideTooltip();
    });
  }

  function positionTooltip(target) {
    const rect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let left = rect.left + window.scrollX + rect.width / 2 - tooltipRect.width / 2;
    let top = rect.top + window.scrollY - tooltipRect.height - 10;

    if (top < window.scrollY) top = rect.bottom + window.scrollY + 10;

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function hideTooltip() {
    tooltip.classList.remove("visible");
    activeElement = null;
  }
});


/* New Sequence */
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
    const cell = document.querySelector(`#sequence_grid div[data-row="${row}"][data-col="${col}"] div`)
    if (cell !== null) cell.addEventListener("click", toggleClick);
  }
}

function toggleClick(event) {
  const cell = event.target;
  if (cell.classList.contains("clicked")) {
    cell.classList.remove("clicked");
  } else {
    cell.classList.add("clicked");
  }
}

function saveClickWords() {
  const clickWords = JSON.parse(localStorage.getItem("clickWords")) || [];

  const newSequence = [];
  newSequence.push(["5"]); // Ensure "5" is always in the first layer

  const layerData = {1: [], 2: [], 3: []};

  document.querySelectorAll(".grid div div.clicked").forEach(cell => {
    cell = cell.parentElement;
    let layer = cell.dataset.layer;
    let audio = cell.dataset.audio;
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

  loadHomeContent();
  showView('home');
}

saveButton.addEventListener("click", saveClickWords);

function loadHomeContent() {
  // Clear the bottom bar
  bottomBar.innerHTML = '';

  // Retrieve saved sequences from localStorage
  const savedSequences = JSON.parse(localStorage.getItem("clickWords")) || [];

  savedSequences.forEach((sequence, index) => {
      // Create a mini-grid container
      const miniGrid = document.createElement("div");
      miniGrid.classList.add("mini-grid", "clickableCircle", "relative");
      miniGrid.dataset.index = index;
      miniGrid.addEventListener("click", () => playLayers(sequence));

      // Create a delete button for each sequence
      const deleteBtn = document.createElement('a');
      deleteBtn.className = 'delBtn';
      deleteBtn.textContent = 'ⅹ';
      deleteBtn.addEventListener('click', function(event) {
          event.stopPropagation(); // Prevent click from triggering playLayers

          // Remove the sequence from localStorage
          savedSequences.splice(index, 1);
          localStorage.setItem("clickWords", JSON.stringify(savedSequences));

          // Refresh the bottom bar
          loadHomeContent();
      });

      // Define the grid structure for mini-grids
      const gridStructure = [
          ["3-1", "3-0", "3-0", "3-2", "3-0", "3-0", "3-3"],
          ["3-0", "2-1", "2-0", "2-2", "2-0", "2-3", "3-0"],
          ["3-0", "2-0", "1-1", "1-2", "1-3", "2-0", "3-0"],
          ["3-4", "2-4", "1-4", "0-5", "1-6", "2-6", "3-6"],
          ["3-0", "2-0", "1-7", "1-8", "1-9", "2-0", "3-0"],
          ["3-0", "2-7", "2-0", "2-8", "2-0", "2-9", "3-0"],
          ["3-7", "3-0", "3-0", "3-8", "3-0", "3-0", "3-9"]
      ];

      // Generate the mini-grid
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

              // Highlight active circles based on the saved sequence
              sequence.forEach((sequenceLayer, sequenceIndex) => {
                  if (layer == sequenceIndex) {
                      sequenceLayer.forEach((layerAudio) => {
                          if (audio == layerAudio) {
                              cell.style.opacity = "1";
                          }
                      });
                  }
              });

              // Make the center always visible
              if (col === 3 && row === 3) {
                  cell.style.opacity = "1";
                  cell.classList.add("mini-droplet");
              }

              miniGrid.appendChild(cell);
          }
      }

      // Append delete button and mini-grid to the bottom bar
      miniGrid.appendChild(deleteBtn);
      bottomBar.appendChild(miniGrid);
  });
}
