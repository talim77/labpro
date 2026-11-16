/**
 * Offline Lab Management System - IndexedDB Data Layer
 * 100% Client-Side, Zero External Dependencies, Persistent across browser restarts.
 */

const DB_NAME = 'LabManagementDB';
const DB_VERSION = 1;

class LabDB {
  constructor() {
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Stores
        if (!db.objectStoreNames.contains('lab_profiles')) {
          db.createObjectStore('lab_profiles', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('labId', 'labId', { unique: false });
          userStore.createIndex('username', 'username', { unique: false });
        }
        if (!db.objectStoreNames.contains('doctors')) {
          const docStore = db.createObjectStore('doctors', { keyPath: 'id' });
          docStore.createIndex('labId', 'labId', { unique: false });
        }
        if (!db.objectStoreNames.contains('test_catalog')) {
          const testStore = db.createObjectStore('test_catalog', { keyPath: 'id' });
          testStore.createIndex('labId', 'labId', { unique: false });
        }
        if (!db.objectStoreNames.contains('patients')) {
          const patStore = db.createObjectStore('patients', { keyPath: 'id' });
          patStore.createIndex('labId', 'labId', { unique: false });
          patStore.createIndex('date', 'date', { unique: false });
          patStore.createIndex('doctorId', 'doctorId', { unique: false });
        }
        if (!db.objectStoreNames.contains('reports')) {
          const repStore = db.createObjectStore('reports', { keyPath: 'id' });
          repStore.createIndex('patientId', 'patientId', { unique: false });
          repStore.createIndex('labId', 'labId', { unique: false });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.db.onversionchange = () => {
          if (this.db) {
            this.db.close();
            this.db = null;
          }
        };
        resolve(this.db);
      };

      request.onblocked = (event) => {
        console.warn('IndexedDB connection blocked by another open tab or window.');
      };

      request.onerror = (event) => {
        console.error('IndexedDB opening error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  // Generic Get All
  async getAll(storeName, filterFn = null) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result || [];
        if (filterFn) {
          resolve(results.filter(filterFn));
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Generic Get by Key
  async get(storeName, key) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic Add
  async add(storeName, item) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onsuccess = () => {
        if (storeName !== 'settings') {
          if (window.backupManager && typeof window.backupManager.scheduleAutoBackup === 'function') {
            window.backupManager.scheduleAutoBackup();
          }
          if (window.cloudSyncManager && typeof window.cloudSyncManager.scheduleCloudSync === 'function') {
            window.cloudSyncManager.scheduleCloudSync();
          }
        }
        resolve(item);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Generic Put (Update or Insert)
  async put(storeName, item) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => {
        if (storeName !== 'settings') {
          if (window.backupManager && typeof window.backupManager.scheduleAutoBackup === 'function') {
            window.backupManager.scheduleAutoBackup();
          }
          if (window.cloudSyncManager && typeof window.cloudSyncManager.scheduleCloudSync === 'function') {
            window.cloudSyncManager.scheduleCloudSync();
          }
        }
        resolve(item);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Generic Delete
  async delete(storeName, key) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        if (storeName !== 'settings') {
          if (window.backupManager && typeof window.backupManager.scheduleAutoBackup === 'function') {
            window.backupManager.scheduleAutoBackup();
          }
          if (window.cloudSyncManager && typeof window.cloudSyncManager.scheduleCloudSync === 'function') {
            window.cloudSyncManager.scheduleCloudSync();
          }
        }
        resolve(true);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Full Database Export (for 1-click offline backup)
  async exportDatabase() {
    await this.init();
    const stores = ['lab_profiles', 'users', 'doctors', 'test_catalog', 'patients', 'reports', 'settings'];
    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      stores: {}
    };

    for (const store of stores) {
      backupData.stores[store] = await this.getAll(store);
    }

    return backupData;
  }

  // Full Database Restore (from 1-click offline backup)
  async importDatabase(backupData) {
    await this.init();
    if (!backupData || !backupData.stores) {
      throw new Error('Invalid backup file format');
    }

    const stores = Object.keys(backupData.stores);
    for (const storeName of stores) {
      if (!this.db.objectStoreNames.contains(storeName)) continue;

      const items = backupData.stores[storeName] || [];
      await new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        store.clear();

        items.forEach((item) => store.put(item));

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    }

    return true;
  }
}

// Global instance
window.labDB = new LabDB();
