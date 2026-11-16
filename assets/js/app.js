/**
 * Offline Lab Management System - Main App Controller
 * Multi-page enabled, modular, with automatic shared modal injection.
 */

class AppController {
  constructor() {
    this.currentPage = 'dashboard';
    this.adminApprovalTemp = null;
  }

  async init(pageName = 'dashboard') {
    this.currentPage = pageName;

    // Initialize DB
    await window.labDB.init();

    // Initialize Firebase & Cloud Sync
    if (window.firebaseConfigManager) {
      await window.firebaseConfigManager.init();
    }
    if (window.cloudSyncManager) {
      await window.cloudSyncManager.init();
    }

    // Check Auth & Lab Profile
    await window.authManager.init();

    // Ensure all common modals exist in DOM
    this.ensureCommonModals();

    // Update UI headers
    this.updateLabHeaderUI();

    // Initialize specific page
    if (pageName === 'dashboard') {
      await this.renderDashboard();
    } else if (pageName === 'new-patient') {
      await this.renderNewPatientForm();
    } else if (pageName === 'patients-reports') {
      await this.renderPatientsList();
    } else if (pageName === 'referral-doctors') {
      await this.renderDoctorsView();
    } else if (pageName === 'test-catalog') {
      await this.renderTestCatalogView();
    } else if (pageName === 'staff') {
      await this.renderStaffView();
    } else if (pageName === 'settings') {
      await this.renderSettingsView();
    }

    this.setupEventListeners();
  }

  updateLabHeaderUI() {
    const lab = window.authManager.currentLab;
    const user = window.authManager.currentUser;

    if (lab) {
      const nameEl = document.getElementById('ui-lab-name');
      const tagEl = document.getElementById('ui-lab-tagline');
      if (nameEl) nameEl.innerText = lab.name;
      if (tagEl) tagEl.innerText = lab.tagline || 'Diagnostics';
      document.title = `${lab.name} - Lab Management`;
    }

    if (user) {
      const userEl = document.getElementById('ui-user-name');
      const rolePill = document.getElementById('ui-user-role');
      if (userEl) userEl.innerText = user.name;
      if (rolePill) {
        rolePill.innerText = user.role.toUpperCase();
        rolePill.className = `role-pill ${user.role}`;
      }

      // Hide Admin-only menu items for staff
      const adminOnlyElements = document.querySelectorAll('.admin-only');
      adminOnlyElements.forEach(el => {
        el.style.display = user.role === 'admin' ? '' : 'none';
      });
    }

    // Insert live Cloud Sync status badge in topbar if present
    const topbarRight = document.querySelector('.topbar-right');
    if (topbarRight && !topbarRight.querySelector('.ui-cloud-status-badge')) {
      const badgeContainer = document.createElement('div');
      badgeContainer.className = 'ui-cloud-status-badge';
      topbarRight.insertBefore(badgeContainer, topbarRight.firstChild);
    }
    if (window.cloudSyncManager) {
      window.cloudSyncManager.updateStatusBadge();
    }
  }

  // Ensure shared modals exist on every HTML page
  ensureCommonModals() {
    // 1. Dual-Mode Login Modal (Cloud Firebase + Offline PIN)
    if (!document.getElementById('modal-login')) {
      const modal = document.createElement('div');
      modal.className = 'modal-backdrop';
      modal.id = 'modal-login';
      modal.innerHTML = `
        <div class="modal-dialog" style="max-width:440px;">
          <div class="modal-header">
            <div>
              <h3 style="margin:0;">🔬 Lab Account Login</h3>
              <span style="font-size:11.5px; color:#64748b;">Sign in to your Pathology Lab</span>
            </div>
            <button class="modal-close" onclick="window.app.closeModal('modal-login')">&times;</button>
          </div>
          <div class="modal-body" style="padding:16px 20px;">
            <!-- Login Tabs -->
            <div style="display:flex; border-bottom:1px solid #e2e8f0; margin-bottom:16px;">
              <button id="tab-login-cloud" type="button" class="btn btn-sm" style="flex:1; border:none; border-bottom:2px solid var(--primary); background:transparent; font-weight:700; color:var(--primary); border-radius:0; padding:8px;" onclick="window.app.switchLoginTab('cloud')">
                ☁️ Cloud Login (Online)
              </button>
              <button id="tab-login-offline" type="button" class="btn btn-sm" style="flex:1; border:none; border-bottom:2px solid transparent; background:transparent; font-weight:600; color:#64748b; border-radius:0; padding:8px;" onclick="window.app.switchLoginTab('offline')">
                💻 Offline PIN Login
              </button>
            </div>

            <!-- Tab 1: Cloud Login (Firebase Email & Password) -->
            <div id="pane-login-cloud">
              <div class="form-group">
                <label class="form-label required">Gmail / Email</label>
                <input type="email" id="cloud-login-email" class="form-control" placeholder="e.g. admin@gmail.com or staff@gmail.com">
              </div>
              <div class="form-group">
                <label class="form-label required">Password</label>
                <input type="password" id="cloud-login-password" class="form-control" placeholder="••••••••">
              </div>
              <button class="btn btn-primary" style="width:100%; margin-top:8px; font-weight:700;" onclick="window.app.performCloudLogin()">
                ☁️ Login to Cloud Lab
              </button>
            </div>

            <!-- Tab 2: Offline PIN Login -->
            <div id="pane-login-offline" style="display:none;">
              <div class="form-group">
                <label class="form-label required">Select Local User Account</label>
                <select id="login-user-select" class="form-control"></select>
              </div>
              <div class="form-group">
                <label class="form-label required">4-Digit Security PIN</label>
                <input type="password" id="login-pin-input" class="form-control" maxlength="6" placeholder="Enter PIN">
              </div>
              <button class="btn btn-secondary" style="width:100%; margin-top:8px; font-weight:700;" onclick="window.app.performLogin()">
                💻 Login Offline (PIN)
              </button>
            </div>

            <!-- Account Creation & Registration -->
            <div style="margin-top:20px; padding-top:14px; border-top:1px dashed #cbd5e1; display:flex; flex-direction:column; gap:8px;">
              <button type="button" class="btn btn-outline btn-sm" style="width:100%; color:#0284c7; border-color:#0284c7; font-weight:600;" onclick="window.app.openRegisterAdminLabModal()">
                🏢 + Register New Lab (Admin Account)
              </button>
              <button type="button" class="btn btn-outline btn-sm" style="width:100%; color:#16a34a; border-color:#16a34a; font-weight:600;" onclick="window.app.openStaffSignupModal()">
                👤 + Staff Account Sign Up (Invited Gmail)
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    // 2. Register New Lab & Admin Modal (Multi-Admin Multi-Lab)
    if (!document.getElementById('modal-register-admin-lab')) {
      const modal = document.createElement('div');
      modal.className = 'modal-backdrop';
      modal.id = 'modal-register-admin-lab';
      modal.innerHTML = `
        <div class="modal-dialog" style="max-width:520px;">
          <div class="modal-header">
            <div>
              <h3 style="margin:0;">🏢 Register Your Lab (Admin)</h3>
              <span style="font-size:11.5px; color:#64748b;">Multi-Admin: Create your Lab profile and Admin account</span>
            </div>
            <button class="modal-close" onclick="window.app.closeModal('modal-register-admin-lab')">&times;</button>
          </div>
          <div class="modal-body" style="max-height:78vh; overflow-y:auto;">
            <div class="form-group">
              <label class="form-label required">Lab Name</label>
              <input type="text" id="reg-lab-name" class="form-control" placeholder="e.g. Apex Diagnostics & Pathology" required>
            </div>
            <div class="form-group">
              <label class="form-label">Lab Tagline / Subtitle</label>
              <input type="text" id="reg-lab-tagline" class="form-control" placeholder="e.g. Accurate & Computerized Diagnostics">
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
              <div class="form-group">
                <label class="form-label">Lab Address</label>
                <input type="text" id="reg-lab-address" class="form-control" placeholder="e.g. Station Road, City">
              </div>
              <div class="form-group">
                <label class="form-label">Contact Phone</label>
                <input type="text" id="reg-lab-phone" class="form-control" placeholder="e.g. 9876543210">
              </div>
            </div>
            <div style="height:1px; background:#e2e8f0; margin:8px 0 14px 0;"></div>
            <div style="font-weight:700; font-size:13px; color:#0369a1; margin-bottom:10px;">👑 Admin Account Credentials</div>
            <div class="form-group">
              <label class="form-label required">Admin Full Name</label>
              <input type="text" id="reg-admin-name" class="form-control" placeholder="e.g. Dr. R. K. Sharma" required>
            </div>
            <div class="form-group">
              <label class="form-label required">Admin Email / Gmail (For Login)</label>
              <input type="email" id="reg-admin-email" class="form-control" placeholder="e.g. admin@gmail.com" required>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
              <div class="form-group">
                <label class="form-label required">Account Password</label>
                <input type="password" id="reg-admin-password" class="form-control" placeholder="Min 6 characters" required>
              </div>
              <div class="form-group">
                <label class="form-label required">Offline PIN (4 Digits)</label>
                <input type="password" id="reg-admin-pin" class="form-control" maxlength="4" placeholder="e.g. 1234" value="1234" required>
              </div>
            </div>
            <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:6px; padding:10px; font-size:12px; color:#0369a1; margin-top:8px;">
              💡 <strong>Multi-Tenant Isolation:</strong> Aapki Lab ko ek alag Lab ID milegi. Aap apne staff ko invite kar sakenge aur aapka data doosre admins se poori tarah alag aur Cloud Firestore me secure rahega.
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="window.app.closeModal('modal-register-admin-lab')">Cancel</button>
            <button class="btn btn-primary" onclick="window.app.submitRegisterAdminLab()">✓ Register Lab & Admin</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    // 3. Staff Account Sign Up Modal (Strict Pre-Registered Email Verification)
    if (!document.getElementById('modal-staff-signup')) {
      const modal = document.createElement('div');
      modal.className = 'modal-backdrop';
      modal.id = 'modal-staff-signup';
      modal.innerHTML = `
        <div class="modal-dialog" style="max-width:480px;">
          <div class="modal-header">
            <div>
              <h3 style="margin:0;">👤 Staff Account Sign Up</h3>
              <span style="font-size:11.5px; color:#64748b;">Sign in with your pre-registered Gmail</span>
            </div>
            <button class="modal-close" onclick="window.app.closeModal('modal-staff-signup')">&times;</button>
          </div>
          <div class="modal-body" style="max-height:78vh; overflow-y:auto;">
            <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:6px; padding:10px 12px; margin-bottom:14px; font-size:12px; color:#1e40af;">
              🔒 <strong>Zaroori Niyam:</strong> Staff sirf usi Gmail/Email se account bana sakta hai jise Admin ne database me pehle se add kiya ho. Isase system automatic pehchan lega ki aapko kis Lab ka access dena hai.
            </div>
            <div class="form-group">
              <label class="form-label required">Your Registered Gmail / Email</label>
              <input type="email" id="staff-signup-email" class="form-control" placeholder="e.g. rahul@gmail.com" required style="font-weight:600;">
              <small style="color:#64748b; font-size:11px;">Wahi email enter karein jo aapke Lab Admin ne Staff menu me save kiya hai.</small>
            </div>
            <div class="form-group">
              <label class="form-label required">Create Account Password</label>
              <input type="password" id="staff-signup-password" class="form-control" placeholder="Min 6 characters" required>
            </div>
            <div class="form-group">
              <label class="form-label">Your Full Name (Optional if already set by Admin)</label>
              <input type="text" id="staff-signup-name" class="form-control" placeholder="e.g. Rahul Sharma">
            </div>
            <div class="form-group">
              <label class="form-label required">Create 4-Digit Security PIN (Offline Backup)</label>
              <input type="password" id="staff-signup-pin" class="form-control" maxlength="4" placeholder="••••" value="1234" required style="font-size:16px; font-weight:700; letter-spacing:2px; text-align:center;">
              <small style="color:#64748b; font-size:11px;">Agar internet na rahe toh aap is PIN se offline login kar sakenge.</small>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="window.app.closeModal('modal-staff-signup')">Cancel</button>
            <button class="btn btn-success" onclick="window.app.submitStaffSignup()">✓ Verify Email & Join Lab</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    // 1B. Staff Account Activation Modal (Step 2: Staff Creates Username & Private 4-digit PIN)
    if (!document.getElementById('modal-staff-activation')) {
      const modal = document.createElement('div');
      modal.className = 'modal-backdrop';
      modal.id = 'modal-staff-activation';
      modal.innerHTML = `
        <div class="modal-dialog" style="max-width:470px;">
          <div class="modal-header">
            <div>
              <h3 style="margin:0;">🔑 Staff Account Activation</h3>
              <span style="font-size:11.5px; color:#64748b;">Step 2: Choose Username & Secret 4-Digit PIN</span>
            </div>
            <button class="modal-close" onclick="window.app.closeModal('modal-staff-activation')">&times;</button>
          </div>
          <div class="modal-body" style="max-height:78vh; overflow-y:auto;">
            <!-- Step A: Search Pending Staff by Mobile -->
            <div id="activation-step-search">
              <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:6px; padding:10px; margin-bottom:14px; font-size:12px; color:#0369a1;">
                Admin dwara register kiya gaya apna <strong>Mobile Phone Number</strong> enter karein taaki aapka profile verify ho sake:
              </div>
              <div class="form-group">
                <label class="form-label required">Your Registered Mobile Number</label>
                <input type="tel" id="activation-phone-search" class="form-control" placeholder="e.g. 9876543210" style="font-size:15px; font-weight:700;">
              </div>
              <button class="btn btn-primary" style="width:100%; margin-top:8px;" onclick="window.app.searchStaffForActivation()">
                Find My Profile →
              </button>
            </div>

            <!-- Step B: Found Profile & Create 4-Digit Secret PIN -->
            <div id="activation-step-form" style="display:none;">
              <input type="hidden" id="activation-staff-id">
              
              <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; padding:10px; margin-bottom:12px; font-size:12px; color:#15803d;">
                ✓ Staff profile match ho gaya! Aap apna Name/Mobile check ya edit karke apna <strong>Username</strong> aur <strong>Secret 4-Digit PIN</strong> banayein:
              </div>

              <div class="form-group">
                <label class="form-label required">Your Full Name (Editable)</label>
                <input type="text" id="activation-name-input" class="form-control" required>
              </div>

              <div class="form-group">
                <label class="form-label required">Your Mobile Phone (Editable)</label>
                <input type="tel" id="activation-phone-input" class="form-control" required>
              </div>

              <div class="form-group">
                <label class="form-label required">Choose Login Username</label>
                <input type="text" id="activation-username-input" class="form-control" placeholder="e.g. amit" required>
                <span style="font-size:11px; color:#64748b;">Aap future me is username ya mobile number se login karenge.</span>
              </div>

              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-top:10px;">
                <div class="form-group">
                  <label class="form-label required">Create 4-Digit PIN</label>
                  <input type="password" id="activation-pin-input" class="form-control" maxlength="4" placeholder="••••" required style="font-size:18px; font-weight:800; letter-spacing:4px; text-align:center;">
                </div>
                <div class="form-group">
                  <label class="form-label required">Confirm 4-Digit PIN</label>
                  <input type="password" id="activation-pin-confirm" class="form-control" maxlength="4" placeholder="••••" required style="font-size:18px; font-weight:800; letter-spacing:4px; text-align:center;">
                </div>
              </div>

              <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:6px; padding:10px; margin-top:8px; font-size:11.5px; color:#b91c1c;">
                🔒 <strong>Strict Privacy & Offline Security:</strong> Yeh 4-digit PIN aapka private PIN hai. Yeh system me encrypted store rahega aur <strong>Admin ko bhi nahi dikhega</strong>. Offline hone ke kaaran iska koi OTP/reset option nahi hoga. Kripya apna PIN yaad rakhein.
              </div>

              <button class="btn btn-success" style="width:100%; margin-top:14px; padding:10px; font-weight:700;" onclick="window.app.submitStaffActivation()">
                ✓ Save PIN & Activate Account Now
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    // 2. Switch Lab Modal
    if (!document.getElementById('modal-switch-lab')) {
      const modal = document.createElement('div');
      modal.className = 'modal-backdrop';
      modal.id = 'modal-switch-lab';
      modal.innerHTML = `
        <div class="modal-dialog" style="max-width:480px;">
          <div class="modal-header">
            <h3>Switch or Manage Lab Accounts</h3>
            <button class="modal-close" onclick="window.app.closeModal('modal-switch-lab')">&times;</button>
          </div>
          <div class="modal-body">
            <div id="switch-lab-list-container" style="margin-bottom:16px;"></div>
            <button class="btn btn-outline" style="width:100%;" onclick="window.app.openCreateLabModal()">
              ➕ Create Another New Lab Account
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    // 3. Create New Lab Modal
    if (!document.getElementById('modal-create-lab')) {
      const modal = document.createElement('div');
      modal.className = 'modal-backdrop';
      modal.id = 'modal-create-lab';
      modal.innerHTML = `
        <div class="modal-dialog" style="max-width:500px;">
          <div class="modal-header">
            <h3>Create New Lab Account</h3>
            <button class="modal-close" onclick="window.app.closeModal('modal-create-lab')">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label required">Lab Name</label>
              <input type="text" id="new-lab-name" class="form-control" placeholder="e.g. LifeCare Pathology Lab">
            </div>
            <div class="form-group">
              <label class="form-label">Address</label>
              <input type="text" id="new-lab-address" class="form-control" placeholder="e.g. Near City Hospital">
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input type="text" id="new-lab-phone" class="form-control" placeholder="e.g. 9876543210">
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
              <div class="form-group">
                <label class="form-label required">Admin Username</label>
                <input type="text" id="new-admin-user" class="form-control" value="admin">
              </div>
              <div class="form-group">
                <label class="form-label required">Admin PIN</label>
                <input type="password" id="new-admin-pin" class="form-control" placeholder="e.g. 1234">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="window.app.closeModal('modal-create-lab')">Cancel</button>
            <button class="btn btn-primary" onclick="window.app.createNewLabFromModal()">Create Lab</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    // 4. Doctor Patients Ledger Modal
    if (!document.getElementById('modal-doctor-patients')) {
      const modal = document.createElement('div');
      modal.className = 'modal-backdrop';
      modal.id = 'modal-doctor-patients';
      modal.innerHTML = `
        <div class="modal-dialog" style="max-width:750px;">
          <div class="modal-header">
            <div>
              <h3 id="doc-patient-modal-title">Doctor's Referred Patients</h3>
              <span id="doc-patient-modal-sub" style="font-size:12px; color:#64748b;">Commission Ledger</span>
            </div>
            <button class="modal-close" onclick="window.app.closeModal('modal-doctor-patients')">&times;</button>
          </div>
          <div class="modal-body">
            <div class="table-responsive">
              <table class="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Patient Name & UHID</th>
                    <th>Tests Booked</th>
                    <th>Bill Amount</th>
                    <th>Commission</th>
                  </tr>
                </thead>
                <tbody id="doc-patient-modal-tbody"></tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="window.app.closeModal('modal-doctor-patients')">Close</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
  }

  // --------------------------------------------------------------------------
  // 1. DASHBOARD VIEW (index.html)
  // --------------------------------------------------------------------------
  async renderDashboard() {
    const labId = window.authManager.currentLab?.id;
    if (!labId) return;

    const allPatients = await window.labDB.getAll('patients', p => p.labId === labId);
    // Exclude hidden patients so all counts and revenues deduct hidden records
    const patients = allPatients.filter(p => !p.isHidden);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayPatients = patients.filter(p => p.date && p.date.startsWith(todayStr));

    const totalTodayRevenue = todayPatients.reduce((sum, p) => sum + (parseFloat(p.paidAmount) || 0), 0);
    const totalAllRevenue = patients.reduce((sum, p) => sum + (parseFloat(p.paidAmount) || 0), 0);
    
    let totalOutstandingDue = 0;
    let dueCount = 0;
    patients.forEach(p => {
      const finalAmt = parseFloat(p.finalAmount) || 0;
      const paidAmt = p.paidAmount !== undefined ? (parseFloat(p.paidAmount) || 0) : finalAmt;
      const dueAmt = Math.max(0, finalAmt - paidAmt);
      if (dueAmt > 0.01) {
        totalOutstandingDue += dueAmt;
        dueCount++;
      }
    });

    const pendingReports = patients.filter(p => p.status === 'pending').length;

    const elTodayPatients = document.getElementById('stat-today-patients');
    const elTodayCollection = document.getElementById('stat-today-collection');
    const elPendingReports = document.getElementById('stat-pending-reports');
    const elTotalPatientsSub = document.getElementById('stat-total-patients-sub');
    const elTotalRevenueSub = document.getElementById('stat-total-revenue-sub');
    const elTotalDue = document.getElementById('stat-total-due');
    const elDueCountSub = document.getElementById('stat-due-count-sub');

    if (elTodayPatients) elTodayPatients.innerText = todayPatients.length;
    if (elTodayCollection) elTodayCollection.innerText = '₹' + totalTodayRevenue.toFixed(0);
    if (elPendingReports) elPendingReports.innerText = pendingReports;
    if (elTotalPatientsSub) elTotalPatientsSub.innerText = `Total: ${patients.length} registered`;
    if (elTotalRevenueSub) elTotalRevenueSub.innerText = `Total: ₹${totalAllRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    if (elTotalDue) elTotalDue.innerText = '₹' + totalOutstandingDue.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    if (elDueCountSub) elDueCountSub.innerText = `${dueCount} Pending Bills`;

    // Render Recent 8 Patients
    const recent = patients.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
    const tbody = document.getElementById('dashboard-recent-table-body');
    if (!tbody) return;

    if (recent.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#64748b;">Abhi tak koi patient record nahi hai. "+ New Patient / Bill" par click karke registration karein.</td></tr>`;
      return;
    }

    tbody.innerHTML = recent.map(p => {
      const isCompleted = p.status === 'completed';
      const statusBadge = isCompleted 
        ? `<span class="badge badge-success">Completed</span>`
        : `<span class="badge badge-warning">Pending Findings</span>`;

      const finalAmt = parseFloat(p.finalAmount) || 0;
      const paidAmt = p.paidAmount !== undefined ? (parseFloat(p.paidAmount) || 0) : finalAmt;
      const dueAmt = Math.max(0, finalAmt - paidAmt);

      const dueBadge = dueAmt > 0.01 
        ? `<br><span class="badge badge-danger" style="font-size:10px;">Due: ₹${dueAmt.toFixed(0)}</span>`
        : `<br><span class="badge badge-success" style="font-size:10px;">Paid</span>`;

      return `
        <tr>
          <td><strong>${p.billNo}</strong><br><span style="font-size:11px; color:#64748b;">${p.uhid}</span></td>
          <td><strong>${p.name}</strong><br><span style="font-size:11px; color:#64748b;">${p.age} ${p.ageUnit} / ${p.gender}</span></td>
          <td>${p.doctorName}</td>
          <td><span style="font-size:12px; color:#334155;">${(p.testNames || []).join(', ')}</span></td>
          <td>
            <strong>₹${finalAmt.toFixed(0)}</strong>
            ${dueBadge}
          </td>
          <td>${statusBadge}</td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="btn btn-outline btn-sm" onclick="window.app.openResultEntryModal('${p.id}')">
                ✏️ Result
              </button>
              <a class="btn btn-primary btn-sm" href="print-report.html?id=${p.id}&mode=full" target="_blank" title="Print Blood Test Report (Full / Letterhead)">
                🖨️ Report
              </a>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // --------------------------------------------------------------------------
  // 2. NEW PATIENT REGISTRATION & BILLING (new-patient.html)
  // --------------------------------------------------------------------------
  async renderNewPatientForm() {
    const labId = window.authManager.currentLab?.id;
    if (!labId) return;

    await this.populateDoctorsDropdown(labId);

    const tests = await window.testCatalogManager.getTests(labId);
    const testListContainer = document.getElementById('billing-test-checkboxes');
    if (testListContainer) {
      testListContainer.innerHTML = tests.map(t => `
        <label class="test-checkbox-card" style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border:1px solid #e2e8f0; border-radius:6px; margin-bottom:6px; cursor:pointer; background:#fff;">
          <div style="display:flex; align-items:center; gap:10px;">
            <input type="checkbox" class="billing-test-chk" value="${t.id}" data-name="${t.name}" data-price="${t.price}" onchange="window.app.onTestSelectionChanged()">
            <div>
              <strong style="font-size:13px; color:#0f172a;">${t.name}</strong>
              <span style="display:block; font-size:11px; color:#64748b;">${t.category}</span>
            </div>
          </div>
          <div style="font-weight:700; color:#0284c7; font-size:13px;">₹${t.price}</div>
        </label>
      `).join('');
    }

    this.recalculateBillingTotals();
  }

  async populateDoctorsDropdown(labId, selectDoctorId = null) {
    const doctors = await window.doctorManager.getDoctors(labId);
    const docSelect = document.getElementById('patient-doctor-select');
    if (!docSelect) return;

    docSelect.innerHTML = `
      <option value="self" data-rate="0">Self / Direct Walk-in (0% Comm)</option>
      ${doctors.map(d => `<option value="${d.id}" data-rate="${d.commissionRate}" data-name="${d.name}" ${selectDoctorId === d.id ? 'selected' : ''}>${d.name} (${d.degree || 'Dr.'}) - ${d.commissionRate}% Comm</option>`).join('')}
    `;
  }

  // "+ Add New Doctor" directly from new-patient page
  openQuickDoctorModal() {
    document.getElementById('form-quick-doctor').reset();
    document.getElementById('quick-doc-rate-input').value = '15';
    this.showModal('modal-quick-add-doctor');
  }

  async saveQuickDoctor() {
    try {
      const name = document.getElementById('quick-doc-name-input').value.trim();
      const degree = document.getElementById('quick-doc-degree-input').value.trim();
      const hospital = document.getElementById('quick-doc-hospital-input').value.trim();
      const phone = document.getElementById('quick-doc-phone-input').value.trim();
      const rate = parseFloat(document.getElementById('quick-doc-rate-input').value) || 0;

      if (!name) throw new Error('Doctor ka Naam likhna zaroori hai.');

      const savedDoc = await window.doctorManager.saveDoctor({
        id: null,
        labId: window.authManager.currentLab.id,
        name, degree, hospital, phone, commissionRate: rate
      });

      await this.populateDoctorsDropdown(window.authManager.currentLab.id, savedDoc.id);
      this.closeModal('modal-quick-add-doctor');
      this.showToast(`Doctor ${savedDoc.name} add ho gaye aur auto-select kar diye gaye!`, 'success');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  onTestSelectionChanged() {
    this.recalculateBillingTotals();
  }

  recalculateBillingTotals() {
    const checkboxes = document.querySelectorAll('.billing-test-chk:checked');
    let subtotal = 0;
    checkboxes.forEach(chk => {
      subtotal += parseFloat(chk.dataset.price) || 0;
    });

    const discountInput = document.getElementById('patient-discount');
    if (!discountInput) return;

    let discount = parseFloat(discountInput.value) || 0;
    if (discount > subtotal) {
      discount = subtotal;
      discountInput.value = subtotal;
    }

    const finalTotal = Math.max(0, subtotal - discount);
    const paidInput = document.getElementById('patient-paid');
    
    if (paidInput) {
      if (parseFloat(paidInput.value) === 0 || paidInput.dataset.autoFilled === 'true') {
        paidInput.value = finalTotal;
        paidInput.dataset.autoFilled = 'true';
      }
    }

    const currentPaid = paidInput ? (parseFloat(paidInput.value) || 0) : finalTotal;
    const liveDue = Math.max(0, finalTotal - currentPaid);

    const subEl = document.getElementById('bill-summary-subtotal');
    const discEl = document.getElementById('bill-summary-discount');
    const finEl = document.getElementById('bill-summary-final');
    const dueEl = document.getElementById('bill-summary-due');

    if (subEl) subEl.innerText = '₹' + subtotal.toFixed(2);
    if (discEl) discEl.innerText = '- ₹' + discount.toFixed(2);
    if (finEl) finEl.innerText = '₹' + finalTotal.toFixed(2);
    if (dueEl) {
      if (liveDue > 0.01) {
        dueEl.innerHTML = `<strong style="color:#dc2626; font-size:14px;">₹${liveDue.toFixed(2)} (Payment Due)</strong>`;
      } else {
        dueEl.innerHTML = `<strong style="color:#16a34a;">₹0.00 (Fully Paid)</strong>`;
      }
    }

    this.updateDiscountUIState();
  }

  updateDiscountUIState() {
    const discountInput = document.getElementById('patient-discount');
    if (!discountInput) return;

    const discountVal = parseFloat(discountInput.value) || 0;
    const alertBox = document.getElementById('discount-approval-box');
    const user = window.authManager.currentUser;
    if (!alertBox) return;

    if (discountVal > 0) {
      alertBox.style.display = 'flex';
      const statusText = document.getElementById('discount-approval-status-text');
      if (user && user.role === 'admin') {
        statusText.innerHTML = `<strong>Admin Privileged:</strong> Aap Admin hain, yeh discount direct apply hoga.`;
      } else if (this.adminApprovalTemp) {
        statusText.innerHTML = `<strong style="color:#16a34a;">Approved by Admin:</strong> ${this.adminApprovalTemp.name} ne yeh discount approve kar diya hai.`;
      } else {
        statusText.innerHTML = `
          <strong style="color:#b45309;">Staff Restriction:</strong> Discount dene ke liye Admin PIN zaroori hai.
          <button type="button" class="btn btn-warning btn-sm" style="margin-left:8px;" onclick="window.app.openAdminPinModal()">Verify Admin PIN</button>
        `;
      }
    } else {
      alertBox.style.display = 'none';
    }
  }

  async submitNewPatient() {
    try {
      const name = document.getElementById('patient-name').value.trim();
      const age = document.getElementById('patient-age').value.trim();
      const ageUnit = document.getElementById('patient-age-unit').value;
      const gender = document.getElementById('patient-gender').value;
      const phone = document.getElementById('patient-phone').value.trim();
      const address = document.getElementById('patient-address').value.trim();

      const docSelect = document.getElementById('patient-doctor-select');
      const selectedOption = docSelect.options[docSelect.selectedIndex];
      const doctorId = docSelect.value;
      const doctorName = selectedOption.dataset.name || 'Self / Walk-in';
      const doctorCommissionRate = selectedOption.dataset.rate || 0;

      const checkedTests = Array.from(document.querySelectorAll('.billing-test-chk:checked'));
      const testIds = checkedTests.map(c => c.value);
      const testNames = checkedTests.map(c => c.dataset.name);

      let subtotal = 0;
      checkedTests.forEach(c => subtotal += parseFloat(c.dataset.price) || 0);

      const discount = parseFloat(document.getElementById('patient-discount').value) || 0;
      const finalAmount = Math.max(0, subtotal - discount);
      const paidAmount = parseFloat(document.getElementById('patient-paid').value) || 0;
      const paymentMode = document.getElementById('patient-payment-mode').value;

      const user = window.authManager.currentUser;
      const labId = window.authManager.currentLab.id;

      const formData = {
        name, age, ageUnit, gender, phone, address,
        doctorId, doctorName, doctorCommissionRate,
        testIds, testNames,
        subtotal,
        discountAmount: discount,
        adminVerified: user.role === 'admin' || !!this.adminApprovalTemp,
        adminApprovedByName: this.adminApprovalTemp ? this.adminApprovalTemp.name : null,
        finalAmount, paidAmount, paymentMode
      };

      const patient = await window.billingManager.registerPatient(formData, labId, user);
      this.showToast(`Patient ${patient.name} (${patient.billNo}) successfully register ho gaye!`, 'success');

      setTimeout(() => {
        window.location.href = 'patients-reports.html';
      }, 1000);
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // --------------------------------------------------------------------------
  // 3. PATIENTS & REPORTS LIST (patients-reports.html)
  // --------------------------------------------------------------------------
  async renderPatientsList() {
    const labId = window.authManager.currentLab?.id;
    if (!labId) return;

    const allPatients = await window.labDB.getAll('patients', p => p.labId === labId);
    // STRICT RULE: Only active (non-hidden) patients contribute to financial ledger & revenue metrics
    const activePatients = allPatients.filter(p => !p.isHidden);
    allPatients.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate overall financial stats for the lab ledger (Hidden patients deducted!)
    let totalGrossBilled = 0;
    let totalNetBilled = 0;
    let totalPaidCollected = 0;
    let totalDuePending = 0;
    let totalDiscountsGiven = 0;
    let countDuePatients = 0;
    let countPaidPatients = 0;
    let countDiscountBills = 0;

    activePatients.forEach(p => {
      const finalAmt = parseFloat(p.finalAmount) || 0;
      const subtotalAmt = parseFloat(p.subtotal) || (finalAmt + (parseFloat(p.discountAmount) || 0));
      const discAmt = parseFloat(p.discountAmount) || 0;
      const paidAmt = p.paidAmount !== undefined ? (parseFloat(p.paidAmount) || 0) : finalAmt;
      const dueAmt = Math.max(0, finalAmt - paidAmt);

      totalGrossBilled += subtotalAmt;
      totalNetBilled += finalAmt;
      totalPaidCollected += paidAmt;
      totalDuePending += dueAmt;
      totalDiscountsGiven += discAmt;

      if (dueAmt > 0.01) countDuePatients++;
      else countPaidPatients++;

      if (discAmt > 0) countDiscountBills++;
    });

    // Update Top Stat Cards if present
    const elStatBilled = document.getElementById('ledger-stat-billed');
    const elSubGross = document.getElementById('ledger-sub-gross');
    const elStatPaid = document.getElementById('ledger-stat-paid');
    const elSubPaidCount = document.getElementById('ledger-sub-paid-count');
    const elStatDue = document.getElementById('ledger-stat-due');
    const elSubDueCount = document.getElementById('ledger-sub-due-count');
    const elStatDisc = document.getElementById('ledger-stat-discount');
    const elSubDiscCount = document.getElementById('ledger-sub-disc-count');

    if (elStatBilled) elStatBilled.innerText = '₹' + totalNetBilled.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    if (elSubGross) elSubGross.innerText = 'Gross: ₹' + totalGrossBilled.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    if (elStatPaid) elStatPaid.innerText = '₹' + totalPaidCollected.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    if (elSubPaidCount) elSubPaidCount.innerText = `${countPaidPatients} Active Cleared`;
    if (elStatDue) elStatDue.innerText = '₹' + totalDuePending.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    if (elSubDueCount) elSubDueCount.innerText = `${countDuePatients} Active Pending`;
    if (elStatDisc) elStatDisc.innerText = '₹' + totalDiscountsGiven.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    if (elSubDiscCount) elSubDiscCount.innerText = `${countDiscountBills} Active Discounts`;

    // Filter values
    const searchTerm = (document.getElementById('patient-search-input')?.value || '').toLowerCase();
    const filterStatus = document.getElementById('patient-filter-status')?.value || 'all';
    const filterPayment = document.getElementById('patient-filter-payment')?.value || 'all';
    const filterVisibility = document.getElementById('patient-filter-visibility')?.value || 'active';

    // Filter records for table display based on visibility setting
    let candidatePatients = allPatients;
    if (filterVisibility === 'active') {
      candidatePatients = allPatients.filter(p => !p.isHidden);
    } else if (filterVisibility === 'hidden') {
      candidatePatients = allPatients.filter(p => p.isHidden);
    }

    const filtered = candidatePatients.filter(p => {
      const matchSearch = (p.name && p.name.toLowerCase().includes(searchTerm)) ||
                          (p.billNo && p.billNo.toLowerCase().includes(searchTerm)) ||
                          (p.uhid && p.uhid.toLowerCase().includes(searchTerm)) ||
                          (p.phone && p.phone.includes(searchTerm)) ||
                          (p.doctorName && p.doctorName.toLowerCase().includes(searchTerm));

      const matchStatus = filterStatus === 'all' || p.status === filterStatus;

      const finalAmt = parseFloat(p.finalAmount) || 0;
      const paidAmt = p.paidAmount !== undefined ? (parseFloat(p.paidAmount) || 0) : finalAmt;
      const dueAmt = Math.max(0, finalAmt - paidAmt);

      let matchPayment = true;
      if (filterPayment === 'due') {
        matchPayment = dueAmt > 0.01;
      } else if (filterPayment === 'paid') {
        matchPayment = dueAmt <= 0.01;
      }

      return matchSearch && matchStatus && matchPayment;
    });

    const tbody = document.getElementById('patients-table-body');
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:30px; color:#64748b;">Koi patient record match nahi hua.</td></tr>`;
      return;
    }

    const isAdminUser = window.authManager.isAdmin();

    tbody.innerHTML = filtered.map(p => {
      const isCompleted = p.status === 'completed';
      let statusBadge = isCompleted 
        ? `<span class="badge badge-success">Completed</span>`
        : `<span class="badge badge-warning">Pending Findings</span>`;

      if (p.isHidden) {
        statusBadge += `<br><span class="badge badge-danger" style="margin-top:3px; background:#fee2e2; color:#b91c1c;">👁️ HIDDEN</span>`;
      }

      const dateStr = new Date(p.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short' });

      const finalAmt = parseFloat(p.finalAmount) || 0;
      const paidAmt = p.paidAmount !== undefined ? (parseFloat(p.paidAmount) || 0) : finalAmt;
      const dueAmt = Math.max(0, finalAmt - paidAmt);
      const discAmt = parseFloat(p.discountAmount) || 0;
      const payMode = p.paymentMode || 'Cash';

      let dueBadge = '';
      let collectBtn = '';

      if (dueAmt > 0.01) {
        dueBadge = `
          <div style="margin-top:3px;">
            <span class="badge badge-danger" style="font-weight:700; font-size:11px;">
              DUE: ₹${dueAmt.toFixed(2)}
            </span>
          </div>
        `;
        if (!p.isHidden) {
          collectBtn = `
            <button class="btn btn-warning btn-sm" title="Collect Pending Due" onclick="window.app.openCollectPaymentModal('${p.id}')" style="background:#f59e0b; color:#fff; border-color:#d97706;">
              💰 Collect Due
            </button>
          `;
        }
      } else {
        dueBadge = `
          <div style="margin-top:3px;">
            <span class="badge badge-success" style="font-weight:700; font-size:11px;">
              PAID IN FULL
            </span>
          </div>
        `;
      }

      const discountLine = discAmt > 0 ? `
        <div style="font-size:10.5px; color:#16a34a; margin-top:2px;" title="Approved by: ${p.discountApprovedBy || 'Admin'}">
          🏷️ Disc: -₹${discAmt.toFixed(2)} (${p.discountApprovedBy || 'Admin'})
        </div>
      ` : '';

      // Hide / Unhide Action Button (Admin Only)
      let hideBtn = '';
      if (isAdminUser) {
        if (p.isHidden) {
          hideBtn = `
            <button class="btn btn-secondary btn-sm" style="color:#16a34a; border-color:#86efac; font-weight:700;" title="Unhide Patient (Restore to Lab Totals)" onclick="window.app.toggleHidePatient('${p.id}', false)">
              👁️ Unhide
            </button>
          `;
        } else {
          hideBtn = `
            <button class="btn btn-secondary btn-sm" style="color:#ef4444; border-color:#fca5a5;" title="Hide Patient (Exclude from Totals)" onclick="window.app.toggleHidePatient('${p.id}', true)">
              👁️ Hide
            </button>
          `;
        }
      }

      const rowBg = p.isHidden ? 'style="background:#f8fafc; opacity:0.85;"' : '';

      return `
        <tr ${rowBg}>
          <td>
            <strong>${p.billNo}</strong>
            <br><span style="font-size:11px; color:#64748b;">${p.uhid}</span>
            ${p.isHidden ? `<br><span style="font-size:10px; color:#ef4444; font-weight:700;">[VOIDED/HIDDEN]</span>` : ''}
          </td>
          <td><strong>${p.name}</strong><br><span style="font-size:11px; color:#64748b;">${p.age} ${p.ageUnit} / ${p.gender} | ${p.phone || '-'}</span></td>
          <td>${p.doctorName}</td>
          <td><span style="font-size:12px; color:#334155;">${(p.testNames || []).join(', ')}</span></td>
          <td>
            <div style="font-size:13px;">
              <strong>Billed: ₹${finalAmt.toFixed(2)}</strong>
            </div>
            <div style="font-size:11.5px; color:#0284c7;">
              Paid: ₹${paidAmt.toFixed(2)} <span style="font-size:10px; color:#64748b;">(${payMode})</span>
            </div>
            ${dueBadge}
            ${discountLine}
          </td>
          <td>${dateStr}</td>
          <td>${statusBadge}</td>
          <td>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              ${collectBtn}
              <button class="btn btn-outline btn-sm" title="Enter Blood Test Findings" onclick="window.app.openResultEntryModal('${p.id}')">
                ✏️ Result
              </button>
              <a class="btn btn-primary btn-sm" title="Print Blood Test Report (Full / Letterhead)" href="print-report.html?id=${p.id}&mode=full" target="_blank">
                🖨️ Report
              </a>
              <button class="btn btn-secondary btn-sm" title="Print Bill Receipt" onclick="window.app.openBillModal('${p.id}')">
                🧾 Bill
              </button>
              ${hideBtn}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Hide or Unhide Patient record (Admin only)
  // When hidden, all revenue and counts are immediately deducted from lab totals
  async toggleHidePatient(patientId, shouldHide) {
    if (!window.authManager.isAdmin()) {
      this.showToast('Patient hide/unhide karne ka adhikar sirf Admin ke paas hai.', 'error');
      return;
    }

    const patient = await window.labDB.get('patients', patientId);
    if (!patient) return;

    const confirmMsg = shouldHide 
      ? `Kya aap "${patient.name}" (${patient.billNo}) ko HIDE karna chahte hain?\n\nDhayan dein: Is patient ka bill amount (₹${patient.finalAmount}) aur count lab ke sabhi revenue aur statistics se MINUS ho jayega.`
      : `Kya aap "${patient.name}" (${patient.billNo}) ko UNHIDE karke wapas active karna chahte hain?\n\nIska revenue aur record wapas lab totals me add ho jayega.`;

    if (confirm(confirmMsg)) {
      patient.isHidden = !!shouldHide;
      patient.hiddenAt = shouldHide ? new Date().toISOString() : null;
      patient.hiddenBy = shouldHide ? (window.authManager.currentUser?.name || 'Admin') : null;

      await window.labDB.put('patients', patient);
      this.showToast(shouldHide ? 'Patient hide kar diya gaya aur totals se deduct ho gaya.' : 'Patient wapas unhide ho gaya.', 'success');
      this.renderPatientsList();
    }
  }

  // Collect Payment / Settle Due Modal
  async openCollectPaymentModal(patientId) {
    const patient = await window.labDB.get('patients', patientId);
    if (!patient) return;

    const finalAmt = parseFloat(patient.finalAmount) || 0;
    const paidAmt = patient.paidAmount !== undefined ? (parseFloat(patient.paidAmount) || 0) : finalAmt;
    const dueAmt = Math.max(0, finalAmt - paidAmt);

    document.getElementById('collect-patient-id').value = patient.id;
    document.getElementById('collect-patient-title').innerText = `${patient.name} (${patient.billNo}) - ${patient.phone || ''}`;
    document.getElementById('collect-info-total').innerText = '₹' + finalAmt.toFixed(2);
    document.getElementById('collect-info-paid').innerText = '₹' + paidAmt.toFixed(2);
    document.getElementById('collect-info-due').innerText = '₹' + dueAmt.toFixed(2);

    const amountInput = document.getElementById('collect-amount-input');
    amountInput.value = dueAmt.toFixed(2);
    amountInput.max = dueAmt;

    document.getElementById('collect-notes-input').value = '';

    this.showModal('modal-collect-payment');
  }

  async saveCollectPayment() {
    try {
      const patientId = document.getElementById('collect-patient-id').value;
      const receivingAmount = parseFloat(document.getElementById('collect-amount-input').value) || 0;
      const paymentMode = document.getElementById('collect-mode-input').value;
      const notes = document.getElementById('collect-notes-input').value.trim();

      if (receivingAmount <= 0) {
        throw new Error('Valid amount enter karein.');
      }

      const patient = await window.labDB.get('patients', patientId);
      if (!patient) throw new Error('Patient nahi mila.');

      const finalAmt = parseFloat(patient.finalAmount) || 0;
      const currentPaid = patient.paidAmount !== undefined ? (parseFloat(patient.paidAmount) || 0) : finalAmt;
      const remainingDue = Math.max(0, finalAmt - currentPaid);

      if (receivingAmount > (remainingDue + 0.05)) {
        throw new Error(`Amount due se zyada nahi ho sakta. Remaining Due: ₹${remainingDue.toFixed(2)}`);
      }

      const newPaidTotal = currentPaid + receivingAmount;
      patient.paidAmount = newPaidTotal;
      patient.paymentMode = paymentMode;

      // Log payment history
      patient.paymentHistory = patient.paymentHistory || [];
      patient.paymentHistory.push({
        date: new Date().toISOString(),
        amount: receivingAmount,
        mode: paymentMode,
        receivedBy: window.authManager.currentUser?.name || 'Staff',
        notes: notes
      });

      await window.labDB.put('patients', patient);

      this.closeModal('modal-collect-payment');
      this.showToast(`₹${receivingAmount.toFixed(2)} payment successfully receive ho gaya!`, 'success');
      this.renderPatientsList();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // --------------------------------------------------------------------------
  // 4. TEST RESULT ENTRY MODAL
  // --------------------------------------------------------------------------
  async openResultEntryModal(patientId) {
    const patient = await window.labDB.get('patients', patientId);
    if (!patient) return;

    const reports = await window.labDB.getAll('reports', r => r.patientId === patientId);
    const lab = window.authManager.currentLab;

    const titleEl = document.getElementById('entry-modal-patient-name');
    if (titleEl) titleEl.innerText = `${patient.name} (${patient.age} ${patient.ageUnit}/${patient.gender}) - ${patient.billNo}`;

    const container = document.getElementById('entry-modal-tests-container');
    if (container) {
      container.innerHTML = '';
      reports.forEach((rep, rIndex) => {
        const params = rep.parametersData || {};
        const paramKeys = Object.keys(params);

        const paramsInputsHTML = paramKeys.map(k => {
          const item = params[k];
          return `
            <div style="display:grid; grid-template-columns: 2fr 1.5fr 1fr 2.5fr; gap:10px; align-items:center; padding:6px 0; border-bottom:1px solid #f1f5f9;">
              <div><strong style="font-size:13px; color:#1e293b;">${k}</strong></div>
              <div>
                <input type="text" class="form-control result-param-input" 
                       data-report-id="${rep.id}" 
                       data-param-name="${k}" 
                       value="${item.value || ''}" 
                       placeholder="Enter value...">
              </div>
              <div style="font-size:12px; color:#64748b;">${item.unit || '-'}</div>
              <div style="font-size:11px; color:#475569; white-space:pre-line;">${item.range || '-'}</div>
            </div>
          `;
        }).join('');

        container.innerHTML += `
          <div class="card" style="margin-bottom:18px; border:1px solid #cbd5e1;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:8px; margin-bottom:12px;">
              <h4 style="color:#0284c7; font-size:15px; margin:0;">${rIndex + 1}. ${rep.testName}</h4>
              <span class="badge ${rep.status === 'completed' ? 'badge-success' : 'badge-warning'}">${rep.status}</span>
            </div>

            <div style="display:grid; grid-template-columns: 2fr 1.5fr 1fr 2.5fr; gap:10px; font-weight:700; font-size:11px; color:#64748b; text-transform:uppercase; padding-bottom:6px; border-bottom:1.5px solid #cbd5e1;">
              <div>Parameter</div>
              <div>Observed Value</div>
              <div>Unit</div>
              <div>Reference Range</div>
            </div>

            ${paramsInputsHTML}

            <div class="form-group" style="margin-top:14px;">
              <label class="form-label">Clinical Remarks / Impression (Optional):</label>
              <input type="text" class="form-control result-remarks-input" data-report-id="${rep.id}" value="${rep.remarks || ''}" placeholder="e.g. Microcytic Hypochromic blood picture...">
            </div>
          </div>
        `;
      });
    }

    const techEl = document.getElementById('entry-tech-name');
    const pathEl = document.getElementById('entry-path-name');
    if (techEl) techEl.value = (reports[0] && reports[0].technologist) || lab.technologistName || '';
    if (pathEl) pathEl.value = (reports[0] && reports[0].pathologist) || lab.pathologistName || '';

    const saveBtn = document.getElementById('btn-save-results');
    if (saveBtn) saveBtn.onclick = () => this.saveAllEnteredResults(patientId, reports);

    this.showModal('modal-result-entry');
  }

  async saveAllEnteredResults(patientId, reports) {
    try {
      const tech = document.getElementById('entry-tech-name')?.value || '';
      const path = document.getElementById('entry-path-name')?.value || '';

      for (const rep of reports) {
        const inputs = document.querySelectorAll(`.result-param-input[data-report-id="${rep.id}"]`);
        const paramVals = {};
        inputs.forEach(inp => {
          paramVals[inp.dataset.paramName] = inp.value.trim();
        });

        const remInp = document.querySelector(`.result-remarks-input[data-report-id="${rep.id}"]`);
        const remarks = remInp ? remInp.value.trim() : '';

        await window.reportEntryManager.saveReportResults(rep.id, paramVals, remarks, tech, path);
      }

      this.closeModal('modal-result-entry');
      this.showToast('Test results save ho gaye!', 'success');
      
      if (this.currentPage === 'dashboard') {
        this.renderDashboard();
      } else if (this.currentPage === 'patients-reports') {
        this.renderPatientsList();
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // --------------------------------------------------------------------------
  // 5. DUAL-MODE PRINT PREVIEW (Clean Standalone Window without Scrollbars)
  // --------------------------------------------------------------------------
  openPrintPreviewModal(patientId) {
    window.open(`print-report.html?id=${patientId}&mode=full`, '_blank');
  }

  async setPrintMode(mode) {
    this.currentPrintMode = mode;
    const btnFull = document.getElementById('btn-mode-full');
    const btnLetterhead = document.getElementById('btn-mode-letterhead');

    if (btnFull) {
      btnFull.classList.toggle('btn-primary', mode === 'full');
      btnFull.classList.toggle('btn-outline', mode !== 'full');
    }
    if (btnLetterhead) {
      btnLetterhead.classList.toggle('btn-primary', mode === 'letterhead');
      btnLetterhead.classList.toggle('btn-outline', mode !== 'letterhead');
    }

    const padTopInput = document.getElementById('input-modal-pad-top');
    const padBottomInput = document.getElementById('input-modal-pad-bottom');
    const padSideInput = document.getElementById('input-modal-pad-side');

    if (padTopInput && padBottomInput && padSideInput) {
      if (mode === 'letterhead') {
        padTopInput.value = 45;
        padBottomInput.value = 20;
        padSideInput.value = 12;
      } else {
        padTopInput.value = 10;
        padBottomInput.value = 10;
        padSideInput.value = 12;
      }
    }

    await this.refreshPrintPreview();
  }

  async refreshPrintPreview() {
    if (!this.currentPrintPatientId) return;
    const padTop = parseFloat(document.getElementById('input-modal-pad-top')?.value) || (this.currentPrintMode === 'letterhead' ? 45 : 10);
    const padBottom = parseFloat(document.getElementById('input-modal-pad-bottom')?.value) || (this.currentPrintMode === 'letterhead' ? 20 : 10);
    const padSide = parseFloat(document.getElementById('input-modal-pad-side')?.value) || 12;

    const html = await window.reportPrintManager.generateReportHTML(
      this.currentPrintPatientId,
      this.currentPrintMode,
      padTop,
      padBottom,
      padSide
    );
    const renderArea = document.getElementById('print-preview-render-area');
    if (renderArea) renderArea.innerHTML = html;
  }

  triggerPrint() {
    window.print();
  }

  // --------------------------------------------------------------------------
  // 6. BILL / RECEIPT MODAL
  // --------------------------------------------------------------------------
  async openBillModal(patientId) {
    const html = await window.reportPrintManager.generateBillHTML(patientId);
    const billArea = document.getElementById('bill-print-render-area');
    if (billArea) billArea.innerHTML = html;
    this.showModal('modal-bill-print');
  }

  // --------------------------------------------------------------------------
  // 7. REFERRAL DOCTORS VIEW (referral-doctors.html)
  // --------------------------------------------------------------------------
  async renderDoctorsView() {
    const labId = window.authManager.currentLab?.id;
    if (!labId) return;

    const filter = document.getElementById('doctor-time-filter')?.value || 'all';
    const report = await window.doctorManager.getCommissionReport(labId, filter);

    const tbody = document.getElementById('doctors-table-body');
    if (!tbody) return;

    const canEditDoc = window.authManager.hasPermission('canEditDoctor');
    const canDelDoc = window.authManager.hasPermission('canDeleteDoctor');

    let totalPatientsReferred = 0;
    let totalBillingSum = 0;
    let totalCommissionSum = 0;

    tbody.innerHTML = report.map(r => {
      const isSelf = r.doctor.id === 'self';
      totalPatientsReferred += r.patientCount;
      totalBillingSum += r.totalBilled;
      totalCommissionSum += r.totalCommission;

      const editBtn = canEditDoc
        ? `<button class="btn btn-outline btn-sm" onclick="window.app.editDoctor('${r.doctor.id}')">Edit</button>`
        : `<button class="btn btn-outline btn-sm" style="opacity:0.5; cursor:not-allowed;" title="Edit restricted by Admin" onclick="window.app.showToast('Edit restricted: Doctor edit karne ki permission sirf Admin dwara allow hone par milti hai.', 'error')">🔒 Edit</button>`;

      const delBtn = canDelDoc
        ? `<button class="btn btn-danger btn-sm" onclick="window.app.deleteDoctor('${r.doctor.id}')">Del</button>`
        : `<button class="btn btn-danger btn-sm" style="opacity:0.5; cursor:not-allowed;" title="Delete restricted by Admin" onclick="window.app.showToast('Delete restricted: Doctor delete karne ki permission aapke staff account ko nahi hai.', 'error')">🔒 Del</button>`;

      return `
        <tr>
          <td>
            <strong>${r.doctor.name}</strong>
            <br><span style="font-size:11px; color:#64748b;">${r.doctor.degree || '-'} | ${r.doctor.hospital || '-'}</span>
          </td>
          <td>${r.doctor.phone || '-'}</td>
          <td>
            <span class="badge ${r.commissionRate > 0 ? 'badge-info' : 'badge-neutral'}">
              ${r.commissionRate}%
            </span>
          </td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="window.app.viewDoctorPatients('${r.doctor.id}')" title="View Patient Ledger">
              👥 <strong>${r.patientCount}</strong> Patients
            </button>
          </td>
          <td><strong>₹${r.totalBilled.toFixed(2)}</strong></td>
          <td>
            <strong style="color:#0284c7; font-size:14px;">₹${r.totalCommission.toFixed(2)}</strong>
          </td>
          <td>
            ${!isSelf ? `
              <div style="display:flex; gap:6px;">
                ${editBtn}
                ${delBtn}
              </div>
            ` : `<span style="font-size:11px; color:#94a3b8;">Default</span>`}
          </td>
        </tr>
      `;
    }).join('');

    const elDocPatients = document.getElementById('doc-stat-patients');
    const elDocBilled = document.getElementById('doc-stat-billed');
    const elDocComm = document.getElementById('doc-stat-commission');

    if (elDocPatients) elDocPatients.innerText = totalPatientsReferred;
    if (elDocBilled) elDocBilled.innerText = '₹' + totalBillingSum.toFixed(0);
    if (elDocComm) elDocComm.innerText = '₹' + totalCommissionSum.toFixed(0);
  }

  // View doctor's patient ledger
  async viewDoctorPatients(docId) {
    const labId = window.authManager.currentLab?.id;
    const doctors = await window.doctorManager.getDoctors(labId);
    const doc = doctors.find(d => d.id === docId) || (docId === 'self' ? { name: 'Self / Direct Walk-in', commissionRate: 0 } : null);
    if (!doc) return;

    const allPatients = await window.labDB.getAll('patients', p => p.labId === labId);
    const docPatients = allPatients.filter(p => (docId === 'self' ? (!p.doctorId || p.doctorId === 'self') : p.doctorId === docId));

    document.getElementById('doc-patient-modal-title').innerText = doc.name;
    document.getElementById('doc-patient-modal-sub').innerText = `Referral Rate: ${doc.commissionRate || 0}% | Total Patients: ${docPatients.length}`;

    const tbody = document.getElementById('doc-patient-modal-tbody');
    if (docPatients.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#64748b;">Is doctor dwara abhi tak koi patient refer nahi kiya gaya hai.</td></tr>`;
    } else {
      tbody.innerHTML = docPatients.map(p => {
        const comm = ((parseFloat(p.finalAmount) || 0) * (parseFloat(doc.commissionRate) || 0)) / 100;
        const dateStr = new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        return `
          <tr>
            <td>${dateStr}</td>
            <td><strong>${p.name}</strong><br><span style="font-size:11px; color:#64748b;">${p.billNo} (${p.uhid})</span></td>
            <td><span style="font-size:12px;">${(p.testNames || []).join(', ')}</span></td>
            <td><strong>₹${p.finalAmount}</strong></td>
            <td><strong style="color:#0284c7;">₹${comm.toFixed(2)}</strong></td>
          </tr>
        `;
      }).join('');
    }

    this.showModal('modal-doctor-patients');
  }

  async saveDoctorForm() {
    try {
      const id = document.getElementById('doc-id-input').value;
      const name = document.getElementById('doc-name-input').value.trim();
      const degree = document.getElementById('doc-degree-input').value.trim();
      const hospital = document.getElementById('doc-hospital-input').value.trim();
      const phone = document.getElementById('doc-phone-input').value.trim();
      const rate = parseFloat(document.getElementById('doc-rate-input').value) || 0;

      if (!name) throw new Error('Doctor ka Naam likhna zaroori hai.');

      if (id && !window.authManager.hasPermission('canEditDoctor')) {
        throw new Error('Permission Denied: Doctor details ya commission % edit karne ki permission aapke staff account ko nahi hai.');
      }

      await window.doctorManager.saveDoctor({
        id: id || null,
        labId: window.authManager.currentLab.id,
        name, degree, hospital, phone, commissionRate: rate
      });

      this.closeModal('modal-add-doctor');
      this.showToast('Doctor details save ho gayi!', 'success');
      this.renderDoctorsView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async editDoctor(docId) {
    if (!window.authManager.hasPermission('canEditDoctor')) {
      this.showToast('Permission Denied: Doctor details ya commission % edit karne ki permission aapke staff account ko nahi hai.', 'error');
      return;
    }

    const doc = await window.labDB.get('doctors', docId);
    if (!doc) return;

    document.getElementById('doc-id-input').value = doc.id;
    document.getElementById('doc-name-input').value = doc.name;
    document.getElementById('doc-degree-input').value = doc.degree || '';
    document.getElementById('doc-hospital-input').value = doc.hospital || '';
    document.getElementById('doc-phone-input').value = doc.phone || '';
    document.getElementById('doc-rate-input').value = doc.commissionRate || 0;

    this.showModal('modal-add-doctor');
  }

  async deleteDoctor(docId) {
    if (!window.authManager.hasPermission('canDeleteDoctor')) {
      this.showToast('Permission Denied: Doctor delete karne ki permission aapke staff account ko nahi hai.', 'error');
      return;
    }

    if (confirm('Kya aap sach me is doctor ko delete karna chahte hain?')) {
      await window.doctorManager.deleteDoctor(docId);
      this.showToast('Doctor delete ho gaya.', 'success');
      this.renderDoctorsView();
    }
  }

  // --------------------------------------------------------------------------
  // 8. TEST CATALOG VIEW (test-catalog.html)
  // --------------------------------------------------------------------------
  async renderTestCatalogView() {
    const labId = window.authManager.currentLab?.id;
    if (!labId) return;

    const tests = await window.testCatalogManager.getTests(labId);
    const tbody = document.getElementById('test-catalog-table-body');
    if (!tbody) return;

    const canChangeRate = window.authManager.hasPermission('canChangeTestRate');
    const canEditTest = window.authManager.hasPermission('canEditTest');
    const canDeleteTest = window.authManager.hasPermission('canDeleteTest');

    tbody.innerHTML = tests.map(t => {
      const rateBtn = canChangeRate
        ? `<button class="btn btn-outline btn-sm" onclick="window.app.editTestPrice('${t.id}')">Rate</button>`
        : `<button class="btn btn-outline btn-sm" style="opacity:0.5; cursor:not-allowed;" title="Rate change restricted by Admin" onclick="window.app.showToast('Rate change restricted: Test rate badalne ki permission sirf Admin dwara allow hone par milti hai.', 'error')">🔒 Rate</button>`;

      const editBtn = canEditTest
        ? `<button class="btn btn-primary btn-sm" onclick="window.app.openAddTestModal('${t.id}')">Edit</button>`
        : `<button class="btn btn-primary btn-sm" style="opacity:0.5; cursor:not-allowed;" title="Edit restricted by Admin" onclick="window.app.showToast('Edit restricted: Already added test ko edit karne ki permission aapke staff account ko nahi hai.', 'error')">🔒 Edit</button>`;

      const delBtn = canDeleteTest
        ? `<button class="btn btn-danger btn-sm" onclick="window.app.deleteTestCatalogItem('${t.id}')">Del</button>`
        : `<button class="btn btn-danger btn-sm" style="opacity:0.5; cursor:not-allowed;" title="Delete restricted by Admin" onclick="window.app.showToast('Delete restricted: Test delete karne ki permission aapke staff account ko nahi hai.', 'error')">🔒 Del</button>`;

      return `
        <tr>
          <td><strong>${t.code || '-'}</strong></td>
          <td>
            <strong>${t.name}</strong>
            <br><span style="font-size:11px; color:#64748b;">${(t.parameters || []).length} Parameters</span>
          </td>
          <td><span class="badge badge-neutral">${t.category}</span></td>
          <td>${(t.parameters || []).length} Findings</td>
          <td><strong style="color:#0284c7; font-size:14px;">₹${t.price}</strong></td>
          <td>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
              ${rateBtn}
              ${editBtn}
              ${delBtn}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  async editTestPrice(testId) {
    if (!window.authManager.hasPermission('canChangeTestRate')) {
      this.showToast('Permission Denied: Test rate badalne ki permission aapke staff account ko nahi hai.', 'error');
      return;
    }

    const test = await window.labDB.get('test_catalog', testId);
    if (!test) return;

    const newPriceStr = prompt(`"${test.name}" ka naya price enter karein (₹):`, test.price);
    if (newPriceStr !== null) {
      const price = parseFloat(newPriceStr);
      if (!isNaN(price) && price >= 0) {
        test.price = price;
        await window.testCatalogManager.saveTest(test);
        this.showToast('Test price update ho gaya!', 'success');
        this.renderTestCatalogView();
      }
    }
  }

  // Open Add / Edit Test Modal
  async openAddTestModal(testId = null) {
    const container = document.getElementById('test-parameters-list-container');
    if (!container) return;

    container.innerHTML = '';
    const priceInput = document.getElementById('input-test-price');

    if (testId) {
      // Editing existing test requires canEditTest
      if (!window.authManager.hasPermission('canEditTest')) {
        this.showToast('Permission Denied: Existing test edit karne ki permission aapke staff account ko nahi hai.', 'error');
        return;
      }

      const test = await window.labDB.get('test_catalog', testId);
      if (!test) return;

      document.getElementById('modal-add-test-title').innerText = '✏️ Edit Pathology Test';
      document.getElementById('input-test-id').value = test.id;
      document.getElementById('input-test-code').value = test.code || '';
      document.getElementById('input-test-name').value = test.name || '';
      document.getElementById('input-test-category').value = test.category || 'Biochemistry';
      
      if (priceInput) {
        priceInput.value = test.price || 0;
        // If staff cannot change rate, lock the rate input field
        if (!window.authManager.hasPermission('canChangeTestRate')) {
          priceInput.setAttribute('readonly', 'true');
          priceInput.style.background = '#f1f5f9';
          priceInput.title = 'Rate change restricted by Admin';
        } else {
          priceInput.removeAttribute('readonly');
          priceInput.style.background = '';
          priceInput.title = '';
        }
      }

      if (test.parameters && test.parameters.length > 0) {
        test.parameters.forEach(p => this.addParameterRow(p));
      } else {
        this.addParameterRow();
      }
    } else {
      // Adding NEW test: Allowed for staff (Requirement 4)
      document.getElementById('modal-add-test-title').innerText = '➕ Add New Pathology Test';
      document.getElementById('input-test-id').value = '';
      document.getElementById('input-test-code').value = '';
      document.getElementById('input-test-name').value = '';
      document.getElementById('input-test-category').value = 'Biochemistry';
      
      if (priceInput) {
        priceInput.value = '350';
        priceInput.removeAttribute('readonly');
        priceInput.style.background = '';
        priceInput.title = '';
      }

      this.addParameterRow();
    }

    this.showModal('modal-add-test');
  }

  // Add parameter input row in modal
  addParameterRow(param = null) {
    const container = document.getElementById('test-parameters-list-container');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'param-input-row';
    row.style = 'display:grid; grid-template-columns: 2.5fr 1fr 2.5fr 40px; gap:8px; align-items:center; margin-bottom:8px;';

    row.innerHTML = `
      <input type="text" class="form-control param-field-name" placeholder="Parameter Name (e.g. Hemoglobin)" value="${param ? (param.name || '') : ''}">
      <input type="text" class="form-control param-field-unit" placeholder="Unit (e.g. g/dL)" value="${param ? (param.unit || '') : ''}">
      <input type="text" class="form-control param-field-range" placeholder="Ref Range (e.g. 13.0 - 17.0)" value="${param ? (param.rangeStr || '') : ''}">
      <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()" style="padding:6px; font-weight:700;" title="Remove parameter">✕</button>
    `;

    container.appendChild(row);
  }

  // Save new or updated test to catalog
  async saveTestCatalogItem() {
    try {
      const id = document.getElementById('input-test-id').value;
      const code = document.getElementById('input-test-code').value.trim();
      const name = document.getElementById('input-test-name').value.trim();
      const category = document.getElementById('input-test-category').value;
      let price = parseFloat(document.getElementById('input-test-price').value) || 0;

      if (!name) throw new Error('Test Name likhna anivarya hai.');

      // Check permission for modifying existing tests
      if (id) {
        if (!window.authManager.hasPermission('canEditTest')) {
          throw new Error('Permission Denied: Existing test edit karne ki permission aapke staff account ko nahi hai.');
        }

        // If staff cannot change rates, restore existing test price
        if (!window.authManager.hasPermission('canChangeTestRate')) {
          const original = await window.labDB.get('test_catalog', id);
          if (original) {
            price = original.price;
          }
        }
      }

      const paramRows = document.querySelectorAll('.param-input-row');
      const parameters = [];

      paramRows.forEach(row => {
        const pName = row.querySelector('.param-field-name').value.trim();
        const pUnit = row.querySelector('.param-field-unit').value.trim();
        const pRange = row.querySelector('.param-field-range').value.trim();

        if (pName) {
          parameters.push({
            name: pName,
            unit: pUnit,
            rangeStr: pRange
          });
        }
      });

      if (parameters.length === 0) {
        throw new Error('Kam se kam ek parameter likhna zaroori hai.');
      }

      const testData = {
        id: id || null,
        labId: window.authManager.currentLab.id,
        code: code || 'T' + Math.floor(Math.random() * 900 + 100),
        name: name,
        category: category,
        price: price,
        parameters: parameters
      };

      await window.testCatalogManager.saveTest(testData);

      this.closeModal('modal-add-test');
      this.showToast(`Test "${name}" successfully catalog me save ho gaya!`, 'success');
      this.renderTestCatalogView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // Delete test item
  async deleteTestCatalogItem(testId) {
    if (!window.authManager.hasPermission('canDeleteTest')) {
      this.showToast('Permission Denied: Test delete karne ki permission aapke staff account ko nahi hai.', 'error');
      return;
    }

    const test = await window.labDB.get('test_catalog', testId);
    if (!test) return;

    if (confirm(`Kya aap "${test.name}" test ko catalog se hatana chahte hain?`)) {
      await window.testCatalogManager.deleteTest(testId);
      this.showToast(`Test "${test.name}" catalog se delete ho gaya.`, 'success');
      this.renderTestCatalogView();
    }
  }

  // --------------------------------------------------------------------------
  // 9. STAFF VIEW (staff.html)
  // --------------------------------------------------------------------------
  async renderStaffView() {
    const staffList = await window.authManager.getStaffList();
    const tbody = document.getElementById('staff-table-body');
    if (!tbody) return;

    tbody.innerHTML = staffList.map(s => {
      let permissionsHTML = '';
      if (s.role === 'admin') {
        permissionsHTML = `<span class="badge badge-info" style="font-weight:700;">Full Admin Access</span>`;
      } else {
        const p = s.permissions || {};
        const badges = [];

        if (p.canChangeTestRate) badges.push(`<span class="badge badge-success" title="Test Rate Change Allowed">✓ Rate</span>`);
        else badges.push(`<span class="badge badge-neutral" style="opacity:0.5;" title="Test Rate Change Denied">✕ Rate</span>`);

        if (p.canEditTest) badges.push(`<span class="badge badge-success" title="Edit Existing Test Allowed">✓ Edit Test</span>`);
        else badges.push(`<span class="badge badge-neutral" style="opacity:0.5;" title="Edit Existing Test Denied">✕ Edit Test</span>`);

        if (p.canDeleteTest) badges.push(`<span class="badge badge-success" title="Delete Test Allowed">✓ Del Test</span>`);
        else badges.push(`<span class="badge badge-neutral" style="opacity:0.5;" title="Delete Test Denied">✕ Del Test</span>`);

        if (p.canEditDoctor) badges.push(`<span class="badge badge-success" title="Edit Doctor & Commission % Allowed">✓ Edit Doc</span>`);
        else badges.push(`<span class="badge badge-neutral" style="opacity:0.5;" title="Edit Doctor & Commission % Denied">✕ Edit Doc</span>`);

        if (p.canDeleteDoctor) badges.push(`<span class="badge badge-success" title="Delete Doctor Allowed">✓ Del Doc</span>`);
        else badges.push(`<span class="badge badge-neutral" style="opacity:0.5;" title="Delete Doctor Denied">✕ Del Doc</span>`);

        permissionsHTML = `<div style="display:flex; gap:4px; flex-wrap:wrap;">${badges.join('')}</div>`;
      }

      const emailCol = s.email ? `<strong style="color:#0284c7;">${s.email}</strong>` : `<span style="color:#94a3b8; font-style:italic;">Not Set</span>`;
      const usernameCol = s.username ? `@${s.username}` : `<span class="badge badge-neutral" style="font-size:11px;">@${(s.email || '').split('@')[0]}</span>`;
      const statusCol = (s.role === 'admin' || s.isActivated)
        ? `<span class="badge badge-success">✓ Active & Joined</span>`
        : `<span class="badge badge-warning" style="background:#fef3c7; color:#92400e;" title="Admin has pre-registered this email, waiting for staff signup">⏳ Invited (Pending Signup)</span>`;
      const pinCol = (s.role === 'admin')
        ? `<span class="badge badge-neutral" style="font-family:monospace;">${s.pin ? s.pin : '••••'}</span>`
        : (s.isActivated 
            ? `<span class="badge badge-neutral" style="background:#f1f5f9; color:#475569;" title="Staff PIN is private & encrypted">🔒 Set</span>`
            : `<span style="font-size:11px; color:#94a3b8; font-style:italic;">Not Set Yet</span>`);

      return `
        <tr>
          <td><strong>${s.name}</strong></td>
          <td>${emailCol}</td>
          <td>${usernameCol}</td>
          <td>${s.phone || '-'}</td>
          <td>${statusCol}</td>
          <td>${pinCol}</td>
          <td>${permissionsHTML}</td>
          <td>
            ${s.role !== 'admin' ? `
              <div style="display:flex; gap:6px;">
                <button class="btn btn-outline btn-sm" onclick="window.app.openEditStaffModal('${s.id}')" title="Configure Granular Permissions">⚙️ Permissions</button>
                <button class="btn btn-danger btn-sm" onclick="window.app.deleteStaffAccount('${s.id}')">Remove</button>
              </div>
            ` : `<span style="font-size:11px; color:#64748b;">Primary Admin</span>`}
          </td>
        </tr>
      `;
    }).join('');
  }

  async saveNewStaffForm() {
    try {
      const name = document.getElementById('staff-name-input')?.value.trim();
      const email = document.getElementById('staff-email-input')?.value.trim();
      const phone = document.getElementById('staff-phone-input')?.value.trim();

      if (!name || !email) {
        throw new Error('Staff Name aur Email (Gmail) dono bharna anivarya hai.');
      }

      const permissions = {
        canChangeTestRate: document.getElementById('staff-perm-test-rate')?.checked || false,
        canEditTest: document.getElementById('staff-perm-test-edit')?.checked || false,
        canDeleteTest: document.getElementById('staff-perm-test-del')?.checked || false,
        canEditDoctor: document.getElementById('staff-perm-doc-edit')?.checked || false,
        canDeleteDoctor: document.getElementById('staff-perm-doc-del')?.checked || false
      };

      await window.authManager.createStaff({ name, email, phone, permissions });
      this.closeModal('modal-add-staff');
      document.getElementById('form-staff')?.reset();
      this.showToast('Staff email add ho gaya! Staff ab isi Gmail se account bana sakega.', 'success');
      this.renderStaffView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async openEditStaffModal(userId) {
    const staff = await window.labDB.get('users', userId);
    if (!staff) return;

    document.getElementById('edit-staff-id').value = staff.id;
    document.getElementById('edit-staff-username-pill').innerText = staff.email || (staff.username ? `@${staff.username}` : '(Pending)');
    document.getElementById('edit-staff-name-input').value = staff.name || '';
    if (document.getElementById('edit-staff-email-input')) {
      document.getElementById('edit-staff-email-input').value = staff.email || '';
    }
    document.getElementById('edit-staff-phone-input').value = staff.phone || '';

    const p = staff.permissions || {};
    document.getElementById('edit-perm-test-rate').checked = !!p.canChangeTestRate;
    document.getElementById('edit-perm-test-edit').checked = !!p.canEditTest;
    document.getElementById('edit-perm-test-del').checked = !!p.canDeleteTest;
    document.getElementById('edit-perm-doc-edit').checked = !!p.canEditDoctor;
    document.getElementById('edit-perm-doc-del').checked = !!p.canDeleteDoctor;

    this.showModal('modal-edit-staff');
  }

  async saveEditStaffForm() {
    try {
      const id = document.getElementById('edit-staff-id').value;
      const name = document.getElementById('edit-staff-name-input').value.trim();
      const email = document.getElementById('edit-staff-email-input')?.value.trim();
      const phone = document.getElementById('edit-staff-phone-input').value.trim();

      if (!name) throw new Error('Staff ka name likhna zaroori hai.');
      if (!email) throw new Error('Staff ka email (Gmail) likhna zaroori hai.');

      const permissions = {
        canChangeTestRate: document.getElementById('edit-perm-test-rate').checked,
        canEditTest: document.getElementById('edit-perm-test-edit').checked,
        canDeleteTest: document.getElementById('edit-perm-test-del').checked,
        canEditDoctor: document.getElementById('edit-perm-doc-edit').checked,
        canDeleteDoctor: document.getElementById('edit-perm-doc-del').checked
      };

      const updateData = { name, email, phone, permissions };
      await window.authManager.updateStaff(id, updateData);
      this.closeModal('modal-edit-staff');
      this.showToast('Staff details aur permissions successfully update ho gayi!', 'success');
      this.renderStaffView();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async deleteStaffAccount(userId) {
    if (confirm('Kya aap is staff account ko hatana chahte hain?')) {
      try {
        await window.authManager.deleteStaff(userId);
        this.showToast('Staff remove ho gaya.', 'success');
        this.renderStaffView();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    }
  }

  openStaffActivationModal(prefillPhone = '') {
    this.closeModal('modal-login');
    const stepSearch = document.getElementById('activation-step-search');
    const stepForm = document.getElementById('activation-step-form');
    if (stepSearch) stepSearch.style.display = 'block';
    if (stepForm) stepForm.style.display = 'none';

    const phoneSearch = document.getElementById('activation-phone-search');
    if (phoneSearch) {
      phoneSearch.value = prefillPhone || '';
    }
    this.showModal('modal-staff-activation');
  }

  async searchStaffForActivation() {
    const phoneInput = document.getElementById('activation-phone-search');
    const phone = phoneInput ? phoneInput.value.trim() : '';

    if (!phone) {
      this.showToast('Kripya apna registered Mobile Number enter karein.', 'warning');
      return;
    }

    try {
      const staff = await window.authManager.getPendingStaffByPhone(phone);
      if (!staff) {
        throw new Error(`Mobile number "${phone}" se koi pending staff account nahi mila. Kripya Admin se add karne ko kahein.`);
      }

      document.getElementById('activation-staff-id').value = staff.id;
      document.getElementById('activation-name-input').value = staff.name || '';
      document.getElementById('activation-phone-input').value = staff.phone || phone;
      document.getElementById('activation-username-input').value = staff.username || '';
      document.getElementById('activation-pin-input').value = '';
      document.getElementById('activation-pin-confirm').value = '';

      document.getElementById('activation-step-search').style.display = 'none';
      document.getElementById('activation-step-form').style.display = 'block';
      this.showToast(`Swagatam ${staff.name}! Ab apna username aur 4-digit PIN banayein.`, 'info');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async submitStaffActivation() {
    try {
      const staffId = document.getElementById('activation-staff-id').value;
      const name = document.getElementById('activation-name-input').value.trim();
      const phone = document.getElementById('activation-phone-input').value.trim();
      const username = document.getElementById('activation-username-input').value.trim();
      const pin = document.getElementById('activation-pin-input').value.trim();
      const pinConfirm = document.getElementById('activation-pin-confirm').value.trim();

      if (!name || !phone || !username || !pin) {
        throw new Error('Kripya sabhi fields bharein.');
      }
      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        throw new Error('PIN theek 4-digit ka numeric number hona chahiye (jaise: 2580).');
      }
      if (pin !== pinConfirm) {
        throw new Error('PIN aur Confirm PIN aapas me match nahi kar rahe hain!');
      }

      const activeUser = await window.authManager.activateStaffAccount({
        staffId,
        name,
        phone,
        username,
        pin
      });

      this.closeModal('modal-staff-activation');
      this.showToast(`Badhai ho ${activeUser.name}! Aapka Staff Account successfully activate ho gaya.`, 'success');
      this.updateLabHeaderUI();
      setTimeout(() => {
        window.location.reload();
      }, 900);
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // --------------------------------------------------------------------------
  // 10. LAB SETTINGS & BACKUP VIEW (settings.html)
  // --------------------------------------------------------------------------
  async renderSettingsView() {
    const lab = window.authManager.currentLab;
    if (!lab) return;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setVal('setting-lab-name', lab.name);
    setVal('setting-lab-tagline', lab.tagline);
    setVal('setting-lab-address', lab.address);
    setVal('setting-lab-phone', lab.phone);
    setVal('setting-lab-email', lab.email);
    setVal('setting-lab-regno', lab.regNo);
    setVal('setting-lab-technologist', lab.technologistName);
    setVal('setting-lab-pathologist', lab.pathologistName);
    setVal('setting-letterhead-margin', lab.letterheadTopMargin || 50);

    await this.renderAutoBackupUI();
    await this.renderFirebaseSettingsUI();
  }

  async renderFirebaseSettingsUI() {
    if (!window.firebaseConfigManager) return;
    const cfg = window.firebaseConfigManager.getConfig();

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setVal('fb-setting-apikey', cfg.apiKey);
    setVal('fb-setting-authdomain', cfg.authDomain);
    setVal('fb-setting-projectid', cfg.projectId);
    setVal('fb-setting-storage', cfg.storageBucket);
    setVal('fb-setting-senderid', cfg.messagingSenderId);
    setVal('fb-setting-appid', cfg.appId);

    const projectDisplay = document.getElementById('fb-display-project-id');
    if (projectDisplay) {
      projectDisplay.innerText = cfg.projectId || 'Default Demo Project';
    }

    if (window.cloudSyncManager) {
      window.cloudSyncManager.updateStatusBadge();
    }
  }

  async saveLabSettings() {
    try {
      const lab = window.authManager.currentLab;
      lab.name = document.getElementById('setting-lab-name').value.trim();
      lab.tagline = document.getElementById('setting-lab-tagline').value.trim();
      lab.address = document.getElementById('setting-lab-address').value.trim();
      lab.phone = document.getElementById('setting-lab-phone').value.trim();
      lab.email = document.getElementById('setting-lab-email').value.trim();
      lab.regNo = document.getElementById('setting-lab-regno').value.trim();
      lab.technologistName = document.getElementById('setting-lab-technologist').value.trim();
      lab.pathologistName = document.getElementById('setting-lab-pathologist').value.trim();
      lab.letterheadTopMargin = parseInt(document.getElementById('setting-letterhead-margin').value) || 50;

      await window.labDB.put('lab_profiles', lab);
      window.authManager.currentLab = lab;
      this.updateLabHeaderUI();
      this.showToast('Lab Profile & Settings save ho gayi!', 'success');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async triggerBackupDownload() {
    try {
      const res = await window.backupManager.downloadBackup();
      this.showToast(`Backup download complete: ${res.filename}`, 'success');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async triggerRestoreBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm('CAUTION: Backup restore karne se purana data replace ho sakta hai. Kya aap aage badhna chahte hain?')) {
      event.target.value = '';
      return;
    }

    try {
      await window.backupManager.restoreBackupFromFile(file);
      this.showToast('Data successfully restore ho gaya! Reload ho raha hai...', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // --------------------------------------------------------------------------
  // LIVE AUTO-BACKUP CONTROLLERS (FILE SYSTEM ACCESS)
  // --------------------------------------------------------------------------
  async renderAutoBackupUI() {
    if (!window.backupManager) return;
    const status = await window.backupManager.getAutoBackupStatus();

    const badge = document.getElementById('auto-backup-status-badge');
    const infoBox = document.getElementById('auto-backup-info-box');
    const folderNameEl = document.getElementById('auto-backup-folder-name');
    const lastTimeEl = document.getElementById('auto-backup-last-time');
    const btnSetup = document.getElementById('btn-setup-auto-backup');
    const btnTest = document.getElementById('btn-test-auto-backup');
    const btnDisable = document.getElementById('btn-disable-auto-backup');

    if (!badge || !infoBox) return;

    if (status.configured && status.enabled) {
      badge.style.background = '#16a34a';
      badge.style.color = '#fff';
      badge.innerText = 'ACTIVE (LIVE SYNC)';

      infoBox.style.display = 'block';
      if (folderNameEl) folderNameEl.innerText = status.folderName || 'Selected Folder';
      if (lastTimeEl) {
        lastTimeEl.innerText = status.lastBackupTime ? new Date(status.lastBackupTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: 'short' }) : 'Never';
      }

      if (btnSetup) btnSetup.innerText = '📁 Change Folder';
      if (btnTest) btnTest.style.display = 'inline-block';
      if (btnDisable) btnDisable.style.display = 'inline-block';
    } else {
      badge.style.background = '#e2e8f0';
      badge.style.color = '#475569';
      badge.innerText = 'OFF / NOT CONFIGURED';

      infoBox.style.display = 'none';
      if (btnSetup) btnSetup.innerText = '📁 Select Dedicated Backup Folder';
      if (btnTest) btnTest.style.display = 'none';
      if (btnDisable) btnDisable.style.display = 'none';
    }
  }

  async setupAutoBackup() {
    try {
      const res = await window.backupManager.setupAutoBackupFolder();
      if (res && res.success) {
        this.showToast(`Auto-backup connected to '${res.folderName}'! File 'Lab_AutoBackup_Data.json' created.`, 'success');
        await this.renderAutoBackupUI();
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async testAutoBackupNow() {
    try {
      await window.backupManager.performAutoBackup(false);
      await this.renderAutoBackupUI();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  async disableAutoBackup() {
    if (!confirm('Kya aap Automatic Backup ko disconnect karna chahte hain?')) return;
    try {
      await window.backupManager.disableAutoBackup();
      this.showToast('Auto-backup disconnect ho gaya.', 'info');
      await this.renderAutoBackupUI();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  // --------------------------------------------------------------------------
  // MULTI-LAB MANAGEMENT
  // --------------------------------------------------------------------------
  async openSwitchLabModal() {
    const labs = await window.labDB.getAll('lab_profiles');
    const container = document.getElementById('switch-lab-list-container');
    const activeId = window.authManager.currentLab?.id;

    if (container) {
      container.innerHTML = labs.map(l => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border:1px solid #e2e8f0; border-radius:6px; margin-bottom:8px; background:${l.id === activeId ? '#e0f2fe' : '#fff'};">
          <div>
            <strong>${l.name}</strong>
            <span style="display:block; font-size:11px; color:#64748b;">${l.address || 'Local PC'}</span>
          </div>
          ${l.id === activeId ? `<span class="badge badge-info">Active</span>` : `
            <button class="btn btn-outline btn-sm" onclick="window.app.switchLabAccount('${l.id}')">Switch</button>
          `}
        </div>
      `).join('');
    }

    this.showModal('modal-switch-lab');
  }

  async switchLabAccount(labId) {
    await window.authManager.switchLab(labId);
    window.location.reload();
  }

  openCreateLabModal() {
    this.closeModal('modal-switch-lab');
    this.showModal('modal-create-lab');
  }

  async createNewLabFromModal() {
    const name = document.getElementById('new-lab-name').value.trim();
    const address = document.getElementById('new-lab-address').value.trim();
    const phone = document.getElementById('new-lab-phone').value.trim();
    const username = document.getElementById('new-admin-user').value.trim();
    const pin = document.getElementById('new-admin-pin').value.trim();

    if (!name || !username || !pin) {
      alert('Lab Name, Username aur Admin PIN zaroor bharein.');
      return;
    }

    await window.authManager.createLabAccount(
      { name, address, phone },
      { name: 'Admin (' + name + ')', username, pin }
    );

    this.closeModal('modal-create-lab');
    this.showToast('Naya Lab Account successfully create ho gaya!', 'success');
    window.location.reload();
  }

  // --------------------------------------------------------------------------
  // MODALS & HELPERS
  // --------------------------------------------------------------------------
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('open');
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  }

  openAdminPinModal() {
    const el = document.getElementById('input-verify-admin-pin');
    if (el) el.value = '';
    this.showModal('modal-verify-admin-pin');
  }

  async verifyAdminPinForDiscount() {
    const pin = document.getElementById('input-verify-admin-pin').value;
    const admin = await window.authManager.verifyAdminPin(pin);

    if (admin) {
      this.adminApprovalTemp = admin;
      this.closeModal('modal-verify-admin-pin');
      this.showToast(`Discount approved by Admin: ${admin.name}`, 'success');
      this.updateDiscountUIState();
    } else {
      this.showToast('Galat Admin PIN! Discount approve nahi hua.', 'error');
    }
  }

  switchLoginTab(tab) {
    const paneCloud = document.getElementById('pane-login-cloud');
    const paneOffline = document.getElementById('pane-login-offline');
    const tabCloud = document.getElementById('tab-login-cloud');
    const tabOffline = document.getElementById('tab-login-offline');

    if (tab === 'cloud') {
      if (paneCloud) paneCloud.style.display = 'block';
      if (paneOffline) paneOffline.style.display = 'none';
      if (tabCloud) {
        tabCloud.style.borderBottomColor = 'var(--primary)';
        tabCloud.style.color = 'var(--primary)';
      }
      if (tabOffline) {
        tabOffline.style.borderBottomColor = 'transparent';
        tabOffline.style.color = '#64748b';
      }
    } else {
      if (paneCloud) paneCloud.style.display = 'none';
      if (paneOffline) paneOffline.style.display = 'block';
      if (tabOffline) {
        tabOffline.style.borderBottomColor = 'var(--primary)';
        tabOffline.style.color = 'var(--primary)';
      }
      if (tabCloud) {
        tabCloud.style.borderBottomColor = 'transparent';
        tabCloud.style.color = '#64748b';
      }
      this.populateLoginUsers();
    }
  }

  openRegisterAdminLabModal() {
    this.closeModal('modal-login');
    this.closeModal('modal-switch-lab');
    this.showModal('modal-register-admin-lab');
  }

  openStaffSignupModal() {
    this.closeModal('modal-login');
    this.showModal('modal-staff-signup');
  }

  async performCloudLogin() {
    const email = document.getElementById('cloud-login-email')?.value.trim();
    const password = document.getElementById('cloud-login-password')?.value;

    if (!email || !password) {
      this.showToast('Email aur Password dono enter karein.', 'warning');
      return;
    }

    try {
      this.showToast('Cloud Firestore se login ho raha hai...', 'info');
      const res = await window.authManager.loginWithEmail(email, password);
      if (res.success) {
        this.closeModal('modal-login');
        this.showToast(`Swagatam, ${res.user.name}! Lab: ${res.lab.name}`, 'success');
        this.updateLabHeaderUI();
        setTimeout(() => window.location.reload(), 800);
      } else {
        this.showToast(res.message, 'error');
      }
    } catch (e) {
      this.showToast('Login error: ' + e.message, 'error');
    }
  }

  async submitRegisterAdminLab() {
    try {
      const labName = document.getElementById('reg-lab-name')?.value.trim();
      const tagline = document.getElementById('reg-lab-tagline')?.value.trim();
      const address = document.getElementById('reg-lab-address')?.value.trim();
      const phone = document.getElementById('reg-lab-phone')?.value.trim();
      const adminName = document.getElementById('reg-admin-name')?.value.trim();
      const adminEmail = document.getElementById('reg-admin-email')?.value.trim();
      const password = document.getElementById('reg-admin-password')?.value;
      const pin = document.getElementById('reg-admin-pin')?.value.trim();

      if (!labName || !adminEmail || !password) {
        throw new Error('Lab Name, Admin Email aur Password bharna zaroori hai.');
      }

      this.showToast('Lab aur Admin account create ho raha hai...', 'info');
      const res = await window.authManager.registerLabAdminWithFirebase({
        labName, tagline, address, phone, email: adminEmail, adminName, adminEmail, password, pin
      });

      this.closeModal('modal-register-admin-lab');
      this.showToast(`Swagatam! Lab "${res.lab.name}" successfully create ho gayi!`, 'success');
      setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      alert(err.message);
      this.showToast(err.message, 'error');
    }
  }

  async submitStaffSignup() {
    try {
      const email = document.getElementById('staff-signup-email')?.value.trim();
      const password = document.getElementById('staff-signup-password')?.value;
      const name = document.getElementById('staff-signup-name')?.value.trim();
      const pin = document.getElementById('staff-signup-pin')?.value.trim();

      if (!email || !password) {
        throw new Error('Staff Email (Gmail) aur Password bharna zaroori hai.');
      }

      this.showToast('Admin verification check ho raha hai...', 'info');
      const res = await window.authManager.registerStaffWithFirebase({
        email, password, name, pin
      });

      this.closeModal('modal-staff-signup');
      this.showToast(`Swagatam, ${res.user.name}! Aap Lab "${res.lab.name}" me successfully jud gaye!`, 'success');
      setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      alert(err.message);
      this.showToast(err.message, 'error');
    }
  }

  // Cloud Sync methods for Settings UI
  async triggerCloudSyncNow() {
    if (!window.cloudSyncManager) return;
    await window.cloudSyncManager.syncToCloud(true);
    await this.renderSettingsView();
  }

  async triggerCloudRestoreNow() {
    if (!window.cloudSyncManager) return;
    if (!confirm('CAUTION: Cloud Firestore se data restore karne par local data replace ho jayega. Kya aap aage badhna chahte hain?')) {
      return;
    }
    try {
      await window.cloudSyncManager.restoreFromCloud();
      this.showToast('Cloud Firestore se data successfully restore ho gaya!', 'success');
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
      this.showToast(e.message, 'error');
    }
  }

  async saveFirebaseSettingsFromUI() {
    try {
      const apiKey = document.getElementById('fb-setting-apikey')?.value.trim();
      const authDomain = document.getElementById('fb-setting-authdomain')?.value.trim();
      const projectId = document.getElementById('fb-setting-projectid')?.value.trim();
      const storageBucket = document.getElementById('fb-setting-storage')?.value.trim();
      const messagingSenderId = document.getElementById('fb-setting-senderid')?.value.trim();
      const appId = document.getElementById('fb-setting-appid')?.value.trim();

      if (!apiKey || !projectId) {
        throw new Error('API Key aur Project ID bharna zaroori hai.');
      }

      window.firebaseConfigManager.saveConfig({
        apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId
      });

      this.showToast('Firebase settings save ho gayi! System reload ho raha hai...', 'success');
      setTimeout(() => window.location.reload(), 900);
    } catch (e) {
      this.showToast(e.message, 'error');
    }
  }

  async testFirebaseConnectionFromUI() {
    try {
      this.showToast('Testing Firebase Firestore connection...', 'info');
      const res = await window.firebaseConfigManager.testConnection();
      if (res.success) {
        this.showToast('✓ ' + res.message, 'success');
      } else {
        this.showToast('✕ ' + res.message, 'error');
      }
    } catch (e) {
      this.showToast('Connection test error: ' + e.message, 'error');
    }
  }

  async populateLoginUsers() {
    const lab = window.authManager.currentLab;
    if (!lab) return;

    const users = await window.labDB.getAll('users', u => u.labId === lab.id && u.active);
    const select = document.getElementById('login-user-select');
    if (!select) return;

    select.innerHTML = users.map(u => {
      const val = u.username || u.phone;
      const statusLabel = u.isActivated ? '' : ' [⏳ Pending Setup - Click Activate Below]';
      return `<option value="${val}">${u.name} (${u.role.toUpperCase()})${statusLabel}</option>`;
    }).join('');
  }

  async performLogin() {
    const select = document.getElementById('login-user-select');
    const identifier = select ? select.value : '';
    const pin = document.getElementById('login-pin-input')?.value || '';

    const res = await window.authManager.login(identifier, pin);
    if (res.success) {
      this.closeModal('modal-login');
      this.showToast(`Swagatam, ${res.user.name}!`, 'success');
      this.updateLabHeaderUI();
      window.location.reload();
    } else {
      if (res.needsActivation) {
        this.showToast(res.message, 'warning');
        this.openStaffActivationModal(res.phone || '');
      } else {
        this.showToast(res.message, 'error');
      }
    }
  }

  logout() {
    window.authManager.logout();
    this.showModal('modal-login');
    this.populateLoginUsers();
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  setupEventListeners() {
    const searchInput = document.getElementById('patient-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.renderPatientsList());
    }

    const filterStatus = document.getElementById('patient-filter-status');
    if (filterStatus) {
      filterStatus.addEventListener('change', () => this.renderPatientsList());
    }

    const docFilter = document.getElementById('doctor-time-filter');
    if (docFilter) {
      docFilter.addEventListener('change', () => this.renderDoctorsView());
    }
  }
}

window.app = new AppController();
