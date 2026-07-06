import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { brandHeader, addWatermark, brandFooter, sectionLabel } from './pdfHelpers'
import { DARK, CREAM, GOLD, TEXT_DARK } from './constants'

export function downloadBoardPackPDF(template, selectedSections, period, top10Risks) {
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
