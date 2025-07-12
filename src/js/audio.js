// Audio sequence playback system
// Handles playing saved sequences with proper timing and ripple effects

// Timing configuration for radial playback
const RADIAN_TIMING = {
  ZERO: 0,     // Center circle (0s)
  ONE: 0.25,   // First ring (0.25s)
  TWO: 0.5,    // Second ring (0.5s)
  THREE: 0.75  // Third ring (0.75s)
};

const MULTIPLE_SOUND_OFFSET = 0.01; // 0.01s offset between multiple sounds in same radian

// Audio context for precise timing
let audioContext = null;

// Initialize audio context on first user interaction
function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

// Convert circle index to radian and position within radian
function getRadianInfo(circleIndex) {
  // circleIndex 0-23 maps to 8 directions × 3 rings
  const directionIndex = Math.floor(circleIndex / 3); // 0-7 (direction)
  const ringIndex = circleIndex % 3; // 0-2 (ring within direction)

  return {
    radian: ringIndex + 1, // 1, 2, or 3 (radianOne, radianTwo, radianThree)
    direction: directionIndex,
    position: ringIndex
  };
}

// Get audio source for a circle index
function getAudioForCircle(circleIndex) {
  const directionIndex = Math.floor(circleIndex / 3);
  // Ensure we have access to smallCircles array from main.js
  if (typeof smallCircles !== 'undefined' && smallCircles[directionIndex]) {
    return smallCircles[directionIndex].audio;
  }
  return null;
}

// Create ripple effect at center for sequence playback
function createSequenceRipple() {
  if (typeof ripples !== 'undefined') {
    const cx = DESIGN_UNIT * 3;
    const cy = DESIGN_UNIT * 3;
    const R = Math.min(DESIGN_UNIT, DESIGN_UNIT) * 0.4;
    ripples.push({ x: cx, y: cy, radius: R, alpha: 1 });
  }
}

// Play a sequence with proper timing
async function playSequence(sequenceIndices) {
  if (!sequenceIndices || sequenceIndices.length === 0) {
    console.warn('No sequence to play');
    return;
  }

  // Initialize audio context
  const ctx = initAudioContext();

  // Resume audio context if suspended (required for autoplay policies)
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  console.log('🎵 Playing sequence:', sequenceIndices);

  // Group circles by radian for timing
  const radianGroups = {
    0: [], // Center (not used for sequences, but keeping for completeness)
    1: [], // First ring
    2: [], // Second ring
    3: []  // Third ring
  };

  // Group sequence indices by their radian
  sequenceIndices.forEach(circleIndex => {
    const { radian } = getRadianInfo(circleIndex);
    radianGroups[radian].push(circleIndex);
  });

  // Create ripple effect at start
  createSequenceRipple();

  // Play center droplet sound at 0s
  if (typeof dropletSound !== 'undefined') {
    setTimeout(() => {
      dropletSound.currentTime = 0;
      dropletSound.play().catch(e => console.warn('Failed to play droplet sound:', e));
    }, 0);
  }

  // Schedule sounds for each radian
  Object.keys(radianGroups).forEach(radian => {
    const circles = radianGroups[radian];
    if (circles.length === 0) return;

    const radianNumber = parseInt(radian);
    const baseDelay = RADIAN_TIMING[Object.keys(RADIAN_TIMING)[radianNumber]] * 1000; // Convert to ms

    circles.forEach((circleIndex, index) => {
      const audio = getAudioForCircle(circleIndex);
      if (audio) {
        const delay = baseDelay + (index * MULTIPLE_SOUND_OFFSET * 1000);

        setTimeout(() => {
          audio.currentTime = 0;
          audio.play().catch(e => console.warn(`Failed to play audio for circle ${circleIndex}:`, e));
        }, delay);
      }
    });
  });

  console.log('🎵 Sequence playback scheduled');
}

// Add click listeners to thumbnail sequences
function setupSequencePlayback() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupSequencePlayback);
    return;
  }

  const sequenceBar = document.getElementById('sequenceBar');
  if (!sequenceBar) {
    console.warn('Sequence bar not found, retrying...');
    setTimeout(setupSequencePlayback, 100);
    return;
  }

  // Use event delegation to handle clicks on sequence thumbnails
  sequenceBar.addEventListener('click', async (e) => {
    // Find the clicked canvas thumbnail
    const canvas = e.target.closest('canvas');
    if (!canvas) return;

    // Get the sequence data associated with this thumbnail
    const sequenceIndex = Array.from(sequenceBar.children).indexOf(canvas);

    try {
      // Load all sequences and get the clicked one
      const sequences = await loadAllSequences();
      if (sequences[sequenceIndex]) {
        console.log(`🎵 Playing sequence ${sequenceIndex + 1}`);
        await playSequence(sequences[sequenceIndex]);
      }
    } catch (error) {
      console.error('Error playing sequence:', error);
    }
  });

  console.log('🎵 Sequence playback system initialized');
}

// Initialize when the script loads
setupSequencePlayback();

// Export functions for use in other files
window.audioSystem = {
  playSequence,
  initAudioContext,
  getRadianInfo,
  RADIAN_TIMING
};
