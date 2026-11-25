# LabPro — Local Pathology Lab Management System (100% Offline)

**Live Web App / PWA:** [https://talim77.github.io/labpro/](https://talim77.github.io/labpro/)  
**Portfolio Hub:** [https://talim77.github.io/portfolio/](https://talim77.github.io/portfolio/)

A fast, zero-backend, 100% offline-capable Pathology Lab Management System (LIS) built with vanilla HTML5, CSS3, JavaScript, and browser **IndexedDB**. Runs directly from GitHub Pages or by opening `index.html` locally without Node.js, Python, or a database server.

---

## Key Features

- **Zero-Backend Offline Storage (IndexedDB):** Patient demographics, billing, test results, staff profiles, and referral ledgers stay securely inside the local browser (`assets/js/db.js`).
- **Pre-Configured Catalog of 50 Routine Pathology Tests:** Includes CBC, Blood Sugar (FBS/PPBS/RBS), HbA1c, Lipid Profile, LFT, KFT/RFT, Thyroid Profile, Widal, Urine Routine, Dengue Serology, and editable lab rates (`test-catalog.html`).
- **Referral Doctors & Auto Commission Ledger (`referral-doctors.html`):** Automatically increments referred patient count, total billed revenue, and doctor commission (`Bill x Rate %`) with Today / This Month / All Time filters.
- **Dual A4 Printable / PDF Reports (`print-report.html`):**
  - **Full Lab Report Mode:** Prints complete lab header, patient info, test table with reference ranges, signatures, and footer.
  - **Blank / Doctor Letterhead Mode:** Hides lab header/footer and reserves adjustable top margin (in mm) for pre-printed doctor pads.
- **Admin vs Staff Roles & PIN-Protected Discounts (`staff.html`, `assets/js/auth.js`):** Staff cannot apply bill discounts without live Admin PIN approval.
- **Multi-Lab Accounts & 1-Click JSON Backup (`settings.html`, `assets/js/backup.js`):** Switch between multiple labs on one PC and export/restore complete `.json` backups.

---

## How to Run

1. Open the live app at **[talim77.github.io/labpro](https://talim77.github.io/labpro/)** (or double-click `index.html` / run `run-lab.bat` locally).
2. Complete the **Create Your Local Lab Account** onboarding screen (Lab Name, Address, Phone, Admin Username, and Security PIN) or restore an existing `.json` backup.

See [WALKTHROUGH.md](WALKTHROUGH.md) for the complete module & page architecture.
