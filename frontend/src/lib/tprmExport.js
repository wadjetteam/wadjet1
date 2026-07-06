import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { brandHeader, addWatermark, brandFooter } from './pdfHelpers'
import { newWb, initBrandedSheet, saveXLSX, xlsxCellStyle, xlsxFillByValue } from './excelHelpers'
import { DARK, CREAM, GOLD, TEXT_DARK } from './constants'

export function downloadTPRMPDF(vendors) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  let y = brandHeader(doc, 'Third-Party Risk Management', 'Vendor Registry · Concentration Risk · CBE Compliance Status')

  autoTable(doc, {
    startY: y,
    head: [['ID', 'Vendor Name', 'Category', 'Tier', 'Country', 'Risk Score', 'Level', 'Status', 'Contract Expiry', 'Open Findings', 'Spend (M EGP)', 'CBE Approved']],
    body: vendors.map(v => [
      v.id, v.name, v.category, `Tier ${v.tier}`, v.country,
      v.riskScore, v.riskLevel.toUpperCase(), v.status,
      v.contractExpiry, v.openFindings, v.spend,
      v.regulatoryApproved ? '✓ Yes' : '✗ No',
    ]),
    theme: 'striped',
    headStyles: { fillColor: DARK, textColor: GOLD, fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: CREAM },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const v = data.cell.raw
        if (v === 'HIGH' || v === 'CRITICAL') data.cell.styles.textColor = [180, 20, 40]
        else if (v === 'MEDIUM') data.cell.styles.textColor = [150, 100, 0]
        else if (v === 'LOW')    data.cell.styles.textColor = [20, 100, 50]
      }
      if (data.section === 'body' && data.column.index === 11) {
        if (data.cell.raw === '✗ No') data.cell.styles.textColor = [180, 20, 40]
        else data.cell.styles.textColor = [20, 100, 50]
      }
    },
  })

  addWatermark(doc)
  brandFooter(doc)
  doc.save('Wadjet-GRC-TPRM-Vendor-Register.pdf')
}

export async function downloadTPRMXLSX(vendors) {
  const wb = newWb()
  const { ws } = initBrandedSheet(wb, {
    sheetName: 'Vendor Register',
    title: 'Third-Party Risk Management — Vendor Register',
    subtitle: 'Vendor registry · Concentration risk · Due diligence · Contract management',
    columns: [
      { header: 'Vendor ID',            width: 14 },
      { header: 'Vendor Name',          width: 32 },
      { header: 'Category',             width: 22 },
      { header: 'Tier',                 width: 10 },
      { header: 'Country',              width: 14 },
      { header: 'Risk Score',           width: 12 },
      { header: 'Risk Level',           width: 14 },
      { header: 'Status',               width: 18 },
      { header: 'Contract Expiry',      width: 16 },
      { header: 'Last Assessment',      width: 16 },
      { header: 'Next Assessment',      width: 16 },
      { header: 'Open Findings',        width: 14 },
      { header: 'Annual Spend (M EGP)', width: 18 },
      { header: 'CBE Approved',         width: 14 },
    ],
  })
  vendors.forEach(v => {
    const approved = v.regulatoryApproved ? '✓ Yes' : '✗ No'
    const row = ws.addRow([v.id, v.name, v.category, v.tier, v.country, v.riskScore, v.riskLevel.toUpperCase(), v.status, v.contractExpiry, v.lastAssessment, v.nextAssessment, v.openFindings, v.spend, approved])
    row.height = 18
    row.eachCell(cell => Object.assign(cell, xlsxCellStyle(xlsxFillByValue(v.riskLevel))))
    if (!v.regulatoryApproved) ws.getCell(row.number, 14).font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFB01428' } }
    else ws.getCell(row.number, 14).font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF147832' } }
  })

  await saveXLSX(wb, 'Wadjet-GRC-TPRM-Vendor-Register.xlsx')
}
