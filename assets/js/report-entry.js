/**
 * Offline Lab Management System - Test Result Entry
 * Handles entry of parameter findings with live high/low/normal indicators.
 */

class ReportEntryManager {
  constructor() {}

  async getReportsForPatient(patientId) {
    return await window.labDB.getAll('reports', r => r.patientId === patientId);
  }

  async getReportById(reportId) {
    return await window.labDB.get('reports', reportId);
  }

  /**
   * Save Entered Results for a Report
   */
  async saveReportResults(reportId, paramValues, remarks, technologist, pathologist) {
    const report = await window.labDB.get('reports', reportId);
    if (!report) throw new Error('Report record nahi mila.');

    const patient = await window.labDB.get('patients', report.patientId);
    const testDef = await window.labDB.get('test_catalog', report.testId);

    // Update each parameter with value & auto-flag
    const updatedParams = {};
    let allFilled = true;

    if (testDef && testDef.parameters) {
      testDef.parameters.forEach(p => {
        const val = paramValues[p.name] !== undefined ? paramValues[p.name] : '';
        if (val === '') allFilled = false;

        const flag = window.testCatalogManager.evaluateParamValue(
          p,
          val,
          patient ? patient.gender : 'male',
          patient ? parseInt(patient.age) : 30
        );

        updatedParams[p.name] = {
          value: val,
          unit: p.unit || '',
          range: p.rangeStr || '',
          flag: flag
        };
      });
    } else {
      // In case parameters weren't mapped
      for (const [key, val] of Object.entries(paramValues)) {
        updatedParams[key] = {
          value: val,
          unit: '',
          range: '',
          flag: 'normal'
        };
      }
    }

    report.parametersData = updatedParams;
    report.remarks = remarks || '';
    report.technologist = technologist || '';
    report.pathologist = pathologist || '';
    report.status = allFilled ? 'completed' : 'in-progress';
    report.reportedDate = new Date().toISOString();

    await window.labDB.put('reports', report);

    // Check if all reports for this patient are completed
    const allPatientReports = await this.getReportsForPatient(report.patientId);
    const hasPending = allPatientReports.some(r => r.id !== report.id && r.status !== 'completed');
    if (!hasPending && allFilled) {
      patient.status = 'completed';
      await window.labDB.put('patients', patient);
    }

    return report;
  }
}

window.reportEntryManager = new ReportEntryManager();
