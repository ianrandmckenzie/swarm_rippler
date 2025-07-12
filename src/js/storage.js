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

async function saveSequenceToDB(seq) {
  const db = await openDB();
  const tx = db.transaction('sequences', 'readwrite');
  tx.objectStore('sequences').add(seq);
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
