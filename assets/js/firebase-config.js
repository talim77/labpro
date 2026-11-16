/**
 * Offline-First Pathology Lab Management System
 * Firebase & Cloud Firestore Configuration Manager
 * Supports:
 * - Dynamic configuration via UI (Settings -> Firebase Config)
 * - Safe offline initialization (never crashes if internet is absent or CDN fails)
 * - Firestore persistence (cached reads/writes)
 */

// Default configuration placeholder - user can update this via Settings UI or edit here
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDemoKeyForLabManagementSystem2026",
  authDomain: "labpro-cloud-sync.firebaseapp.com",
  projectId: "labpro-cloud-sync",
  storageBucket: "labpro-cloud-sync.appspot.com",
  messagingSenderId: "102938475610",
  appId: "1:102938475610:web:89abcdef0123456789abcd"
};

class FirebaseConfigManager {
  constructor() {
    this.app = null;
    this.auth = null;
    this.db = null;
    this.isInitialized = false;
    this.isConfigured = false;
    this.initError = null;
  }

  // Load configuration from localStorage or default
  getConfig() {
    const saved = localStorage.getItem('lab_firebase_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved firebase config:', e);
      }
    }
    return DEFAULT_FIREBASE_CONFIG;
  }

  // Save new configuration to localStorage
  saveConfig(newConfig) {
    if (!newConfig || !newConfig.projectId || !newConfig.apiKey) {
      throw new Error('Invalid Firebase Config: apiKey aur projectId hona anivarya hai.');
    }
    localStorage.setItem('lab_firebase_config', JSON.stringify(newConfig));
    return true;
  }

  // Check if real config is provided (not just demo placeholder)
  hasValidCustomConfig() {
    const cfg = this.getConfig();
    return cfg && cfg.apiKey && !cfg.apiKey.includes('DemoKey') && cfg.projectId && !cfg.projectId.includes('labpro-cloud-sync');
  }

  // Initialize Firebase safely
  async init() {
    if (typeof firebase === 'undefined') {
      console.warn('[Firebase] Firebase SDK is not loaded. Operating in 100% local offline mode.');
      this.initError = 'Firebase SDK CDN nahi mila ya offline hai.';
      return false;
    }

    try {
      const config = this.getConfig();

      // Check if already initialized
      if (!firebase.apps || firebase.apps.length === 0) {
        this.app = firebase.initializeApp(config);
      } else {
        this.app = firebase.app();
      }

      this.auth = firebase.auth();
      this.db = firebase.firestore();

      // Configure persistence if available
      try {
        await this.db.enablePersistence({ synchronizeTabs: true });
        console.log('[Firebase] Firestore multi-tab offline persistence enabled.');
      } catch (err) {
        if (err.code === 'failed-precondition') {
          console.warn('[Firebase] Multiple tabs open, persistence enabled in first tab only.');
        } else if (err.code === 'unimplemented') {
          console.warn('[Firebase] Browser does not support Firestore persistence.');
        }
      }

      this.isInitialized = true;
      this.isConfigured = true;
      console.log('[Firebase] Firebase initialized successfully. Project:', config.projectId);
      return true;
    } catch (err) {
      console.warn('[Firebase Init Error]:', err.message);
      this.initError = err.message;
      return false;
    }
  }

  // Quick connectivity test
  async testConnection() {
    if (!this.isInitialized || !this.db) {
      return { success: false, message: 'Firebase initialize nahi hua hai. Internet ya config check karein.' };
    }
    try {
      const testRef = this.db.collection('_system_health').doc('ping');
      await testRef.set({ lastPing: new Date().toISOString() }, { merge: true });
      return { success: true, message: 'Cloud Firestore se connection safal raha!' };
    } catch (e) {
      return { success: false, message: 'Firestore connection failed: ' + e.message };
    }
  }
}

window.firebaseConfigManager = new FirebaseConfigManager();
