// ------------ Development Helper Functions ------------
import { openDB, setSetting } from './storage.js';

// NON-PRODUCTION: Clear all IndexedDB data for this project
async function clearAllData() {
  console.warn('🗑️ Clearing all IndexedDB data for clicking_glossolalia project...');

  try {
    const db = await openDB();

    // Clear all sequences
    const sequenceTx = db.transaction('sequences', 'readwrite');
    await sequenceTx.objectStore('sequences').clear();

    // Clear all settings
    const settingsTx = db.transaction('settings', 'readwrite');
    await settingsTx.objectStore('settings').clear();

    console.log('✅ All IndexedDB data cleared successfully');

    // Optionally reload the page to reset the UI state
    const shouldReload = confirm('Data cleared! Reload page to reset UI?');
    if (shouldReload) {
      window.location.reload();
    }

  } catch (error) {
    console.error('❌ Error clearing IndexedDB data:', error);
  }
}

// NON-PRODUCTION: Reset tutorial state to test first-time user experience
async function resetTutorial() {
  console.warn('🎓 Resetting tutorial state...');

  try {
    await setSetting('tutorialSeen', false);
    console.log('✅ Tutorial state reset - reload page to see tutorial');

    const shouldReload = confirm('Tutorial reset! Reload page to see tutorial?');
    if (shouldReload) {
      window.location.reload();
    }
  } catch (error) {
    console.error('❌ Error resetting tutorial:', error);
  }
}

// Make functions available in browser console for development
window.clearAllData = clearAllData;
window.resetTutorial = resetTutorial;
console.log('🔧 Dev helpers available:');
console.log('  - clearAllData(): Clear all sequences and settings');
console.log('  - resetTutorial(): Reset tutorial state to test first-time experience');

// NON-PRODUCTION: Generate random sequences for testing bottom bar design
async function generateRandomSequences(count = 50) {
  console.warn(`🎲 Generating ${count} random sequences for testing...`);

  try {
    const db = await openDB();
    let generated = 0;

    for (let i = 0; i < count; i++) {
      // Generate a random sequence with 1-8 circles (reasonable range)
      const sequenceLength = Math.floor(Math.random() * 8) + 1;
      const sequence = [];

      // Create a set to avoid duplicate indices in the same sequence
      const usedIndices = new Set();

      for (let j = 0; j < sequenceLength; j++) {
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * 24); // 0-23 (24 total circles)
        } while (usedIndices.has(randomIndex));

        usedIndices.add(randomIndex);
        sequence.push(randomIndex);
      }

      // Sort sequence for consistency (optional, but makes patterns cleaner)
      sequence.sort((a, b) => a - b);

      // Save to IndexedDB
      const tx = db.transaction('sequences', 'readwrite');
      await tx.objectStore('sequences').add(sequence);
      generated++;

      // Add thumbnail to UI immediately
      if (typeof addSequenceThumbnail === 'function') {
        addSequenceThumbnail(sequence);
      }

      // Small delay to prevent overwhelming the browser
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    console.log(`✅ Generated ${generated} random sequences successfully`);
    console.log('📊 Sequences range from 1-8 circles each, randomly distributed across all 24 positions');

  } catch (error) {
    console.error('❌ Error generating random sequences:', error);
  }
}

// NON-PRODUCTION: Generate sequences with specific patterns for testing
async function generateTestPatterns() {
  console.warn('🎨 Generating test patterns for design testing...');

  const patterns = [
    // Single circles from each direction
    [0], [3], [6], [9], [12], [15], [18], [21],
    // Full directions (all 3 rings in one direction)
    [0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11],
    // Single rings (one circle from each direction)
    [0, 3, 6, 9, 12, 15, 18, 21], // First ring
    [1, 4, 7, 10, 13, 16, 19, 22], // Second ring
    [2, 5, 8, 11, 14, 17, 20, 23], // Third ring
    // Patterns
    [0, 6, 12, 18], // Cross pattern
    [3, 9, 15, 21], // X pattern
    [0, 1, 3, 4, 6, 7, 9, 10], // Quarter fill
    // Random complex patterns
    [0, 2, 5, 8, 11, 14, 17, 20], // Spiral-ish
    [1, 4, 7, 10, 13, 16, 19, 22], // Middle ring only
  ];

  try {
    const db = await openDB();

    for (const pattern of patterns) {
      const tx = db.transaction('sequences', 'readwrite');
      await tx.objectStore('sequences').add(pattern);

      if (typeof addSequenceThumbnail === 'function') {
        addSequenceThumbnail(pattern);
      }
    }

    console.log(`✅ Generated ${patterns.length} test patterns`);

  } catch (error) {
    console.error('❌ Error generating test patterns:', error);
  }
}

// Make functions available in browser console
window.generateRandomSequences = generateRandomSequences;
window.generateTestPatterns = generateTestPatterns;
console.log('🔧 Dev helpers available:');
console.log('  - generateRandomSequences(50) - Generate random sequences');
console.log('  - generateTestPatterns() - Generate specific test patterns');
console.log('  - clearAllData() - Clear all data and reload');
console.log('  - resetTutorial() - Reset tutorial state');

// Export dev tools functions
export {
  clearAllData,
  resetTutorial,
  generateRandomSequences,
  generateTestPatterns
};
