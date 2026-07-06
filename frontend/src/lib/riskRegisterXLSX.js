import ExcelJS from 'exceljs'
import { saveXLSX, xlsxHeader, xlsxDataStyle, xlsxLevelFill } from './excelHelpers'

export async function downloadRiskRegisterXLSX(risks) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'WADJET GRC Enterprise Suite'
  wb.created = new Date()
  wb.modified = new Date()

  const ws = wb.addWorksheet('Risk Register', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    views: [{ state: 'frozen', xSplit: 1, ySplit: 3 }],
  })

  ws.mergeCells('A1:AF1')
  const titleCell = ws.getCell('A1')
  titleCell.value = '𓂀  WADJET GRC — Risk Register  |  Eyes on Risk. Control in Action.'
  titleCell.font  = { name: 'Calibri', bold: true, size: 14, color: { argb: 'FFD4A832' } }
  titleCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0C1018' } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
  ws.getRow(1).height = 30

  ws.mergeCells('A2:AF2')
  const subCell = ws.getCell('A2')
  subCell.value = `Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}  ·  ${risks.length} Risks  ·  CONFIDENTIAL — For Internal Regulatory Use Only`
  subCell.font  = { name: 'Calibri', italic: true, size: 9, color: { argb: 'FFB49A50' } }
  subCell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F1A28' } }
  subCell.alignment = { vertical: 'middle', horizontal: 'center' }
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

  ws.columns = COLS.map((c, i) => ({ key: c.key, width: c.width }))

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

  const headerRow = ws.addRow(COLS.map(c => c.header))
  headerRow.height = 36
  const hStyle = xlsxHeader()
  headerRow.eachCell(cell => Object.assign(cell, hStyle))

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
      const isBold = colNumber === 24
      Object.assign(cell, xlsxDataStyle(level, isBold))
    })
  })

  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: COLS.length } }

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
