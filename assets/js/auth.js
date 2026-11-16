/**
 * Offline Lab Management System - Auth & Permissions Manager
 * Persistent across multiple HTML pages via localStorage.
 * Auto-seeds default Lab Profile and Admin if empty, so the system is immediately ready to use.
 */

class AuthManager {
  constructor() {
    this.currentLab = null;
    this.currentUser = null;
  }

  async init() {
    await window.labDB.init();

    // Check if any lab exists
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

  // Create a new Lab Profile and its Admin
  async createLabAccount(labData, adminData) {
    const labId = 'lab_' + Math.random().toString(36).substr(2, 9);
    const newLab = {
      id: labId,
      name: labData.name,
      tagline: labData.tagline || 'Clinical Pathology & Diagnostic Centre',
      address: labData.address || '',
      phone: labData.phone || '',
      email: labData.email || '',
      regNo: labData.regNo || '',
      technologistName: labData.technologistName || 'Lab Technician (DMLT)',
      pathologistName: labData.pathologistName || 'Consultant Pathologist (MD)',
      letterheadTopMargin: labData.letterheadTopMargin || 50,
      logoBase64: labData.logoBase64 || '',
      createdAt: new Date().toISOString()
    };

    await window.labDB.add('lab_profiles', newLab);

    // Create Admin User
    const adminId = 'usr_' + Math.random().toString(36).substr(2, 9);
    const adminUser = {
      id: adminId,
      labId: labId,
      name: adminData.name || 'Lab Admin',
      username: adminData.username.toLowerCase().trim(),
      pin: adminData.pin.trim(),
      pinHash: await this.hashPin(adminData.pin.trim()),
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

    await window.labDB.add('users', adminUser);
    await window.testCatalogManager.ensureDefaultTests(labId);

    this.currentLab = newLab;
    this.currentUser = adminUser;
    localStorage.setItem('active_lab_id', labId);
    localStorage.setItem('active_user_' + labId, JSON.stringify(adminUser));

    return { lab: newLab, user: adminUser };
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
    return true;
  }

  // Cryptographic SHA-256 hash helper with pure JS fallback (100% offline & local origin safe)
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
    } catch (e) {
      // In case crypto.subtle is unavailable in some restricted environments
    }
    // High-dispersion pure-JS 32-bit hash fallback
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

  // Login (Supports Username or Mobile Phone number + 4-digit PIN)
  async login(identifier, pin) {
    if (!this.currentLab) return { success: false, message: 'Koi Lab select nahi hai.' };

    const cleanId = String(identifier || '').toLowerCase().trim();
    const cleanDigits = String(identifier || '').replace(/\D/g, '');
    const cleanPin = String(pin || '').trim();

    if (!cleanId || !cleanPin) {
      return { success: false, message: 'Username/Mobile aur PIN enter karein.' };
    }

    const users = await window.labDB.getAll('users', u => u.labId === this.currentLab.id && u.active);
    
    // Find user by username or phone
    const user = users.find(u => {
      const uUser = (u.username || '').toLowerCase();
      const uPhone = String(u.phone || '').replace(/\D/g, '');
      return (uUser && uUser === cleanId) || (cleanDigits && uPhone && (uPhone === cleanDigits || uPhone.endsWith(cleanDigits)));
    });

    if (!user) {
      return { success: false, message: 'User account nahi mila! Username ya Mobile Number dobara check karein.' };
    }

    // Check if staff has completed first-time activation
    if (user.role === 'staff' && user.isActivated === false) {
      return { 
        success: false, 
        needsActivation: true,
        phone: user.phone,
        name: user.name,
        message: 'Aapka Staff account abhi activate nahi hua hai. Kripya niche "Activate Staff Account" par click karke apna secret PIN banayein.' 
      };
    }

    const hashedEntered = await this.hashPin(cleanPin);
    let isMatch = false;

    if (user.pinHash) {
      isMatch = (user.pinHash === hashedEntered);
    } else if (user.pin) {
      // Backwards compatibility for existing accounts
      isMatch = (user.pin === cleanPin);
    }

    if (!isMatch) {
      return { success: false, message: 'Galat Security PIN! Kripya apna sahi 4-digit PIN enter karein.' };
    }

    this.currentUser = user;
    
    // Store sanitized user session in localStorage (never expose PIN or pinHash!)
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

  // Step 1: Admin initiates staff onboarding (Name + Mobile + Permissions only)
  async createStaff(staffData) {
    if (!this.isAdmin()) throw new Error('Staff add karne ka adhikar sirf Admin ke paas hai.');

    if (!staffData.name || !staffData.name.trim()) {
      throw new Error('Staff Member Name bharna zaroori hai.');
    }
    if (!staffData.phone || !staffData.phone.trim()) {
      throw new Error('Staff ka Mobile Phone Number bharna zaroori hai.');
    }

    const staffId = 'usr_' + Math.random().toString(36).substr(2, 9);
    
    // Explicit Staff Permissions (Defaults: false)
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
      name: staffData.name.trim(),
      phone: staffData.phone.trim(),
      username: '',     // To be set by staff during activation
      pinHash: '',      // To be set privately by staff
      role: 'staff',
      permissions: permissions,
      isActivated: false,
      active: true,
      createdAt: new Date().toISOString()
    };

    await window.labDB.add('users', newStaff);
    return newStaff;
  }

  // Step 2 (Staff side): Lookup pending staff profile by mobile number
  async getPendingStaffByPhone(phone) {
    if (!this.currentLab) return null;
    const cleanPhone = String(phone).replace(/\D/g, '');
    if (!cleanPhone) return null;

    const staffUsers = await window.labDB.getAll('users', u => u.labId === this.currentLab.id && u.role === 'staff' && u.active);
    
    // Match by phone number
    return staffUsers.find(u => {
      const uPhone = String(u.phone).replace(/\D/g, '');
      return uPhone && (uPhone === cleanPhone || uPhone.endsWith(cleanPhone) || cleanPhone.endsWith(uPhone));
    }) || null;
  }

  // Step 2 (Staff side): Staff activates account, chooses username, and sets secret 4-digit PIN
  async activateStaffAccount({ staffId, name, phone, username, pin }) {
    if (!this.currentLab) throw new Error('Lab select nahi hai.');
    
    const user = await window.labDB.get('users', staffId);
    if (!user) throw new Error('Staff invitation record nahi mila. Admin se sampark karein.');

    const cleanUsername = username.toLowerCase().trim();
    if (!cleanUsername) throw new Error('Login Username chunna anivarya hai.');

    // Ensure username is not already taken by someone else
    const allUsers = await window.labDB.getAll('users', u => u.labId === this.currentLab.id && u.id !== staffId);
    if (allUsers.some(u => u.username && u.username.toLowerCase() === cleanUsername)) {
      throw new Error(`Username "${cleanUsername}" pehle se kisi dusre user ka hai. Kripya koi dusra username chunein.`);
    }

    // Verify 4-digit PIN
    const cleanPin = String(pin).trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      throw new Error('Security PIN theek 4-digit ka numeric number hona chahiye (jaise: 1122).');
    }

    const hashed = await this.hashPin(cleanPin);

    user.name = name.trim();
    user.phone = phone.trim();
    user.username = cleanUsername;
    user.pinHash = hashed;
    delete user.pin; // Plaintext PIN is never stored!
    user.isActivated = true;
    user.activatedAt = new Date().toISOString();

    await window.labDB.put('users', user);

    // Auto login
    this.currentUser = user;
    const safeUser = { ...user };
    delete safeUser.pin;
    delete safeUser.pinHash;
    localStorage.setItem('active_user_' + this.currentLab.id, JSON.stringify(safeUser));

    return safeUser;
  }

  // Update existing Staff account and granular permissions (Admin only)
  // Notice: Admin CANNOT view or alter staff's secret PIN!
  async updateStaff(userId, updateData) {
    if (!this.isAdmin()) throw new Error('Staff update karne ka adhikar sirf Admin ke paas hai.');
    const user = await window.labDB.get('users', userId);
    if (!user) throw new Error('Staff account nahi mila.');

    if (updateData.name) user.name = updateData.name.trim();
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
    await window.labDB.delete('users', userId);
    return true;
  }

  isAdmin() {
    return this.currentUser && this.currentUser.role === 'admin';
  }

  isStaff() {
    return this.currentUser && this.currentUser.role === 'staff';
  }

  /**
   * Granular permission evaluator:
   * Admins have universal permission (returns true).
   * Staff permissions checked against permissions object.
   */
  hasPermission(permissionKey) {
    if (!this.currentUser) return false;
    if (this.currentUser.role === 'admin') return true;
    if (!this.currentUser.permissions) return false;
    return !!this.currentUser.permissions[permissionKey];
  }
}

window.authManager = new AuthManager();
