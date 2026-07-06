import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { brandHeader, addWatermark, brandFooter, sectionLabel } from './pdfHelpers'
import { downloadCSV } from './csvExport'
import { RED_BG, AMB_BG, YEL_BG, GRN_BG, CREAM, DARK, GOLD, TEXT_DARK, LEVEL_TEXT } from './constants'

export function downloadRiskRegisterPDF(risks) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  let y = brandHeader(doc, 'Risk Register', `Risk Assessment Report · ${risks.length} Risks · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`)

  const levelStyle = (data) => {
    if (data.section !== 'body') return
    const level = data.row.raw[data.row.raw.length - 1]
    if (level === 'Critical') { data.cell.styles.fillColor = RED_BG; if (data.column.index === 5) data.cell.styles.textColor = LEVEL_TEXT.Critical }
    else if (level === 'High')  { data.cell.styles.fillColor = AMB_BG; if (data.column.index === 5) data.cell.styles.textColor = LEVEL_TEXT.High }
    else if (level === 'Medium'){ data.cell.styles.fillColor = YEL_BG }
    else if (level === 'Low')   { data.cell.styles.fillColor = GRN_BG; if (data.column.index === 5) data.cell.styles.textColor = LEVEL_TEXT.Low }
  }

  y = sectionLabel(doc, '§ 1  Risk Identification & Classification', y)
  autoTable(doc, {
    startY: y,
    head: [['Risk ID', 'Process', 'Sub-Process', 'Asset/System', 'Category', 'Inherent Level', 'Risk Title', 'Threat', 'Vulnerability', 'Ref']],
    body: risks.map(r => [
      r.riskId, r.process || '—', r.subProcess || '—', r.assetSystem || '—',
      r.riskCategory, r.inherentLevel, r.riskTitle,
      r.threat || '—', r.vulnerability || '—', r.riskRef || '—',
      r.inherentLevel,
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
