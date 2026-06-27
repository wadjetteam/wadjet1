import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExcelJS from 'exceljs'

// ── Brand palette ─────────────────────────────────────────────────────────────
const GOLD      = [212, 168, 50]
const DARK      = [12,  16,  24]
const DARK2     = [18,  28,  44]
const DARK3     = [22,  36,  58]
const WHITE     = [255, 255, 255]
const CREAM     = [250, 247, 238]
const TEXT_DARK = [26,  18,  48]
const RED_BG    = [255, 236, 236]
const AMB_BG    = [255, 248, 228]
const YEL_BG    = [255, 253, 228]
const GRN_BG    = [236, 255, 244]

// ── Risk-level row fill ───────────────────────────────────────────────────────
const LEVEL_FILL = { Critical: RED_BG, High: AMB_BG, Medium: YEL_BG, Low: GRN_BG }
const LEVEL_TEXT = { Critical: [180, 20,  40], High: [160, 80, 0], Medium: [120, 90, 0], Low: [20, 100, 50] }

// ── PDF helpers ───────────────────────────────────────────────────────────────
function brandHeader(doc, title, subtitle) {
  const w = doc.internal.pageSize.getWidth()
  // Dark bar
  doc.setFillColor(...DARK)
  doc.rect(0, 0, w, 38, 'F')
  // Gold accent line
  doc.setFillColor(...GOLD)
  doc.rect(0, 38, w, 1.5, 'F')
  // Eye of Horus glyph (simplified circle + pupil) — right side decoration
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.5)
  doc.circle(w - 18, 19, 8)
  doc.setFillColor(...GOLD)
  doc.circle(w - 18, 19, 2.5, 'F')
  // Wadjet name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...GOLD)
  doc.text('WADJET', 14, 16)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(180, 155, 90)
  doc.text('GRC ENTERPRISE SUITE', 14, 23)
  doc.setFontSize(7)
  doc.setTextColor(120, 100, 55)
  doc.text('EYES ON RISK. CONTROL IN ACTION.', 14, 30)
  // Report title / subtitle
  if (title) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...WHITE)
    doc.text(title, w - 30, 15, { align: 'right' })
  }
  if (subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(180, 155, 90)
    doc.text(subtitle, w - 30, 22, { align: 'right' })
  }
  const now = new Date()
  doc.setFontSize(7)
  doc.setTextColor(100, 85, 45)
  doc.text(
    `Generated: ${now.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} · ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
    w - 30, 30, { align: 'right' }
  )
  return 46
}

function addWatermark(doc) {
  const pages = doc.internal.getNumberOfPages()
  const w = doc.internal.pageSize.getWidth()
  const h = doc.internal.pageSize.getHeight()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.saveGraphicsState()
    doc.setGState(new doc.GState({ opacity: 0.055 }))
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(44)
    doc.setTextColor(...GOLD)
    doc.text('WADJET GRC', w / 2, h / 2, { align: 'center', angle: 45 })
    doc.restoreGraphicsState()
  }
}

function brandFooter(doc) {
  const w = doc.internal.pageSize.getWidth()
  const h = doc.internal.pageSize.getHeight()
  const pages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFillColor(...DARK)
    doc.rect(0, h - 12, w, 12, 'F')
    doc.setFillColor(...GOLD)
    doc.rect(0, h - 12, w, 0.8, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(130, 110, 55)
    doc.text('CONFIDENTIAL — WADJET GRC Enterprise Suite · For internal regulatory use only · Unauthorised disclosure is prohibited', 14, h - 4)
    doc.text(`Page ${i} of ${pages}`, w - 14, h - 4, { align: 'right' })
  }
}

function sectionLabel(doc, text, y) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...GOLD)
  doc.text(text, 14, y)
  return y + 5
}

// ── CSV helper ────────────────────────────────────────────────────────────────
export function downloadCSV(filename, headers, rows) {
  const escape = (v) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))]
  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : filename + '.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ── ExcelJS XLSX helper ───────────────────────────────────────────────────────
async function saveXLSX(workbook, filename) {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.xlsx') ? filename : filename + '.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}

function xlsxHeader(sheet, cols) {
  return {
    font:      { name: 'Calibri', bold: true, color: { argb: 'FFD4A832' }, size: 10 },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0C1018' } },
    border:    { bottom: { style: 'medium', color: { argb: 'FFD4A832' } } },
    alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
  }
}

function xlsxLevelFill(level) {
  const map = { Critical: 'FFFFEAEA', High: 'FFFFF3D4', Medium: 'FFFFFDE8', Low: 'FFECFFF4' }
  return map[level] || 'FFFAF7EE'
}

function xlsxDataStyle(level, bold = false) {
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

// ── RISK REGISTER — XLSX (all 32 columns, styled) ────────────────────────────
export async function downloadRiskRegisterXLSX(risks) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'WADJET GRC Enterprise Suite'
  wb.created = new Date()
  wb.modified = new Date()

  const ws = wb.addWorksheet('Risk Register', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    views: [{ state: 'frozen', xSplit: 1, ySplit: 3 }],
  })

  // ── Title banner (row 1) ────────────────────────────────────────────────────
  ws.mergeCells('A1:AF1')
  const titleCell = ws.getCell('A1')
  titleCell.value = '𓂀  WADJET GRC — Risk Register  |  Eyes on Risk. Control in Action.'
  titleCell.font  = { name: 'Calibri', bold: true, size: 14, color: { argb: 'FFD4A832' } }
  titleCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0C1018' } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
  ws.getRow(1).height = 30

  // ── Subtitle (row 2) ────────────────────────────────────────────────────────
  ws.mergeCells('A2:AF2')
  const subCell = ws.getCell('A2')
  subCell.value = `Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}  ·  ${risks.length} Risks  ·  CONFIDENTIAL — For Internal Regulatory Use Only`
  subCell.font  = { name: 'Calibri', italic: true, size: 9, color: { argb: 'FFB49A50' } }
  subCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F1A28' } }
  subCell.alignment = { vertical: 'middle', horizontal: 'center' }
  ws.getRow(2).height = 18

  // ── Column definitions (matching the Excel template) ───────────────────────
  const COLS = [
    // Basic identification
    { key: 'riskId',           header: 'Risk ID',                  width: 10 },
    { key: 'process',          header: 'Process',                   width: 18 },
    { key: 'subProcess',       header: 'Sub-Process',               width: 18 },
    { key: 'assetSystem',      header: 'Asset / System',            width: 20 },
    { key: 'ownerTeam',        header: 'Owner Team',                width: 18 },
    // Risk classification
    { key: 'riskCategory',     header: 'Risk Category',             width: 18 },
    { key: 'threat',           header: 'Threat',                    width: 25 },
    { key: 'vulnerability',    header: 'Vulnerability',             width: 25 },
    { key: 'severity',         header: 'Severity',                  width: 12 },
    // Risk description
    { key: 'riskTitle',        header: 'Risk Title',                width: 35 },
    { key: 'riskDescription',  header: 'Risk Description',          width: 40 },
    { key: 'riskRef',          header: 'Risk Ref',                  width: 14 },
    // Impact scores
    { key: 'likelihood',       header: 'Likelihood\n(1–5)',         width: 12 },
    { key: 'impactFinance',    header: 'Impact:\nFinancial',        width: 12 },
    { key: 'impactRegulatory', header: 'Impact:\nRegulatory',       width: 12 },
    { key: 'impactReputational',header:'Impact:\nReputational',     width: 12 },
    { key: 'impactSafety',     header: 'Impact:\nSafety',           width: 12 },
    { key: 'impactOperational',header: 'Impact:\nOperational',      width: 12 },
    { key: 'impactC',          header: 'Impact: C\n(Confidentiality)',width:13},
    { key: 'impactI',          header: 'Impact: I\n(Integrity)',    width: 12 },
    { key: 'impactA',          header: 'Impact: A\n(Availability)', width: 12 },
    // Scores
    { key: 'overallScore',     header: 'Overall\nScore',            width: 10 },
    { key: 'riskScore',        header: 'Risk\nScore',               width: 10 },
    { key: 'inherentLevel',    header: 'Inherent\nRisk Level',      width: 14 },
    // Controls
    { key: 'existingControls', header: 'Existing Controls',         width: 40 },
    { key: 'residualScore',    header: 'Residual\nScore',           width: 12 },
    { key: 'overallRisk',      header: 'Overall Risk\n(Post-Control)',width:14},
    // Treatment
    { key: 'treatment',        header: 'Treatment',                 width: 14 },
    { key: 'status',           header: 'Status',                    width: 14 },
    { key: 'mitigationActions',header: 'Mitigation Actions',        width: 40 },
    { key: 'deadline',         header: 'Deadline',                  width: 14 },
    { key: 'owner',            header: 'Owner',                     width: 20 },
  ]

  ws.columns = COLS.map((c, i) => ({ key: c.key, width: c.width }))

  // ── Column group header bands (row 3 partial) ───────────────────────────────
  // Group 1: Basic Info (A3:E3)
  // Group 2: Risk Classification (F3:I3)
  // Group 3: Risk Description (J3:L3)
  // Group 4: Impact Scores (M3:U3)
  // Group 5: Scores & Level (V3:X3)
  // Group 6: Controls (Y3:AA3)
  // Group 7: Treatment & Action (AB3:AF3)
  const groupDefs = [
    { range: 'A3:E3',   label: '📁 IDENTIFICATION',      argb: 'FF121C2C' },
    { range: 'F3:I3',   label: '🏷 RISK CLASSIFICATION',  argb: 'FF0F1E30' },
    { range: 'J3:L3',   label: '📝 DESCRIPTION',          argb: 'FF121C2C' },
    { range: 'M3:U3',   label: '📊 IMPACT SCORES (1–5)', argb: 'FF0F1E30' },
    { range: 'V3:X3',   label: '⚠ SCORES & LEVEL',       argb: 'FF1A140A' },
    { range: 'Y3:AA3',  label: '🛡 EXISTING CONTROLS',    argb: 'FF0A1A0E' },
    { range: 'AB3:AF3', label: '🔧 TREATMENT & ACTION',   argb: 'FF1A100A' },
  ]
  groupDefs.forEach(({ range, label, argb }) => {
    ws.mergeCells(range)
    const c = ws.getCell(range.split(':')[0])
    c.value = label
    c.font  = { name: 'Calibri', bold: true, size: 8, color: { argb: 'FFD4A832' } }
    c.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb } }
    c.alignment = { vertical: 'middle', horizontal: 'center' }
  })
  ws.getRow(3).height = 16

  // ── Column headers (row 4) ─────────────────────────────────────────────────
  const headerRow = ws.addRow(COLS.map(c => c.header))
  headerRow.height = 36
  const hStyle = xlsxHeader()
  headerRow.eachCell(cell => Object.assign(cell, hStyle))

  // ── Data rows ──────────────────────────────────────────────────────────────
  risks.forEach((r) => {
    const level = r.inherentLevel || ''
    const row = ws.addRow([
      r.riskId, r.process, r.subProcess, r.assetSystem, r.ownerTeam,
      r.riskCategory, r.threat, r.vulnerability, r.severity,
      r.riskTitle, r.riskDescription, r.riskRef,
      r.likelihood, r.impactFinance, r.impactRegulatory, r.impactReputational,
      r.impactSafety, r.impactOperational, r.impactC, r.impactI, r.impactA,
      r.overallScore, r.riskScore, level,
      r.existingControls, r.residualScore, r.overallRisk,
      r.treatment, r.status, r.mitigationActions, r.deadline, r.owner,
    ])
    row.height = 20
    row.eachCell((cell, colNumber) => {
      const isBold = colNumber === 24 // Inherent Level column
      Object.assign(cell, xlsxDataStyle(level, isBold))
    })
  })

  // ── Auto-filter on header row ──────────────────────────────────────────────
  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: COLS.length } }

  // ── Stats summary sheet ────────────────────────────────────────────────────
  const summaryWs = wb.addWorksheet('Summary', { views: [{}] })
  const critCount = risks.filter(r => r.inherentLevel === 'Critical').length
  const highCount = risks.filter(r => r.inherentLevel === 'High').length
  const medCount  = risks.filter(r => r.inherentLevel === 'Medium').length
  const lowCount  = risks.filter(r => r.inherentLevel === 'Low').length
  const openCount = risks.filter(r => r.status === 'Open').length

  summaryWs.mergeCells('A1:D1')
  const sumTitle = summaryWs.getCell('A1')
  sumTitle.value = '𓂀  WADJET GRC — Risk Register Summary'
  sumTitle.font  = { name: 'Calibri', bold: true, size: 13, color: { argb: 'FFD4A832' } }
  sumTitle.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0C1018' } }
  sumTitle.alignment = { vertical: 'middle', horizontal: 'center' }
  summaryWs.getRow(1).height = 28

  const summaryRows = [
    ['Metric', 'Value', 'Notes', ''],
    ['Total Risks', risks.length, 'All active risks in register', ''],
    ['Critical', critCount, 'Score ≥ 15 — Immediate action required', ''],
    ['High', highCount, 'Score 10–14 — Priority remediation', ''],
    ['Medium', medCount, 'Score 5–9 — Planned mitigation', ''],
    ['Low', lowCount, 'Score 1–4 — Monitor', ''],
    ['Open', openCount, 'Risks not yet closed or accepted', ''],
    ['In Progress', risks.filter(r => r.status === 'In Progress').length, '', ''],
    ['Closed', risks.filter(r => r.status === 'Closed').length, '', ''],
    ['Accepted', risks.filter(r => r.status === 'Accepted').length, '', ''],
    ['Generated', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), '', ''],
  ]
  summaryRows.forEach((r, i) => {
    const row = summaryWs.addRow(r)
    row.height = 18
    if (i === 0) {
      row.eachCell(cell => {
        cell.font  = { name: 'Calibri', bold: true, size: 10, color: { argb: 'FFD4A832' } }
        cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF121C2C' } }
        cell.alignment = { vertical: 'middle', horizontal: 'left' }
      })
    } else {
      const levelForRow = { 'Critical': 'Critical', 'High': 'High', 'Medium': 'Medium', 'Low': 'Low' }[r[0]]
      row.eachCell((cell, colNum) => {
        cell.font  = { name: 'Calibri', size: 10, bold: colNum === 1 }
        cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: levelForRow ? xlsxLevelFill(levelForRow) : (i % 2 === 0 ? 'FFFAF7EE' : 'FFFFFFFF') } }
        cell.alignment = { vertical: 'middle', horizontal: colNum === 2 ? 'center' : 'left' }
      })
    }
  })
  summaryWs.columns = [{ width: 22 }, { width: 12 }, { width: 42 }, { width: 10 }]

  await saveXLSX(wb, `Wadjet-GRC-Risk-Register-${new Date().toISOString().slice(0,10)}.xlsx`)
}

// ── RISK REGISTER TEMPLATE — XLSX (empty, all 32 columns styled) ──────────────
export async function downloadRiskRegisterTemplateXLSX() {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'WADJET GRC Enterprise Suite'
  wb.created = new Date()

  const ws = wb.addWorksheet('Risk Register Template', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 4 }],
  })

  ws.mergeCells('A1:AF1')
  const titleCell = ws.getCell('A1')
  titleCell.value = '𓂀  WADJET GRC — Risk Register Template  |  Fill in all fields below'
  titleCell.font  = { name: 'Calibri', bold: true, size: 14, color: { argb: 'FFD4A832' } }
  titleCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0C1018' } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
  ws.getRow(1).height = 30

  ws.mergeCells('A2:AF2')
  const instrCell = ws.getCell('A2')
  instrCell.value = 'Instructions: Complete all mandatory fields. Likelihood × max(Impact scores) = Risk Score.  Scoring: 1–4 Low | 5–9 Medium | 10–14 High | 15–25 Critical'
  instrCell.font  = { name: 'Calibri', italic: true, size: 9, color: { argb: 'FFB49A50' } }
  instrCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F1A28' } }
  instrCell.alignment = { vertical: 'middle', horizontal: 'center' }
  ws.getRow(2).height = 18

  const COLS = [
    { key: 'riskId',           header: 'Risk ID',                  width: 10 },
    { key: 'process',          header: 'Process',                   width: 18 },
    { key: 'subProcess',       header: 'Sub-Process',               width: 18 },
    { key: 'assetSystem',      header: 'Asset / System',            width: 20 },
    { key: 'ownerTeam',        header: 'Owner Team',                width: 18 },
    { key: 'riskCategory',     header: 'Risk Category',             width: 18 },
    { key: 'threat',           header: 'Threat',                    width: 25 },
    { key: 'vulnerability',    header: 'Vulnerability',             width: 25 },
    { key: 'severity',         header: 'Severity',                  width: 12 },
    { key: 'riskTitle',        header: 'Risk Title',                width: 35 },
    { key: 'riskDescription',  header: 'Risk Description',          width: 40 },
    { key: 'riskRef',          header: 'Risk Ref',                  width: 14 },
    { key: 'likelihood',       header: 'Likelihood\n(1–5)',         width: 12 },
    { key: 'impactFinance',    header: 'Impact:\nFinancial',        width: 12 },
    { key: 'impactRegulatory', header: 'Impact:\nRegulatory',       width: 12 },
    { key: 'impactReputational',header:'Impact:\nReputational',     width: 12 },
    { key: 'impactSafety',     header: 'Impact:\nSafety',           width: 12 },
    { key: 'impactOperational',header: 'Impact:\nOperational',      width: 12 },
    { key: 'impactC',          header: 'Impact: C\n(Confidentiality)',width:13},
    { key: 'impactI',          header: 'Impact: I\n(Integrity)',    width: 12 },
    { key: 'impactA',          header: 'Impact: A\n(Availability)', width: 12 },
    { key: 'overallScore',     header: 'Overall\nScore',            width: 10 },
    { key: 'riskScore',        header: 'Risk\nScore',               width: 10 },
    { key: 'inherentLevel',    header: 'Inherent\nRisk Level',      width: 14 },
    { key: 'existingControls', header: 'Existing Controls',         width: 40 },
    { key: 'residualScore',    header: 'Residual\nScore',           width: 12 },
    { key: 'overallRisk',      header: 'Overall Risk\n(Post-Control)',width:14},
    { key: 'treatment',        header: 'Treatment',                 width: 14 },
    { key: 'status',           header: 'Status',                    width: 14 },
    { key: 'mitigationActions',header: 'Mitigation Actions',        width: 40 },
    { key: 'deadline',         header: 'Deadline',                  width: 14 },
    { key: 'owner',            header: 'Owner',                     width: 20 },
  ]
  ws.columns = COLS.map(c => ({ key: c.key, width: c.width }))

  const groupDefs = [
    { range: 'A3:E3',   label: '📁 IDENTIFICATION',       argb: 'FF121C2C' },
    { range: 'F3:I3',   label: '🏷 RISK CLASSIFICATION',   argb: 'FF0F1E30' },
    { range: 'J3:L3',   label: '📝 DESCRIPTION',           argb: 'FF121C2C' },
    { range: 'M3:U3',   label: '📊 IMPACT SCORES (1–5)',  argb: 'FF0F1E30' },
    { range: 'V3:X3',   label: '⚠ SCORES & LEVEL',        argb: 'FF1A140A' },
    { range: 'Y3:AA3',  label: '🛡 EXISTING CONTROLS',     argb: 'FF0A1A0E' },
    { range: 'AB3:AF3', label: '🔧 TREATMENT & ACTION',    argb: 'FF1A100A' },
  ]
  groupDefs.forEach(({ range, label, argb }) => {
    ws.mergeCells(range)
    const c = ws.getCell(range.split(':')[0])
    c.value = label
    c.font  = { name: 'Calibri', bold: true, size: 8, color: { argb: 'FFD4A832' } }
    c.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb } }
    c.alignment = { vertical: 'middle', horizontal: 'center' }
  })
  ws.getRow(3).height = 16

  const headerRow = ws.addRow(COLS.map(c => c.header))
  headerRow.height = 36
  const hStyle = xlsxHeader()
  headerRow.eachCell(cell => Object.assign(cell, hStyle))

  // 15 empty data rows with zebra fill
  for (let i = 1; i <= 15; i++) {
    const row = ws.addRow(COLS.map((c, ci) => ci === 0 ? `R-${String(i).padStart(3,'0')}` : ''))
    row.height = 20
    const fillArgb = i % 2 === 0 ? 'FFFAF7EE' : 'FFFFFFFF'
    row.eachCell(cell => {
      cell.font  = { name: 'Calibri', size: 9 }
      cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } }
      cell.alignment = { vertical: 'middle', wrapText: true }
      cell.border = {
        top:    { style: 'thin', color: { argb: 'FFE0D8C0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0D8C0' } },
        left:   { style: 'thin', color: { argb: 'FFE0D8C0' } },
        right:  { style: 'thin', color: { argb: 'FFE0D8C0' } },
      }
    })
  }

  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: COLS.length } }

  await saveXLSX(wb, 'Wadjet-GRC-Risk-Register-Template.xlsx')
}

// ── RISK REGISTER — PDF (full 32 columns, 2 sections, landscape) ──────────────
export function downloadRiskRegisterPDF(risks) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  let y = brandHeader(doc, 'Risk Register', `Risk Assessment Report · ${risks.length} Risks · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`)

  const levelStyle = (data) => {
    if (data.section !== 'body') return
    const level = data.row.raw[data.row.raw.length - 1] // stashed in last index
    if (level === 'Critical') { data.cell.styles.fillColor = RED_BG; if (data.column.index === 5) data.cell.styles.textColor = LEVEL_TEXT.Critical }
    else if (level === 'High')  { data.cell.styles.fillColor = AMB_BG; if (data.column.index === 5) data.cell.styles.textColor = LEVEL_TEXT.High }
    else if (level === 'Medium'){ data.cell.styles.fillColor = YEL_BG }
    else if (level === 'Low')   { data.cell.styles.fillColor = GRN_BG; if (data.column.index === 5) data.cell.styles.textColor = LEVEL_TEXT.Low }
  }

  // Section 1: Identification + Classification + Description
  y = sectionLabel(doc, '§ 1  Risk Identification & Classification', y)
  autoTable(doc, {
    startY: y,
    head: [['Risk ID', 'Process', 'Sub-Process', 'Asset/System', 'Category', 'Inherent Level', 'Risk Title', 'Threat', 'Vulnerability', 'Ref']],
    body: risks.map(r => [
      r.riskId, r.process || '—', r.subProcess || '—', r.assetSystem || '—',
      r.riskCategory, r.inherentLevel, r.riskTitle,
      r.threat || '—', r.vulnerability || '—', r.riskRef || '—',
      r.inherentLevel, // stashed for style
    ]),
    theme: 'grid',
    headStyles: { fillColor: DARK, textColor: GOLD, fontSize: 7, fontStyle: 'bold', minCellHeight: 10 },
    bodyStyles: { fontSize: 6.5, textColor: TEXT_DARK, minCellHeight: 7 },
    alternateRowStyles: { fillColor: CREAM },
    columnStyles: {
      0: { cellWidth: 13 }, 1: { cellWidth: 22 }, 2: { cellWidth: 22 }, 3: { cellWidth: 22 },
      4: { cellWidth: 22 }, 5: { cellWidth: 18, fontStyle: 'bold' }, 6: { cellWidth: 42 },
      7: { cellWidth: 26 }, 8: { cellWidth: 26 }, 9: { cellWidth: 14 }, 10: { cellWidth: 0 },
    },
    didParseCell: levelStyle,
    margin: { left: 10, right: 10 },
  })

  // Section 2: Impact Scores + Scores
  doc.addPage()
  y = brandHeader(doc, 'Risk Register', 'Section 2 — Impact Scores & Risk Scores')
  y = sectionLabel(doc, '§ 2  Impact Matrix & Scoring', y)
  autoTable(doc, {
    startY: y,
    head: [['Risk ID', 'Risk Title', 'Inherent', 'Likelihood', 'Fin.', 'Reg.', 'Rep.', 'Safety', 'Ops.', 'C', 'I', 'A', 'Overall\nScore', 'Risk\nScore', 'Residual\nScore', 'Overall Risk\n(Post-Control)']],
    body: risks.map(r => [
      r.riskId, r.riskTitle,
      r.inherentLevel,
      r.likelihood,
      r.impactFinance, r.impactRegulatory, r.impactReputational,
      r.impactSafety, r.impactOperational,
      r.impactC, r.impactI, r.impactA,
      r.overallScore, r.riskScore, r.residualScore, r.overallRisk || '—',
      r.inherentLevel,
    ]),
    theme: 'grid',
    headStyles: { fillColor: DARK, textColor: GOLD, fontSize: 7, fontStyle: 'bold', minCellHeight: 12 },
    bodyStyles: { fontSize: 7, textColor: TEXT_DARK, minCellHeight: 7 },
    alternateRowStyles: { fillColor: CREAM },
    columnStyles: {
      0: { cellWidth: 13 }, 1: { cellWidth: 46 }, 2: { cellWidth: 16, fontStyle: 'bold' },
      3: { cellWidth: 13, halign: 'center' }, 4: { cellWidth: 10, halign: 'center' },
      5: { cellWidth: 10, halign: 'center' }, 6: { cellWidth: 10, halign: 'center' },
      7: { cellWidth: 10, halign: 'center' }, 8: { cellWidth: 10, halign: 'center' },
      9: { cellWidth: 8, halign: 'center'  }, 10: { cellWidth: 8, halign: 'center' },
      11: { cellWidth: 8, halign: 'center' }, 12: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      13: { cellWidth: 12, halign: 'center'}, 14: { cellWidth: 14, halign: 'center' },
      15: { cellWidth: 16 }, 16: { cellWidth: 0 },
    },
    didParseCell: (data) => {
      if (data.section !== 'body') return
      const level = data.row.raw[data.row.raw.length - 1]
      if (level === 'Critical')      data.cell.styles.fillColor = RED_BG
      else if (level === 'High')     data.cell.styles.fillColor = AMB_BG
      else if (level === 'Medium')   data.cell.styles.fillColor = YEL_BG
      else if (level === 'Low')      data.cell.styles.fillColor = GRN_BG
      if (data.section === 'body' && data.column.index === 2) {
        const tc = LEVEL_TEXT[level]
        if (tc) data.cell.styles.textColor = tc
      }
    },
    margin: { left: 10, right: 10 },
  })

  // Section 3: Controls & Treatment
  doc.addPage()
  y = brandHeader(doc, 'Risk Register', 'Section 3 — Controls, Treatment & Action Plan')
  y = sectionLabel(doc, '§ 3  Existing Controls & Remediation', y)
  autoTable(doc, {
    startY: y,
    head: [['Risk ID', 'Risk Title', 'Inherent\nLevel', 'Existing Controls', 'Treatment', 'Status', 'Mitigation Actions', 'Deadline', 'Owner']],
    body: risks.map(r => [
      r.riskId, r.riskTitle, r.inherentLevel,
      r.existingControls || '—', r.treatment || '—', r.status,
      r.mitigationActions || '—', r.deadline || '—', r.owner || '—',
      r.inherentLevel,
    ]),
    theme: 'grid',
    headStyles: { fillColor: DARK, textColor: GOLD, fontSize: 7, fontStyle: 'bold', minCellHeight: 12 },
    bodyStyles: { fontSize: 6.5, textColor: TEXT_DARK, minCellHeight: 8 },
    alternateRowStyles: { fillColor: CREAM },
    columnStyles: {
      0: { cellWidth: 13 }, 1: { cellWidth: 48, fontStyle: 'bold' }, 2: { cellWidth: 16, fontStyle: 'bold' },
      3: { cellWidth: 52 }, 4: { cellWidth: 18 }, 5: { cellWidth: 18 },
      6: { cellWidth: 52 }, 7: { cellWidth: 18 }, 8: { cellWidth: 22 }, 9: { cellWidth: 0 },
    },
    didParseCell: (data) => {
      if (data.section !== 'body') return
      const level = data.row.raw[data.row.raw.length - 1]
      if (level === 'Critical')      data.cell.styles.fillColor = RED_BG
      else if (level === 'High')     data.cell.styles.fillColor = AMB_BG
      else if (level === 'Medium')   data.cell.styles.fillColor = YEL_BG
      else if (level === 'Low')      data.cell.styles.fillColor = GRN_BG
      if (data.section === 'body' && data.column.index === 2) {
        const tc = LEVEL_TEXT[level]
        if (tc) data.cell.styles.textColor = tc
      }
      if (data.section === 'body' && data.column.index === 5) {
        const v = data.cell.raw
        if (v === 'Open')       data.cell.styles.textColor = [180, 20, 40]
        else if (v === 'In Progress') data.cell.styles.textColor = [150, 100, 0]
        else if (v === 'Closed')      data.cell.styles.textColor = [20, 100, 50]
        else if (v === 'Accepted')    data.cell.styles.textColor = [80, 80, 80]
      }
    },
    margin: { left: 10, right: 10 },
  })

  addWatermark(doc)
  brandFooter(doc)
  doc.save(`Wadjet-GRC-Risk-Register-${new Date().toISOString().slice(0,10)}.pdf`)
}

// ── RISK REGISTER CSV (all 32 columns) ────────────────────────────────────────
export function downloadRiskRegisterCSV(risks) {
  downloadCSV('Wadjet-GRC-Risk-Register',
    ['Risk ID','Process','Sub-Process','Asset/System','Owner Team','Risk Category',
     'Threat','Vulnerability','Severity','Risk Title','Risk Description','Risk Ref',
     'Likelihood','Impact: Financial','Impact: Regulatory','Impact: Reputational',
     'Impact: Safety','Impact: Operational','Impact: C','Impact: I','Impact: A',
     'Overall Score','Risk Score','Inherent Level',
     'Existing Controls','Residual Score','Overall Risk (Post-Control)',
     'Treatment','Status','Mitigation Actions','Deadline','Owner'],
    risks.map(r => [
      r.riskId, r.process, r.subProcess, r.assetSystem, r.ownerTeam,
      r.riskCategory, r.threat, r.vulnerability, r.severity,
      r.riskTitle, r.riskDescription, r.riskRef,
      r.likelihood, r.impactFinance, r.impactRegulatory, r.impactReputational,
      r.impactSafety, r.impactOperational, r.impactC, r.impactI, r.impactA,
      r.overallScore, r.riskScore, r.inherentLevel,
      r.existingControls, r.residualScore, r.overallRisk,
      r.treatment, r.status, r.mitigationActions, r.deadline, r.owner,
    ])
  )
}

// ── COMPLIANCE ENGINE ─────────────────────────────────────────────────────────
export function downloadCompliancePDF(frameworks, mappingMatrix) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  let y = brandHeader(doc, 'Compliance Engine Report', 'Cross-Framework Control Mapping')

  y = sectionLabel(doc, 'Framework Summary', y)
  autoTable(doc, {
    startY: y,
    head: [['Framework', 'Authority', 'Compliance %', 'Controls', 'Status']],
    body: frameworks.map(f => [f.name, f.authority, `${f.percent}%`, f.controls, f.active ? 'Active' : 'Inactive']),
    theme: 'grid',
    headStyles: { fillColor: DARK, textColor: GOLD, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: CREAM },
    columnStyles: { 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' } },
    margin: { left: 14, right: 14 },
  })

  y = doc.lastAutoTable.finalY + 8
  y = sectionLabel(doc, 'Control Mapping Matrix', y)
  const af = frameworks.filter(f => f.active)
  autoTable(doc, {
    startY: y,
    head: [['Control Requirement', ...af.map(f => f.name.split(' ')[0])]],
    body: mappingMatrix.map(row => [row.control, ...af.map(f => row[f.id]?.mapped ? `✓ ${row[f.id]?.ref || ''}` : 'N/A')]),
    theme: 'striped',
    headStyles: { fillColor: DARK2, textColor: GOLD, fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: CREAM },
    margin: { left: 14, right: 14 },
  })

  addWatermark(doc)
  brandFooter(doc)
  doc.save('Wadjet-GRC-Compliance-Framework-Report.pdf')
}

export function downloadComplianceCSV(frameworks, mappingMatrix) {
  const af = frameworks.filter(f => f.active)
  downloadCSV('Wadjet-GRC-Compliance-Matrix',
    ['Control Requirement', ...af.map(f => f.name)],
    mappingMatrix.map(row => [row.control, ...af.map(f => row[f.id]?.mapped ? row[f.id]?.ref : 'N/A')])
  )
}

// ── GAP ASSESSMENT ────────────────────────────────────────────────────────────
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

// ── AML ───────────────────────────────────────────────────────────────────────
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

// ── BASEL ─────────────────────────────────────────────────────────────────────
export function downloadBaselPDF(capitalRatios, capitalTrend) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = brandHeader(doc, 'Basel III/IV Capital Adequacy', 'Pillar 1 · Pillar 2 · Pillar 3 · LCR/NSFR · RWA Monitoring')

  y = sectionLabel(doc, 'Capital Ratios — Current Position', y)
  autoTable(doc, {
    startY: y,
    head: [['Ratio', 'Current (%)', 'Minimum (%)', 'Conservation Buffer (%)', 'Status']],
    body: capitalRatios.map(r => [r.label, r.value, r.min, r.buffer, r.status.toUpperCase()]),
    theme: 'grid',
    headStyles: { fillColor: DARK, textColor: GOLD, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8.5, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: CREAM },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' } },
    margin: { left: 14, right: 14 },
  })

  y = doc.lastAutoTable.finalY + 8
  y = sectionLabel(doc, 'Capital Ratio Trend — Last 6 Quarters', y)
  autoTable(doc, {
    startY: y,
    head: [['Quarter', 'CET1 (%)', 'Tier 1 (%)', 'Total Capital (%)']],
    body: capitalTrend.map(t => [t.q, t.cet1, t.tier1, t.total]),
    theme: 'striped',
    headStyles: { fillColor: DARK2, textColor: GOLD, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8.5, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: CREAM },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' } },
    margin: { left: 14, right: 14 },
  })

  addWatermark(doc)
  brandFooter(doc)
  doc.save('Wadjet-GRC-Basel-Capital-Adequacy-Report.pdf')
}

export function downloadBaselCSV(capitalRatios) {
  downloadCSV('Wadjet-GRC-Capital-Ratios',
    ['Ratio', 'Label', 'Current (%)', 'Minimum (%)', 'Buffer (%)', 'Status'],
    capitalRatios.map(r => [r.name, r.label, r.value, r.min, r.buffer, r.status])
  )
}

// ── REGULATORY CALENDAR ───────────────────────────────────────────────────────
export function downloadRegulatoryCalendarPDF(submissions) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  let y = brandHeader(doc, 'Regulatory Calendar & Submissions', 'CBE Reporting Period: Q2 2026')

  autoTable(doc, {
    startY: y,
    head: [['ID', 'Submission Title', 'Framework', 'Frequency', 'Due Date', 'Priority', 'Status', 'Owner', 'Evidence Files']],
    body: submissions.map(s => [s.id, s.title, s.framework, s.frequency, s.due, s.priority.toUpperCase(), s.status.replace('-', ' '), s.owner, s.evidence]),
    theme: 'striped',
    headStyles: { fillColor: DARK, textColor: GOLD, fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: CREAM },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const v = data.cell.raw
        if (v === 'submitted')   data.cell.styles.textColor = [20, 100, 50]
        else if (v === 'in progress') data.cell.styles.textColor = [150, 100, 0]
        else if (v === 'overdue')     { data.cell.styles.textColor = [180, 20, 40]; data.cell.styles.fontStyle = 'bold' }
      }
    },
  })

  addWatermark(doc)
  brandFooter(doc)
  doc.save('Wadjet-GRC-Regulatory-Calendar-Q2-2026.pdf')
}

export function downloadRegulatoryCalendarCSV(submissions) {
  downloadCSV('Wadjet-GRC-Regulatory-Calendar',
    ['ID', 'Title', 'Framework', 'Frequency', 'Due Date', 'Priority', 'Status', 'Owner', 'Evidence Count'],
    submissions.map(s => [s.id, s.title, s.framework, s.frequency, s.due, s.priority, s.status, s.owner, s.evidence])
  )
}

// ── EXAMINATION TRACKER ───────────────────────────────────────────────────────
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

// ── FOLLOW-UP WORKSPACE ───────────────────────────────────────────────────────
export function downloadFollowUpCSV(tasks) {
  downloadCSV('Wadjet-GRC-Followup-Tasks',
    ['ID', 'Title', 'Severity', 'Category', 'Status', 'Owner', 'Due Date', 'SLA Breached', 'Level'],
    tasks.map(t => [t.id, t.title, t.severity, t.category || '', t.status, t.owner, t.dueDate || '', t.breached ? 'Yes' : 'No', t.level || ''])
  )
}

export function downloadFollowUpPDF(tasks) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  let y = brandHeader(doc, 'Follow-Up Workspace', 'Remediation Action Plan — Task Register')

  autoTable(doc, {
    startY: y,
    head: [['Task ID', 'Title', 'Severity', 'Status', 'Owner', 'Due Date', 'SLA Breached']],
    body: tasks.map(t => [t.id, t.title, t.severity || '', t.status, t.owner || '', t.dueDate || '', t.breached ? 'BREACHED' : 'On Track']),
    theme: 'striped',
    headStyles: { fillColor: DARK, textColor: GOLD, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7.5, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: CREAM },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6 && data.cell.raw === 'BREACHED') {
        data.cell.styles.textColor = [180, 20, 40]
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = RED_BG
      }
    },
  })

  addWatermark(doc)
  brandFooter(doc)
  doc.save('Wadjet-GRC-Followup-Tasks-Report.pdf')
}

// ── POLICY ATTESTATION ────────────────────────────────────────────────────────
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

// ── LOSS EVENT DATABASE ───────────────────────────────────────────────────────
export function downloadLossEventCSV(events) {
  downloadCSV('Wadjet-GRC-Loss-Events',
    ['ID', 'Date', 'Category', 'Title', 'Gross Loss (EGP)', 'Recovered (EGP)', 'Net Loss (EGP)', 'Status', 'Severity', 'Business Line', 'Near Miss'],
    events.map(e => [e.id, e.date, e.category, e.title, e.amount, e.recovered, e.amount - e.recovered, e.status, e.severity, e.businessLine, e.nearMiss ? 'Yes' : 'No'])
  )
}

export function downloadLossEventPDF(events) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  let y = brandHeader(doc, 'Operational Loss Event Database', 'Basel III Pillar 2 · 7 Basel II Event Categories')

  autoTable(doc, {
    startY: y,
    head: [['Event ID', 'Date', 'Category', 'Title', 'Gross Loss (EGP)', 'Recovered', 'Status', 'Severity', 'Business Line']],
    body: events.filter(e => !e.nearMiss).map(e => [
      e.id, e.date, e.category, e.title.substring(0, 45),
      `EGP ${e.amount.toLocaleString()}`, `EGP ${e.recovered.toLocaleString()}`,
      e.status, e.severity.toUpperCase(), e.businessLine,
    ]),
    theme: 'striped',
    headStyles: { fillColor: DARK, textColor: GOLD, fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fontSize: 6.5, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: CREAM },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 7) {
        const v = data.cell.raw
        if (v === 'CRITICAL') { data.cell.styles.textColor = [180, 20, 40]; data.cell.styles.fontStyle = 'bold' }
        else if (v === 'HIGH') data.cell.styles.textColor = [180, 100, 0]
      }
    },
  })

  addWatermark(doc)
  brandFooter(doc)
  doc.save('Wadjet-GRC-Loss-Event-Database.pdf')
}

// ── TPRM ──────────────────────────────────────────────────────────────────────
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

// ── BOARD PACK ────────────────────────────────────────────────────────────────
export function downloadBoardPackPDF(template, selectedSections, period, kris, top10Risks) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = brandHeader(doc, template?.name || 'Board Pack', `${period} · ${template?.audience || ''}`)

  if (selectedSections.includes('Executive Summary')) {
    y = sectionLabel(doc, 'Executive Summary', y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(60, 50, 30)
    const summary = 'The bank maintains a strong GRC posture for Q2 2026 with a compliance score of 94.7%, narrowly below the 95% target. Capital ratios remain well above CBE minimum requirements. Two critical regulatory findings from the 2026 CBE Full-Scope Examination remain open and are being actively remediated within agreed timelines. AML controls are effective with 156 STRs filed YTD; two KYC exceptions require urgent escalation.'
    const lines = doc.splitTextToSize(summary, 182)
    doc.text(lines, 14, y)
    y += lines.length * 4.5 + 8
  }

  if (selectedSections.includes('KRI Dashboard') || selectedSections.includes('Risk Dashboard')) {
    doc.addPage()
    y = brandHeader(doc, template?.name || 'Board Pack', `${period} · KRI Dashboard`)
    y = sectionLabel(doc, 'Key Risk Indicators', y)
    autoTable(doc, {
      startY: y,
      head: [['KRI Metric', 'Current Value', 'Target', 'Trend', 'Status']],
      body: kris.map(k => [k.label, k.value, k.target, k.trend, k.status.toUpperCase()]),
      theme: 'grid',
      headStyles: { fillColor: DARK, textColor: GOLD, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8.5, textColor: TEXT_DARK },
      alternateRowStyles: { fillColor: CREAM },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          if (data.cell.raw === 'RED')     data.cell.styles.textColor = [180, 20, 40]
          else if (data.cell.raw === 'WARNING') data.cell.styles.textColor = [150, 100, 0]
          else if (data.cell.raw === 'GREEN')   data.cell.styles.textColor = [20, 100, 50]
        }
      },
    })
  }

  if (top10Risks.length && (selectedSections.includes('Top 10 Risks') || selectedSections.includes('Risk Dashboard'))) {
    doc.addPage()
    y = brandHeader(doc, template?.name || 'Board Pack', `${period} · Top Risk Register`)
    y = sectionLabel(doc, 'Top Risks', y)
    autoTable(doc, {
      startY: y,
      head: [['Rank', 'Risk Title', 'Inherent Score', 'Residual Score', 'Trend']],
      body: top10Risks.map(r => [r.rank, r.title, r.inherent, r.residual, r.trend === 'up' ? '↑ Increasing' : '→ Stable']),
      theme: 'striped',
      headStyles: { fillColor: DARK, textColor: GOLD, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: TEXT_DARK },
      alternateRowStyles: { fillColor: CREAM },
      margin: { left: 14, right: 14 },
    })
  }

  addWatermark(doc)
  brandFooter(doc)
  doc.save(`Wadjet-GRC-Board-Pack-${period.replace(/\s+/g, '-')}.pdf`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED XLSX HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/** Fill color based on any level / status / severity string */
function xlsxFillByValue(value) {
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

function xlsxCellStyle(fillArgb) {
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

/**
 * Bootstrap a branded workbook + worksheet with:
 *  - Row 1: dark navy title banner
 *  - Row 2: metadata subtitle
 *  - Row 3: column header row (dark navy, gold text)
 * Returns { ws, ncols } — caller adds data rows after.
 */
function initBrandedSheet(wb, { sheetName, title, subtitle, columns, frozen = 2, orientation = 'landscape' }) {
  const ws = wb.addWorksheet(sheetName, {
    pageSetup: { paperSize: 9, orientation, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    views: [{ state: 'frozen', xSplit: 0, ySplit: frozen }],
  })
  const ncols = columns.length

  // Row 1 — title banner
  ws.mergeCells(1, 1, 1, ncols)
  const t = ws.getCell(1, 1)
  t.value = `𓂀  WADJET GRC — ${title}`
  t.font  = { name: 'Calibri', bold: true, size: 13, color: { argb: 'FFD4A832' } }
  t.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0C1018' } }
  t.alignment = { vertical: 'middle', horizontal: 'center' }
  ws.getRow(1).height = 28

  // Row 2 — subtitle
  ws.mergeCells(2, 1, 2, ncols)
  const s = ws.getCell(2, 1)
  s.value = `${subtitle}  ·  Generated: ${new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}  ·  CONFIDENTIAL — For Internal Regulatory Use Only`
  s.font  = { name: 'Calibri', italic: true, size: 8.5, color: { argb: 'FFB49A50' } }
  s.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F1A28' } }
  s.alignment = { vertical: 'middle', horizontal: 'center' }
  ws.getRow(2).height = 15

  // Row 3 — column headers
  ws.columns = columns.map(c => ({ width: c.width }))
  const hRow = ws.addRow(columns.map(c => c.header))
  hRow.height = 30
  const hs = xlsxHeader()
  hRow.eachCell(cell => Object.assign(cell, hs))

  // autoFilter on header row
  ws.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: ncols } }

  return { ws, ncols }
}

function newWb() {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'WADJET GRC Enterprise Suite'
  wb.created = new Date()
  wb.modified = new Date()
  return wb
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLIANCE ENGINE — XLSX
// ═══════════════════════════════════════════════════════════════════════════════
export async function downloadComplianceXLSX(frameworks, mappingMatrix) {
  const wb = newWb()

  // Sheet 1: Framework Summary
  const { ws: ws1 } = initBrandedSheet(wb, {
    sheetName: 'Framework Summary',
    title: 'Compliance Engine — Framework Summary',
    subtitle: 'Cross-Framework Control Mapping',
    columns: [
      { header: 'Framework',    width: 35 },
      { header: 'Authority',    width: 22 },
      { header: 'Compliance %', width: 14 },
      { header: 'Controls',     width: 12 },
      { header: 'Status',       width: 14 },
    ],
  })
  frameworks.forEach(f => {
    const row = ws1.addRow([f.name, f.authority, `${f.percent}%`, f.controls, f.active ? 'Active' : 'Inactive'])
    row.height = 18
    const fill = f.percent >= 90 ? 'FFECFFF4' : f.percent >= 70 ? 'FFFFFDE8' : 'FFFFEAEA'
    row.eachCell(cell => Object.assign(cell, xlsxCellStyle(fill)))
  })

  // Sheet 2: Control Mapping
  const af = frameworks.filter(f => f.active)
  const mapCols = [
    { header: 'Control Requirement', width: 42 },
    ...af.map(f => ({ header: f.name.split(' ')[0], width: 18 })),
  ]
  const { ws: ws2 } = initBrandedSheet(wb, {
    sheetName: 'Control Mapping',
    title: 'Compliance Engine — Control Mapping Matrix',
    subtitle: 'Active framework cross-references',
    columns: mapCols,
  })
  mappingMatrix.forEach(row => {
    const vals = [row.control, ...af.map(f => row[f.id]?.mapped ? `✓ ${row[f.id]?.ref || ''}` : 'N/A')]
    const r = ws2.addRow(vals)
    r.height = 18
    r.eachCell((cell, ci) => {
      const fill = ci > 1 ? (vals[ci - 1] === 'N/A' ? 'FFFFEAEA' : 'FFECFFF4') : 'FFFAF7EE'
      Object.assign(cell, xlsxCellStyle(fill))
    })
  })

  await saveXLSX(wb, 'Wadjet-GRC-Compliance-Framework-Report.xlsx')
}

// ═══════════════════════════════════════════════════════════════════════════════
// GAP ASSESSMENT — XLSX
// ═══════════════════════════════════════════════════════════════════════════════
export async function downloadGapAssessmentXLSX(clauses, maturityLevel, stats) {
  const wb = newWb()

  // Sheet 1: Summary
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

  // Sheet 2: Clause Detail
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

// ═══════════════════════════════════════════════════════════════════════════════
// AML / FINANCIAL CRIME — XLSX
// ═══════════════════════════════════════════════════════════════════════════════
export async function downloadAMLXLSX(fatfRecommendations, sarData, kycExceptions) {
  const wb = newWb()

  // Sheet 1: FATF Recommendations
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

  // Sheet 2: KYC Exceptions
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

// ═══════════════════════════════════════════════════════════════════════════════
// BASEL III/IV CAPITAL ADEQUACY — XLSX
// ═══════════════════════════════════════════════════════════════════════════════
export async function downloadBaselXLSX(capitalRatios, capitalTrend) {
  const wb = newWb()

  // Sheet 1: Capital Ratios
  const { ws: ws1 } = initBrandedSheet(wb, {
    sheetName: 'Capital Ratios',
    title: 'Basel III/IV — Capital Adequacy Ratios',
    subtitle: 'Pillar 1 · Pillar 2 · Pillar 3 · LCR/NSFR · RWA Monitoring',
    columns: [
      { header: 'Ratio',                  width: 32 },
      { header: 'Current (%)',            width: 16 },
      { header: 'CBE Minimum (%)',        width: 18 },
      { header: 'Conservation Buffer (%)',width: 22 },
      { header: 'Status',                 width: 18 },
    ],
    orientation: 'portrait',
  })
  capitalRatios.forEach(r => {
    const row = ws1.addRow([r.label, r.value, r.min, r.buffer, r.status.toUpperCase()])
    row.height = 18
    const fill = r.value >= r.min + (r.buffer || 0) ? 'FFECFFF4' : r.value >= r.min ? 'FFFFFDE8' : 'FFFFEAEA'
    row.eachCell(cell => Object.assign(cell, xlsxCellStyle(fill)))
    ws1.getCell(row.number, 2).alignment = { vertical: 'middle', horizontal: 'center' }
    ws1.getCell(row.number, 3).alignment = { vertical: 'middle', horizontal: 'center' }
    ws1.getCell(row.number, 4).alignment = { vertical: 'middle', horizontal: 'center' }
  })

  // Sheet 2: Trend
  const { ws: ws2 } = initBrandedSheet(wb, {
    sheetName: 'Capital Trend',
    title: 'Basel III/IV — Capital Ratio Trend',
    subtitle: 'Last 6 Quarters Historical Data',
    columns: [
      { header: 'Quarter',         width: 16 },
      { header: 'CET1 (%)',        width: 14 },
      { header: 'Tier 1 (%)',      width: 14 },
      { header: 'Total Capital (%)',width: 18 },
    ],
    orientation: 'portrait',
  })
  capitalTrend.forEach((t, i) => {
    const row = ws2.addRow([t.q, t.cet1, t.tier1, t.total])
    row.height = 18
    const fill = i % 2 === 0 ? 'FFFAF7EE' : 'FFFFFFFF'
    row.eachCell(cell => Object.assign(cell, xlsxCellStyle(fill)))
  })

  await saveXLSX(wb, 'Wadjet-GRC-Basel-Capital-Adequacy-Report.xlsx')
}

// ═══════════════════════════════════════════════════════════════════════════════
// REGULATORY CALENDAR — XLSX
// ═══════════════════════════════════════════════════════════════════════════════
export async function downloadRegulatoryCalendarXLSX(submissions) {
  const wb = newWb()
  const { ws } = initBrandedSheet(wb, {
    sheetName: 'Regulatory Calendar',
    title: 'Regulatory Calendar & Submissions',
    subtitle: 'CBE Reporting Period: Q2 2026 · All scheduled regulatory submissions',
    columns: [
      { header: 'Submission ID',   width: 16 },
      { header: 'Title',           width: 44 },
      { header: 'Framework',       width: 26 },
      { header: 'Frequency',       width: 16 },
      { header: 'Due Date',        width: 16 },
      { header: 'Priority',        width: 14 },
      { header: 'Status',          width: 18 },
      { header: 'Owner',           width: 24 },
      { header: 'Evidence Files',  width: 14 },
    ],
  })
  submissions.forEach(s => {
    const row = ws.addRow([s.id, s.title, s.framework, s.frequency, s.due, s.priority.toUpperCase(), s.status.replace('-', ' '), s.owner, s.evidence])
    row.height = 18
    row.eachCell(cell => Object.assign(cell, xlsxCellStyle(xlsxFillByValue(s.status))))
    ws.getCell(row.number, 7).font = { name: 'Calibri', size: 9, bold: true, color: { argb: xlsxFillByValue(s.status) === 'FFFFEAEA' ? 'FFB01428' : xlsxFillByValue(s.status) === 'FFECFFF4' ? 'FF147832' : 'FFA05000' } }
  })

  await saveXLSX(wb, 'Wadjet-GRC-Regulatory-Calendar-Q2-2026.xlsx')
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMINATION TRACKER — XLSX
// ═══════════════════════════════════════════════════════════════════════════════
export async function downloadExaminationXLSX(findings, examinations) {
  const wb = newWb()

  // Sheet 1: Examinations
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

  // Sheet 2: Findings Register
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

// ═══════════════════════════════════════════════════════════════════════════════
// FOLLOW-UP WORKSPACE — XLSX
// ═══════════════════════════════════════════════════════════════════════════════
export async function downloadFollowUpXLSX(tasks) {
  const wb = newWb()
  const { ws } = initBrandedSheet(wb, {
    sheetName: 'Follow-Up Tasks',
    title: 'Follow-Up Workspace — Remediation Action Plan',
    subtitle: 'Gap remediation & regulatory finding task register',
    columns: [
      { header: 'Task ID',      width: 14 },
      { header: 'Title',        width: 46 },
      { header: 'Severity',     width: 14 },
      { header: 'Category',     width: 22 },
      { header: 'Status',       width: 18 },
      { header: 'Owner',        width: 22 },
      { header: 'Due Date',     width: 14 },
      { header: 'SLA Breached', width: 14 },
      { header: 'Level',        width: 14 },
    ],
  })
  tasks.forEach(t => {
    const breached = t.breached
    const row = ws.addRow([t.id, t.title, t.severity || '', t.category || '', t.status, t.owner || '', t.dueDate || '', breached ? 'BREACHED' : 'On Track', t.level || ''])
    row.height = 18
    const fill = breached ? 'FFFFEAEA' : xlsxFillByValue(t.severity || t.status)
    row.eachCell(cell => Object.assign(cell, xlsxCellStyle(fill)))
    if (breached) ws.getCell(row.number, 8).font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFB01428' } }
  })

  await saveXLSX(wb, 'Wadjet-GRC-Followup-Tasks-Report.xlsx')
}

// ═══════════════════════════════════════════════════════════════════════════════
// POLICY ATTESTATION — XLSX
// ═══════════════════════════════════════════════════════════════════════════════
export async function downloadPolicyAttestationXLSX(branches) {
  const wb = newWb()

  // Sheet 1: Branch Summary
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
  // Totals row
  const totalRow = ws1.addRow(['TOTAL', totalCompleted, totalAll, `${Math.round((totalCompleted / totalAll) * 100)}%`])
  totalRow.height = 20
  totalRow.eachCell(cell => {
    Object.assign(cell, xlsxCellStyle('FFEDE8C8'))
    cell.font = { name: 'Calibri', size: 10, bold: true }
  })

  // Sheet 2: Staff Detail (if available)
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

// ═══════════════════════════════════════════════════════════════════════════════
// LOSS EVENT DATABASE — XLSX
// ═══════════════════════════════════════════════════════════════════════════════
export async function downloadLossEventXLSX(events) {
  const wb = newWb()

  // Sheet 1: Loss Events
  const actualLosses = events.filter(e => !e.nearMiss)
  const { ws: ws1 } = initBrandedSheet(wb, {
    sheetName: 'Loss Events',
    title: 'Operational Loss Event Database',
    subtitle: 'Basel III Pillar 2 · 7 Basel II Event Categories · Gross Loss Registry',
    columns: [
      { header: 'Event ID',           width: 14 },
      { header: 'Event Date',         width: 14 },
      { header: 'Category',           width: 26 },
      { header: 'Title',              width: 44 },
      { header: 'Gross Loss (EGP)',   width: 18 },
      { header: 'Recovered (EGP)',    width: 16 },
      { header: 'Net Loss (EGP)',     width: 16 },
      { header: 'Status',             width: 16 },
      { header: 'Severity',           width: 14 },
      { header: 'Business Line',      width: 22 },
    ],
  })
  actualLosses.forEach(e => {
    const row = ws1.addRow([e.id, e.date, e.category, e.title, e.amount, e.recovered, e.amount - e.recovered, e.status, e.severity.toUpperCase(), e.businessLine])
    row.height = 18
    row.eachCell(cell => Object.assign(cell, xlsxCellStyle(xlsxFillByValue(e.severity))))
    ws1.getCell(row.number, 5).numFmt = '#,##0'
    ws1.getCell(row.number, 6).numFmt = '#,##0'
    ws1.getCell(row.number, 7).numFmt = '#,##0'
  })

  // Sheet 2: Near Misses
  const nearMisses = events.filter(e => e.nearMiss)
  if (nearMisses.length > 0) {
    const { ws: ws2 } = initBrandedSheet(wb, {
      sheetName: 'Near Misses',
      title: 'Operational Loss — Near Miss Register',
      subtitle: 'Proactive risk identification · Near-miss events',
      columns: [
        { header: 'Event ID',      width: 14 },
        { header: 'Event Date',    width: 14 },
        { header: 'Category',      width: 26 },
        { header: 'Title',         width: 50 },
        { header: 'Severity',      width: 14 },
        { header: 'Business Line', width: 22 },
        { header: 'Status',        width: 16 },
      ],
    })
    nearMisses.forEach(e => {
      const row = ws2.addRow([e.id, e.date, e.category, e.title, e.severity.toUpperCase(), e.businessLine, e.status])
      row.height = 18
      row.eachCell(cell => Object.assign(cell, xlsxCellStyle(xlsxFillByValue(e.severity))))
    })
  }

  await saveXLSX(wb, 'Wadjet-GRC-Loss-Event-Database.xlsx')
}

// ═══════════════════════════════════════════════════════════════════════════════
// TPRM — XLSX
// ═══════════════════════════════════════════════════════════════════════════════
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
