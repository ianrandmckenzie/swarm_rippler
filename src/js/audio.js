// Audio sequence playback system
// Handles playing saved sequences with proper timing and ripple effects
import { smallCircles, ripples, canvas, dropletSound } from './main-canvas.js';
import { loadAllSequences } from './storage.js';

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
  if (smallCircles[directionIndex]) {
    return smallCircles[directionIndex].audio;
  }
  return null;
}

// Create ripple effect at center for sequence playback
function createSequenceRipple() {
  if (ripples && canvas) {
    const cx = canvas.clientWidth / 2;
    const cy = canvas.clientHeight / 2;
    const size = Math.min(canvas.clientWidth, canvas.clientHeight);
    const artworkScale = 0.4; // Same scale factor as drawing
    const R = size * 0.15 * artworkScale;
    ripples.push({ x: cx, y: cy, radius: R, alpha: 1 });
  }
}

// Play a sequence with proper timing
async function playSequence(sequenceIndices, options = {}) {
  if (!sequenceIndices || sequenceIndices.length === 0) {
    console.warn('No sequence to play');
    return;
  }

  const { inModal = false } = options;

  // Initialize audio context
  const ctx = initAudioContext();

  // Resume audio context if suspended (required for autoplay policies)
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  // Clear any existing highlights before starting new sequence
  if (window.canvasHighlight) {
    window.canvasHighlight.clearAllHighlights();
  }

  // Clear modal highlights if in modal
  if (inModal && window.modalHighlight) {
    window.modalHighlight.clearModalHighlights();
  }

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

  // Create modal ripple if in modal
  if (inModal && window.modalHighlight) {
    window.modalHighlight.createModalRipple();
  }

  // Play center droplet sound at 0s
  if (dropletSound) {
    setTimeout(() => {
      dropletSound.currentTime = 0;
      dropletSound.play().catch(e => console.warn('Failed to play droplet sound:', e));

      // Highlight the center circle when droplet sound plays
      if (window.canvasHighlight) {
        window.canvasHighlight.highlightCircle(-1, 400); // Use -1 for center circle
      }

      // Highlight modal center if in modal
      if (inModal && window.modalHighlight) {
        window.modalHighlight.highlightModalCircle(-1, 400);
      }
    }, 0);
  }

  // Schedule sounds and highlights for each radian
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
          // Play the audio
          audio.currentTime = 0;
          audio.play().catch(e => console.warn(`Failed to play audio for circle ${circleIndex}:`, e));

          // Highlight the corresponding circle on the main canvas
          if (window.canvasHighlight) {
            window.canvasHighlight.highlightCircle(circleIndex, 600); // Highlight for 600ms
          }

          // Highlight modal circle if in modal
          if (inModal && window.modalHighlight) {
            window.modalHighlight.highlightModalCircle(circleIndex, 600);
          }
        }, delay);
      }
    });
  });
}

// Loop playback management - support for multiple concurrent loops
const MAX_CONCURRENT_LOOPS = 5;
let activeLoops = new Map(); // Map of sequence ID -> { timer, sequence, interval }

function getSequenceId(sequence) {
  return JSON.stringify(sequence);
}

function toggleLoopPlayback(sequence, intervalSeconds) {
  const sequenceId = getSequenceId(sequence);

  if (activeLoops.has(sequenceId)) {
    // Stop this specific loop
    const loopData = activeLoops.get(sequenceId);
    clearInterval(loopData.timer);
    activeLoops.delete(sequenceId);
    console.log('🔄 Loop playback stopped for sequence:', sequenceId.substring(0, 50) + '...');

    // Update visual state
    updateThumbnailLoopStates();
    updateLoopCounter();
  } else {
    // Check if we've reached the maximum number of concurrent loops
    if (activeLoops.size >= MAX_CONCURRENT_LOOPS) {
      console.warn(`🔄 Maximum number of concurrent loops (${MAX_CONCURRENT_LOOPS}) reached. Cannot start new loop.`);

      // Show a brief visual feedback to the user
      const loopCounter = document.getElementById('loopCounter');
      if (loopCounter) {
        const originalBg = loopCounter.className;
        loopCounter.className = loopCounter.className.replace(/bg-\S+/g, 'bg-red-200 dark:bg-red-800');
        loopCounter.style.animation = 'pulse 0.5s ease-in-out 2';

        setTimeout(() => {
          loopCounter.className = originalBg;
          loopCounter.style.animation = '';
        }, 1000);
      }

      return;
    }

    // Start new loop
    console.log(`🔄 Starting loop playback every ${intervalSeconds}s`);

    // Play immediately
    playSequence(sequence);

    // Set up repeating timer
    const timer = setInterval(async () => {
      try {
        await playSequence(sequence);
      } catch (error) {
        console.error('Error in loop playback:', error);
        // Stop this specific loop if there's an error
        toggleLoopPlayback(sequence, intervalSeconds);
      }
    }, intervalSeconds * 1000);

    // Store the loop data
    activeLoops.set(sequenceId, {
      timer: timer,
      sequence: sequence,
      interval: intervalSeconds
    });

    // Update visual state
    updateThumbnailLoopStates();
    updateLoopCounter();
  }
}

// Check if a sequence is currently looping
function isSequenceLooping(sequence) {
  if (!sequence) return false;
  const sequenceId = getSequenceId(sequence);
  return activeLoops.has(sequenceId);
}

// Update loop counter display
function updateLoopCounter() {
  const loopCounter = document.getElementById('loopCounter');
  if (!loopCounter) return;

  const activeCount = activeLoops.size;

  if (activeCount > 0) {
    loopCounter.textContent = `Loops playing: ${activeCount}/${MAX_CONCURRENT_LOOPS}`;
    loopCounter.classList.remove('hidden');
  } else {
    loopCounter.classList.add('hidden');
  }
}

// Update visual state of all thumbnails to show which one is looping
function updateThumbnailLoopStates() {
  const sequenceBar = document.getElementById('sequenceBar');
  if (!sequenceBar) return;

  const thumbnails = sequenceBar.querySelectorAll('canvas');
  thumbnails.forEach(thumbnail => {
    const sequenceData = thumbnail.sequenceData;
    if (sequenceData) {
      const isCurrentlyLooping = isSequenceLooping(sequenceData.seq);
      const isDark = document.documentElement.classList.contains('dark');

      // Remove all loop state classes
      thumbnail.classList.remove(
        'bg-swarmstripe-200/50', 'bg-swarmshadow-50', 'rounded-lg', 'transition-colors', 'duration-300',
        'ease-in-out', 'loop-pulse-animation', 'p-2'
      );
      thumbnail.style.backgroundColor = '';
      thumbnail.style.animation = '';

      // Apply active loop styling
      if (isCurrentlyLooping) {
        thumbnail.classList.add(
          'rounded-full', 'transition-colors', 'duration-300', 'ease-in-out', 'loop-pulse-animation', 'p-2'
        );

        // Apply theme-aware background color
        if (isDark) {
          thumbnail.classList.add('bg-swarmshadow-50'); // Slightly lighter than swarmshadow-200
        } else {
          thumbnail.classList.add('bg-swarmstripe-200/50');
        }

        // Add pulsing animation
        thumbnail.style.animation = 'loop-pulse 2s ease-in-out infinite';
      }
    }
  });
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

    // Get the sequence data from the canvas element (if available) or fallback to index lookup
    let sequenceData;
    if (canvas.sequenceData) {
      sequenceData = canvas.sequenceData;
    } else {
      // Fallback for legacy sequences
      const sequenceIndex = Array.from(sequenceBar.children).indexOf(canvas);
      try {
        const sequences = await loadAllSequences();
        sequenceData = sequences[sequenceIndex];
      } catch (error) {
        console.error('Error loading sequence:', error);
        return;
      }
    }

    if (!sequenceData) return;

    // Normalize sequence data
    let seq, isLoop, loopInterval;
    if (Array.isArray(sequenceData)) {
      // Legacy format
      seq = sequenceData;
      isLoop = false;
      loopInterval = 3;
    } else {
      // New format
      seq = sequenceData.seq || sequenceData.sequence;
      isLoop = sequenceData.isLoop || false;
      loopInterval = sequenceData.loopInterval || 3;
    }

    try {
      if (isLoop) {
        // Start/stop loop playback
        toggleLoopPlayback(seq, loopInterval);
      } else {
        // Play once
        await playSequence(seq);
      }
    } catch (error) {
      console.error('Error playing sequence:', error);
    }
  });
}

// Initialize when the script loads
setupSequencePlayback();

// Initialize loop counter on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateLoopCounter);
} else {
  updateLoopCounter();
}

// Export functions for use in other files
window.audioSystem = {
  playSequence,
  initAudioContext,
  toggleLoopPlayback,
  isSequenceLooping,
  updateThumbnailLoopStates,
  updateLoopCounter,
  getRadianInfo,
  RADIAN_TIMING,
  MAX_CONCURRENT_LOOPS,
  getActiveLoopCount: () => activeLoops.size
};

// ES module exports
export {
  playSequence,
  initAudioContext,
  toggleLoopPlayback,
  isSequenceLooping,
  updateThumbnailLoopStates,
  updateLoopCounter,
  getRadianInfo,
  RADIAN_TIMING,
  MAX_CONCURRENT_LOOPS,
  getAudioForCircle,
  createSequenceRipple,
  setupSequencePlayback
};
