import ExcelJS from 'exceljs'

export async function saveXLSX(workbook, filename) {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.xlsx') ? filename : filename + '.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}

export function xlsxHeader() {
  return {
    font:      { name: 'Calibri', bold: true, color: { argb: 'FFD4A832' }, size: 10 },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0C1018' } },
    border:    { bottom: { style: 'medium', color: { argb: 'FFD4A832' } } },
    alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
  }
}

export function xlsxLevelFill(level) {
  const map = { Critical: 'FFFFEAEA', High: 'FFFFF3D4', Medium: 'FFFFFDE8', Low: 'FFECFFF4' }
  return map[level] || 'FFFAF7EE'
}

export function xlsxDataStyle(level, bold = false) {
  const textMap = { Critical: 'FFB01428', High: 'FFA05000', Medium: 'FF786400', Low: 'FF147832' }
  return {
    font:      { name: 'Calibri', size: 9, bold, color: bold ? { argb: textMap[level] || 'FF1A1230' } : { argb: 'FF1A1230' } },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: xlsxLevelFill(level) } },
    alignment: { vertical: 'middle', wrapText: true },
    border: {
      top:    { style: 'thin', color: { argb: 'FFE0D8C0' } },
      bottom: { style: 'thin', color: { argb: 'FFE0D8C0' } },
      left:   { style: 'thin', color: { argb: 'FFE0D8C0' } },
      right:  { style: 'thin', color: { argb: 'FFE0D8C0' } },
    },
  }
}

export function xlsxFillByValue(value) {
  const v = String(value || '').toLowerCase().trim()
  if (v === 'critical' || v === 'non-compliant' || v === 'open' || v === 'overdue'
    || v === 'mria' || v.includes('breach') || v === 'not approved' || v === '✗ no') return 'FFFFEAEA'
  if (v === 'high' || v === 'partial' || v === 'in progress' || v === 'warning'
    || v === 'pending review' || v === 'under review' || v === 'mra') return 'FFFFF3D4'
  if (v === 'medium' || v === 'pending') return 'FFFFFDE8'
  if (v === 'low' || v === 'compliant' || v === 'closed' || v === 'submitted'
    || v === 'accepted' || v === 'approved' || v === 'on track' || v === '✓ yes') return 'FFECFFF4'
  return 'FFFAF7EE'
}

export function xlsxCellStyle(fillArgb) {
  return {
    font:      { name: 'Calibri', size: 9, color: { argb: 'FF1A1230' } },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } },
    alignment: { vertical: 'middle', wrapText: true },
    border: {
      top:    { style: 'thin', color: { argb: 'FFE0D8C0' } },
      bottom: { style: 'thin', color: { argb: 'FFE0D8C0' } },
      left:   { style: 'thin', color: { argb: 'FFE0D8C0' } },
      right:  { style: 'thin', color: { argb: 'FFE0D8C0' } },
    },
  }
}

export function initBrandedSheet(wb, { sheetName, title, subtitle, columns, frozen = 2, orientation = 'landscape' }) {
  const ws = wb.addWorksheet(sheetName, {
    pageSetup: { paperSize: 9, orientation, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    views: [{ state: 'frozen', xSplit: 0, ySplit: frozen }],
  })
  const ncols = columns.length

  ws.mergeCells(1, 1, 1, ncols)
  const t = ws.getCell(1, 1)
  t.value = `𓂀  WADJET GRC — ${title}`
  t.font  = { name: 'Calibri', bold: true, size: 13, color: { argb: 'FFD4A832' } }
  t.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0C1018' } }
  t.alignment = { vertical: 'middle', horizontal: 'center' }
  ws.getRow(1).height = 28

  ws.mergeCells(2, 1, 2, ncols)
  const s = ws.getCell(2, 1)
  s.value = `${subtitle}  ·  Generated: ${new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}  ·  CONFIDENTIAL — For Internal Regulatory Use Only`
  s.font  = { name: 'Calibri', italic: true, size: 8.5, color: { argb: 'FFB49A50' } }
  s.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F1A28' } }
  s.alignment = { vertical: 'middle', horizontal: 'center' }
  ws.getRow(2).height = 15

  ws.columns = columns.map(c => ({ width: c.width }))
  const hRow = ws.addRow(columns.map(c => c.header))
  hRow.height = 30
  const hs = xlsxHeader()
  hRow.eachCell(cell => Object.assign(cell, hs))

  ws.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: ncols } }

  return { ws, ncols }
}

export function newWb() {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'WADJET GRC Enterprise Suite'
  wb.created = new Date()
  wb.modified = new Date()
  return wb
}
