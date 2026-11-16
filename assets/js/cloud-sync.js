/**
 * Offline-First Pathology Lab Management System - Cloud Sync & Backup Engine
 * Dual-Sync Philosophy:
 * 1. 100% Offline: Data writes instantly to local IndexedDB and local JSON file.
 * 2. Real-Time Cloud: When internet is available, automatically syncs to Cloud Firestore.
 * 3. Offline Queue: When offline, queued mutations automatically sync as soon as internet returns.
 */

class CloudSyncManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.isSyncing = false;
    this.syncTimer = null;
    this.lastSyncTime = localStorage.getItem('last_cloud_sync_time') || null;
    this.status = 'initializing'; // 'online_synced' | 'syncing' | 'offline' | 'error' | 'local_only'

    this.initNetworkListeners();
  }

  initNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('[CloudSync] Internet connection detected (Online).');
      this.isOnline = true;
      this.updateStatusBadge();
      this.flushPendingSyncQueue();
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('🌐 Internet connected! Syncing with Cloud Firestore...', 'info');
      }
    });

    window.addEventListener('offline', () => {
      console.log('[CloudSync] Network lost (Offline mode).');
      this.isOnline = false;
      this.status = 'offline';
      this.updateStatusBadge();
      if (window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('📡 Offline Mode Active: Data saved locally & auto-backup folder safe.', 'warning');
      }
    });
  }

  async init() {
    if (window.firebaseConfigManager) {
      await window.firebaseConfigManager.init();
    }
    this.updateStatusBadge();

    // Check if online and pending queue exists
    if (this.isOnline && this.isFirebaseReady()) {
      setTimeout(() => {
        this.flushPendingSyncQueue();
      }, 1000);
    }
  }

  isFirebaseReady() {
    return window.firebaseConfigManager &&
           window.firebaseConfigManager.isInitialized &&
           window.firebaseConfigManager.db &&
           this.isOnline;
  }

  // Get current active lab ID
  getActiveLabId() {
    return window.authManager?.currentLab?.id || localStorage.getItem('active_lab_id') || 'lab_default';
  }

  // Update visual badge in UI topbar & settings
  updateStatusBadge() {
    const badges = document.querySelectorAll('.ui-cloud-status-badge');
    const labId = this.getActiveLabId();

    let badgeHTML = '';
    if (!this.isOnline) {
      this.status = 'offline';
      badgeHTML = `<span class="badge" style="background:#fef3c7; color:#92400e; font-weight:600; display:inline-flex; align-items:center; gap:5px;" title="Offline Mode: All data saved in local storage & local JSON backup file">
        <span style="width:8px; height:8px; border-radius:50%; background:#d97706; display:inline-block;"></span>
        📡 Offline (Local Storage Safe)
      </span>`;
    } else if (this.isSyncing) {
      this.status = 'syncing';
      badgeHTML = `<span class="badge" style="background:#e0f2fe; color:#0369a1; font-weight:600; display:inline-flex; align-items:center; gap:5px;" title="Syncing changes with Cloud Firestore...">
        <span style="display:inline-block; animation:spin 1s linear infinite;">🔄</span>
        Syncing Cloud...
      </span>`;
    } else if (this.isFirebaseReady()) {
      this.status = 'online_synced';
      const timeStr = this.lastSyncTime ? new Date(this.lastSyncTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Just now';
      badgeHTML = `<span class="badge" style="background:#dcfce7; color:#15803d; font-weight:600; display:inline-flex; align-items:center; gap:5px;" title="Cloud Firestore Connected & Synced (Last: ${timeStr})">
        <span style="width:8px; height:8px; border-radius:50%; background:#16a34a; display:inline-block;"></span>
        ☁️ Cloud Synced
      </span>`;
    } else {
      this.status = 'local_only';
      badgeHTML = `<span class="badge" style="background:#f1f5f9; color:#475569; font-weight:600; display:inline-flex; align-items:center; gap:5px;" title="Local Mode: Working with IndexedDB and local JSON folder">
        <span style="width:8px; height:8px; border-radius:50%; background:#94a3b8; display:inline-block;"></span>
        💻 Local PC Active
      </span>`;
    }

    badges.forEach(b => {
      b.innerHTML = badgeHTML;
    });

    // Update settings timestamp if visible
    const syncTimeEl = document.getElementById('cloud-sync-last-time');
    if (syncTimeEl) {
      syncTimeEl.innerText = this.lastSyncTime
        ? new Date(this.lastSyncTime).toLocaleString('en-IN')
        : 'Not synced yet';
    }
  }

  /**
   * Schedule automatic cloud sync (called on any DB change)
   */
  scheduleCloudSync() {
    clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(async () => {
      await this.syncToCloud(false);
    }, 1500); // 1.5s debounce
  }

  /**
   * Sync complete database for active lab to Cloud Firestore
   */
  async syncToCloud(isManual = false) {
    const labId = this.getActiveLabId();
    if (!labId) return;

    if (!this.isOnline || !this.isFirebaseReady()) {
      // Record in offline sync queue
      this.queueOfflineMutation(labId);
      if (isManual && window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('Internet ya Firebase connected nahi hai. Changes local storage me save hain aur online aate hi sync ho jayenge.', 'warning');
      }
      return;
    }

    if (this.isSyncing) return;

    try {
      this.isSyncing = true;
      this.updateStatusBadge();

      const db = window.firebaseConfigManager.db;
      const exportData = await window.labDB.exportDatabase();

      // Filter data strictly belonging to this Lab
      const labProfile = (exportData.stores.lab_profiles || []).find(l => l.id === labId);
      const patients = (exportData.stores.patients || []).filter(p => p.labId === labId);
      const reports = (exportData.stores.reports || []).filter(r => r.labId === labId);
      const doctors = (exportData.stores.doctors || []).filter(d => d.labId === labId);
      const tests = (exportData.stores.test_catalog || []).filter(t => t.labId === labId);
      const staff = (exportData.stores.users || []).filter(u => u.labId === labId);

      const batch = db.batch();
      const now = new Date().toISOString();

      // 1. Sync Lab Profile doc
      if (labProfile) {
        const labRef = db.collection('labs').doc(labId);
        batch.set(labRef, { ...labProfile, lastSyncedAt: now }, { merge: true });
      }

      // 2. Sync Full JSON Cloud Snapshot (1-Click Disaster Recovery in Cloud)
      const backupRef = db.collection('labs').doc(labId).collection('backups').doc('latest');
      batch.set(backupRef, {
        labId: labId,
        exportedAt: now,
        counts: {
          patients: patients.length,
          reports: reports.length,
          doctors: doctors.length,
          tests: tests.length,
          staff: staff.length
        },
        snapshotJson: JSON.stringify(exportData)
      }, { merge: true });

      // Commit batch
      await batch.commit();

      // 3. Sync individual collections in background for real-time query support
      await this.syncCollectionToCloud(db, labId, 'patients', patients);
      await this.syncCollectionToCloud(db, labId, 'reports', reports);
      await this.syncCollectionToCloud(db, labId, 'doctors', doctors);
      await this.syncCollectionToCloud(db, labId, 'test_catalog', tests);
      await this.syncCollectionToCloud(db, labId, 'staff', staff);

      this.lastSyncTime = now;
      localStorage.setItem('last_cloud_sync_time', now);
      this.clearPendingSyncQueue(labId);

      console.log(`[CloudSync] Successfully synced Lab (${labId}) to Cloud Firestore at ${now}`);

      if (isManual && window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('✓ Cloud Firestore par sara data successfully backup & sync ho gaya!', 'success');
      }
    } catch (err) {
      console.warn('[CloudSync Error]:', err.message);
      this.queueOfflineMutation(labId);
      if (isManual && window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('Cloud sync error: ' + err.message, 'error');
      }
    } finally {
      this.isSyncing = false;
      this.updateStatusBadge();
    }
  }

  // Helper to sync sub-collection in chunks
  async syncCollectionToCloud(db, labId, subcollectionName, items) {
    if (!items || items.length === 0) return;
    const chunkSize = 25; // Firestore batch limits
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const batch = db.batch();
      for (const item of chunk) {
        if (!item.id) continue;
        const ref = db.collection('labs').doc(labId).collection(subcollectionName).doc(item.id);
        batch.set(ref, item, { merge: true });
      }
      try {
        await batch.commit();
      } catch (e) {
        console.warn(`[CloudSync] Chunk write error on ${subcollectionName}:`, e.message);
      }
    }
  }

  /**
   * Pull all data for active lab from Cloud Firestore and restore into local IndexedDB
   */
  async restoreFromCloud(labId = null) {
    const targetLabId = labId || this.getActiveLabId();
    if (!this.isOnline || !this.isFirebaseReady()) {
      throw new Error('Internet ya Cloud Firestore connection uplabdh nahi hai.');
    }

    const db = window.firebaseConfigManager.db;
    const backupDoc = await db.collection('labs').doc(targetLabId).collection('backups').doc('latest').get();

    if (!backupDoc.exists) {
      throw new Error(`Cloud Firestore par is Lab (${targetLabId}) ka koi backup nahi mila.`);
    }

    const backupData = backupDoc.data();
    if (!backupData.snapshotJson) {
      throw new Error('Backup snapshot data corrupted ya empty hai.');
    }

    const parsed = JSON.parse(backupData.snapshotJson);
    await window.labDB.importDatabase(parsed);
    localStorage.setItem('active_lab_id', targetLabId);

    return {
      success: true,
      counts: backupData.counts,
      exportedAt: backupData.exportedAt
    };
  }

  // Offline queue management
  queueOfflineMutation(labId) {
    try {
      const queueKey = 'pending_cloud_sync_' + labId;
      localStorage.setItem(queueKey, 'pending_' + new Date().toISOString());
    } catch (e) {}
  }

  clearPendingSyncQueue(labId) {
    try {
      localStorage.removeItem('pending_cloud_sync_' + labId);
    } catch (e) {}
  }

  async flushPendingSyncQueue() {
    const labId = this.getActiveLabId();
    const queueKey = 'pending_cloud_sync_' + labId;
    if (localStorage.getItem(queueKey)) {
      console.log('[CloudSync] Flushing pending offline sync queue for Lab:', labId);
      await this.syncToCloud(false);
    }
  }
}

window.cloudSyncManager = new CloudSyncManager();
