import api from './api';

const DB_NAME = 'FixvoOfflineSyncDB';
const STORE_NAME = 'offlineActions';

const openDB = () => {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

export const queueOfflineAction = async (action) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.add({
        ...action,
        timestamp: Date.now(),
        retryCount: 0
      });
      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error('[OfflineSync] Failed to queue offline action:', err);
    return false;
  }
};

export const getQueuedActions = async () => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error('[OfflineSync] Failed to read queued actions:', err);
    return [];
  }
};

export const removeQueuedAction = async (id) => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error('[OfflineSync] Failed to delete queued action:', err);
    return false;
  }
};

export const syncOfflineActions = async (onSyncSuccess) => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.log('[OfflineSync] Browser is offline, skipping sync.');
    return;
  }

  const actions = await getQueuedActions();
  if (actions.length === 0) return;

  console.log(`[OfflineSync] Found ${actions.length} queued offline actions. Syncing...`);

  for (const action of actions) {
    try {
      await api.put(`/bookings/${action.bookingId}/status`, { 
        status: action.status,
        rejectionReason: action.rejectionReason || '' 
      });
      await removeQueuedAction(action.id);
      console.log(`[OfflineSync] Synced status '${action.status}' for Booking ${action.bookingId}`);
      if (onSyncSuccess) onSyncSuccess(action);
    } catch (err) {
      console.error(`[OfflineSync] Failed syncing action for Booking ${action.bookingId}:`, err);
      // If server explicitly rejects the action with 400/404, remove it from queue to avoid blockages
      if (err.response && (err.response.status === 400 || err.response.status === 404)) {
        await removeQueuedAction(action.id);
      }
    }
  }
};
