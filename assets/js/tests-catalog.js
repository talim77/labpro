/**
 * Offline Lab Management System - Pathology Test Catalog
 * Pre-configured standard tests with normal biological reference ranges for Indian & Global labs.
 */

const DEFAULT_PATHOLOGY_TESTS = [
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
    code: 'GLU01',
    name: 'Blood Glucose (Fasting - FBS)',
    category: 'Biochemistry',
    price: 80,
    parameters: [
      { name: 'Blood Glucose Fasting', unit: 'mg/dL', min: 70, max: 100, rangeStr: '70 - 100 mg/dL (Normal)\n100 - 125 mg/dL (Impaired)' }
    ]
  },
  {
    code: 'GLU02',
    name: 'Blood Glucose (Post Prandial - PPBS)',
    category: 'Biochemistry',
    price: 80,
    parameters: [
      { name: 'Blood Glucose PP', unit: 'mg/dL', min: 70, max: 140, rangeStr: 'Up to 140 mg/dL' }
    ]
  },
  {
    code: 'GLU03',
    name: 'Blood Glucose (Random - RBS)',
    category: 'Biochemistry',
    price: 80,
    parameters: [
      { name: 'Blood Glucose Random', unit: 'mg/dL', min: 70, max: 140, rangeStr: '70 - 140 mg/dL' }
    ]
  },
  {
    code: 'HBA1C',
    name: 'HbA1c (Glycated Hemoglobin)',
    category: 'Biochemistry',
    price: 450,
    parameters: [
      { name: 'HbA1c', unit: '%', min: 4.0, max: 5.6, rangeStr: '< 5.7 % (Normal)\n5.7 - 6.4 % (Prediabetes)\n>= 6.5 % (Diabetic)' },
      { name: 'Estimated Average Glucose (eAG)', unit: 'mg/dL', min: 70, max: 126, rangeStr: '70 - 126 mg/dL' }
    ]
  },
  {
    code: 'LIP01',
    name: 'Lipid Profile',
    category: 'Biochemistry',
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
    code: 'LFT01',
    name: 'Liver Function Test (LFT)',
    category: 'Biochemistry',
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
    code: 'KFT01',
    name: 'Kidney Function Test (KFT / RFT)',
    category: 'Biochemistry',
    price: 550,
    parameters: [
      { name: 'Blood Urea', unit: 'mg/dL', min: 15, max: 40, rangeStr: '15 - 40 mg/dL' },
      { name: 'Serum Creatinine', unit: 'mg/dL', maleMin: 0.7, maleMax: 1.3, femaleMin: 0.6, femaleMax: 1.1, rangeStr: 'Male: 0.7-1.3 | Female: 0.6-1.1 mg/dL' },
      { name: 'Serum Uric Acid', unit: 'mg/dL', maleMin: 3.5, maleMax: 7.2, femaleMin: 2.6, femaleMax: 6.0, rangeStr: 'Male: 3.5-7.2 | Female: 2.6-6.0 mg/dL' },
      { name: 'Blood Urea Nitrogen (BUN)', unit: 'mg/dL', min: 7, max: 20, rangeStr: '7 - 20 mg/dL' }
    ]
  },
  {
    code: 'THY01',
    name: 'Thyroid Profile (Total T3, T4, TSH)',
    category: 'Serology / Endocrinology',
    price: 450,
    parameters: [
      { name: 'Total Triiodothyronine (T3)', unit: 'ng/mL', min: 0.8, max: 2.0, rangeStr: '0.8 - 2.0 ng/mL' },
      { name: 'Total Thyroxine (T4)', unit: 'ug/dL', min: 5.1, max: 14.1, rangeStr: '5.1 - 14.1 ug/dL' },
      { name: 'TSH (Ultrasensitive)', unit: 'uIU/mL', min: 0.4, max: 4.5, rangeStr: '0.40 - 4.50 uIU/mL' }
    ]
  },
  {
    code: 'WID01',
    name: 'Widal Slide Agglutination (Typhoid)',
    category: 'Serology',
    price: 200,
    parameters: [
      { name: 'S. Typhi "O" (Somat)', unit: 'Titre', rangeStr: 'Negative (< 1:80)' },
      { name: 'S. Typhi "H" (Flagell)', unit: 'Titre', rangeStr: 'Negative (< 1:80)' },
      { name: 'S. Paratyphi "AH"', unit: 'Titre', rangeStr: 'Negative (< 1:80)' },
      { name: 'S. Paratyphi "BH"', unit: 'Titre', rangeStr: 'Negative (< 1:80)' },
      { name: 'Impression', unit: '', rangeStr: 'No significant titre' }
    ]
  },
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
      { name: 'Microscopic - Pus Cells', unit: '/HPF', rangeStr: '0 - 5 / HPF' },
      { name: 'Microscopic - RBCs', unit: '/HPF', rangeStr: 'Nil / 0-2 / HPF' },
      { name: 'Microscopic - Epithelial Cells', unit: '/HPF', rangeStr: 'Few (1-3) / HPF' },
      { name: 'Microscopic - Casts / Crystals', unit: '', rangeStr: 'Not Seen' }
    ]
  },
  {
    code: 'DEN01',
    name: 'Dengue Serology (NS1 + IgM + IgG)',
    category: 'Serology',
    price: 800,
    parameters: [
      { name: 'Dengue NS1 Antigen', unit: '', rangeStr: 'Negative' },
      { name: 'Dengue IgM Antibody', unit: '', rangeStr: 'Negative' },
      { name: 'Dengue IgG Antibody', unit: '', rangeStr: 'Negative' }
    ]
  }
];

class TestCatalogManager {
  constructor() {
    this.tests = [];
  }

  async ensureDefaultTests(labId) {
    const existing = await window.labDB.getAll('test_catalog', (t) => t.labId === labId);
    if (existing && existing.length > 0) {
      this.tests = existing;
      return existing;
    }

    // Seed default tests for this lab
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
