/**
 * Offline Lab Management System - Auto-Backup & 1-Click JSON Backup/Restore Engine
 * Supports:
 * 1. File System Access API - Scoped folder auto-sync with zero duplicate files
 * 2. Silent background overwrite of 'Lab_AutoBackup_Data.json' on real DB form submissions
 * 3. 100% offline manual JSON download and restore
 */

class BackupManager {
  constructor() {
    this.autoTimer = null;
    this.cachedDirHandle = null;
    this.isBackingUp = false;
  }

  // --------------------------------------------------------------------------
  // 1. FILE SYSTEM ACCESS API - DEDICATED AUTO-BACKUP FOLDER
  // --------------------------------------------------------------------------

  /**
   * User selects a dedicated local folder for silent auto-backup
   */
  async setupAutoBackupFolder() {
    if (!('showDirectoryPicker' in window)) {
      throw new Error('Aapka browser File System Access API support nahi karta. Kripya Google Chrome ya Microsoft Edge browser use karein.');
    }

    try {
      // 1. Open native Windows folder selector
      const dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents'
      });

      if (!dirHandle) return null;

      // 2. Verify write permission immediately
      const perm = await this.verifyPermission(dirHandle, true);
      if (!perm) {
        throw new Error('Folder me write permission nahi mili.');
      }

      // 3. Test write: Create or overwrite initial backup file
      const fileHandle = await dirHandle.getFileHandle('Lab_AutoBackup_Data.json', { create: true });
      const writable = await fileHandle.createWritable();
      const exportData = await window.labDB.exportDatabase();
      await writable.write(JSON.stringify(exportData, null, 2));
      await writable.close();

      // 4. Save handle and folder name in IndexedDB settings store
      this.cachedDirHandle = dirHandle;
      const now = new Date().toISOString();

      await window.labDB.put('settings', {
        key: 'auto_backup_config',
        folderName: dirHandle.name,
        handle: dirHandle,
        enabled: true,
        lastBackupTime: now,
        updatedAt: now
      });

      return {
        success: true,
        folderName: dirHandle.name,
        time: now
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        // User cancelled picker dialog
        return null;
      }
      console.error('setupAutoBackupFolder error:', err);
      throw err;
    }
  }

  /**
   * Check and optionally request permission for stored directory handle
   */
  async verifyPermission(dirHandle, requestIfNeed = false) {
    if (!dirHandle) return false;
    try {
      const opts = { mode: 'readwrite' };
      const current = await dirHandle.queryPermission(opts);
      if (current === 'granted') return true;

      if (requestIfNeed) {
        const req = await dirHandle.requestPermission(opts);
        return req === 'granted';
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get the current auto-backup configuration status
   */
  async getAutoBackupStatus() {
    try {
      const cfg = await window.labDB.get('settings', 'auto_backup_config');
      if (!cfg || !cfg.enabled) {
        return { configured: false, enabled: false };
      }

      this.cachedDirHandle = cfg.handle || this.cachedDirHandle;
      const hasPerm = await this.verifyPermission(this.cachedDirHandle, false);

      return {
        configured: true,
        enabled: cfg.enabled,
        folderName: cfg.folderName,
        lastBackupTime: cfg.lastBackupTime,
        hasPermission: hasPerm
      };
    } catch (err) {
      console.warn('Error reading auto backup status:', err);
      return { configured: false, enabled: false };
    }
  }

  /**
   * Disable / Disconnect auto-backup folder
   */
  async disableAutoBackup() {
    this.cachedDirHandle = null;
    await window.labDB.put('settings', {
      key: 'auto_backup_config',
      enabled: false,
      handle: null,
      folderName: null
    });
    return true;
  }

  /**
   * Perform the silent auto-backup: Overwrites 'Lab_AutoBackup_Data.json' in selected folder
   */
  async performAutoBackup(silent = true) {
    if (this.isBackingUp) return;

    try {
      this.isBackingUp = true;
      const cfg = await window.labDB.get('settings', 'auto_backup_config');
      if (!cfg || !cfg.enabled) return;

      const handle = this.cachedDirHandle || cfg.handle;
      if (!handle) return;

      // Check permission
      const hasPerm = await this.verifyPermission(handle, false);
      if (!hasPerm) {
        console.warn('Auto-backup skipped: Permission needed for folder', cfg.folderName);
        return;
      }

      // Check/create Lab_AutoBackup_Data.json and overwrite it
      const fileHandle = await handle.getFileHandle('Lab_AutoBackup_Data.json', { create: true });
      const writable = await fileHandle.createWritable();
      const exportData = await window.labDB.exportDatabase();

      await writable.write(JSON.stringify(exportData, null, 2));
      await writable.close();

      const now = new Date().toISOString();
      cfg.lastBackupTime = now;
      await window.labDB.put('settings', cfg);

      console.log(`[Auto-Backup] Successfully updated Lab_AutoBackup_Data.json in '${cfg.folderName}' at ${now}`);

      if (!silent && window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(`Auto-backup file updated in '${cfg.folderName}'!`, 'success');
      }

      // If settings page is active, update last time display
      const timeElem = document.getElementById('auto-backup-last-time');
      if (timeElem) {
        timeElem.innerText = new Date(now).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
    } catch (err) {
      console.warn('[Auto-Backup Error]:', err.message);
      if (!silent && window.app && typeof window.app.showToast === 'function') {
        window.app.showToast('Auto-backup error: ' + err.message, 'error');
      }
    } finally {
      this.isBackingUp = false;
    }
  }

  /**
   * Debounced Auto-Backup Trigger
   * Called STRICTLY on DB mutation success (Save Patient, Save Report, Save Doctor, Save Bill).
   * NEVER triggered by mouse click, scroll, typing, or open forms!
   */
  scheduleAutoBackup() {
    clearTimeout(this.autoTimer);
    this.autoTimer = setTimeout(async () => {
      await this.performAutoBackup(true);
    }, 1200); // 1.2s debounce waits for full multi-record form submission to settle
  }

  // --------------------------------------------------------------------------
  // 2. MANUAL 1-CLICK BACKUP & RESTORE (CLASSIC FALLBACK)
  // --------------------------------------------------------------------------

  /**
   * Export all data to a downloadable JSON file
   */
  async downloadBackup() {
    try {
      const data = await window.labDB.exportDatabase();
      const labName = (window.authManager.currentLab && window.authManager.currentLab.name) || 'Lab';
      const cleanLabName = labName.replace(/[^a-zA-Z0-9]/g, '_');
      
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `${cleanLabName}_Backup_${dateStr}.json`;

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true, filename: filename };
    } catch (err) {
      console.error('Backup export failed:', err);
      throw new Error('Backup download karne me samasya aayi: ' + err.message);
    }
  }

  /**
   * Restore database from an uploaded JSON file, configure Admin PIN and auto-login
   */
  async restoreBackupFromFile(file, customAdminPin = null) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('Kripya backup JSON file select karein.'));

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          const result = await this.restoreBackupData(parsed, customAdminPin);
          resolve(result);
        } catch (err) {
          reject(new Error('Backup restore me error: ' + err.message));
        }
      };

      reader.onerror = () => reject(new Error('File read nahi ho saki.'));
      reader.readAsText(file);
    });
  }

  /**
   * Core restore routine from parsed backup object
   */
  async restoreBackupData(parsed, customAdminPin = null) {
    if (!parsed || !parsed.stores || !parsed.stores.lab_profiles || parsed.stores.lab_profiles.length === 0) {
      throw new Error('Yeh file valid Lab Backup format me nahi hai (Lab profile missing).');
    }

    // 1. Import all collections into IndexedDB
    await window.labDB.importDatabase(parsed);

    // 2. Identify primary Lab
    const labs = await window.labDB.getAll('lab_profiles');
    const primaryLab = labs[0];
    if (!primaryLab) throw new Error('Lab profile import nahi ho paya.');

    // 3. Identify and configure Admin User
    const users = await window.labDB.getAll('users', u => u.labId === primaryLab.id);
    let adminUser = users.find(u => u.role === 'admin') || users[0];

    // If custom PIN is provided, or if admin has no PIN, set the PIN
    const pinToSet = customAdminPin ? String(customAdminPin).trim() : '1234';
    if (adminUser) {
      const pinHash = await window.authManager.hashPin(pinToSet);
      adminUser.pinHash = pinHash;
      delete adminUser.pin;
      adminUser.isActivated = true;
      adminUser.active = true;
      await window.labDB.put('users', adminUser);
    }

    // 4. Set Active Lab and Active User Session (Immediate Auto-Login!)
    window.authManager.currentLab = primaryLab;
    localStorage.setItem('active_lab_id', primaryLab.id);

    if (adminUser) {
      window.authManager.currentUser = adminUser;
      const safeUser = { ...adminUser };
      delete safeUser.pin;
      delete safeUser.pinHash;
      localStorage.setItem('active_user_' + primaryLab.id, JSON.stringify(safeUser));
    }

    // 5. Ensure standard tests exist
    if (window.testCatalogManager) {
      await window.testCatalogManager.ensureDefaultTests(primaryLab.id);
    }

    return {
      success: true,
      lab: primaryLab,
      user: adminUser,
      pinUsed: pinToSet,
      storesCount: Object.keys(parsed.stores).length,
      patientsCount: parsed.stores.patients?.length || 0
    };
  }
}

window.backupManager = new BackupManager();
