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
    const cell = document.querySelector(`#grid div[data-row="${row}"][data-col="${col}"] div`)
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

  const layerData = { 1: [], 2: [], 3: [] };

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

  window.location.href = '/';
}

saveButton.addEventListener("click", saveClickWords);
