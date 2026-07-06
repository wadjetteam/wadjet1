import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { brandHeader, addWatermark, brandFooter, sectionLabel } from './pdfHelpers'
import { newWb, initBrandedSheet, saveXLSX, xlsxCellStyle, xlsxFillByValue } from './excelHelpers'
import { DARK, DARK2, CREAM, GOLD, TEXT_DARK, RED_BG } from './constants'

export function downloadGapAssessmentPDF(clauses, maturityLevel, stats) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = brandHeader(doc, 'Gap Assessment Report', `CBE Official Report · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`)

  y = sectionLabel(doc, 'Maturity Assessment Summary', y)
  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: [
      ['Current Maturity Level', `Level ${maturityLevel}`],
      ['Total Clauses Assessed', stats.totalClauses],
      ['Compliant', stats.compliantCount],
      ['Partial Compliance', stats.partialCount],
      ['Non-Compliant (Gaps)', stats.nonCompliantCount],
      ['Readiness Score', `${stats.readiness}%`],
      ['Critical Blockers', stats.criticalBlockers],
      ['Total Regulatory Exposure', `EGP ${(stats.totalPenalty || 0).toLocaleString()}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: DARK, textColor: GOLD, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8.5, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: CREAM },
    columnStyles: { 0: { fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
  })

  y = doc.lastAutoTable.finalY + 8
  y = sectionLabel(doc, 'Clause-Level Assessment Detail', y)
  autoTable(doc, {
    startY: y,
    head: [['Clause ID', 'Requirement Name', 'Law / Framework', 'Status', 'Justification / Root Cause', 'Potential Penalty (EGP)']],
    body: clauses.map(c => [c.id, c.name, c.law || '', c.state || 'pending', c.justification || '—', c.penalty || '—']),
    theme: 'striped',
    headStyles: { fillColor: DARK2, textColor: GOLD, fontSize: 7.5, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7.5, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: CREAM },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const v = data.cell.raw
        if (v === 'compliant')     { data.cell.styles.textColor = [20, 100, 50]; data.cell.styles.fontStyle = 'bold' }
        else if (v === 'partial')  { data.cell.styles.textColor = [150, 100, 0]; data.cell.styles.fontStyle = 'bold' }
        else if (v === 'non-compliant') { data.cell.styles.fillColor = RED_BG; data.cell.styles.textColor = [180, 20, 40]; data.cell.styles.fontStyle = 'bold' }
      }
    },
    margin: { left: 14, right: 14 },
  })

  addWatermark(doc)
  brandFooter(doc)
  doc.save('Wadjet-GRC-Gap-Assessment-CBE-Report.pdf')
}

export async function downloadGapAssessmentXLSX(clauses, maturityLevel, stats) {
  const wb = newWb()

  const { ws: ws1 } = initBrandedSheet(wb, {
    sheetName: 'Summary',
    title: 'Gap Assessment — Maturity Summary',
    subtitle: `CBE Official Report · Maturity Level ${maturityLevel}`,
    columns: [{ header: 'Metric', width: 36 }, { header: 'Value', width: 22 }, { header: 'Notes', width: 50 }],
    orientation: 'portrait',
  })
  const summaryData = [
    ['Current Maturity Level', `Level ${maturityLevel}`, 'CMMI 1–5 scale'],
    ['Total Clauses Assessed', stats.totalClauses, ''],
    ['Compliant', stats.compliantCount, 'Full controls in place'],
    ['Partial Compliance', stats.partialCount, 'Controls partially implemented'],
    ['Non-Compliant (Gaps)', stats.nonCompliantCount, 'Immediate remediation required'],
    ['Readiness Score', `${stats.readiness}%`, 'Overall compliance readiness'],
    ['Critical Blockers', stats.criticalBlockers, 'Blocks maturity progression'],
    ['Total Regulatory Exposure', `EGP ${(stats.totalPenalty || 0).toLocaleString()}`, 'Sum of non-compliant penalties'],
  ]
  summaryData.forEach(([metric, value, notes]) => {
    const fill = String(value).includes('Non-Compliant') || metric === 'Total Regulatory Exposure' ? 'FFFFEAEA'
      : metric === 'Compliant' ? 'FFECFFF4' : 'FFFAF7EE'
    const row = ws1.addRow([metric, value, notes])
    row.height = 18
    row.eachCell(cell => Object.assign(cell, xlsxCellStyle(fill)))
    ws1.getCell(row.number, 1).font = { name: 'Calibri', size: 9, bold: true }
  })

  const { ws: ws2 } = initBrandedSheet(wb, {
    sheetName: 'Clause Assessment',
    title: 'Gap Assessment — Clause-Level Detail',
    subtitle: 'Law 151/2020 PDPL · CBE Cybersecurity Framework · ISO 27001 · Law 175/2018',
    columns: [
      { header: 'Clause ID',                width: 18 },
      { header: 'Requirement Name',          width: 40 },
      { header: 'Law / Framework',           width: 34 },
      { header: 'Assessment Status',         width: 18 },
      { header: 'Root Cause / Justification',width: 50 },
      { header: 'Potential Penalty (EGP)',   width: 28 },
    ],
  })
  clauses.forEach(c => {
    const row = ws2.addRow([c.id, c.name, c.law || '', c.state || 'pending', c.justification || '—', c.penalty || '—'])
    row.height = 18
    const fill = xlsxFillByValue(c.state)
    row.eachCell(cell => Object.assign(cell, xlsxCellStyle(fill)))
    ws2.getCell(row.number, 4).font = { name: 'Calibri', size: 9, bold: true, color: { argb: fill === 'FFFFEAEA' ? 'FFB01428' : fill === 'FFFFF3D4' ? 'FFA05000' : 'FF147832' } }
  })

  await saveXLSX(wb, 'Wadjet-GRC-Gap-Assessment-CBE-Report.xlsx')
}
