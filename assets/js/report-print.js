/**
 * Offline Lab Management System - Smart Multi-Page A4 Report Print Engine
 * Features:
 * - 3-Way Padding Control: Top (mm), Bottom (mm), Left/Right Side (mm)
 * - Multi-Page Smart Pagination: Prevents mid-test splitting (e.g. CBC, Urine Routine)
 * - Metadata on Every Page: Patient Demographics & Table Column Headers on Page 2+
 * - Dual Mode: Mode 1 (Full Lab Report) & Mode 2 (Without Letterhead / Pre-printed)
 */

class ReportPrintManager {
  constructor() {}

  /**
   * Realistic height calculation in millimeters (mm) for a test block in Chrome
   */
  calculateTestHeightMM(report) {
    const params = report.parametersData || {};
    const paramCount = Object.keys(params).length || 1;
    
    // Calibrated against Chromium rendering engine with 30-50% larger fonts:
    // Category title header = 9.5mm (was 7.5mm)
    // Row height = 8.2mm per parameter (was 6.2mm)
    // Remarks = 11.0mm if present (was 8.0mm)
    // Spacing between tests = 3.0mm (was 2.5mm)
    const categoryHeaderMM = 9.5;
    const rowMM = 8.2;
    const remarksMM = (report.remarks && report.remarks.trim()) ? 11.0 : 0;
    const spacingMM = 3.0;

    return categoryHeaderMM + (paramCount * rowMM) + remarksMM + spacingMM;
  }

  /**
   * Smartly chunk tests into A4 pages based on Top & Bottom padding
   * Ensures NO test is chopped or split across pages!
   */
  paginateTests(reports, mode, padTop = 10, padBottom = 10) {
    if (!reports || reports.length === 0) return [[]];

    const isLetterhead = mode === 'letterhead';

    // Total usable height in mm on an A4 sheet (296mm to prevent Chromium subpixel page-spill)
    const USABLE_PAGE_HEIGHT = 296 - padTop - padBottom;

    // Header heights in mm (including patient demographic box & table thead) with 30-50% larger typography:
    // Mode 1: Lab Header (~42mm) + Patient Box (~28mm) + Dept Banner (~9mm) + Table Head (~9mm) = ~88mm
    // Mode 2: Lab Header hidden. Patient Box (~28mm) + Dept Banner (~9mm) + Table Head (~9mm) = ~46mm
    const PAGE1_HEADER_HEIGHT = isLetterhead ? 46 : 88;
    const PAGE2_HEADER_HEIGHT = 58; // Continuation Banner (~12mm) + Patient Box (~28mm) + Dept Banner (~9mm) + Table Head (~9mm)
    
    const SIGNATURES_FOOTER_HEIGHT = 36; // End note + Signatures + Disclaimer
    const CONTINUED_NOTE_HEIGHT = 10;   // ">>> Report Continued on Page X >>>"

    // First check: Can all tests fit on a single page?
    const totalHeight = reports.reduce((sum, r) => sum + this.calculateTestHeightMM(r), 0);
    const singlePageCapacity = USABLE_PAGE_HEIGHT - PAGE1_HEADER_HEIGHT - SIGNATURES_FOOTER_HEIGHT;

    if (totalHeight <= singlePageCapacity) {
      return [reports]; // Fits on 1 Page!
    }

    // Smart Multi-Page Best-Fit Packing:
    // If a large test (e.g. Urine Routine) does not fit in the remaining space of the current page,
    // look-ahead through remaining tests to find smaller tests (e.g. HbA1c, PPBS) that DO fit,
    // avoiding awkward blank gaps on Page 1 while strictly keeping every test intact.
    const pages = [];
    let remaining = [...reports];
    let isFirstPage = true;

    while (remaining.length > 0) {
      const headerH = isFirstPage ? PAGE1_HEADER_HEIGHT : PAGE2_HEADER_HEIGHT;
      const totalRemainingHeight = remaining.reduce((sum, r) => sum + this.calculateTestHeightMM(r), 0);
      const singleOrLastCapacity = USABLE_PAGE_HEIGHT - headerH - SIGNATURES_FOOTER_HEIGHT;

      // If all remaining tests fit along with doctor/technologist signatures, close document
      if (totalRemainingHeight <= singleOrLastCapacity) {
        pages.push(remaining);
        break;
      }

      // Intermediate page: Needs space for ">>> Report continued on Page X >>>" footer note
      const intermediateCapacity = USABLE_PAGE_HEIGHT - headerH - CONTINUED_NOTE_HEIGHT;
      const pageTests = [];
      let usedHeight = 0;
      const nextRemaining = [];

      for (let i = 0; i < remaining.length; i++) {
        const rep = remaining[i];
        const testH = this.calculateTestHeightMM(rep);

        if (usedHeight + testH <= intermediateCapacity) {
          pageTests.push(rep);
          usedHeight += testH;
        } else if (pageTests.length === 0) {
          // If a single massive test exceeds page capacity, let it occupy this sheet
          pageTests.push(rep);
          usedHeight += testH;
        } else {
          // Defer to next page
          nextRemaining.push(rep);
        }
      }

      pages.push(pageTests);
      remaining = nextRemaining;
      isFirstPage = false;
    }

    return pages.length > 0 ? pages : [[]];
  }

  /**
   * Render HTML for test findings table rows
   */
  renderTestRowsHTML(testsOnThisPage) {
    let rowsHTML = '';
    
    if (!testsOnThisPage || testsOnThisPage.length === 0) {
      return `<tr><td colspan="5" style="text-align:center; padding: 20px; color: #64748b;">No test findings recorded yet.</td></tr>`;
    }

    testsOnThisPage.forEach(report => {
      // Category / Test Name Header Row
      rowsHTML += `
        <tr class="test-category-row">
          <td colspan="5">
            <strong>${report.testName}</strong>
            ${report.category ? `<span style="font-size: 13.5px; font-weight: normal; color: #64748b; margin-left: 8px;">(${report.category})</span>` : ''}
          </td>
        </tr>
      `;

      const params = report.parametersData || {};
      const paramNames = Object.keys(params);

      if (paramNames.length === 0) {
        rowsHTML += `<tr><td colspan="5" style="text-align:center; padding: 6px; font-size: 13.5px;">Awaiting results...</td></tr>`;
      } else {
        paramNames.forEach(pName => {
          const p = params[pName] || {};
          const flagStr = String(p.flag || 'normal').toLowerCase();
          const isAbnormal = flagStr === 'high' || flagStr === 'low';
          const valueClass = isAbnormal ? (flagStr === 'high' ? 'abnormal-high' : 'abnormal-low') : '';
          const displayFlag = flagStr === 'normal' ? 'NORMAL' : flagStr.toUpperCase();
          const rangeDisplay = String(p.range || '-').replace(/\n/g, '<br>');

          rowsHTML += `
            <tr>
              <td class="param-name" style="padding-left: 12px;">${pName}</td>
              <td class="param-value ${valueClass}">${(p.value !== undefined && p.value !== null && p.value !== '') ? p.value : '-'}</td>
              <td class="param-units">${p.unit || '-'}</td>
              <td class="param-range">${rangeDisplay}</td>
              <td class="param-flag ${flagStr}">${displayFlag}</td>
            </tr>
          `;
        });
      }

      // Remarks if any
      if (report.remarks && report.remarks.trim()) {
        rowsHTML += `
          <tr style="background: #fafafa;">
            <td colspan="5" style="padding: 6px 12px; font-size: 13.5px; color: #475569;">
              <em><strong>Remark / Interpretation:</strong> ${report.remarks}</em>
            </td>
          </tr>
        `;
      }
    });

    return rowsHTML;
  }

  /**
   * Main Generator: Generates Multi-Page A4 HTML with live custom paddings
   * @param {string} patientId
   * @param {string} mode 'full' | 'letterhead'
   * @param {number} padTop top padding in mm
   * @param {number} padBottom bottom padding in mm
   * @param {number} padSide left & right padding in mm
   */
  async generateReportHTML(patientId, mode = 'full', padTop = null, padBottom = null, padSide = null) {
    const isLetterhead = mode === 'letterhead';
    if (padTop === null || padTop === undefined || isNaN(padTop)) {
      padTop = isLetterhead ? 45 : 10;
    }
    if (padBottom === null || padBottom === undefined || isNaN(padBottom)) {
      padBottom = isLetterhead ? 20 : 10;
    }
    if (padSide === null || padSide === undefined || isNaN(padSide)) {
      padSide = 12;
    }

    const patient = await window.labDB.get('patients', patientId);
    if (!patient) throw new Error('Patient record nahi mila.');

    const lab = window.authManager.currentLab || {
      name: 'City Diagnostics & Clinical Lab',
      tagline: 'Accurate, Reliable & Computerized Pathology',
      address: 'Main Hospital Road, Medical Enclave',
      phone: '+91 98765 43210',
      email: 'lab@example.com',
      regNo: 'LAB/REG/2026/982',
      technologistName: 'Medical Lab Technologist',
      pathologistName: 'Consultant Pathologist (MD)'
    };

    const reports = await window.labDB.getAll('reports', r => r.patientId === patientId);

    // Format dates & safe fallbacks
    const patientDate = patient.date ? new Date(patient.date).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : new Date().toLocaleDateString('en-IN');
    const printDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const genderText = (patient.gender || 'N/A').toUpperCase();
    const ageText = `${patient.age || '-'} ${patient.ageUnit || 'Years'}`;

    const techName = (reports[0] && reports[0].technologist) || lab.technologistName || 'Medical Lab Technologist';
    const pathName = (reports[0] && reports[0].pathologist) || lab.pathologistName || 'Consultant Pathologist (MD)';

    // Paginate tests according to the active top/bottom padding
    const paginatedTests = this.paginateTests(reports, mode, padTop, padBottom);
    const totalPages = paginatedTests.length;

    let fullHTML = '';

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const isFirstPage = (pageIdx === 0);
      const isLastPage = (pageIdx === totalPages - 1);
      const pageNum = pageIdx + 1;
      const testsForThisSheet = paginatedTests[pageIdx];

      // 1. PAGE HEADER
      let pageHeaderHTML = '';

      if (isFirstPage) {
        // Page 1 Header
        pageHeaderHTML = `
          <div class="report-header" style="${isLetterhead ? 'display:none;' : ''}">
            <div class="report-header-left">
              ${lab.logoBase64 ? `<img src="${lab.logoBase64}" class="report-lab-logo" alt="Lab Logo">` : `
                <div style="width: 60px; height: 60px; background: #0284c7; color: #fff; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 28px; border-radius: 4px;">
                  +
                </div>
              `}
              <div class="report-lab-info">
                <h1>${lab.name}</h1>
                <p class="tagline">${lab.tagline || 'Clinical Pathology & Diagnostic Centre'}</p>
                <p class="contact-line"><strong>Address:</strong> ${lab.address || 'Medical Centre'}</p>
                <p class="contact-line"><strong>Phone:</strong> ${lab.phone || '-'} | <strong>Email:</strong> ${lab.email || '-'}</p>
              </div>
            </div>
            <div class="report-header-right">
              <span class="reg-badge">REG NO: ${lab.regNo || 'N/A'}</span>
              <p style="margin-top: 3px;">ISO 9001:2015 Certified</p>
              <p style="font-size: 13px; color: #64748b;">Computerized Lab Examination</p>
            </div>
          </div>
        `;
      } else {
        // Page 2+ Continuation Header
        pageHeaderHTML = `
          <div class="report-continuation-header" style="border-bottom: 2px solid #0284c7; padding-bottom: 4px; margin-bottom: 8px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong style="color: #0369a1; font-size: 18px; text-transform:uppercase;">${lab.name}</strong>
              <span style="font-size: 13.5px; color: #64748b; margin-left: 8px;">(CONTINUATION REPORT)</span>
            </div>
            <div style="font-size: 13.5px; font-weight: 700; color: #0284c7;">
              PAGE ${pageNum} OF ${totalPages}
            </div>
          </div>
        `;
      }

      // 2. PATIENT DETAILS BAR (ALWAYS PRINTED ON EVERY PAGE!)
      const patientMetaBarHTML = `
        <div class="patient-meta-grid">
          <div class="meta-row">
            <span class="meta-label">Patient Name:</span>
            <span class="meta-val">${patient.name}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">UHID / Lab ID:</span>
            <span class="meta-val">${patient.uhid}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Age / Gender:</span>
            <span class="meta-val">${ageText} / ${genderText}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Bill / Sample No:</span>
            <span class="meta-val">${patient.billNo}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Ref By Doctor:</span>
            <span class="meta-val" style="color: #0369a1;">${patient.doctorName}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Sample Date:</span>
            <span class="meta-val">${patientDate}</span>
          </div>
        </div>
      `;

      // 3. DEPARTMENT BANNER & TABLE
      const tableRowsHTML = this.renderTestRowsHTML(testsForThisSheet);

      // 4. FOOTER (Signatures on Last Page, Continuation note on earlier pages)
      let pageFooterHTML = '';

      if (isLastPage) {
        pageFooterHTML = `
          <div class="report-end-mark">
            *** End of Laboratory Examination Report ***
          </div>

          <div class="report-footer-signatures">
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-name">${techName}</div>
              <div class="signature-role">Medical Lab Technologist</div>
            </div>
            <div class="signature-block" style="text-align: center; color: #94a3b8; font-size: 12.5px;">
              <p>Verified Electronically</p>
              <p>No Physical Signature Needed</p>
            </div>
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-name">${pathName}</div>
              <div class="signature-role">Consultant Pathologist (MD)</div>
            </div>
          </div>

          <div class="report-bottom-disclaimer" style="${isLetterhead ? 'display:none;' : ''}">
            <span>Note: Findings relate strictly to the sample analyzed. Please correlate clinically.</span>
            <span>Page ${pageNum} of ${totalPages}</span>
          </div>
        `;
      } else {
        pageFooterHTML = `
          <div style="border-top: 1px dashed #cbd5e1; padding-top: 6px; margin-top: auto; display: flex; justify-content: space-between; align-items: center; font-size: 13.5px; color: #64748b;">
            <span><em>>>> Report continued on Page ${pageNum + 1} >>></em></span>
            <strong>Page ${pageNum} of ${totalPages}</strong>
          </div>
        `;
      }

      // Inline dynamic padding based on user controls: Top, Bottom, Left/Right
      const paddingStyle = `padding-top: ${padTop}mm !important; padding-bottom: ${padBottom}mm !important; padding-left: ${padSide}mm !important; padding-right: ${padSide}mm !important;`;

      fullHTML += `
        <div class="a4-page-sheet ${isLetterhead ? 'letterhead-mode' : ''}" style="${paddingStyle}">
          
          <div>
            ${pageHeaderHTML}
            ${patientMetaBarHTML}

            <div class="report-title-banner">
              DEPARTMENT OF CLINICAL PATHOLOGY & BIOCHEMISTRY
            </div>

            <table class="results-table">
              <thead>
                <tr>
                  <th style="width: 38%;">Investigation (Test Parameter)</th>
                  <th style="width: 18%;">Observed Value</th>
                  <th style="width: 14%;">Unit</th>
                  <th style="width: 20%;">Biological Ref Interval</th>
                  <th style="width: 10%;">Flag</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHTML}
              </tbody>
            </table>
          </div>

          <div>
            ${pageFooterHTML}
          </div>

        </div>
      `;
    }

    return fullHTML;
  }

  /**
   * Bill / Payment Receipt Print Generator
   */
  async generateBillHTML(patientId) {
    const patient = await window.labDB.get('patients', patientId);
    if (!patient) throw new Error('Patient record nahi mila.');

    const lab = window.authManager.currentLab || { name: 'Pathology Lab', phone: '' };
    const dateStr = new Date(patient.date).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const testsHTML = (patient.testNames || []).map((t, idx) => `
      <tr>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13.5px;">${idx + 1}. ${t}</td>
        <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 13.5px;">-</td>
      </tr>
    `).join('');

    return `
      <div style="background: #fff; width: 155mm; margin: 0 auto; padding: 14mm; border: 1px solid #cbd5e1; font-family: sans-serif; font-size: 14.5px; color: #0f172a; box-sizing: border-box;">
        <div style="text-align: center; border-bottom: 2px dashed #94a3b8; padding-bottom: 10px; margin-bottom: 12px;">
          <h2 style="margin: 0; font-size: 24px; color: #0369a1; text-transform: uppercase; font-weight: 800;">${lab.name}</h2>
          <p style="margin: 3px 0; font-size: 13.5px; color: #64748b;">${lab.address || ''} | Tel: ${lab.phone || ''}</p>
          <h3 style="margin: 8px 0 0; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px;">Payment Receipt / Invoice</h3>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; margin-bottom: 14px; font-size: 13.5px;">
          <div><strong>Bill No:</strong> ${patient.billNo}</div>
          <div><strong>Date:</strong> ${dateStr}</div>
          <div><strong>Patient:</strong> ${patient.name} (${patient.age} ${patient.ageUnit}/${patient.gender[0].toUpperCase()})</div>
          <div><strong>UHID:</strong> ${patient.uhid}</div>
          <div><strong>Ref By:</strong> ${patient.doctorName}</div>
          <div><strong>Phone:</strong> ${patient.phone || '-'}</div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 13.5px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 1.5px solid #94a3b8;">
              <th style="padding: 7px 10px; text-align: left; font-size: 13.5px;">Test Description</th>
              <th style="padding: 7px 10px; text-align: right; font-size: 13.5px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${testsHTML}
          </tbody>
        </table>

        <div style="border-top: 1.5px solid #0f172a; padding-top: 8px; font-size: 14px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Subtotal (Gross):</span>
            <span>₹${(patient.subtotal !== undefined ? patient.subtotal : (patient.finalAmount + (patient.discountAmount || 0))).toFixed(2)}</span>
          </div>
          ${patient.discountAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #16a34a; font-weight: 600;">
              <span>Discount (${patient.discountApprovedBy || 'Approved'}):</span>
              <span>- ₹${patient.discountAmount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-weight: 800; font-size: 17px; border-top: 1px dashed #cbd5e1; padding-top: 6px;">
            <span>Net Payable:</span>
            <span>₹${patient.finalAmount.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #0284c7; font-weight: 700; font-size: 15px;">
            <span>Amount Paid (${patient.paymentMode || 'Cash'}):</span>
            <span>₹${(patient.paidAmount !== undefined ? patient.paidAmount : patient.finalAmount).toFixed(2)}</span>
          </div>
          ${(patient.paymentHistory && patient.paymentHistory.length > 0) ? `
            <div style="margin: 6px 0; padding: 6px 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 12.5px;">
              <strong style="color: #334155;">Payment Transactions:</strong>
              ${patient.paymentHistory.map(ph => `
                <div style="display: flex; justify-content: space-between; color: #64748b; margin-top: 3px;">
                  <span>${new Date(ph.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })} (${ph.mode}${ph.notes ? ' - ' + ph.notes : ''}):</span>
                  <span style="font-weight: 600; color: #0f172a;">₹${parseFloat(ph.amount).toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${(patient.finalAmount - (patient.paidAmount !== undefined ? patient.paidAmount : patient.finalAmount)) > 0.01 ? `
            <div style="display: flex; justify-content: space-between; margin-top: 6px; padding: 6px 8px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; color: #dc2626; font-weight: 800; font-size: 15.5px;">
              <span>BALANCE DUE:</span>
              <span>₹${(patient.finalAmount - (patient.paidAmount !== undefined ? patient.paidAmount : patient.finalAmount)).toFixed(2)}</span>
            </div>
          ` : `
            <div style="text-align: right; color: #16a34a; font-weight: 800; font-size: 14px; margin-top: 6px; padding: 5px 8px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px;">
              ✓ FULL PAYMENT RECEIVED [PAID IN FULL]
            </div>
          `}
        </div>

        <div style="margin-top: 24px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 12.5px; color: #64748b;">
          <div>Operator: ${patient.createdBy}</div>
          <div style="text-align: right; border-top: 1.5px solid #475569; padding-top: 5px; width: 140px; font-weight: 600;">
            Authorized Signature
          </div>
        </div>
      </div>
    `;
  }
}

window.reportPrintManager = new ReportPrintManager();
