# LabPro — Architecture & Walkthrough

This document outlines the page structure, IndexedDB modules, and clinical reporting workflow of **`talim77/labpro`**.

---

## Repository Structure

```text
labpro/
├── index.html                  # Dashboard overview & lab onboarding modal
├── new-patient.html            # 2-column patient registration, test selection & billing
├── patients-reports.html       # Patient records, payment collection & status filter
├── print-report.html           # Recalibrated A4 printable report & PDF export view
├── referral-doctors.html       # Doctor directory & commission (%) ledger
├── test-catalog.html           # 50+ pre-configured pathology tests & rate editor
├── staff.html                  # Admin & staff user management
├── settings.html               # Lab profile, letterhead margin & JSON backup/restore
├── manifest.json & sw.js       # Offline PWA configuration & service worker
├── assets/
│   ├── css/
│   │   ├── style.css           # Dashboard & responsive form UI styles
│   │   └── print.css           # A4 pagination & letterhead margin print rules
│   ├── js/
│   │   ├── db.js               # IndexedDB wrapper, multi-lab switching & schema
│   │   ├── auth.js             # Lab onboarding, login, role checks & Admin PIN modal
│   │   ├── app.js              # Sidebar navigation & dashboard KPI metrics
│   │   ├── tests-catalog.js    # Default 50 pathology test definitions & ranges
│   │   ├── patient-billing.js  # Registration, billing math & staff discount PIN gate
│   │   ├── report-entry.js     # Test value entry & abnormal flag calculation
│   │   ├── report-print.js     # Full-lab vs blank-letterhead A4 print controller
│   │   ├── doctors.js          # Referral doctor CRUD & date-filtered commissions
│   │   └── backup.js           # Full database JSON export & restore
│   └── vendor/
│       └── html2pdf.bundle.min.js
└── README.md
```

---

## Workflow Walkthrough

1. **Multi-Lab Initialization (`auth.js` + `db.js`):** Each lab gets an isolated store scope; users can switch labs from the top header.
2. **Patient Registration & Billing (`new-patient.html` + `patient-billing.js`):** Selecting tests updates gross total, optional discount (protected by Admin PIN when logged in as Staff), paid amount, and due balance.
3. **Result Entry & A4 Reporting (`patients-reports.html` -> `print-report.html`):** Enter findings against biological reference ranges, preview A4 pagination, toggle **Full Lab Header** vs **Doctor Letterhead Mode**, and print or save as PDF.
4. **Data Portability (`settings.html` + `backup.js`):** Export all labs, patients, tests, and referral records into a portable `.json` file anytime.
