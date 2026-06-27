import { useState } from 'react'
import { FileText, Download, Eye, CheckSquare, Square, Printer, BarChart2 } from 'lucide-react'
import { downloadBoardPackPDF } from '../lib/downloadUtils'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts'

const packTemplates = [
  { id: 'board-risk', name: 'Board Risk Committee Pack', audience: 'Board of Directors', frequency: 'Quarterly', sections: ['Executive Summary', 'Capital Adequacy', 'Risk Dashboard', 'Regulatory Findings', 'AML/CFT Update', 'Cyber Risk', 'Top 10 Risks'] },
  { id: 'alco', name: 'ALCO Report', audience: 'Asset & Liability Committee', frequency: 'Monthly', sections: ['Liquidity Position', 'LCR/NSFR', 'Capital Ratios', 'Interest Rate Risk', 'FX Exposure', 'Funding Profile'] },
  { id: 'risk-committee', name: 'Executive Risk Committee', audience: 'Executive Management', frequency: 'Monthly', sections: ['KRI Dashboard', 'Operational Risk Events', 'Compliance Status', 'Open Findings', 'TPRM Update', 'Cybersecurity Incidents'] },
  { id: 'cbe-governor', name: 'CBE Governor Meeting Pack', audience: 'Central Bank of Egypt', frequency: 'Quarterly', sections: ['Bank Overview', 'Capital Adequacy', 'Liquidity Metrics', 'Compliance Posture', 'Remediation Status', 'Forward Look'] },
]

const maturityRadar = [
  { subject: 'Governance', score: 3.8, target: 4.5 },
  { subject: 'Risk Mgmt', score: 3.2, target: 4.5 },
  { subject: 'Compliance', score: 4.1, target: 4.5 },
  { subject: 'Cyber', score: 3.0, target: 4.5 },
  { subject: 'BCP/DR', score: 3.5, target: 4.5 },
  { subject: 'AML/CFT', score: 3.7, target: 4.5 },
]

const top10Risks = [
  { rank: 1, title: 'Cybersecurity / Ransomware Attack', inherent: 80, residual: 52, trend: 'up' },
  { rank: 2, title: 'Core Banking System Failure', inherent: 72, residual: 40, trend: 'stable' },
  { rank: 3, title: 'AML Regulatory Breach', inherent: 75, residual: 48, trend: 'up' },
  { rank: 4, title: 'Data Privacy Violation (Law 151)', inherent: 60, residual: 38, trend: 'stable' },
  { rank: 5, title: 'Third-Party Concentration Risk', inherent: 65, residual: 50, trend: 'up' },
]

const kris = [
  { label: 'Compliance Score', value: '94.7%', target: '≥ 95%', status: 'warning', trend: '+2.3%' },
  { label: 'CET1 Capital Ratio', value: '13.2%', target: '≥ 7.0%', status: 'green', trend: '+0.2%' },
  { label: 'LCR', value: '138%', target: '≥ 100%', status: 'green', trend: '+4%' },
  { label: 'Open Critical Findings', value: '2', target: '= 0', status: 'red', trend: '-1' },
  { label: 'Overdue Remediations', value: '1', target: '= 0', status: 'red', trend: '0' },
  { label: 'Operational Losses (YTD)', value: 'EGP 4.05M', target: '< EGP 6M', status: 'green', trend: '+680K' },
]

const statusDot = { green: '#0dbfa8', warning: '#d4af37', red: '#c41e3a' }
const statusPrint = { green: '#0a7a3c', warning: '#8a6800', red: '#c41e3a' }

export default function BoardPackGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState('board-risk')
  const [selectedSections, setSelectedSections] = useState(packTemplates[0].sections)
  const [generating, setGenerating] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [preview, setPreview] = useState(false)
  const [period, setPeriod] = useState('Q2 2026')

  const template = packTemplates.find(t => t.id === selectedTemplate)

  const handleTemplateChange = (id) => {
    setSelectedTemplate(id)
    setSelectedSections(packTemplates.find(t => t.id === id)?.sections || [])
    setPreview(false)
  }

  const toggleSection = (section) => {
    setSelectedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    )
  }

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => { setGenerating(false); setPreview(true) }, 1800)
  }

  const handlePrintPDF = () => {
    setPrinting(true)

    const refNum = `WG-${Date.now().toString().slice(-6)}`
    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

    const kriRows = kris.map(k => `
      <div class="kri-card" style="border-color:${statusPrint[k.status]}50;">
        <div class="kri-dot" style="background:${statusPrint[k.status]};"></div>
        <div class="kri-label">${k.label}</div>
        <div class="kri-value" style="color:${statusPrint[k.status]};">${k.value}</div>
        <div class="kri-target">Target: ${k.target}</div>
        <div class="kri-trend" style="color:${statusPrint[k.status]};">${k.trend}</div>
      </div>`).join('')

    const riskRows = top10Risks.map(r => {
      const color = r.residual > 60 ? '#c41e3a' : r.residual > 40 ? '#8a6800' : '#0a7a3c'
      return `<tr>
        <td class="rank">${r.rank}</td>
        <td class="risk-title">${r.title}</td>
        <td style="color:#c41e3a;font-weight:700;text-align:center;">${r.inherent}</td>
        <td style="color:${color};font-weight:700;text-align:center;">${r.residual}</td>
        <td style="font-size:10px;text-align:center;">${r.trend === 'up' ? '↑ Increasing' : '→ Stable'}</td>
        <td style="min-width:80px;">
          <div style="height:6px;background:#e8e8e8;border-radius:3px;">
            <div style="height:6px;border-radius:3px;width:${r.residual}%;background:${color};"></div>
          </div>
        </td>
      </tr>`
    }).join('')

    const hasSection = (...names) => names.some(n => selectedSections.includes(n))

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${template?.name} — ${period}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      color: #1a1a2e;
      background: #fff;
      padding: 48px 56px;
      font-size: 12px;
      line-height: 1.65;
    }
    /* ── Header ── */
    .header { text-align: center; margin-bottom: 36px; padding-bottom: 28px; border-bottom: 2px solid #c9a82e; }
    .gold-line { height: 2px; background: linear-gradient(90deg, transparent, #c9a82e, #d4af37, #c9a82e, transparent); width: 220px; margin: 14px auto; }
    .confidential { font-size: 8px; letter-spacing: 0.35em; text-transform: uppercase; color: #999; margin-bottom: 14px; font-family: Arial, sans-serif; }
    .report-title { font-size: 26px; font-weight: 700; color: #1a1230; margin-bottom: 6px; }
    .report-sub { font-size: 12px; color: #666; }
    .report-meta { font-size: 10px; color: #aaa; margin-top: 6px; font-family: Arial, sans-serif; }
    /* ── Sections ── */
    .section { margin-bottom: 32px; break-inside: avoid; }
    .section-title {
      font-size: 13px; font-weight: 700; color: #1a1230;
      border-left: 4px solid #d4af37;
      padding: 2px 0 2px 12px;
      margin-bottom: 14px;
      font-family: Arial, sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .section-body { font-size: 12px; color: #333; line-height: 1.75; }
    /* ── KRI Grid ── */
    .kri-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 4px; }
    .kri-card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 14px 12px; text-align: center; background: #fafaf8; }
    .kri-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; margin-bottom: 6px; }
    .kri-label { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 0.05em; font-family: Arial, sans-serif; margin-bottom: 5px; }
    .kri-value { font-size: 22px; font-weight: 700; margin-bottom: 3px; }
    .kri-target { font-size: 9px; color: #bbb; font-family: Arial, sans-serif; }
    .kri-trend { font-size: 10px; margin-top: 4px; font-weight: 600; font-family: Arial, sans-serif; }
    /* ── Capital grid ── */
    .cap-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .cap-card { border: 1px solid #c8e8d8; border-radius: 8px; padding: 16px; background: #f4faf7; text-align: center; }
    .cap-ratio { font-size: 28px; font-weight: 700; color: #0a7a3c; }
    .cap-label { font-size: 10px; color: #555; margin-bottom: 6px; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.05em; }
    .cap-min { font-size: 9px; color: #aaa; margin-top: 6px; font-family: Arial, sans-serif; }
    .cap-buffer { font-size: 10px; color: #0a7a3c; font-weight: 700; margin-top: 3px; }
    /* ── Risk Table ── */
    .risk-table { width: 100%; border-collapse: collapse; font-size: 11px; }
    .risk-table thead tr { background: #f5f0e0; }
    .risk-table th { padding: 8px 10px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: #666; border-bottom: 2px solid #d4af37; font-family: Arial, sans-serif; }
    .risk-table td { padding: 9px 10px; border-bottom: 1px solid #eee; vertical-align: middle; }
    .risk-table tr:last-child td { border-bottom: none; }
    .rank { font-weight: 700; color: #bbb; width: 24px; }
    .risk-title { font-weight: 600; color: #1a1230; }
    /* ── Two-col layout ── */
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    /* ── Info box ── */
    .info-box { background: #f8f5ed; border: 1px solid #e8ddb0; border-radius: 8px; padding: 16px; }
    .info-box p { font-size: 11px; color: #444; line-height: 1.7; }
    /* ── Forward Look table ── */
    .fwd-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
    .fwd-table th { background: #1a1230; color: #d4af37; padding: 7px 12px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.07em; font-family: Arial, sans-serif; }
    .fwd-table td { padding: 8px 12px; border-bottom: 1px solid #eee; }
    .fwd-table tr:nth-child(even) td { background: #fafaf8; }
    .badge { display: inline-block; border-radius: 4px; padding: 2px 7px; font-size: 9px; font-family: Arial, sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .badge-red { background: #fde8ec; color: #c41e3a; }
    .badge-amber { background: #fdf3d0; color: #8a6800; }
    .badge-green { background: #e0f5ec; color: #0a7a3c; }
    /* ── Footer ── */
    .footer { text-align: center; font-size: 8.5px; color: #bbb; border-top: 1px solid #e8e0c0; padding-top: 18px; margin-top: 40px; font-family: Arial, sans-serif; letter-spacing: 0.08em; text-transform: uppercase; line-height: 1.8; }
    /* ── Print ── */
    @media print {
      body { padding: 16px 24px; }
      @page { size: A4; margin: 1.5cm 1.8cm; }
      .section { break-inside: avoid; }
    }
  </style>
</head>
<body>

  <!-- ══ COVER / HEADER ══ -->
  <div class="header">
    <div class="gold-line"></div>
    <p class="confidential">CONFIDENTIAL · FOR COMMITTEE USE ONLY · NOT FOR DISTRIBUTION</p>
    <h1 class="report-title">${template?.name}</h1>
    <p class="report-sub">Reporting Period: <strong>${period}</strong> &nbsp;·&nbsp; ${template?.audience}</p>
    <p class="report-meta">Prepared by: Risk &amp; Compliance Division &nbsp;·&nbsp; Ahmed Abdullah, Senior Compliance Officer</p>
    <p class="report-meta">Wadjet GRC Enterprise Suite v2.4.1 &nbsp;·&nbsp; Reference: ${refNum}</p>
    <div class="gold-line" style="margin-top:16px;"></div>
  </div>

  <!-- ══ EXECUTIVE SUMMARY ══ -->
  ${hasSection('Executive Summary', 'Bank Overview') ? `
  <div class="section">
    <h2 class="section-title">1. Executive Summary</h2>
    <div class="info-box">
      <p>The Bank maintained a strong compliance posture in <strong>${period}</strong> with an overall GRC score of <strong>94.7%</strong>,
      approaching our 95% board-approved target. Capital adequacy ratios remain well above regulatory minimums with
      CET1 at <strong>13.2%</strong> against a 7.0% CBE minimum. Two critical MRA findings from the CBE Q1 examination
      require board attention: (1) AML transaction monitoring system calibration (target closure: June 2026) and
      (2) Segregation of duties gaps in core banking access controls (target closure: July 2026).
      No regulatory sanctions or formal enforcement actions were received during the period.
      Operational losses totalled <strong>EGP 4.05M</strong>, within the EGP 6M board-approved risk appetite threshold.
      Cyber posture remains stable with no material incidents; patch compliance stands at 94%.</p>
    </div>
  </div>` : ''}

  <!-- ══ KEY RISK INDICATORS ══ -->
  ${hasSection('Risk Dashboard', 'KRI Dashboard') ? `
  <div class="section">
    <h2 class="section-title">2. Key Risk Indicators (KRIs)</h2>
    <div class="kri-grid">${kriRows}</div>
  </div>` : ''}

  <!-- ══ CAPITAL ADEQUACY ══ -->
  ${hasSection('Capital Adequacy', 'Capital Ratios') ? `
  <div class="section">
    <h2 class="section-title">3. Capital Adequacy — Basel III/IV</h2>
    <div class="cap-grid">
      <div class="cap-card">
        <div class="cap-label">Common Equity Tier 1 (CET1)</div>
        <div class="cap-ratio">13.2%</div>
        <div class="cap-min">CBE Minimum: 7.0%</div>
        <div class="cap-buffer">Buffer: +6.2 pp</div>
      </div>
      <div class="cap-card">
        <div class="cap-label">Tier 1 Capital Ratio</div>
        <div class="cap-ratio">14.8%</div>
        <div class="cap-min">CBE Minimum: 8.5%</div>
        <div class="cap-buffer">Buffer: +6.3 pp</div>
      </div>
      <div class="cap-card">
        <div class="cap-label">Total Capital Ratio</div>
        <div class="cap-ratio">16.5%</div>
        <div class="cap-min">CBE Minimum: 10.5%</div>
        <div class="cap-buffer">Buffer: +6.0 pp</div>
      </div>
      <div class="cap-card">
        <div class="cap-label">Liquidity Coverage Ratio (LCR)</div>
        <div class="cap-ratio">138%</div>
        <div class="cap-min">Minimum: 100%</div>
        <div class="cap-buffer">Surplus: +38 pp</div>
      </div>
      <div class="cap-card">
        <div class="cap-label">Net Stable Funding Ratio (NSFR)</div>
        <div class="cap-ratio">122%</div>
        <div class="cap-min">Minimum: 100%</div>
        <div class="cap-buffer">Surplus: +22 pp</div>
      </div>
      <div class="cap-card">
        <div class="cap-label">Risk-Weighted Assets (RWA)</div>
        <div class="cap-ratio" style="color:#8a6800;">EGP 41.2B</div>
        <div class="cap-min">Credit: 74% · Market: 14% · Op: 12%</div>
        <div class="cap-buffer" style="color:#8a6800;">YTD Change: +2.1%</div>
      </div>
    </div>
  </div>` : ''}

  <!-- ══ LIQUIDITY ══ -->
  ${hasSection('Liquidity Position', 'LCR/NSFR', 'Funding Profile') ? `
  <div class="section">
    <h2 class="section-title">4. Liquidity Position</h2>
    <div class="two-col">
      <div class="info-box">
        <p><strong>Liquidity Coverage Ratio (LCR): 138%</strong><br/>
        HQLA stock: EGP 28.6B. Net cash outflows (30-day): EGP 20.7B.
        Surplus HQLA: EGP 7.9B above the 100% threshold. No LCR breaches in the period.</p>
      </div>
      <div class="info-box">
        <p><strong>Net Stable Funding Ratio (NSFR): 122%</strong><br/>
        Available Stable Funding (ASF): EGP 63.1B.
        Required Stable Funding (RSF): EGP 51.7B.
        Comfort margin of EGP 11.4B above regulatory floor.</p>
      </div>
    </div>
  </div>` : ''}

  <!-- ══ TOP RISKS ══ -->
  ${hasSection('Top 10 Risks', 'Operational Risk Events', 'Open Findings') ? `
  <div class="section">
    <h2 class="section-title">5. Top Risk Register — Inherent vs. Residual</h2>
    <table class="risk-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Risk Title</th>
          <th style="text-align:center;">Inherent</th>
          <th style="text-align:center;">Residual</th>
          <th style="text-align:center;">Trend</th>
          <th>Residual Bar</th>
        </tr>
      </thead>
      <tbody>${riskRows}</tbody>
    </table>
  </div>` : ''}

  <!-- ══ REGULATORY FINDINGS ══ -->
  ${hasSection('Regulatory Findings', 'Compliance Status', 'Compliance Posture', 'Remediation Status') ? `
  <div class="section">
    <h2 class="section-title">6. Regulatory Findings &amp; Remediation</h2>
    <table class="fwd-table">
      <thead>
        <tr>
          <th>Finding ID</th><th>Description</th><th>Source</th><th>Severity</th><th>Owner</th><th>Due Date</th><th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>MRA-2026-01</strong></td>
          <td>AML transaction monitoring calibration</td>
          <td>CBE On-Site Q1</td>
          <td><span class="badge badge-red">MRIA</span></td>
          <td>Head of AML</td>
          <td>30 Jun 2026</td>
          <td><span class="badge badge-amber">IN PROGRESS</span></td>
        </tr>
        <tr>
          <td><strong>MRA-2026-02</strong></td>
          <td>Segregation of duties — core banking access</td>
          <td>CBE On-Site Q1</td>
          <td><span class="badge badge-red">MRA</span></td>
          <td>Head of IT Risk</td>
          <td>15 Jul 2026</td>
          <td><span class="badge badge-amber">IN PROGRESS</span></td>
        </tr>
        <tr>
          <td><strong>PCI-2026-04</strong></td>
          <td>CDE network segmentation documentation gap</td>
          <td>QSA Assessment</td>
          <td><span class="badge badge-amber">HIGH</span></td>
          <td>CISO Office</td>
          <td>31 Aug 2026</td>
          <td><span class="badge badge-green">PLAN SUBMITTED</span></td>
        </tr>
      </tbody>
    </table>
  </div>` : ''}

  <!-- ══ AML / CFT ══ -->
  ${hasSection('AML/CFT Update') ? `
  <div class="section">
    <h2 class="section-title">7. AML / Financial Crime Update</h2>
    <div class="two-col">
      <div class="info-box">
        <p><strong>STR Filings — ${period}</strong><br/>
        Suspicious Transaction Reports filed with the Financial Intelligence Unit (FIU): <strong>4</strong>.<br/>
        Cumulative YTD STRs: 11. FATF compliance score: 87%.<br/>
        Sanctions screening frequency: real-time (Fircosoft).</p>
      </div>
      <div class="info-box">
        <p><strong>KYC &amp; CDD Status</strong><br/>
        KYC exception rate: <strong>2.3%</strong> (threshold: 3.0%). High-risk customers with open EDD: 6.
        PEPs onboarded without completed EDD: 0. AML training completion (bank-wide): 94%.</p>
      </div>
    </div>
  </div>` : ''}

  <!-- ══ CYBER RISK ══ -->
  ${hasSection('Cyber Risk', 'Cybersecurity Incidents', 'TPRM Update') ? `
  <div class="section">
    <h2 class="section-title">8. Cybersecurity &amp; Technology Risk</h2>
    <div class="info-box">
      <p><strong>Incident Summary:</strong> No material cybersecurity incidents recorded in ${period}.
      Open vulnerabilities: 3 Critical (24-hour SLA), 12 High, 28 Medium.
      Patch compliance rate: <strong>94%</strong>. Mean Time to Patch (MTTP) critical: 18 hours.
      Penetration testing completed for all internet-facing systems (Q1 2026 scope).
      ISO 27001:2022 recertification surveillance audit: Q3 2026.
      BCP/DR test completed — actual RTO: <strong>4.2 hours</strong> against 6-hour RTO target (PASS).<br/>
      <strong>Third-Party:</strong> 3 critical vendors reviewed in ${period}. Concentration risk flag on cloud hosting: under CISO monitoring.</p>
    </div>
  </div>` : ''}

  <!-- ══ INTEREST RATE / FX ══ -->
  ${hasSection('Interest Rate Risk', 'FX Exposure') ? `
  <div class="section">
    <h2 class="section-title">9. Market &amp; Interest Rate Risk</h2>
    <div class="two-col">
      <div class="info-box">
        <p><strong>IRRBB (EVE Basis):</strong> Change in Economic Value of Equity under +200bps shock: EGP –1.42B (limit: EGP –2.0B). No limit breaches. Duration gap: 1.8 years (within 2.5-year threshold).</p>
      </div>
      <div class="info-box">
        <p><strong>FX Net Open Position:</strong> Total NOP: 12.4% of capital (CBE limit: 20%). USD long position: EGP +680M. EUR short position: EGP –210M. No overnight limit breaches.</p>
      </div>
    </div>
  </div>` : ''}

  <!-- ══ FORWARD LOOK ══ -->
  ${hasSection('Forward Look') ? `
  <div class="section">
    <h2 class="section-title">10. Forward Look — Key Actions ${period}</h2>
    <table class="fwd-table">
      <thead>
        <tr><th>Priority</th><th>Action Item</th><th>Owner</th><th>Target Date</th><th>Status</th></tr>
      </thead>
      <tbody>
        <tr><td><span class="badge badge-red">1</span></td><td>Close MRA-2026-01 (AML monitoring)</td><td>Head of AML</td><td>30 Jun 2026</td><td><span class="badge badge-amber">IN PROGRESS</span></td></tr>
        <tr><td><span class="badge badge-red">2</span></td><td>Close MRA-2026-02 (Core banking access SoD)</td><td>Head of IT Risk</td><td>15 Jul 2026</td><td><span class="badge badge-amber">IN PROGRESS</span></td></tr>
        <tr><td><span class="badge badge-amber">3</span></td><td>ISO 27001 recertification readiness review</td><td>CISO Office</td><td>31 Aug 2026</td><td><span class="badge badge-green">ON TRACK</span></td></tr>
        <tr><td><span class="badge badge-amber">4</span></td><td>SWIFT CSP 2026 self-attestation submission</td><td>Head of Technology</td><td>15 Sep 2026</td><td><span class="badge badge-green">PLANNED</span></td></tr>
        <tr><td><span class="badge badge-amber">5</span></td><td>Board GRC policy review cycle</td><td>Compliance Division</td><td>30 Sep 2026</td><td><span class="badge badge-green">PLANNED</span></td></tr>
      </tbody>
    </table>
  </div>` : ''}

  <!-- ══ FOOTER ══ -->
  <div class="footer">
    WADJET GRC PLATFORM &nbsp;·&nbsp; ${template?.audience?.toUpperCase()} &nbsp;·&nbsp; REPORTING PERIOD: ${period}<br/>
    Generated: ${dateStr} &nbsp;·&nbsp; Reference: ${refNum} &nbsp;·&nbsp; CONFIDENTIAL — NOT FOR EXTERNAL DISTRIBUTION
  </div>

</body>
</html>`

    setTimeout(() => {
      const printWindow = window.open('', '_blank', 'width=960,height=800')
      if (!printWindow) {
        alert('Pop-up blocked. Please allow pop-ups for this site and try again.')
        setPrinting(false)
        return
      }
      printWindow.document.write(html)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.focus()
        printWindow.print()
        setPrinting(false)
      }, 600)
    }, 400)
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-pharaoh-500" />
            <h1 className="text-2xl font-bold text-pharaoh-200" style={{ fontFamily: "'Cairo', serif" }}>Board Pack Generator</h1>
          </div>
          <p className="text-sm text-pharaoh-400/70 mt-0.5">Automated risk committee reports · ALCO packs · CBE submissions</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={period} onChange={e => setPeriod(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs text-pharaoh-200 outline-none"
            style={{ background: 'rgba(10,22,40,0.95)', border: '1px solid rgba(212,175,55,0.2)' }}>
            <option>Q2 2026</option><option>Q1 2026</option><option>Q4 2025</option><option>Q3 2025</option>
          </select>
        </div>
      </div>

      {!preview ? (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1 space-y-4">
            <div className="pharaoh-card p-5">
              <h3 className="text-xs font-semibold text-pharaoh-300 mb-3 uppercase tracking-wide">Select Report Template</h3>
              <div className="space-y-2">
                {packTemplates.map(t => (
                  <button key={t.id} onClick={() => handleTemplateChange(t.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${selectedTemplate === t.id ? 'gold-gradient text-nile-900' : ''}`}
                    style={selectedTemplate !== t.id ? { background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.1)' } : {}}>
                    <p className={`text-xs font-semibold ${selectedTemplate === t.id ? 'text-nile-900' : 'text-pharaoh-200'}`}>{t.name}</p>
                    <p className={`text-[10px] mt-0.5 ${selectedTemplate === t.id ? 'text-nile-800' : 'text-pharaoh-400/50'}`}>{t.audience} · {t.frequency}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="pharaoh-card p-5">
              <h3 className="text-xs font-semibold text-pharaoh-300 mb-3 uppercase tracking-wide">Report Sections</h3>
              <div className="space-y-2">
                {template?.sections.map(section => (
                  <button key={section} onClick={() => toggleSection(section)}
                    className="w-full flex items-center gap-2 text-left p-2 rounded-lg transition-all hover:bg-pharaoh-500/5">
                    {selectedSections.includes(section)
                      ? <CheckSquare size={14} className="text-pharaoh-400 flex-shrink-0" />
                      : <Square size={14} className="text-pharaoh-400/30 flex-shrink-0" />}
                    <span className="text-xs text-pharaoh-300/80">{section}</span>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleGenerate} disabled={generating}
              className="w-full py-3 rounded-xl text-sm font-bold gold-gradient text-nile-900 shadow-lg transition-all hover:scale-105 disabled:opacity-70">
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin w-4 h-4 border-2 border-nile-900 border-t-transparent rounded-full" />
                  Generating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <FileText size={15} /> Generate {period} Pack
                </span>
              )}
            </button>
          </div>

          <div className="col-span-2 space-y-4">
            <div className="pharaoh-card p-5">
              <h3 className="text-xs font-semibold text-pharaoh-300 mb-4 uppercase tracking-wide">Key Risk Indicators Preview</h3>
              <div className="grid grid-cols-2 gap-3">
                {kris.map(k => (
                  <div key={k.label} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.08)' }}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusDot[k.status] }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-pharaoh-400/60">{k.label}</p>
                      <p className="text-sm font-bold text-pharaoh-200">{k.value}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-pharaoh-400/40">Target: {k.target}</p>
                      <p className="text-[10px]" style={{ color: k.trend.startsWith('+') && k.label.includes('Loss') ? '#c41e3a' : k.trend.startsWith('+') ? '#0dbfa8' : '#b8860b' }}>{k.trend}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="pharaoh-card p-4">
                <h3 className="text-xs font-semibold text-pharaoh-300 mb-3">GRC Maturity vs Target</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <RadarChart data={maturityRadar}>
                    <PolarGrid stroke="rgba(13,191,168,0.12)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(13,191,168,0.65)', fontSize: 9 }} />
                    <Radar name="Current" dataKey="score" stroke="#d4af37" fill="#d4af37" fillOpacity={0.15} />
                    <Radar name="Target" dataKey="target" stroke="#0dbfa8" fill="#0dbfa8" fillOpacity={0.05} strokeDasharray="4 2" />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="pharaoh-card p-4">
                <h3 className="text-xs font-semibold text-pharaoh-300 mb-3">Top 5 Risks — Residual Score</h3>
                <div className="space-y-2">
                  {top10Risks.map(r => (
                    <div key={r.rank} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-pharaoh-400/40 w-4">{r.rank}</span>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-pharaoh-300/70 truncate max-w-[140px]">{r.title}</span>
                          <span className="text-pharaoh-400/50">{r.residual}</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full" style={{ width: `${r.residual}%`, background: r.residual > 60 ? '#c41e3a' : r.residual > 40 ? '#b8860b' : '#0dbfa8' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in space-y-4">
          {/* Success bar */}
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(13,191,168,0.08)', border: '1px solid rgba(13,191,168,0.22)' }}>
            <div className="flex items-center gap-3">
              <CheckSquare size={18} className="text-teal-400" />
              <div>
                <p className="text-sm font-semibold text-pharaoh-200">{template?.name} — {period} Generated Successfully</p>
                <p className="text-xs text-pharaoh-400/60">{selectedSections.length} sections · {template?.audience} · Confidential</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrintPDF}
                disabled={printing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-60"
                style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: '#d4af37' }}>
                {printing ? (
                  <>
                    <span className="animate-spin w-3 h-3 border-2 border-pharaoh-400 border-t-transparent rounded-full" />
                    Preparing...
                  </>
                ) : (
                  <>
                    <Eye size={13} /> Preview
                  </>
                )}
              </button>
              <button
                onClick={() => downloadBoardPackPDF(template, selectedSections, period, kris, top10Risks)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold gold-gradient text-nile-900 shadow-lg transition-all hover:scale-105">
                <Download size={13} /> Download PDF
              </button>
              <button
                onClick={handlePrintPDF}
                disabled={printing}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={{ background: 'rgba(13,191,168,0.07)', border: '1px solid rgba(13,191,168,0.2)', color: '#0dbfa8' }}>
                <Printer size={13} /> Print
              </button>
              <button onClick={() => setPreview(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-pharaoh-400/60 hover:text-pharaoh-300 transition-all"
                style={{ border: '1px solid rgba(212,175,55,0.1)' }}>
                Edit Pack
              </button>
            </div>
          </div>

          {/* In-app preview of the pack */}
          <div className="pharaoh-card p-8 space-y-6" style={{ fontFamily: "'Cairo', serif" }}>
            <div className="text-center border-b pb-6" style={{ borderColor: 'rgba(212,175,55,0.15)' }}>
              <div className="ankh-divider w-48 mx-auto mb-4" />
              <p className="text-[10px] tracking-[0.3em] text-pharaoh-400/50 uppercase mb-2">CONFIDENTIAL · FOR COMMITTEE USE ONLY</p>
              <h2 className="text-2xl font-bold text-pharaoh-300">{template?.name}</h2>
              <p className="text-pharaoh-400/60 text-sm mt-1">Reporting Period: {period}</p>
              <p className="text-pharaoh-400/40 text-xs mt-0.5">Prepared by: Risk &amp; Compliance Division · Ahmed Abdullah</p>
              <div className="ankh-divider w-48 mx-auto mt-4" />
            </div>

            {selectedSections.includes('Executive Summary') && (
              <div>
                <h3 className="text-sm font-bold text-pharaoh-300 mb-2 flex items-center gap-2">
                  <span className="w-1 h-4 gold-gradient rounded-full inline-block" />1. Executive Summary
                </h3>
                <p className="text-xs text-pharaoh-300/70 leading-relaxed">
                  The Bank maintained a strong compliance posture in {period} with an overall GRC score of 94.7%, approaching our 95% target.
                  Capital adequacy ratios remain well above regulatory minimums with CET1 at 13.2%.
                  Two critical MRA findings from the CBE Q1 examination require board attention:
                  (1) AML transaction monitoring calibration and (2) Segregation of duties in core banking access.
                  Operational losses totalled EGP 4.05M, within the EGP 6M risk appetite threshold.
                </p>
              </div>
            )}

            {(selectedSections.includes('Risk Dashboard') || selectedSections.includes('KRI Dashboard')) && (
              <div>
                <h3 className="text-sm font-bold text-pharaoh-300 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 gold-gradient rounded-full inline-block" />2. Key Risk Indicators
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {kris.map(k => (
                    <div key={k.label} className="p-3 rounded-xl text-center" style={{ background: 'rgba(212,175,55,0.04)', border: `1px solid ${statusDot[k.status]}30` }}>
                      <div className="w-2 h-2 rounded-full mx-auto mb-1.5" style={{ background: statusDot[k.status] }} />
                      <p className="text-[10px] text-pharaoh-400/60">{k.label}</p>
                      <p className="text-lg font-bold mt-0.5" style={{ color: statusDot[k.status] }}>{k.value}</p>
                      <p className="text-[10px] text-pharaoh-400/40">Target: {k.target}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => downloadBoardPackPDF(template, selectedSections, period, kris, top10Risks)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold gold-gradient text-nile-900 shadow-lg transition-all hover:scale-105">
                <Download size={15} /> Export Full Report as PDF
              </button>
              <button
                onClick={handlePrintPDF}
                disabled={printing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'rgba(13,191,168,0.08)', border: '1px solid rgba(13,191,168,0.22)', color: '#0dbfa8' }}>
                <Printer size={15} /> Print
              </button>
            </div>

            <div className="text-center text-[10px] text-pharaoh-400/30 border-t pt-4" style={{ borderColor: 'rgba(212,175,55,0.1)' }}>
              WADJET GRC Platform · {template?.audience} · {period} · Page 1 of {selectedSections.length + 1}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
