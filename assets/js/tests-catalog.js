/**
 * Offline Lab Management System - Pathology Test Catalog
 * Pre-configured standard tests with normal biological reference ranges for Indian & Global labs.
 * EXACTLY 50 Standard & Routine Pathology Tests Presets.
 */

const DEFAULT_PATHOLOGY_TESTS = [
  // 1. Hematology & Coagulation (Tests 1 to 8)
  {
    code: 'CBC01',
    name: 'Complete Blood Count (CBC / Hemogram)',
    category: 'Hematology',
    price: 350,
    parameters: [
      { name: 'Hemoglobin (Hb)', unit: 'g/dL', maleMin: 13.0, maleMax: 17.0, femaleMin: 12.0, femaleMax: 15.0, rangeStr: 'Male: 13.0-17.0 | Female: 12.0-15.0 g/dL' },
      { name: 'Total Leukocyte Count (TLC)', unit: '/cumm', min: 4000, max: 11000, rangeStr: '4,000 - 11,000 /cumm' },
      { name: 'Neutrophils', unit: '%', min: 40, max: 75, rangeStr: '40 - 75 %' },
      { name: 'Lymphocytes', unit: '%', min: 20, max: 45, rangeStr: '20 - 45 %' },
      { name: 'Eosinophils', unit: '%', min: 1, max: 6, rangeStr: '01 - 06 %' },
      { name: 'Monocytes', unit: '%', min: 2, max: 10, rangeStr: '02 - 10 %' },
      { name: 'Basophils', unit: '%', min: 0, max: 1, rangeStr: '00 - 01 %' },
      { name: 'Platelet Count', unit: 'Lakh/cumm', min: 1.5, max: 4.5, rangeStr: '1.5 - 4.5 Lakhs /cumm' },
      { name: 'Total RBC Count', unit: 'mill/cumm', maleMin: 4.5, maleMax: 5.5, femaleMin: 3.8, femaleMax: 4.8, rangeStr: 'Male: 4.5-5.5 | Female: 3.8-4.8 mill/cumm' },
      { name: 'Packed Cell Volume (PCV)', unit: '%', maleMin: 40, maleMax: 50, femaleMin: 36, femaleMax: 46, rangeStr: 'Male: 40-50 | Female: 36-46 %' },
      { name: 'MCV', unit: 'fL', min: 80, max: 100, rangeStr: '80 - 100 fL' },
      { name: 'MCH', unit: 'pg', min: 27, max: 32, rangeStr: '27 - 32 pg' },
      { name: 'MCHC', unit: 'g/dL', min: 32, max: 36, rangeStr: '32 - 36 g/dL' }
    ]
  },
  {
    code: 'ESR01',
    name: 'Erythrocyte Sedimentation Rate (ESR)',
    category: 'Hematology',
    price: 100,
    parameters: [
      { name: 'ESR (Westergren Method)', unit: 'mm/1st hr', maleMin: 0, maleMax: 15, femaleMin: 0, femaleMax: 20, rangeStr: 'Male: 0-15 | Female: 0-20 mm/1st hr' }
    ]
  },
  {
    code: 'BLD01',
    name: 'Blood Grouping & Rh Typing (ABO & Rh)',
    category: 'Hematology',
    price: 120,
    parameters: [
      { name: 'ABO Blood Group', unit: '', rangeStr: 'A / B / AB / O' },
      { name: 'Rh Factor (D Antigen)', unit: '', rangeStr: 'Positive / Negative' }
    ]
  },
  {
    code: 'PT01',
    name: 'Prothrombin Time with INR (PT / INR)',
    category: 'Hematology / Coagulation',
    price: 300,
    parameters: [
      { name: 'Prothrombin Time (Patient)', unit: 'sec', min: 11.0, max: 14.5, rangeStr: '11.0 - 14.5 sec' },
      { name: 'Control Time', unit: 'sec', rangeStr: '12.0 sec' },
      { name: 'INR (International Normalized Ratio)', unit: '', min: 0.8, max: 1.2, rangeStr: '0.8 - 1.2 (Therapeutic: 2.0 - 3.0)' }
    ]
  },
  {
    code: 'BTCT01',
    name: 'Bleeding Time & Clotting Time (BT & CT)',
    category: 'Hematology / Coagulation',
    price: 150,
    parameters: [
      { name: 'Bleeding Time (Duke)', unit: 'mins', min: 1, max: 5, rangeStr: '1 - 5 mins' },
      { name: 'Clotting Time (Capillary)', unit: 'mins', min: 3, max: 8, rangeStr: '3 - 8 mins' }
    ]
  },
  {
    code: 'RET01',
    name: 'Reticulocyte Count',
    category: 'Hematology',
    price: 200,
    parameters: [
      { name: 'Reticulocyte Percentage', unit: '%', min: 0.5, max: 2.5, rangeStr: '0.5 - 2.5 %' }
    ]
  },
  {
    code: 'PBS01',
    name: 'Peripheral Blood Smear Examination (PBS / MP)',
    category: 'Hematology',
    price: 180,
    parameters: [
      { name: 'RBC Morphology', unit: '', rangeStr: 'Normocytic Normochromic' },
      { name: 'WBC Morphology', unit: '', rangeStr: 'Normal in number and morphology' },
      { name: 'Platelets on Smear', unit: '', rangeStr: 'Adequate on smear' },
      { name: 'Malarial Parasite', unit: '', rangeStr: 'Not Seen' }
    ]
  },
  {
    code: 'PLT01',
    name: 'Platelet Count (Direct / Automated)',
    category: 'Hematology',
    price: 150,
    parameters: [
      { name: 'Platelet Count', unit: 'Lakh/cumm', min: 1.5, max: 4.5, rangeStr: '1.50 - 4.50 Lakhs/cumm' }
    ]
  },

  // 2. Diabetes & Glucose Metabolism (Tests 9 to 12)
  {
    code: 'GLU01',
    name: 'Blood Glucose (Fasting - FBS)',
    category: 'Biochemistry / Diabetes',
    price: 80,
    parameters: [
      { name: 'Blood Glucose Fasting', unit: 'mg/dL', min: 70, max: 100, rangeStr: '70 - 100 mg/dL (Normal)\n100 - 125 mg/dL (Impaired / Pre-diabetes)' }
    ]
  },
  {
    code: 'GLU02',
    name: 'Blood Glucose (Post Prandial - PPBS)',
    category: 'Biochemistry / Diabetes',
    price: 80,
    parameters: [
      { name: 'Blood Glucose Post Prandial', unit: 'mg/dL', min: 70, max: 140, rangeStr: '< 140 mg/dL (Normal)\n140 - 199 mg/dL (Impaired)' }
    ]
  },
  {
    code: 'GLU03',
    name: 'Blood Glucose (Random - RBS)',
    category: 'Biochemistry / Diabetes',
    price: 80,
    parameters: [
      { name: 'Blood Glucose Random', unit: 'mg/dL', min: 70, max: 140, rangeStr: '70 - 140 mg/dL' }
    ]
  },
  {
    code: 'HBA1C',
    name: 'HbA1c (Glycated Hemoglobin)',
    category: 'Biochemistry / Diabetes',
    price: 450,
    parameters: [
      { name: 'HbA1c', unit: '%', min: 4.0, max: 5.6, rangeStr: '< 5.7 % (Normal)\n5.7 - 6.4 % (Prediabetes)\n>= 6.5 % (Diabetic)' },
      { name: 'Estimated Average Glucose (eAG)', unit: 'mg/dL', min: 70, max: 126, rangeStr: '70 - 126 mg/dL' }
    ]
  },

  // 3. Kidney Function & Renal Profile (Tests 13 to 18)
  {
    code: 'KFT01',
    name: 'Kidney Function Test (KFT / RFT Profile)',
    category: 'Biochemistry / Renal',
    price: 550,
    parameters: [
      { name: 'Blood Urea', unit: 'mg/dL', min: 15, max: 40, rangeStr: '15 - 40 mg/dL' },
      { name: 'Serum Creatinine', unit: 'mg/dL', maleMin: 0.7, maleMax: 1.3, femaleMin: 0.6, femaleMax: 1.1, rangeStr: 'Male: 0.7-1.3 | Female: 0.6-1.1 mg/dL' },
      { name: 'Serum Uric Acid', unit: 'mg/dL', maleMin: 3.5, maleMax: 7.2, femaleMin: 2.6, femaleMax: 6.0, rangeStr: 'Male: 3.5-7.2 | Female: 2.6-6.0 mg/dL' },
      { name: 'Blood Urea Nitrogen (BUN)', unit: 'mg/dL', min: 7, max: 20, rangeStr: '7 - 20 mg/dL' }
    ]
  },
  {
    code: 'CRE01',
    name: 'Serum Creatinine',
    category: 'Biochemistry / Renal',
    price: 150,
    parameters: [
      { name: 'Serum Creatinine', unit: 'mg/dL', maleMin: 0.7, maleMax: 1.3, femaleMin: 0.6, femaleMax: 1.1, rangeStr: 'Male: 0.7-1.3 | Female: 0.6-1.1 mg/dL' }
    ]
  },
  {
    code: 'UREA01',
    name: 'Blood Urea & BUN',
    category: 'Biochemistry / Renal',
    price: 150,
    parameters: [
      { name: 'Blood Urea', unit: 'mg/dL', min: 15, max: 40, rangeStr: '15 - 40 mg/dL' },
      { name: 'Blood Urea Nitrogen (BUN)', unit: 'mg/dL', min: 7, max: 20, rangeStr: '7 - 20 mg/dL' }
    ]
  },
  {
    code: 'URIC01',
    name: 'Serum Uric Acid',
    category: 'Biochemistry / Renal',
    price: 180,
    parameters: [
      { name: 'Serum Uric Acid', unit: 'mg/dL', maleMin: 3.5, maleMax: 7.2, femaleMin: 2.6, femaleMax: 6.0, rangeStr: 'Male: 3.5-7.2 | Female: 2.6-6.0 mg/dL' }
    ]
  },
  {
    code: 'ELEC01',
    name: 'Serum Electrolytes (Na, K, Cl)',
    category: 'Biochemistry / Electrolytes',
    price: 450,
    parameters: [
      { name: 'Serum Sodium (Na+)', unit: 'mmol/L', min: 135, max: 145, rangeStr: '135 - 145 mmol/L' },
      { name: 'Serum Potassium (K+)', unit: 'mmol/L', min: 3.5, max: 5.1, rangeStr: '3.5 - 5.1 mmol/L' },
      { name: 'Serum Chloride (Cl-)', unit: 'mmol/L', min: 96, max: 106, rangeStr: '96 - 106 mmol/L' }
    ]
  },
  {
    code: 'CAL01',
    name: 'Serum Calcium & Phosphorus',
    category: 'Biochemistry',
    price: 300,
    parameters: [
      { name: 'Serum Calcium (Total)', unit: 'mg/dL', min: 8.5, max: 10.5, rangeStr: '8.5 - 10.5 mg/dL' },
      { name: 'Serum Inorganic Phosphorus', unit: 'mg/dL', min: 2.5, max: 4.5, rangeStr: '2.5 - 4.5 mg/dL' }
    ]
  },

  // 4. Liver Function & Hepatic Enzymes (Tests 19 to 23)
  {
    code: 'LFT01',
    name: 'Liver Function Test (LFT Profile)',
    category: 'Biochemistry / Hepatic',
    price: 650,
    parameters: [
      { name: 'Bilirubin Total', unit: 'mg/dL', min: 0.2, max: 1.2, rangeStr: '0.2 - 1.2 mg/dL' },
      { name: 'Bilirubin Direct (Conjugated)', unit: 'mg/dL', min: 0.0, max: 0.3, rangeStr: '0.0 - 0.3 mg/dL' },
      { name: 'Bilirubin Indirect (Unconjugated)', unit: 'mg/dL', min: 0.2, max: 0.9, rangeStr: '0.2 - 0.9 mg/dL' },
      { name: 'SGOT / AST', unit: 'U/L', min: 5, max: 40, rangeStr: '5 - 40 U/L' },
      { name: 'SGPT / ALT', unit: 'U/L', min: 5, max: 45, rangeStr: '5 - 45 U/L' },
      { name: 'Alkaline Phosphatase (ALP)', unit: 'U/L', min: 30, max: 120, rangeStr: '30 - 120 U/L' },
      { name: 'Total Protein', unit: 'g/dL', min: 6.0, max: 8.3, rangeStr: '6.0 - 8.3 g/dL' },
      { name: 'Serum Albumin', unit: 'g/dL', min: 3.5, max: 5.0, rangeStr: '3.5 - 5.0 g/dL' },
      { name: 'Serum Globulin', unit: 'g/dL', min: 2.0, max: 3.5, rangeStr: '2.0 - 3.5 g/dL' },
      { name: 'A/G Ratio', unit: '', min: 1.2, max: 2.2, rangeStr: '1.2 - 2.2' }
    ]
  },
  {
    code: 'BIL01',
    name: 'Serum Bilirubin (Total, Direct & Indirect)',
    category: 'Biochemistry / Hepatic',
    price: 200,
    parameters: [
      { name: 'Bilirubin Total', unit: 'mg/dL', min: 0.2, max: 1.2, rangeStr: '0.2 - 1.2 mg/dL' },
      { name: 'Bilirubin Direct', unit: 'mg/dL', min: 0.0, max: 0.3, rangeStr: '0.0 - 0.3 mg/dL' },
      { name: 'Bilirubin Indirect', unit: 'mg/dL', min: 0.2, max: 0.9, rangeStr: '0.2 - 0.9 mg/dL' }
    ]
  },
  {
    code: 'SGPT01',
    name: 'SGPT / ALT (Alanine Aminotransferase)',
    category: 'Biochemistry / Hepatic',
    price: 150,
    parameters: [
      { name: 'SGPT / ALT', unit: 'U/L', min: 5, max: 45, rangeStr: '5 - 45 U/L' }
    ]
  },
  {
    code: 'SGOT01',
    name: 'SGOT / AST (Aspartate Aminotransferase)',
    category: 'Biochemistry / Hepatic',
    price: 150,
    parameters: [
      { name: 'SGOT / AST', unit: 'U/L', min: 5, max: 40, rangeStr: '5 - 40 U/L' }
    ]
  },
  {
    code: 'ALP01',
    name: 'Alkaline Phosphatase (ALP)',
    category: 'Biochemistry / Hepatic',
    price: 180,
    parameters: [
      { name: 'Alkaline Phosphatase (ALP)', unit: 'U/L', min: 30, max: 120, rangeStr: '30 - 120 U/L' }
    ]
  },

  // 5. Lipid & Cardiovascular Markers (Tests 24 to 27)
  {
    code: 'LIP01',
    name: 'Lipid Profile (Complete Heart & Cholesterol)',
    category: 'Biochemistry / Cardiac',
    price: 600,
    parameters: [
      { name: 'Serum Cholesterol (Total)', unit: 'mg/dL', min: 125, max: 200, rangeStr: '< 200 mg/dL Desirable' },
      { name: 'Serum Triglycerides', unit: 'mg/dL', min: 50, max: 150, rangeStr: '< 150 mg/dL Normal' },
      { name: 'HDL Cholesterol', unit: 'mg/dL', maleMin: 40, maleMax: 60, femaleMin: 50, femaleMax: 70, rangeStr: '> 40 mg/dL (Male) | > 50 mg/dL (Female)' },
      { name: 'LDL Cholesterol', unit: 'mg/dL', min: 0, max: 100, rangeStr: '< 100 mg/dL Optimal' },
      { name: 'VLDL Cholesterol', unit: 'mg/dL', min: 5, max: 30, rangeStr: '5 - 30 mg/dL' },
      { name: 'Total / HDL Ratio', unit: '', min: 3.0, max: 5.0, rangeStr: '3.0 - 5.0' }
    ]
  },
  {
    code: 'CHOL01',
    name: 'Serum Cholesterol (Total)',
    category: 'Biochemistry / Cardiac',
    price: 150,
    parameters: [
      { name: 'Total Cholesterol', unit: 'mg/dL', min: 125, max: 200, rangeStr: '< 200 mg/dL Desirable' }
    ]
  },
  {
    code: 'TRIG01',
    name: 'Serum Triglycerides',
    category: 'Biochemistry / Cardiac',
    price: 180,
    parameters: [
      { name: 'Serum Triglycerides', unit: 'mg/dL', min: 50, max: 150, rangeStr: '< 150 mg/dL Normal' }
    ]
  },
  {
    code: 'TROP01',
    name: 'Troponin-I (Cardiac Biomarker Rapid)',
    category: 'Serology / Cardiac',
    price: 750,
    parameters: [
      { name: 'Troponin-I (Quantitative)', unit: 'ng/mL', min: 0.0, max: 0.04, rangeStr: '< 0.04 ng/mL (Negative)' }
    ]
  },

  // 6. Thyroid & Endocrinology (Tests 28 to 31)
  {
    code: 'THY01',
    name: 'Thyroid Profile (Total T3, Total T4, TSH)',
    category: 'Endocrinology / Thyroid',
    price: 450,
    parameters: [
      { name: 'Total Triiodothyronine (T3)', unit: 'ng/mL', min: 0.8, max: 2.0, rangeStr: '0.80 - 2.00 ng/mL' },
      { name: 'Total Thyroxine (T4)', unit: 'ug/dL', min: 5.1, max: 14.1, rangeStr: '5.10 - 14.10 ug/dL' },
      { name: 'TSH (Ultrasensitive)', unit: 'uIU/mL', min: 0.4, max: 4.5, rangeStr: '0.40 - 4.50 uIU/mL' }
    ]
  },
  {
    code: 'THY02',
    name: 'Free Thyroid Profile (FT3, FT4, TSH)',
    category: 'Endocrinology / Thyroid',
    price: 650,
    parameters: [
      { name: 'Free Triiodothyronine (FT3)', unit: 'pg/mL', min: 2.0, max: 4.4, rangeStr: '2.00 - 4.40 pg/mL' },
      { name: 'Free Thyroxine (FT4)', unit: 'ng/dL', min: 0.93, max: 1.70, rangeStr: '0.93 - 1.70 ng/dL' },
      { name: 'TSH (Ultrasensitive)', unit: 'uIU/mL', min: 0.4, max: 4.5, rangeStr: '0.40 - 4.50 uIU/mL' }
    ]
  },
  {
    code: 'TSH01',
    name: 'TSH (Thyroid Stimulating Hormone)',
    category: 'Endocrinology / Thyroid',
    price: 200,
    parameters: [
      { name: 'TSH (Ultrasensitive)', unit: 'uIU/mL', min: 0.4, max: 4.5, rangeStr: '0.40 - 4.50 uIU/mL' }
    ]
  },
  {
    code: 'PRL01',
    name: 'Serum Prolactin',
    category: 'Endocrinology',
    price: 400,
    parameters: [
      { name: 'Serum Prolactin', unit: 'ng/mL', maleMin: 2.1, maleMax: 17.7, femaleMin: 2.8, femaleMax: 29.2, rangeStr: 'Male: 2.1-17.7 | Female: 2.8-29.2 ng/mL' }
    ]
  },

  // 7. Vitamins & Nutritional Anemia Markers (Tests 32 to 35)
  {
    code: 'VITD01',
    name: '25-OH Vitamin D (Total D2 + D3)',
    category: 'Biochemistry / Vitamins',
    price: 900,
    parameters: [
      { name: '25-OH Vitamin D Total', unit: 'ng/mL', min: 30, max: 100, rangeStr: '< 20 (Deficient) | 20-30 (Insufficient) | 30-100 ng/mL (Sufficient)' }
    ]
  },
  {
    code: 'B1201',
    name: 'Vitamin B12 (Cyanocobalamin)',
    category: 'Biochemistry / Vitamins',
    price: 750,
    parameters: [
      { name: 'Vitamin B12', unit: 'pg/mL', min: 211, max: 911, rangeStr: '211 - 911 pg/mL' }
    ]
  },
  {
    code: 'IRON01',
    name: 'Iron Studies / Iron Profile',
    category: 'Biochemistry / Anemia',
    price: 700,
    parameters: [
      { name: 'Serum Iron', unit: 'ug/dL', maleMin: 65, maleMax: 175, femaleMin: 50, femaleMax: 170, rangeStr: 'Male: 65-175 | Female: 50-170 ug/dL' },
      { name: 'Total Iron Binding Capacity (TIBC)', unit: 'ug/dL', min: 250, max: 450, rangeStr: '250 - 450 ug/dL' },
      { name: 'Transferrin Saturation', unit: '%', min: 20, max: 50, rangeStr: '20 - 50 %' }
    ]
  },
  {
    code: 'FERR01',
    name: 'Serum Ferritin',
    category: 'Biochemistry / Anemia',
    price: 500,
    parameters: [
      { name: 'Serum Ferritin', unit: 'ng/mL', maleMin: 20, maleMax: 300, femaleMin: 10, femaleMax: 200, rangeStr: 'Male: 20-300 | Female: 10-200 ng/mL' }
    ]
  },

  // 8. Serology, Immunology & Autoimmune (Tests 36 to 40)
  {
    code: 'CRP01',
    name: 'C-Reactive Protein (CRP Quantitative)',
    category: 'Serology / Immunology',
    price: 350,
    parameters: [
      { name: 'C-Reactive Protein (CRP)', unit: 'mg/L', min: 0.0, max: 6.0, rangeStr: '< 6.0 mg/L (Normal / Negative)' }
    ]
  },
  {
    code: 'RA01',
    name: 'Rheumatoid Arthritis Factor (RA / RF)',
    category: 'Serology / Immunology',
    price: 350,
    parameters: [
      { name: 'RA Factor (Quantitative)', unit: 'IU/mL', min: 0.0, max: 14.0, rangeStr: '< 14.0 IU/mL (Negative)' }
    ]
  },
  {
    code: 'ASO01',
    name: 'Anti-Streptolysin O Titre (ASO Titre)',
    category: 'Serology / Immunology',
    price: 350,
    parameters: [
      { name: 'ASO Titre (Turbidimetry)', unit: 'IU/mL', min: 0, max: 200, rangeStr: '< 200 IU/mL (Normal / Negative)' }
    ]
  },
  {
    code: 'WID01',
    name: 'Widal Slide Agglutination (Typhoid Fever)',
    category: 'Serology',
    price: 200,
    parameters: [
      { name: 'S. Typhi "O"', unit: 'Titre', rangeStr: 'Negative (< 1:80)' },
      { name: 'S. Typhi "H"', unit: 'Titre', rangeStr: 'Negative (< 1:80)' },
      { name: 'S. Paratyphi "AH"', unit: 'Titre', rangeStr: 'Negative (< 1:80)' },
      { name: 'S. Paratyphi "BH"', unit: 'Titre', rangeStr: 'Negative (< 1:80)' },
      { name: 'Impression', unit: '', rangeStr: 'No significant diagnostic titre' }
    ]
  },
  {
    code: 'TYPH01',
    name: 'Typhidot Rapid Test (IgM & IgG Antibodies)',
    category: 'Serology',
    price: 350,
    parameters: [
      { name: 'Typhidot IgM Antibody', unit: '', rangeStr: 'Negative' },
      { name: 'Typhidot IgG Antibody', unit: '', rangeStr: 'Negative' }
    ]
  },

  // 9. Tropical Fevers & Infectious Diseases (Tests 41 to 43)
  {
    code: 'DEN01',
    name: 'Dengue Combo (NS1 Ag + IgM + IgG Ab)',
    category: 'Serology',
    price: 800,
    parameters: [
      { name: 'Dengue NS1 Antigen', unit: '', rangeStr: 'Negative' },
      { name: 'Dengue IgM Antibody', unit: '', rangeStr: 'Negative' },
      { name: 'Dengue IgG Antibody', unit: '', rangeStr: 'Negative' }
    ]
  },
  {
    code: 'MAL01',
    name: 'Malaria Antigen Rapid Card (Pan / Pv / Pf)',
    category: 'Serology / Parasitology',
    price: 250,
    parameters: [
      { name: 'P. falciparum (Pf) Antigen', unit: '', rangeStr: 'Negative' },
      { name: 'P. vivax / Pan (Pv) Antigen', unit: '', rangeStr: 'Negative' },
      { name: 'Malarial Parasite Smear (MP)', unit: '', rangeStr: 'Negative' }
    ]
  },
  {
    code: 'CHIK01',
    name: 'Chikungunya IgM Antibody (Rapid)',
    category: 'Serology',
    price: 500,
    parameters: [
      { name: 'Chikungunya IgM Antibody', unit: '', rangeStr: 'Negative / Non-Reactive' }
    ]
  },

  // 10. Viral Hepatitis & STD Screening (Tests 44 to 47)
  {
    code: 'HBS01',
    name: 'HBsAg (Hepatitis B Surface Antigen Rapid)',
    category: 'Serology / Virology',
    price: 250,
    parameters: [
      { name: 'HBsAg (Surface Antigen)', unit: '', rangeStr: 'Non-Reactive / Negative' }
    ]
  },
  {
    code: 'HCV01',
    name: 'Anti-HCV (Hepatitis C Antibody Screening)',
    category: 'Serology / Virology',
    price: 350,
    parameters: [
      { name: 'HCV Total Antibodies', unit: '', rangeStr: 'Non-Reactive / Negative' }
    ]
  },
  {
    code: 'HIV01',
    name: 'HIV 1 & 2 Antibody Screening (Tridot Rapid)',
    category: 'Serology / Virology',
    price: 350,
    parameters: [
      { name: 'HIV-1 Antibody', unit: '', rangeStr: 'Non-Reactive' },
      { name: 'HIV-2 Antibody', unit: '', rangeStr: 'Non-Reactive' },
      { name: 'Final Result', unit: '', rangeStr: 'Non-Reactive / Negative' }
    ]
  },
  {
    code: 'VDRL01',
    name: 'VDRL / RPR (Syphilis Screening)',
    category: 'Serology',
    price: 150,
    parameters: [
      { name: 'VDRL / RPR Titre', unit: '', rangeStr: 'Non-Reactive' }
    ]
  },

  // 11. Clinical Pathology (Urine, Pregnancy, Stool) (Tests 48 to 50)
  {
    code: 'URI01',
    name: 'Urine Routine & Microscopic Examination',
    category: 'Clinical Pathology',
    price: 150,
    parameters: [
      { name: 'Color', unit: '', rangeStr: 'Pale Yellow' },
      { name: 'Appearance / Transparency', unit: '', rangeStr: 'Clear' },
      { name: 'Reaction / pH', unit: '', rangeStr: '5.0 - 7.5 (Acidic to Neutral)' },
      { name: 'Specific Gravity', unit: '', rangeStr: '1.010 - 1.025' },
      { name: 'Chemical - Albumin / Protein', unit: '', rangeStr: 'Nil / Negative' },
      { name: 'Chemical - Sugar', unit: '', rangeStr: 'Nil / Negative' },
      { name: 'Chemical - Ketone Bodies', unit: '', rangeStr: 'Nil / Negative' },
      { name: 'Chemical - Bile Salts & Pigments', unit: '', rangeStr: 'Negative' },
      { name: 'Microscopic - Pus Cells', unit: '/HPF', min: 0, max: 5, rangeStr: '0 - 5 / HPF' },
      { name: 'Microscopic - RBCs', unit: '/HPF', min: 0, max: 2, rangeStr: 'Nil / 0-2 / HPF' },
      { name: 'Microscopic - Epithelial Cells', unit: '/HPF', rangeStr: 'Few (1-3) / HPF' },
      { name: 'Microscopic - Casts / Crystals', unit: '', rangeStr: 'Not Seen' }
    ]
  },
  {
    code: 'UPT01',
    name: 'Urine Pregnancy Test (UPT Card - hCG)',
    category: 'Clinical Pathology',
    price: 100,
    parameters: [
      { name: 'hCG (Human Chorionic Gonadotropin)', unit: '', rangeStr: 'Negative (Single Band) / Positive (Double Band)' }
    ]
  },
  {
    code: 'STL01',
    name: 'Stool Routine & Microscopic Examination',
    category: 'Clinical Pathology',
    price: 150,
    parameters: [
      { name: 'Color', unit: '', rangeStr: 'Brownish / Yellowish' },
      { name: 'Consistency', unit: '', rangeStr: 'Formed / Semi-formed' },
      { name: 'Mucus', unit: '', rangeStr: 'Absent' },
      { name: 'Occult Blood', unit: '', rangeStr: 'Negative' },
      { name: 'Microscopic - Ova / Cysts', unit: '', rangeStr: 'Not Seen / Nil' },
      { name: 'Microscopic - Pus Cells', unit: '/HPF', min: 0, max: 4, rangeStr: '0 - 4 / HPF' },
      { name: 'Microscopic - RBCs', unit: '/HPF', rangeStr: 'Nil / Not Seen' }
    ]
  }
];

class TestCatalogManager {
  constructor() {
    this.tests = [];
  }

  async ensureDefaultTests(labId) {
    let existing = await window.labDB.getAll('test_catalog', (t) => t.labId === labId);
    
    // If empty, seed all exact 50 tests
    if (!existing || existing.length === 0) {
      const seeded = [];
      for (const def of DEFAULT_PATHOLOGY_TESTS) {
        const item = {
          id: 'test_' + Math.random().toString(36).substr(2, 9),
          labId: labId,
          code: def.code,
          name: def.name,
          category: def.category,
          price: def.price,
          parameters: def.parameters,
          createdAt: new Date().toISOString()
        };
        await window.labDB.add('test_catalog', item);
        seeded.push(item);
      }
      this.tests = seeded;
      return seeded;
    }

    // If existing lab has fewer than 50 tests, add any missing preset tests
    if (existing.length < DEFAULT_PATHOLOGY_TESTS.length) {
      for (const def of DEFAULT_PATHOLOGY_TESTS) {
        const exists = existing.some(e => e.code === def.code || e.name.toLowerCase() === def.name.toLowerCase());
        if (!exists) {
          const item = {
            id: 'test_' + Math.random().toString(36).substr(2, 9),
            labId: labId,
            code: def.code,
            name: def.name,
            category: def.category,
            price: def.price,
            parameters: def.parameters,
            createdAt: new Date().toISOString()
          };
          await window.labDB.add('test_catalog', item);
          existing.push(item);
        }
      }
    }

    this.tests = existing;
    return existing;
  }

  // Complete reset & restore to exact 50 standard tests
  async resetToDefault50Tests(labId) {
    const existing = await window.labDB.getAll('test_catalog', (t) => t.labId === labId);
    for (const t of existing) {
      await window.labDB.delete('test_catalog', t.id);
    }

    const seeded = [];
    for (const def of DEFAULT_PATHOLOGY_TESTS) {
      const item = {
        id: 'test_' + Math.random().toString(36).substr(2, 9),
        labId: labId,
        code: def.code,
        name: def.name,
        category: def.category,
        price: def.price,
        parameters: def.parameters,
        createdAt: new Date().toISOString()
      };
      await window.labDB.add('test_catalog', item);
      seeded.push(item);
    }
    this.tests = seeded;
    return seeded;
  }

  async getTests(labId) {
    return await window.labDB.getAll('test_catalog', (t) => t.labId === labId);
  }

  async saveTest(testData) {
    if (!testData.id) {
      testData.id = 'test_' + Math.random().toString(36).substr(2, 9);
      testData.createdAt = new Date().toISOString();
    }
    await window.labDB.put('test_catalog', testData);
    return testData;
  }

  async deleteTest(testId) {
    await window.labDB.delete('test_catalog', testId);
    return true;
  }

  /**
   * Helper to evaluate whether a result value is Normal, High, or Low
   */
  evaluateParamValue(param, valStr, gender = 'male', age = 30) {
    const val = parseFloat(valStr);
    if (isNaN(val)) return 'normal'; // Qualitative value (like 'Negative', 'Pale Yellow')

    let min = param.min;
    let max = param.max;

    if (gender && gender.toLowerCase() === 'female') {
      if (param.femaleMin !== undefined) min = param.femaleMin;
      if (param.femaleMax !== undefined) max = param.femaleMax;
    } else {
      if (param.maleMin !== undefined) min = param.maleMin;
      if (param.maleMax !== undefined) max = param.maleMax;
    }

    if (min !== undefined && val < min) return 'low';
    if (max !== undefined && val > max) return 'high';
    return 'normal';
  }
}

window.testCatalogManager = new TestCatalogManager();
