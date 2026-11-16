/**
 * Offline-First Pathology Lab Management System - Auth & Permissions Manager
 * Dual Mode:
 * 1. Firebase Authentication & Cloud Firestore (Multi-Admin & Pre-registered Staff)
 * 2. 100% Offline IndexedDB + PIN Fallback
 */

class AuthManager {
  constructor() {
    this.currentLab = null;
    this.currentUser = null;
    this.firebaseAuth = null;
    this.firestore = null;
  }

  async init() {
    await window.labDB.init();

    // Check if Firebase is available
    if (window.firebaseConfigManager && window.firebaseConfigManager.isInitialized) {
      this.firebaseAuth = window.firebaseConfigManager.auth;
      this.firestore = window.firebaseConfigManager.db;
    }

    // Check if any lab exists locally
    let labs = await window.labDB.getAll('lab_profiles');
    
    // Auto-seed default Lab Profile if empty
    if (!labs || labs.length === 0) {
      const defaultLab = {
        id: 'lab_default',
        name: 'City Diagnostics & Clinical Lab',
        tagline: 'Computerized Pathology & Diagnostic Centre',
        address: 'Near Civil Hospital, Station Road',
        phone: '+91 98765 43210',
        email: 'citylab@example.com',
        regNo: 'REG/PATH/2026/104',
        technologistName: 'R. K. Verma (DMLT)',
        pathologistName: 'Dr. S. K. Gupta (MD Pathologist)',
        letterheadTopMargin: 50,
        logoBase64: '',
        createdAt: new Date().toISOString()
      };
      await window.labDB.add('lab_profiles', defaultLab);

      // Create Default Admin
      const defaultAdmin = {
        id: 'usr_admin',
        labId: 'lab_default',
        name: 'Dr. S. K. Gupta (Admin)',
        username: 'admin',
        email: 'citylab@example.com',
        pin: '1234',
        pinHash: await this.hashPin('1234'),
        phone: '9876543210',
        role: 'admin',
        isActivated: true,
        permissions: {
          canChangeTestRate: true,
          canEditTest: true,
          canDeleteTest: true,
          canEditDoctor: true,
          canDeleteDoctor: true
        },
        active: true,
        createdAt: new Date().toISOString()
      };
      await window.labDB.add('users', defaultAdmin);

      // Seed Default Referral Doctors
      const defaultDoctors = [
        { id: 'doc_1', labId: 'lab_default', name: 'Dr. A. K. Sharma', degree: 'MBBS, MD (Medicine)', hospital: 'Sharma Clinic', phone: '9812345671', commissionRate: 15, createdAt: new Date().toISOString() },
        { id: 'doc_2', labId: 'lab_default', name: 'Dr. Meena Patel', degree: 'MBBS, DGO', hospital: 'Patel Nursing Home', phone: '9812345672', commissionRate: 20, createdAt: new Date().toISOString() },
        { id: 'doc_3', labId: 'lab_default', name: 'Dr. Rajesh Verma', degree: 'BAMS', hospital: 'Verma Health Care', phone: '9812345673', commissionRate: 10, createdAt: new Date().toISOString() }
      ];
      for (const doc of defaultDoctors) {
        await window.labDB.add('doctors', doc);
      }

      // Seed Default Tests
      await window.testCatalogManager.ensureDefaultTests('lab_default');

      labs = [defaultLab];
    }

    // Load active lab ID
    const savedLabId = localStorage.getItem('active_lab_id') || labs[0].id;
    this.currentLab = labs.find(l => l.id === savedLabId) || labs[0];
    localStorage.setItem('active_lab_id', this.currentLab.id);

    // Make sure default tests exist
    await window.testCatalogManager.ensureDefaultTests(this.currentLab.id);

    // Load active user session from localStorage (persists across HTML pages!)
    const savedUserJson = localStorage.getItem('active_user_' + this.currentLab.id);
    if (savedUserJson) {
      try {
        this.currentUser = JSON.parse(savedUserJson);
      } catch (e) {
        this.currentUser = null;
      }
    }

    // Default to main Admin if not explicitly logged in
    if (!this.currentUser) {
      const users = await window.labDB.getAll('users', u => u.labId === this.currentLab.id && u.active);
      this.currentUser = users.find(u => u.role === 'admin') || users[0];
      if (this.currentUser) {
        localStorage.setItem('active_user_' + this.currentLab.id, JSON.stringify(this.currentUser));
      }
    }

    return { needsLabSetup: false, currentLab: this.currentLab, currentUser: this.currentUser };
  }

  // Cryptographic SHA-256 hash helper with pure JS fallback
  async hashPin(pin) {
    if (!pin) return '';
    const pinStr = String(pin).trim();
    try {
      if (window.crypto && window.crypto.subtle) {
        const msgBuffer = new TextEncoder().encode(pinStr + '_lab_secret_salt_2026');
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) {}
    // Pure-JS 32-bit hash fallback
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    const str = pinStr + '_lab_secret_salt_2026';
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 'h_' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }

  // --------------------------------------------------------------------------
  // 1. MULTI-ADMIN LAB REGISTRATION (FIREBASE AUTH & FIRESTORE)
  // --------------------------------------------------------------------------
  async registerLabAdminWithFirebase({ labName, tagline, address, phone, email, adminName, adminEmail, password, pin }) {
    const cleanAdminEmail = (adminEmail || '').toLowerCase().trim();
    const cleanLabName = (labName || '').trim();
    const cleanAdminName = (adminName || 'Admin').trim();
    const cleanPin = (pin || '1234').trim();

    if (!cleanLabName) throw new Error('Lab Name bharna anivarya hai.');
    if (!cleanAdminEmail) throw new Error('Admin Email (Gmail) bharna zaroori hai.');
    if (!password || password.length < 6) throw new Error('Password kam se kam 6 characters ka hona chahiye.');

    let firebaseUser = null;
    const labId = 'lab_' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();

    // Check if Firebase is available and online
    const isOnline = navigator.onLine;
    const isFirebaseReady = window.firebaseConfigManager && window.firebaseConfigManager.isInitialized;

    if (isOnline && isFirebaseReady) {
      try {
        const auth = window.firebaseConfigManager.auth;
        const db = window.firebaseConfigManager.db;

        // Create Firebase Auth User
        const userCred = await auth.createUserWithEmailAndPassword(cleanAdminEmail, password);
        firebaseUser = userCred.user;

        // Save Lab Profile in Firestore
        await db.collection('labs').doc(labId).set({
          id: labId,
          name: cleanLabName,
          tagline: tagline || 'Clinical Pathology & Diagnostic Centre',
          address: address || '',
          phone: phone || '',
          email: email || cleanAdminEmail,
          regNo: '',
          adminUid: firebaseUser.uid,
          adminEmail: cleanAdminEmail,
          createdAt: now,
          updatedAt: now
        });

        // Save Admin Profile in Firestore
        await db.collection('users').doc(firebaseUser.uid).set({
          uid: firebaseUser.uid,
          id: 'usr_' + firebaseUser.uid.substr(0, 8),
          labId: labId,
          labName: cleanLabName,
          name: cleanAdminName,
          email: cleanAdminEmail,
          role: 'admin',
          pin: cleanPin,
          pinHash: await this.hashPin(cleanPin),
          isActivated: true,
          active: true,
          permissions: {
            canChangeTestRate: true,
            canEditTest: true,
            canDeleteTest: true,
            canEditDoctor: true,
            canDeleteDoctor: true
          },
          createdAt: now
        });

        console.log('[Auth] Admin & Lab created in Firebase successfully:', cleanAdminEmail, labId);
      } catch (fbErr) {
        console.warn('[Firebase Auth Register Warning]:', fbErr.message);
        // If already exists in Auth, attempt sign-in or raise specific message
        if (fbErr.code === 'auth/email-already-in-use') {
          throw new Error(`Yeh Email (${cleanAdminEmail}) pehle se registered hai. Kripya login karein ya koi dusra email use karein.`);
        }
        throw new Error('Firebase Registration Error: ' + fbErr.message);
      }
    }

    // 2. Save in local IndexedDB (Guarantees 100% offline access)
    const newLab = {
      id: labId,
      name: cleanLabName,
      tagline: tagline || 'Clinical Pathology & Diagnostic Centre',
      address: address || '',
      phone: phone || '',
      email: email || cleanAdminEmail,
      regNo: '',
      technologistName: 'Lab Technician (DMLT)',
      pathologistName: 'Consultant Pathologist (MD)',
      letterheadTopMargin: 50,
      logoBase64: '',
      adminEmail: cleanAdminEmail,
      createdAt: now
    };
    await window.labDB.add('lab_profiles', newLab);

    const adminUser = {
      id: firebaseUser ? 'usr_' + firebaseUser.uid.substr(0, 8) : 'usr_' + Math.random().toString(36).substr(2, 9),
      uid: firebaseUser ? firebaseUser.uid : null,
      labId: labId,
      name: cleanAdminName,
      email: cleanAdminEmail,
      username: cleanAdminEmail.split('@')[0],
      pin: cleanPin,
      pinHash: await this.hashPin(cleanPin),
      role: 'admin',
      isActivated: true,
      permissions: {
        canChangeTestRate: true,
        canEditTest: true,
        canDeleteTest: true,
        canEditDoctor: true,
        canDeleteDoctor: true
      },
      active: true,
      createdAt: now
    };
    await window.labDB.add('users', adminUser);
    await window.testCatalogManager.ensureDefaultTests(labId);

    // Set active session
    this.currentLab = newLab;
    this.currentUser = adminUser;
    localStorage.setItem('active_lab_id', labId);
    localStorage.setItem('active_user_' + labId, JSON.stringify(adminUser));

    // Trigger local & cloud backup
    if (window.cloudSyncManager) {
      window.cloudSyncManager.scheduleCloudSync();
    }

    return { lab: newLab, user: adminUser };
  }

  // --------------------------------------------------------------------------
  // 2. STAFF ACCOUNT CREATION WITH STRICT ADMIN PRE-REGISTRATION CHECK
  // --------------------------------------------------------------------------
  /**
   * Staff registers their account with their Gmail.
   * Requirement: Staff can ONLY register if Admin has already saved their email in the database!
   */
  async registerStaffWithFirebase({ email, password, name, pin }) {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) throw new Error('Staff Email (Gmail) bharna zaroori hai.');
    if (!password || password.length < 6) throw new Error('Password kam se kam 6 characters ka hona chahiye.');

    const isOnline = navigator.onLine;
    const isFirebaseReady = window.firebaseConfigManager && window.firebaseConfigManager.isInitialized;
    const db = isFirebaseReady ? window.firebaseConfigManager.db : null;

    let inviteRecord = null;

    // STEP A: VERIFY EMAIL IN CLOUD FIRESTORE / LOCAL DB
    if (isOnline && db) {
      // Query 'staff_invites' in Firestore
      const inviteDoc = await db.collection('staff_invites').doc(cleanEmail).get();
      if (inviteDoc.exists) {
        inviteRecord = inviteDoc.data();
      } else {
        // Fallback: check query in case document ID is not email
        const snapshot = await db.collection('staff_invites').where('email', '==', cleanEmail).get();
        if (!snapshot.empty) {
          inviteRecord = snapshot.docs[0].data();
        }
      }
    }

    // Fallback: Check local IndexedDB users for pre-registered staff email
    if (!inviteRecord) {
      const allUsers = await window.labDB.getAll('users');
      const localStaff = allUsers.find(u => u.role === 'staff' && u.email && u.email.toLowerCase() === cleanEmail);
      if (localStaff) {
        const lab = await window.labDB.get('lab_profiles', localStaff.labId);
        inviteRecord = {
          email: cleanEmail,
          labId: localStaff.labId,
          labName: lab ? lab.name : 'Unknown Lab',
          name: localStaff.name,
          phone: localStaff.phone,
          permissions: localStaff.permissions || {},
          localUserId: localStaff.id
        };
      }
    }

    // STRICT CHECK: IF NOT INVITED BY ANY ADMIN -> BLOCK CREATION!
    if (!inviteRecord) {
      throw new Error(
        `❌ Access Denied: Yeh Email (${cleanEmail}) kisi bhi Lab me Admin dwara add nahi kiya gaya hai!\n\n` +
        `Kripya pehle apne Lab Admin se kahein ki wo aapko "Staff Accounts" menu me jakar is email se add karein.`
      );
    }

    const labId = inviteRecord.labId;
    const labName = inviteRecord.labName || 'Assigned Lab';
    const now = new Date().toISOString();
    const cleanPin = (pin || '1234').trim();
    let firebaseUser = null;

    // STEP B: CREATE FIREBASE AUTH ACCOUNT (IF ONLINE)
    if (isOnline && isFirebaseReady) {
      const auth = window.firebaseConfigManager.auth;
      try {
        const userCred = await auth.createUserWithEmailAndPassword(cleanEmail, password);
        firebaseUser = userCred.user;
      } catch (authErr) {
        if (authErr.code === 'auth/email-already-in-use') {
          // If already created in Auth, attempt login
          const signinCred = await auth.signInWithEmailAndPassword(cleanEmail, password);
          firebaseUser = signinCred.user;
        } else {
          throw new Error('Firebase Auth error: ' + authErr.message);
        }
      }

      // Update Firestore 'users' collection
      await db.collection('users').doc(firebaseUser.uid).set({
        uid: firebaseUser.uid,
        email: cleanEmail,
        name: name || inviteRecord.name || 'Staff Member',
        phone: inviteRecord.phone || '',
        role: 'staff',
        labId: labId,
        labName: labName,
        permissions: inviteRecord.permissions || {},
        pin: cleanPin,
        pinHash: await this.hashPin(cleanPin),
        isActivated: true,
        active: true,
        createdAt: now,
        activatedAt: now
      }, { merge: true });

      // Mark invite as activated
      await db.collection('staff_invites').doc(cleanEmail).set({
        status: 'activated',
        activatedUid: firebaseUser.uid,
        activatedAt: now
      }, { merge: true });
    }

    // STEP C: UPDATE / SAVE IN LOCAL INDEXEDDB
    // 1. Ensure Lab Profile exists locally
    let lab = await window.labDB.get('lab_profiles', labId);
    if (!lab && isOnline && db) {
      const labDoc = await db.collection('labs').doc(labId).get();
      if (labDoc.exists) {
        lab = labDoc.data();
        await window.labDB.put('lab_profiles', lab);
      }
    }

    if (!lab) {
      lab = {
        id: labId,
        name: labName,
        createdAt: now
      };
      await window.labDB.put('lab_profiles', lab);
    }

    // 2. Save/Update user in local IndexedDB
    const staffId = inviteRecord.localUserId || (firebaseUser ? 'usr_' + firebaseUser.uid.substr(0, 8) : 'usr_' + Math.random().toString(36).substr(2, 9));
    const localUser = {
      id: staffId,
      uid: firebaseUser ? firebaseUser.uid : null,
      labId: labId,
      name: name || inviteRecord.name || 'Staff Member',
      email: cleanEmail,
      username: cleanEmail.split('@')[0],
      phone: inviteRecord.phone || '',
      pin: cleanPin,
      pinHash: await this.hashPin(cleanPin),
      role: 'staff',
      permissions: inviteRecord.permissions || {},
      isActivated: true,
      active: true,
      createdAt: now,
      activatedAt: now
    };
    await window.labDB.put('users', localUser);
    await window.testCatalogManager.ensureDefaultTests(labId);

    // STEP D: SET ACTIVE SESSION & SWITCH TO LAB
    this.currentLab = lab;
    this.currentUser = localUser;
    localStorage.setItem('active_lab_id', labId);
    localStorage.setItem('active_user_' + labId, JSON.stringify(localUser));

    if (window.cloudSyncManager) {
      window.cloudSyncManager.scheduleCloudSync();
    }

    return { success: true, user: localUser, lab: lab };
  }

  // --------------------------------------------------------------------------
  // 3. ADMIN PRE-REGISTERS STAFF (SAVES EMAIL IN DATABASE FOR LATER SIGNUP)
  // --------------------------------------------------------------------------
  async createStaff(staffData) {
    if (!this.isAdmin()) throw new Error('Staff add karne ka adhikar sirf Admin ke paas hai.');

    const name = (staffData.name || '').trim();
    const email = (staffData.email || '').toLowerCase().trim();
    const phone = (staffData.phone || '').trim();

    if (!name) throw new Error('Staff Member Name bharna zaroori hai.');
    if (!email) throw new Error('Staff Email (Gmail) bharna zaroori hai taaki staff apna account create kar sake.');

    const staffId = 'usr_' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    
    // Explicit Staff Permissions
    const permissions = {
      canChangeTestRate: !!(staffData.permissions?.canChangeTestRate || staffData.canChangeTestRate),
      canEditTest: !!(staffData.permissions?.canEditTest || staffData.canEditTest),
      canDeleteTest: !!(staffData.permissions?.canDeleteTest || staffData.canDeleteTest),
      canEditDoctor: !!(staffData.permissions?.canEditDoctor || staffData.canEditDoctor),
      canDeleteDoctor: !!(staffData.permissions?.canDeleteDoctor || staffData.canDeleteDoctor)
    };

    const newStaff = {
      id: staffId,
      labId: this.currentLab.id,
      name: name,
      email: email,
      phone: phone,
      username: email.split('@')[0],
      pinHash: '',
      role: 'staff',
      permissions: permissions,
      isActivated: false,
      active: true,
      createdAt: now
    };

    // 1. Save locally in IndexedDB
    await window.labDB.add('users', newStaff);

    // 2. Save in Cloud Firestore 'staff_invites' (so staff can sign up online)
    const isOnline = navigator.onLine;
    const isFirebaseReady = window.firebaseConfigManager && window.firebaseConfigManager.isInitialized;
    if (isOnline && isFirebaseReady) {
      try {
        const db = window.firebaseConfigManager.db;
        await db.collection('staff_invites').doc(email).set({
          email: email,
          name: name,
          phone: phone,
          labId: this.currentLab.id,
          labName: this.currentLab.name,
          adminEmail: this.currentUser?.email || 'admin',
          permissions: permissions,
          status: 'pending',
          invitedAt: now
        });
        console.log(`[Auth] Staff invite registered in Firestore for ${email} under Lab ${this.currentLab.id}`);
      } catch (fbErr) {
        console.warn('[Firestore staff_invites write error]:', fbErr.message);
      }
    }

    if (window.cloudSyncManager) {
      window.cloudSyncManager.scheduleCloudSync();
    }

    return newStaff;
  }

  // --------------------------------------------------------------------------
  // 4. UNIFIED LOGIN (FIREBASE AUTH CLOUD LOGIN + OFFLINE PIN LOGIN)
  // --------------------------------------------------------------------------
  /**
   * Cloud Login via Email and Password
   */
  async loginWithEmail(email, password) {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail || !password) {
      return { success: false, message: 'Email aur Password dono enter karein.' };
    }

    const isOnline = navigator.onLine;
    const isFirebaseReady = window.firebaseConfigManager && window.firebaseConfigManager.isInitialized;

    if (isOnline && isFirebaseReady) {
      try {
        const auth = window.firebaseConfigManager.auth;
        const db = window.firebaseConfigManager.db;

        // Firebase Auth Sign In
        const userCred = await auth.signInWithEmailAndPassword(cleanEmail, password);
        const fbUser = userCred.user;

        // Fetch user document from Firestore
        const userDoc = await db.collection('users').doc(fbUser.uid).get();
        if (!userDoc.exists) {
          return { success: false, message: 'User profile Firestore database me nahi mila.' };
        }

        const userData = userDoc.data();
        const labId = userData.labId;

        // Fetch Lab Profile
        const labDoc = await db.collection('labs').doc(labId).get();
        const labData = labDoc.exists ? labDoc.data() : { id: labId, name: userData.labName || 'Lab' };

        // Save into local IndexedDB for future offline usage
        await window.labDB.put('lab_profiles', labData);
        await window.labDB.put('users', userData);
        await window.testCatalogManager.ensureDefaultTests(labId);

        // Set active session
        this.currentLab = labData;
        this.currentUser = userData;
        localStorage.setItem('active_lab_id', labId);
        localStorage.setItem('active_user_' + labId, JSON.stringify(userData));

        if (window.cloudSyncManager) {
          window.cloudSyncManager.scheduleCloudSync();
        }

        return { success: true, user: userData, lab: labData };
      } catch (err) {
        console.warn('[Firebase Login Error]:', err.message);
        return { success: false, message: 'Cloud Login Error: ' + err.message };
      }
    } else {
      return { success: false, message: 'Internet connection nahi hai. Kripya niche "Offline PIN Login" ka use karein.' };
    }
  }

  /**
   * Offline / Standard PIN Login (Supports Username, Email, or Mobile Phone + PIN)
   */
  async login(identifier, pin) {
    if (!this.currentLab) return { success: false, message: 'Koi Lab select nahi hai.' };

    const cleanId = String(identifier || '').toLowerCase().trim();
    const cleanDigits = String(identifier || '').replace(/\D/g, '');
    const cleanPin = String(pin || '').trim();

    if (!cleanId || !cleanPin) {
      return { success: false, message: 'Username/Email/Mobile aur PIN enter karein.' };
    }

    const users = await window.labDB.getAll('users', u => u.labId === this.currentLab.id && u.active);
    
    // Find user by username, email or phone
    const user = users.find(u => {
      const uUser = (u.username || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      const uPhone = String(u.phone || '').replace(/\D/g, '');
      return (uUser && uUser === cleanId) ||
             (uEmail && uEmail === cleanId) ||
             (cleanDigits && uPhone && (uPhone === cleanDigits || uPhone.endsWith(cleanDigits)));
    });

    if (!user) {
      return { success: false, message: 'User account nahi mila! Username, Email ya Mobile Number check karein.' };
    }

    // Check if staff has completed activation
    if (user.role === 'staff' && user.isActivated === false) {
      return { 
        success: false, 
        needsActivation: true,
        phone: user.phone,
        email: user.email,
        name: user.name,
        message: 'Aapka Staff account abhi activate nahi hua hai. Kripya "Create Staff Account" me jakar sign up karein.' 
      };
    }

    const hashedEntered = await this.hashPin(cleanPin);
    let isMatch = false;

    if (user.pinHash) {
      isMatch = (user.pinHash === hashedEntered);
    } else if (user.pin) {
      isMatch = (user.pin === cleanPin);
    }

    if (!isMatch) {
      return { success: false, message: 'Galat Security PIN! Kripya apna sahi 4-digit PIN enter karein.' };
    }

    this.currentUser = user;
    
    const safeUser = { ...user };
    delete safeUser.pin;
    delete safeUser.pinHash;
    localStorage.setItem('active_user_' + this.currentLab.id, JSON.stringify(safeUser));

    return { success: true, user: safeUser };
  }

  logout() {
    if (this.currentLab) {
      localStorage.removeItem('active_user_' + this.currentLab.id);
    }
    this.currentUser = null;
    if (window.firebaseConfigManager && window.firebaseConfigManager.auth) {
      try {
        window.firebaseConfigManager.auth.signOut();
      } catch (e) {}
    }
  }

  // Switch to another lab
  async switchLab(labId) {
    const lab = await window.labDB.get('lab_profiles', labId);
    if (!lab) return false;

    this.currentLab = lab;
    localStorage.setItem('active_lab_id', labId);
    this.currentUser = null;
    localStorage.removeItem('active_user_' + labId);
    await window.testCatalogManager.ensureDefaultTests(labId);

    if (window.cloudSyncManager) {
      window.cloudSyncManager.updateStatusBadge();
    }
    return true;
  }

  // Verify Admin PIN for discount override
  async verifyAdminPin(pinToVerify) {
    if (!this.currentLab) return false;
    const cleanPin = String(pinToVerify).trim();
    const hashed = await this.hashPin(cleanPin);
    const admins = await window.labDB.getAll('users', u => u.labId === this.currentLab.id && u.role === 'admin' && u.active);
    const match = admins.find(a => (a.pinHash && a.pinHash === hashed) || (a.pin && a.pin === cleanPin));
    return match || null;
  }

  // Update existing Staff account and granular permissions (Admin only)
  async updateStaff(userId, updateData) {
    if (!this.isAdmin()) throw new Error('Staff update karne ka adhikar sirf Admin ke paas hai.');
    const user = await window.labDB.get('users', userId);
    if (!user) throw new Error('Staff account nahi mila.');

    if (updateData.name) user.name = updateData.name.trim();
    if (updateData.email) user.email = updateData.email.toLowerCase().trim();
    if (updateData.phone !== undefined) user.phone = updateData.phone.trim();

    if (updateData.permissions) {
      user.permissions = {
        canChangeTestRate: !!updateData.permissions.canChangeTestRate,
        canEditTest: !!updateData.permissions.canEditTest,
        canDeleteTest: !!updateData.permissions.canDeleteTest,
        canEditDoctor: !!updateData.permissions.canEditDoctor,
        canDeleteDoctor: !!updateData.permissions.canDeleteDoctor
      };
    }

    await window.labDB.put('users', user);

    // Update in Firestore if online
    if (navigator.onLine && window.firebaseConfigManager && window.firebaseConfigManager.isInitialized) {
      try {
        const db = window.firebaseConfigManager.db;
        if (user.email) {
          await db.collection('staff_invites').doc(user.email).set({
            name: user.name,
            phone: user.phone,
            permissions: user.permissions
          }, { merge: true });
        }
      } catch (e) {}
    }

    if (this.currentUser && this.currentUser.id === userId) {
      this.currentUser = user;
      const safeUser = { ...user };
      delete safeUser.pin;
      delete safeUser.pinHash;
      localStorage.setItem('active_user_' + this.currentLab.id, JSON.stringify(safeUser));
    }
    return user;
  }

  async getStaffList() {
    if (!this.currentLab) return [];
    return await window.labDB.getAll('users', u => u.labId === this.currentLab.id);
  }

  async deleteStaff(userId) {
    if (!this.isAdmin()) throw new Error('Only Admin can remove staff.');
    if (this.currentUser && this.currentUser.id === userId) {
      throw new Error('Aap apne khud ke active account ko delete nahi kar sakte.');
    }
    const user = await window.labDB.get('users', userId);
    if (user && user.email && navigator.onLine && window.firebaseConfigManager && window.firebaseConfigManager.isInitialized) {
      try {
        await window.firebaseConfigManager.db.collection('staff_invites').doc(user.email).delete();
      } catch (e) {}
    }
    await window.labDB.delete('users', userId);
    return true;
  }

  isAdmin() {
    return this.currentUser && this.currentUser.role === 'admin';
  }

  isStaff() {
    return this.currentUser && this.currentUser.role === 'staff';
  }

  hasPermission(permissionKey) {
    if (!this.currentUser) return false;
    if (this.currentUser.role === 'admin') return true;
    if (!this.currentUser.permissions) return false;
    return !!this.currentUser.permissions[permissionKey];
  }
}

window.authManager = new AuthManager();
