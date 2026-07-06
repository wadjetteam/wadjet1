import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { brandHeader, addWatermark, brandFooter, sectionLabel } from './pdfHelpers'
import { downloadCSV } from './csvExport'
import { newWb, initBrandedSheet, saveXLSX, xlsxCellStyle, xlsxFillByValue } from './excelHelpers'
import { DARK, DARK2, CREAM, GOLD, TEXT_DARK } from './constants'

export function downloadExaminationPDF(findings, examinations) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  let y = brandHeader(doc, 'Examination Findings Tracker', 'MRA/MRIA Management · CBE & External Audit Findings')

  y = sectionLabel(doc, 'Examinations', y)
  autoTable(doc, {
    startY: y,
    head: [['Exam ID', 'Title', 'Examiner', 'Type', 'Status', 'Findings']],
    body: examinations.map(e => [e.id, e.title, e.examiner, e.type, e.status, e.findings]),
    theme: 'grid',
    headStyles: { fillColor: DARK, textColor: GOLD, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7.5, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: CREAM },
    margin: { left: 14, right: 14 },
  })

  y = doc.lastAutoTable.finalY + 8
  y = sectionLabel(doc, 'Findings Register', y)
  autoTable(doc, {
    startY: y,
    head: [['Finding ID', 'Title', 'Category', 'Type', 'Severity', 'Status', 'Owner', 'Due Date', 'Progress %']],
    body: findings.map(f => [f.id, f.title, f.category, f.type, f.severity.toUpperCase(), f.status, f.owner, f.dueDate, `${f.progressPct}%`]),
    theme: 'striped',
    headStyles: { fillColor: DARK2, textColor: GOLD, fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fontSize: 6.5, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: CREAM },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const v = data.cell.raw
        if (v === 'CRITICAL') { data.cell.styles.textColor = [180, 20, 40]; data.cell.styles.fontStyle = 'bold' }
        else if (v === 'HIGH') data.cell.styles.textColor = [180, 100, 0]
        else if (v === 'MEDIUM') data.cell.styles.textColor = [150, 120, 0]
      }
    },
  })

  addWatermark(doc)
  brandFooter(doc)
  doc.save('Wadjet-GRC-Examination-Findings-Tracker.pdf')
}

export function downloadExaminationCSV(findings) {
  downloadCSV('Wadjet-GRC-Examination-Findings',
    ['ID', 'Exam ID', 'Title', 'Category', 'Type', 'Severity', 'Status', 'Owner', 'Due Date', 'Aging (Days)', 'Progress %'],
    findings.map(f => [f.id, f.examId, f.title, f.category, f.type, f.severity, f.status, f.owner, f.dueDate, f.agingDays, f.progressPct])
  )
}

export async function downloadExaminationXLSX(findings, examinations) {
  const wb = newWb()

  const { ws: ws1 } = initBrandedSheet(wb, {
    sheetName: 'Examinations',
    title: 'Examination Tracker — Active Examinations',
    subtitle: 'CBE & External Audit Examination Register',
    columns: [
      { header: 'Exam ID',     width: 14 },
      { header: 'Title',       width: 40 },
      { header: 'Examiner',    width: 24 },
      { header: 'Type',        width: 18 },
      { header: 'Status',      width: 18 },
      { header: 'Findings',    width: 12 },
    ],
  })
  examinations.forEach(e => {
    const row = ws1.addRow([e.id, e.title, e.examiner, e.type, e.status, e.findings])
    row.height = 18
    row.eachCell(cell => Object.assign(cell, xlsxCellStyle(xlsxFillByValue(e.status))))
  })

  const { ws: ws2 } = initBrandedSheet(wb, {
    sheetName: 'Findings Register',
    title: 'Examination Tracker — Findings Register',
    subtitle: 'MRA/MRIA Management · Remediation Tracking',
    columns: [
      { header: 'Finding ID',   width: 14 },
      { header: 'Exam ID',      width: 12 },
      { header: 'Title',        width: 42 },
      { header: 'Category',     width: 22 },
      { header: 'Type',         width: 14 },
      { header: 'Severity',     width: 14 },
      { header: 'Status',       width: 18 },
      { header: 'Owner',        width: 22 },
      { header: 'Due Date',     width: 14 },
      { header: 'Aging (Days)', width: 14 },
      { header: 'Progress %',   width: 12 },
    ],
  })
  findings.forEach(f => {
    const row = ws2.addRow([f.id, f.examId, f.title, f.category, f.type, f.severity.toUpperCase(), f.status, f.owner, f.dueDate, f.agingDays, `${f.progressPct}%`])
    row.height = 18
    row.eachCell(cell => Object.assign(cell, xlsxCellStyle(xlsxFillByValue(f.severity))))
  })

  await saveXLSX(wb, 'Wadjet-GRC-Examination-Findings-Tracker.xlsx')
}
