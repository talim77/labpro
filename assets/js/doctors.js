/**
 * Offline Lab Management System - Referral Doctors & Commission Tracker
 * Tracks patient counts, bill amounts, and calculates doctor commissions (%).
 */

class DoctorManager {
  constructor() {}

  async getDoctors(labId) {
    const list = await window.labDB.getAll('doctors', d => d.labId === labId);
    // Sort alphabetically by name
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }

  async saveDoctor(docData) {
    if (!docData.id) {
      docData.id = 'doc_' + Math.random().toString(36).substr(2, 9);
      docData.createdAt = new Date().toISOString();
    }
    // Ensure commissionRate is numeric
    docData.commissionRate = parseFloat(docData.commissionRate) || 0;
    await window.labDB.put('doctors', docData);
    return docData;
  }

  async deleteDoctor(docId) {
    await window.labDB.delete('doctors', docId);
    return true;
  }

  /**
   * Get Referral Commission Summary & Ledger
   * Filters by date range (e.g. 'all', 'today', 'month', or custom start/end date)
   */
  async getCommissionReport(labId, filter = 'all', startDate = null, endDate = null) {
    const doctors = await this.getDoctors(labId);
    // Exclude hidden/voided patients so doctor commissions are reduced accordingly
    const patients = await window.labDB.getAll('patients', p => p.labId === labId && !p.isHidden);

    // Apply date filtering
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const filteredPatients = patients.filter(p => {
      if (!p.date) return true;
      const pDate = p.date.split('T')[0];

      if (filter === 'today') {
        return pDate === todayStr;
      } else if (filter === 'month') {
        return pDate.startsWith(todayStr.substr(0, 7)); // YYYY-MM
      } else if (filter === 'custom' && startDate && endDate) {
        return pDate >= startDate && pDate <= endDate;
      }
      return true;
    });

    // Aggregate by Doctor
    const report = doctors.map(doc => {
      const docPatients = filteredPatients.filter(p => p.doctorId === doc.id);
      const patientCount = docPatients.length;
      
      const totalBilled = docPatients.reduce((sum, p) => sum + (parseFloat(p.finalAmount) || 0), 0);
      const commRate = parseFloat(doc.commissionRate) || 0;
      const totalCommission = (totalBilled * commRate) / 100;

      return {
        doctor: doc,
        patientCount: patientCount,
        totalBilled: totalBilled,
        commissionRate: commRate,
        totalCommission: totalCommission,
        patients: docPatients
      };
    });

    // Also include 'Self / Direct Walk-in' if any
    const selfPatients = filteredPatients.filter(p => !p.doctorId || p.doctorId === 'self');
    if (selfPatients.length > 0) {
      const selfBilled = selfPatients.reduce((sum, p) => sum + (parseFloat(p.finalAmount) || 0), 0);
      report.unshift({
        doctor: { id: 'self', name: 'Self / Direct Walk-in', degree: '-', hospital: '-', commissionRate: 0 },
        patientCount: selfPatients.length,
        totalBilled: selfBilled,
        commissionRate: 0,
        totalCommission: 0,
        patients: selfPatients
      });
    }

    return report;
  }
}

window.doctorManager = new DoctorManager();
