// ------------ Tutorial and Sequence Modal Logic ------------
// IndexedDB setup
const DB_NAME = 'clickRippleDB';
const DB_VERSION = 1;
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings');
      if (!db.objectStoreNames.contains('sequences')) db.createObjectStore('sequences', { autoIncrement: true });
    };
    request.onsuccess = e => resolve(e.target.result);
    request.onerror = e => reject(e.target.error);
  });
}

async function getSetting(key) {
  const db = await openDB();
  return new Promise(res => {
    const tx = db.transaction('settings', 'readonly');
    const req = tx.objectStore('settings').get(key);
    req.onsuccess = () => res(req.result);
    req.onerror = () => res(null);
  });
}

async function setSetting(key, value) {
  const db = await openDB();
  const tx = db.transaction('settings', 'readwrite');
  tx.objectStore('settings').put(value, key);
}

async function saveSequenceToDB(sequenceData) {
  const db = await openDB();
  const tx = db.transaction('sequences', 'readwrite');

  // Normalize sequence data format
  let normalizedData;
  if (Array.isArray(sequenceData)) {
    // Legacy format: just an array of indices
    normalizedData = {
      sequence: sequenceData,
      isLoop: false,
      loopInterval: 3
    };
  } else {
    // New format: object with sequence and loop settings
    normalizedData = sequenceData;
  }

  tx.objectStore('sequences').add(normalizedData);
}

// Load all sequences from IndexedDB
async function loadAllSequences() {
  const db = await openDB();
  return new Promise(res => {
    const tx = db.transaction('sequences', 'readonly');
    const req = tx.objectStore('sequences').getAll();
    req.onsuccess = () => res(req.result || []);
    req.onerror = () => res([]);
  });
}

// Preferences management
async function getPreferences() {
  const preferences = await getSetting('preferences');
  return preferences || {
    theme: 'system',
    volume: 0.7,
    showTutorial: true
  };
}

async function savePreferences(preferences) {
  await setSetting('preferences', preferences);
}

// Update an existing sequence at a specific index
async function updateSequence(index, sequenceData) {
  const db = await openDB();
  const tx = db.transaction('sequences', 'readwrite');
  const store = tx.objectStore('sequences');

  return new Promise((resolve, reject) => {
    // First get all sequences to find the one at the index
    const getAllReq = store.getAll();

    getAllReq.onsuccess = () => {
      const sequences = getAllReq.result || [];

      if (index >= 0 && index < sequences.length) {
        // Update the sequence at the specified index
        const updateReq = store.put(sequenceData, index + 1); // IndexedDB keys are 1-based

        updateReq.onsuccess = () => {
          console.log('Sequence updated successfully');
          resolve();
        };

        updateReq.onerror = () => {
          console.error('Failed to update sequence:', updateReq.error);
          reject(updateReq.error);
        };
      } else {
        reject(new Error('Invalid sequence index'));
      }
    };

    getAllReq.onerror = () => {
      console.error('Failed to get sequences for update:', getAllReq.error);
      reject(getAllReq.error);
    };
  });
}

// Delete a sequence at a specific index
async function deleteSequence(index) {
  const db = await openDB();
  const tx = db.transaction('sequences', 'readwrite');
  const store = tx.objectStore('sequences');

  return new Promise((resolve, reject) => {
    // First get all sequences
    const getAllReq = store.getAll();

    getAllReq.onsuccess = () => {
      const sequences = getAllReq.result || [];

      if (index >= 0 && index < sequences.length) {
        // Clear the store and re-add all sequences except the one to delete
        const clearReq = store.clear();

        clearReq.onsuccess = () => {
          // Re-add all sequences except the deleted one
          const remainingSequences = sequences.filter((_, i) => i !== index);
          let addCount = 0;

          if (remainingSequences.length === 0) {
            console.log('Sequence deleted successfully (store now empty)');
            resolve();
            return;
          }

          remainingSequences.forEach((seq, newIndex) => {
            const addReq = store.add(seq, newIndex + 1);

            addReq.onsuccess = () => {
              addCount++;
              if (addCount === remainingSequences.length) {
                console.log('Sequence deleted successfully');
                resolve();
              }
            };

            addReq.onerror = () => {
              console.error('Failed to re-add sequence:', addReq.error);
              reject(addReq.error);
            };
          });
        };

        clearReq.onerror = () => {
          console.error('Failed to clear store for deletion:', clearReq.error);
          reject(clearReq.error);
        };
      } else {
        reject(new Error('Invalid sequence index'));
      }
    };

    getAllReq.onerror = () => {
      console.error('Failed to get sequences for deletion:', getAllReq.error);
      reject(getAllReq.error);
    };
  });
}

// Export all storage functions
export {
  openDB,
  getSetting,
  setSetting,
  saveSequenceToDB,
  loadAllSequences,
  getPreferences,
  savePreferences,
  updateSequence,
  deleteSequence
};
