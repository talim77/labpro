/**
 * Offline Lab Management System - Patient Registration & Billing
 * Handles test selection, doctor linking, and strict Admin PIN approval for discounts.
 */

class BillingManager {
  constructor() {}

  async generateNextIds(labId) {
    const patients = await window.labDB.getAll('patients', p => p.labId === labId);
    const count = patients.length + 1;
    const year = new Date().getFullYear();
    const padCount = String(count).padStart(4, '0');
    
    return {
      uhid: `PT-${year}-${padCount}`,
      billNo: `BL-${year}-${padCount}`
    };
  }

  /**
   * Save Patient and Create Associated Test Report Records
   */
  async registerPatient(formData, labId, currentUser) {
    // Basic validations
    if (!formData.name || !formData.age || !formData.gender) {
      throw new Error('Patient ka Naam, Umra aur Gender bharna anivarya hai.');
    }
    if (!formData.testIds || formData.testIds.length === 0) {
      throw new Error('Kam se kam ek blood test select karna zaroori hai.');
    }

    const discount = parseFloat(formData.discountAmount) || 0;

    // Check discount permission
    let discountApproved = false;
    let discountApprovedBy = null;

    if (discount > 0) {
      if (currentUser.role === 'admin') {
        discountApproved = true;
        discountApprovedBy = currentUser.name + ' (Admin)';
      } else {
        // Must be already verified by admin PIN
        if (!formData.adminVerified) {
          throw new Error('Staff bina Admin approval ke discount nahi de sakta. Kripya Admin PIN verify karein.');
        }
        discountApproved = true;
        discountApprovedBy = formData.adminApprovedByName || 'Admin Override';
      }
    }

    const { uhid, billNo } = await this.generateNextIds(labId);

    const patientId = 'pat_' + Math.random().toString(36).substr(2, 9);
    const patientRecord = {
      id: patientId,
      labId: labId,
      uhid: uhid,
      billNo: billNo,
      name: formData.name.trim(),
      age: formData.age,
      ageUnit: formData.ageUnit || 'Years',
      gender: formData.gender,
      phone: formData.phone || '',
      address: formData.address || '',
      doctorId: formData.doctorId || 'self',
      doctorName: formData.doctorName || 'Self / Walk-in',
      doctorCommissionRate: parseFloat(formData.doctorCommissionRate) || 0,
      testIds: formData.testIds,
      testNames: formData.testNames || [],
      subtotal: parseFloat(formData.subtotal) || 0,
      discountAmount: discount,
      discountApproved: discountApproved,
      discountApprovedBy: discountApprovedBy,
      finalAmount: parseFloat(formData.finalAmount) || 0,
      paidAmount: parseFloat(formData.paidAmount) || 0,
      paymentMode: formData.paymentMode || 'Cash',
      status: 'pending', // report status
      createdBy: currentUser.name,
      createdRole: currentUser.role,
      date: formData.date || new Date().toISOString()
    };

    // Save Patient
    await window.labDB.add('patients', patientRecord);

    // Create Initial Report Entry for each selected test
    const allTests = await window.testCatalogManager.getTests(labId);
    for (const testId of formData.testIds) {
      const testDef = allTests.find(t => t.id === testId);
      if (!testDef) continue;

      const reportId = 'rep_' + Math.random().toString(36).substr(2, 9);
      const initialParams = {};
      
      // Setup empty param values
      if (testDef.parameters) {
        testDef.parameters.forEach(p => {
          initialParams[p.name] = {
            value: '',
            unit: p.unit || '',
            range: p.rangeStr || '',
            flag: 'normal'
          };
        });
      }

      const reportRecord = {
        id: reportId,
        labId: labId,
        patientId: patientId,
        billNo: billNo,
        testId: testId,
        testName: testDef.name,
        category: testDef.category,
        parametersData: initialParams,
        remarks: '',
        status: 'pending', // pending result entry
        technologist: '',
        pathologist: '',
        date: patientRecord.date
      };

      await window.labDB.add('reports', reportRecord);
    }

    return patientRecord;
  }

  async getRecentPatients(labId, limit = 50) {
    const list = await window.labDB.getAll('patients', p => p.labId === labId && !p.isHidden);
    // Sort latest first
    list.sort((a, b) => new Date(b.date) - new Date(a.date));
    return limit ? list.slice(0, limit) : list;
  }

  async getPatientById(patientId) {
    return await window.labDB.get('patients', patientId);
  }

  async updatePayment(patientId, paidAmount, paymentMode) {
    const pat = await window.labDB.get('patients', patientId);
    if (!pat) throw new Error('Patient nahi mila.');

    pat.paidAmount = parseFloat(paidAmount) || 0;
    pat.paymentMode = paymentMode;
    await window.labDB.put('patients', pat);
    return pat;
  }
}

window.billingManager = new BillingManager();
