# 🔬 Local Pathology Lab Management System

🌐 **Live WebApp on GitHub Pages**: [https://talim77.github.io/labpro/](https://talim77.github.io/labpro/)

A modern, fast, and completely offline-capable Pathology Lab Management Application designed to run on any browser without complex software installations.

---

## 🚀 Kaise Start Karein? (How to Run)
1. Is poore folder ko apne PC me kisi bhi drive ya Desktop par rakhein.
2. Bas **`index.html`** file par double-click karein (Google Chrome, Microsoft Edge, Brave, ya Firefox kisi me bhi).
3. First-time open karne par **"Create Your Local Lab Account"** screen aayegi:
   - Apni Lab ka naam, address, mobile number likhein.
   - Admin Username aur ek Security PIN (jaise `1234`) set karein.
   - **"Save & Start Lab App"** par click karein.
4. Bas, aapka poora Lab Management System chalu ho gaya!

---

## ✨ Features & Guide (Hinglish)

### 1. 👨‍⚕️ Referral Doctors & Commission Tracker (%)
- **Doctor Add Karein**: `Referral Doctors (%)` menu me jayein aur `+ Add Referral Doctor` par click karein.
- Doctor ka naam, clinic/hospital, aur unka **Commission Rate (%)** (jaise 10%, 15%, 20%) set karein.
- **Auto-tracking**: Jab bhi aap kisi patient ko register karenge aur us doctor ko select karenge:
  - Doctor ke total referred patients count automatically badh jayenge.
  - Doctor ka total blood test billing amount calculate hoga.
  - Doctor ka commission (`Bill Amount x Rate %`) automatic calculate hokar ledger me show hoga.
  - Aap **"Today"**, **"This Month"**, ya **"All Time"** filter se hisaab dekh sakte hain.

### 2. 🖨️ Blood Test Report PDF / Print (2 Different Modes)
Jab patient ke blood test findings save ho jayein, toh **"Print Report"** par click karein. Yahan 2 modes milenge:
- **Mode 1: Full Lab Report (📄)**:
  - Isme Lab ka pura Header (Lab Name, Logo, Address, Phone, Reg No), Patient Demographics, Test Table with Normal Ranges, Technologist & Pathologist signatures, aur Lab Footer sab print hota hai.
- **Mode 2: Blank / Doctor Letterhead Mode (📑)**:
  - Kuchh doctors apna pre-printed letterhead pad use karte hain.
  - Is mode me Lab ka Header aur Footer **poori tarah gayab** ho jata hai.
  - Upar doctor ke letterhead ke liye blank space chhoot jati hai (aap margin slider se mm me space kam/zyada bhi kar sakte hain).
  - Kagaz par sirf **Patient Information**, **Test Findings Table**, aur **Signature Line** print hota hai.
- Dono modes me `Ctrl + P` ya **"Print / Save as PDF"** click karke aap A4 paper par print nikal sakte hain ya PDF save kar sakte hain.

### 3. 👥 Admin vs Staff Roles & Discount Approval
- **Admin**:
  - Staff members add/remove kar sakta hai.
  - Doctor referral commission % change kar sakta hai.
  - Test rates edit kar sakta hai.
  - Direct discount de sakta hai.
- **Staff**:
  - Patient register kar sakta hai, test result feed kar sakta hai, report print kar sakta hai, payment collect kar sakta hai.
  - **Discount Restriction**: Agar staff discount enter karega, toh system turant **"Admin PIN Required"** maangega. Jab tak Admin apna PIN verify nahi karega, discount apply nahi hoga.

### 4. 🧪 Pre-Configured Pathology Test Catalog
Aapki Lab me roz aane wale test pehle se standard parameters aur biological reference ranges ke saath pre-configured hain:
- **CBC (Complete Blood Count / Hemogram)** - Hb, TLC, Neutrophils, Lymphocytes, Monocytes, Eosinophils, Platelets, RBC, MCV, MCH, MCHC, PCV.
- **Blood Sugar** - Fasting (FBS), Post Prandial (PPBS), Random (RBS).
- **HbA1c** - Glycated Hemoglobin & Average Glucose.
- **Lipid Profile** - Total Cholesterol, Triglycerides, HDL, LDL, VLDL.
- **Liver Function Test (LFT)** - Bilirubin (Total/Direct/Indirect), SGOT, SGPT, ALP, Total Protein, Albumin, Globulin, A/G Ratio.
- **Kidney Function Test (KFT/RFT)** - Urea, Creatinine, Uric Acid, BUN.
- **Thyroid Profile** - T3, T4, TSH.
- **Widal Test** - Slide Agglutination (Typhoid).
- **Urine Routine & Microscopy** - Albumin, Sugar, Pus cells, RBCs, Epithelial cells, etc.
- **Dengue Serology** - NS1, IgM, IgG.
- *Test catalog me jakar aap kisi bhi test ka lab rate 1 click me change kar sakte hain.*

### 5. 🏢 Multi-Lab Support (Ek hi PC par alag-alag Labs)
- Agar aapke paas 2 labs ya branches hain, toh top bar par **"🏢 Switch Lab Account"** button se aap naya Lab account add karke switch kar sakte hain.

### 6. 💾 100% Offline Storage & 1-Click Backup
- Sara data aapke PC ke browser ke secure **IndexedDB** me save hota hai.
- Roz sham ko ya hafte me ek baar **"💾 Download Backup"** button dabayein. Ek choti `.json` backup file aapke Downloads folder me aa jayegi.
- Agar PC badalna ho ya format karna ho, toh `Settings & Backup` me jakar **"Select & Restore Backup File"** se wahi file select karein — sara data wapas aa jayega!

---

## 🔒 Privacy & Security
- Koi data internet par nahi jata.
- Koi third-party tracking ya cloud storage nahi hai.
- Aapka aur aapke patients ka data 100% aapke local computer par secure hai.
