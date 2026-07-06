import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { brandHeader, addWatermark, brandFooter } from './pdfHelpers'
import { downloadCSV } from './csvExport'
import { newWb, initBrandedSheet, saveXLSX, xlsxCellStyle } from './excelHelpers'
import { DARK, CREAM, GOLD, TEXT_DARK } from './constants'

export function downloadPolicyAttestationCSV(branches) {
  const rows = branches.flatMap(b =>
    (b.staff || []).map(s => [b.branch, s.name, s.role, s.signedOff ? 'Signed Off' : 'Pending', s.date || ''])
  )
  if (rows.length === 0) {
    downloadCSV('Wadjet-GRC-Policy-Attestation',
      ['Branch / Division', 'Completed', 'Total Staff', 'Completion Rate'],
      branches.map(b => [b.branch, b.completed, b.total, `${Math.round((b.completed / b.total) * 100)}%`])
    )
  } else {
    downloadCSV('Wadjet-GRC-Policy-Attestation', ['Branch / Division', 'Staff Name', 'Role', 'Status', 'Date'], rows)
  }
}

export function downloadPolicyPDF(branches) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = brandHeader(doc, 'Policy Attestation Report', 'Unified Information Security Policy — GRC-POL-SEC-2026/v3.2')

  const totalCompleted = branches.reduce((s, b) => s + b.completed, 0)
  const totalAll = branches.reduce((s, b) => s + b.total, 0)
  const overallRate = Math.round((totalCompleted / totalAll) * 100)

  autoTable(doc, {
    startY: y,
    head: [['Branch / Division', 'Staff Completed', 'Total Staff', 'Completion Rate']],
    body: [
      ...branches.map(b => [b.branch, b.completed, b.total, `${Math.round((b.completed / b.total) * 100)}%`]),
      ['TOTAL', totalCompleted, totalAll, `${overallRate}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: DARK, textColor: GOLD, fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 9, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: CREAM },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center', fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === branches.length) {
        data.cell.styles.fillColor = [240, 230, 200]
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  addWatermark(doc)
  brandFooter(doc)
  doc.save('Wadjet-GRC-Policy-Attestation-Report.pdf')
}

export async function downloadPolicyAttestationXLSX(branches) {
  const wb = newWb()

  const totalCompleted = branches.reduce((s, b) => s + b.completed, 0)
  const totalAll       = branches.reduce((s, b) => s + b.total, 0)
  const { ws: ws1 } = initBrandedSheet(wb, {
    sheetName: 'Branch Summary',
    title: 'Policy Attestation — Branch Completion Summary',
    subtitle: 'Unified Information Security Policy GRC-POL-SEC-2026/v3.2',
    columns: [
      { header: 'Branch / Division', width: 32 },
      { header: 'Staff Completed',   width: 18 },
      { header: 'Total Staff',       width: 16 },
      { header: 'Completion Rate',   width: 18 },
    ],
    orientation: 'portrait',
  })
  branches.forEach(b => {
    const rate = Math.round((b.completed / b.total) * 100)
    const row = ws1.addRow([b.branch, b.completed, b.total, `${rate}%`])
    row.height = 18
    const fill = rate >= 100 ? 'FFECFFF4' : rate >= 75 ? 'FFFFFDE8' : 'FFFFEAEA'
    row.eachCell(cell => Object.assign(cell, xlsxCellStyle(fill)))
  })
  const totalRow = ws1.addRow(['TOTAL', totalCompleted, totalAll, `${Math.round((totalCompleted / totalAll) * 100)}%`])
  totalRow.height = 20
  totalRow.eachCell(cell => {
    Object.assign(cell, xlsxCellStyle('FFEDE8C8'))
    cell.font = { name: 'Calibri', size: 10, bold: true }
  })

  const allStaff = branches.flatMap(b => (b.staff || []).map(s => ({ ...s, branch: b.branch })))
  if (allStaff.length > 0) {
    const { ws: ws2 } = initBrandedSheet(wb, {
      sheetName: 'Staff Detail',
      title: 'Policy Attestation — Individual Staff Sign-Off',
      subtitle: 'Full attestation record per employee',
      columns: [
        { header: 'Branch / Division', width: 30 },
        { header: 'Staff Name',        width: 28 },
        { header: 'Role',              width: 24 },
        { header: 'Status',            width: 16 },
        { header: 'Date Signed',       width: 18 },
      ],
      orientation: 'portrait',
    })
    allStaff.forEach(s => {
      const signed = s.signedOff
      const row = ws2.addRow([s.branch, s.name, s.role, signed ? 'Signed Off' : 'Pending', s.date || '—'])
      row.height = 18
      row.eachCell(cell => Object.assign(cell, xlsxCellStyle(signed ? 'FFECFFF4' : 'FFFFEAEA')))
    })
  }

  await saveXLSX(wb, 'Wadjet-GRC-Policy-Attestation-Report.xlsx')
}
