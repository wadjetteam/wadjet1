import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { brandHeader, addWatermark, brandFooter, sectionLabel } from './pdfHelpers'
import { downloadCSV } from './csvExport'
import { newWb, initBrandedSheet, saveXLSX, xlsxCellStyle, xlsxFillByValue } from './excelHelpers'
import { DARK, DARK2, CREAM, GOLD, TEXT_DARK } from './constants'

export function downloadAMLPDF(fatfRecommendations, kycExceptions) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = brandHeader(doc, 'AML / Financial Crime Report', 'FATF Compliance & KYC Exception Status · Q2 2026')

  y = sectionLabel(doc, 'FATF Recommendations Status', y)
  autoTable(doc, {
    startY: y,
    head: [['FATF Ref', 'Title', 'Category', 'Risk', 'Controls Tested', 'Gaps', 'Status']],
    body: fatfRecommendations.map(r => [r.id, r.title, r.category, r.risk.toUpperCase(), `${r.tested}/${r.controls}`, r.gaps, r.status.replace('-', ' ')]),
    theme: 'striped',
    headStyles: { fillColor: DARK, textColor: GOLD, fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: CREAM },
    margin: { left: 14, right: 14 },
  })

  y = doc.lastAutoTable.finalY + 8
  y = sectionLabel(doc, 'KYC Exceptions Register', y)
  autoTable(doc, {
    startY: y,
    head: [['Exception ID', 'Customer / Entity', 'Risk', 'Issue', 'Owner', 'Due Date', 'Status']],
    body: kycExceptions.map(e => [e.id, e.customer, e.risk.toUpperCase(), e.issue, e.owner, e.due, e.status]),
    theme: 'striped',
    headStyles: { fillColor: DARK2, textColor: GOLD, fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: CREAM },
    margin: { left: 14, right: 14 },
  })

  addWatermark(doc)
  brandFooter(doc)
  doc.save('Wadjet-GRC-AML-Financial-Crime-Report.pdf')
}

export function downloadAMLCSV(fatfRecommendations) {
  downloadCSV('Wadjet-GRC-FATF-Recommendations',
    ['ID', 'Title', 'Category', 'Risk Level', 'Controls', 'Controls Tested', 'Gaps', 'Status', 'Last Test'],
    fatfRecommendations.map(r => [r.id, r.title, r.category, r.risk, r.controls, r.tested, r.gaps, r.status, r.lastTest || 'N/A'])
  )
}

export async function downloadAMLXLSX(fatfRecommendations, sarData, kycExceptions) {
  const wb = newWb()

  const { ws: ws1 } = initBrandedSheet(wb, {
    sheetName: 'FATF Recommendations',
    title: 'AML — FATF Recommendations Status',
    subtitle: 'FATF Compliance · Q2 2026 · FATF Mutual Evaluation: 2027',
    columns: [
      { header: 'FATF Ref',        width: 14 },
      { header: 'Title',           width: 40 },
      { header: 'Category',        width: 22 },
      { header: 'Risk Level',      width: 14 },
      { header: 'Controls',        width: 12 },
      { header: 'Controls Tested', width: 16 },
      { header: 'Gaps',            width: 10 },
      { header: 'Status',          width: 22 },
      { header: 'Last Test Date',  width: 18 },
    ],
  })
  fatfRecommendations.forEach(r => {
    const row = ws1.addRow([r.id, r.title, r.category, r.risk.toUpperCase(), r.controls, r.tested, r.gaps, r.status.replace('-', ' '), r.lastTest || 'N/A'])
    row.height = 18
    row.eachCell(cell => Object.assign(cell, xlsxCellStyle(xlsxFillByValue(r.risk))))
  })

  const { ws: ws2 } = initBrandedSheet(wb, {
    sheetName: 'KYC Exceptions',
    title: 'AML — KYC Exceptions Register',
    subtitle: 'High-risk customer exceptions requiring remediation',
    columns: [
      { header: 'Exception ID',     width: 16 },
      { header: 'Customer / Entity',width: 32 },
      { header: 'Risk Level',       width: 14 },
      { header: 'Issue Description',width: 44 },
      { header: 'Owner',            width: 22 },
      { header: 'Due Date',         width: 16 },
      { header: 'Status',           width: 18 },
    ],
  })
  kycExceptions.forEach(e => {
    const row = ws2.addRow([e.id, e.customer, e.risk.toUpperCase(), e.issue, e.owner, e.due, e.status])
    row.height = 18
    row.eachCell(cell => Object.assign(cell, xlsxCellStyle(xlsxFillByValue(e.risk))))
  })

  await saveXLSX(wb, 'Wadjet-GRC-AML-Financial-Crime-Report.xlsx')
}
