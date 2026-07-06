import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { downloadCompliancePDF, downloadComplianceCSV } from '../../lib/downloadUtils'
import ComplianceFrameworkCards from './ComplianceFrameworkCards'
import ComplianceFrameworkSelector from './ComplianceFrameworkSelector'
import ComplianceTabs from './ComplianceTabs'
import ComplianceControlsTab from './ComplianceControlsTab'
import ComplianceMappingTab from './ComplianceMappingTab'
import ComplianceMatrixTab from './ComplianceMatrixTab'
import EvidenceTab from './EvidenceTab'
import TrackerTab from './TrackerTab'

export default function ComplianceEngine({ auditorMode }) {
  const [frameworks, setFrameworks] = useState([])
  const [domains, setDomains] = useState([])
  const [complianceData, setComplianceData] = useState(null)
  const [tripleMappings, setTripleMappings] = useState([])
  const [activeFwCodes, setActiveFwCodes] = useState([])
  const [activeTab, setActiveTab] = useState('matrix')
  const [loading, setLoading] = useState(true)
  const [selectedFw, setSelectedFw] = useState(null)
  const [assessing, setAssessing] = useState(null)
  const [assessForm, setAssessForm] = useState({ status: 'Not Assessed', score: 0, findings: '' })
  const [detailControl, setDetailControl] = useState(null)
  const [assessMsg, setAssessMsg] = useState(null)
  const [cascadeAssessment, setCascadeAssessment] = useState(false)

  const loadTriples = async () => {
    try {
      const res = await fetch('/api/triple-mappings')
      const data = await res.json()
      setTripleMappings(data.mappings || data.items || [])
    } catch {}
  }

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [fwRes, domRes, triRes] = await Promise.all([
        fetch('/api/frameworks'),
        fetch('/api/domains'),
        fetch('/api/triple-mappings'),
      ])
      const fws = (await fwRes.json()).frameworks || (await fwRes.json()).items || []
      const doms = (await domRes.json()).items || []
      const tris = (await triRes.json()).mappings || (await triRes.json()).items || []
      setFrameworks(fws)
      setDomains(doms)
      setTripleMappings(tris)
      const initialActive = fws.map(f => f.code)
      setActiveFwCodes(initialActive)
      if (fws.length > 0) setSelectedFw(fws[0].code)
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    if (!selectedFw) return
    fetch(`/api/compliance/status?frameworkCode=${selectedFw}`)
      .then(r => r.json())
      .then(data => setComplianceData(data))
      .catch(() => {})
  }, [selectedFw])

  const activeFrameworks = frameworks.filter(f => activeFwCodes.includes(f.code))
  const selectedFramework = frameworks.find(f => f.code === selectedFw)
  const selectedDomains = domains.filter(d => d.frameworkCode === selectedFw)

  const toggleFramework = (code) => {
    setActiveFwCodes(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])
  }

  const handleStatusChange = (status) => {
    const autoScore = { 'Compliant': 100, 'Partially Compliant': 50, 'Non-Compliant': 0, 'Not Assessed': 0, 'Not Applicable': 0 }
    const autoFindings = { 'Compliant': 'Control objective fully met. Evidence verified.', 'Partially Compliant': 'Partial compliance — remediation required.', 'Non-Compliant': 'Control not implemented or failed.', 'Not Applicable': 'Control not applicable to current scope.', 'Not Assessed': '' }
    setAssessForm(prev => ({
      ...prev,
      status,
      score: autoScore[status] ?? prev.score,
      findings: autoFindings[status] ?? prev.findings,
    }))
  }

  const handleAssess = async (controlId) => {
    if (auditorMode) return
    try {
      if (assessForm.isOverride) {
        if (!assessForm.overrideReason || assessForm.overrideReason.trim().length < 10) {
          setAssessMsg('✗ Override reason must be at least 10 characters');
          setTimeout(() => setAssessMsg(null), 3000);
          return;
        }
        const assessRes = await fetch('/api/compliance/override', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            controlId,
            frameworkCode: selectedFw,
            status: assessForm.status,
            score: Number(assessForm.score),
            overrideReason: assessForm.overrideReason.trim(),
          }),
        });
        if (!assessRes.ok) {
          const errData = await assessRes.json();
          throw new Error(errData.error || 'Override failed');
        }
        setAssessMsg(`✓ Override: ${assessForm.status} (${assessForm.score}%) — reason logged`);
      } else {
        const body = JSON.stringify({
          controlId,
          frameworkCode: selectedFw,
          status: assessForm.status,
          score: Number(assessForm.score),
          findings: assessForm.findings || '',
          assessedBy: 'Current User',
          assessedAt: new Date().toISOString(),
          source: 'MANUAL',
        });
        const assessRes = await fetch('/api/compliance/assess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
        if (!assessRes.ok) throw new Error('Assessment failed');
        setAssessMsg(`✓ ${selectedFw}: ${assessForm.status} (${assessForm.score}%)`);
        if (cascadeAssessment) {
          const relatedMappings = tripleMappings.filter(m =>
            (m.isoRef === controlId || m.cbeRef === controlId || m.pciRef === controlId) &&
            (m.isoAssessment && m.cbeAssessment && m.pciAssessment)
          )
          if (relatedMappings.length > 0) {
            const mapped = relatedMappings[0]
            const cascadeTargets = []
            const currentFw = selectedFw
            if (currentFw !== 'ISO 27001-2022' && mapped.isoRef && mapped.isoRef !== controlId) cascadeTargets.push({ fw: 'ISO 27001-2022', ctrl: mapped.isoRef })
            if (currentFw !== 'CBE' && mapped.cbeRef && mapped.cbeRef !== controlId) cascadeTargets.push({ fw: 'CBE', ctrl: mapped.cbeRef })
            if (currentFw !== 'PCI DSS v4.0' && mapped.pciRef && mapped.pciRef !== controlId) cascadeTargets.push({ fw: 'PCI DSS v4.0', ctrl: mapped.pciRef })
            for (const target of cascadeTargets) {
              await fetch('/api/compliance/assess', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  controlId: target.ctrl,
                  frameworkCode: target.fw,
                  status: assessForm.status,
                  score: Number(assessForm.score),
                  findings: `[Cascaded from ${selectedFw}] ${assessForm.findings || ''}`,
                  assessedBy: 'Current User',
                  assessedAt: new Date().toISOString(),
                  source: 'MANUAL',
                }),
              }).catch(() => {})
            }
            if (cascadeTargets.length > 0) setAssessMsg(`✓ ${assessForm.status} — cascaded to ${cascadeTargets.length} mapped control(s)`)
          }
        }
      }
      setTimeout(() => setAssessMsg(null), 3000);
      setAssessing(null);
      setCascadeAssessment(false)
      setAssessForm({ status: 'Not Assessed', score: 0, findings: '', overrideReason: '', isOverride: false });
      const [statusRes] = await Promise.all([
        fetch(`/api/compliance/status?frameworkCode=${selectedFw}`),
        loadTriples(),
      ]);
      const statusData = await statusRes.json();
      setComplianceData(statusData);
    } catch (err) {
      console.error('Assess error:', err);
      setAssessMsg('✗ Assessment failed');
      setTimeout(() => setAssessMsg(null), 3000);
    }
  }

  if (loading) {
    return <div className="h-full flex items-center justify-center"><div className="text-pharaoh-400/60 text-sm">Loading compliance data...</div></div>
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="page-title">Cross-Framework Compliance Engine</h1>
          <p className="page-subtitle">Unified compliance mapping across regulatory frameworks</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadCompliancePDF(activeFrameworks, [])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-pharaoh-500/5 text-pharaoh-400/60 border border-pharaoh-500/15 hover:bg-pharaoh-500/10 hover:text-pharaoh-300">
            <Download size="12" /> Export PDF
          </button>
          <button onClick={() => downloadComplianceCSV(activeFrameworks, [])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-pharaoh-500/5 text-pharaoh-400/60 border border-pharaoh-500/15 hover:bg-pharaoh-500/10 hover:text-egyptian-green">
            <Download size="12" /> Export Excel
          </button>
        </div>
      </div>

      <ComplianceFrameworkCards frameworks={frameworks} activeFwCodes={activeFwCodes} auditorMode={auditorMode} toggleFramework={toggleFramework} />
      <ComplianceFrameworkSelector frameworks={frameworks} selectedFw={selectedFw} setSelectedFw={setSelectedFw} complianceData={complianceData} />
      <ComplianceTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {assessMsg && (
        <div className="fixed top-6 right-6 z-50 px-6 py-3 rounded-xl shadow-2xl text-sm font-medium animate-fade-in"
          style={{
            background: assessMsg.startsWith('✓') ? 'rgba(32,201,151,0.15)' : 'rgba(220,53,69,0.15)',
            color: assessMsg.startsWith('✓') ? '#20c997' : '#dc3545',
            border: `1px solid ${assessMsg.startsWith('✓') ? 'rgba(32,201,151,0.3)' : 'rgba(220,53,69,0.3)'}`,
            backdropFilter: 'blur(12px)',
          }}>
          {assessMsg}
        </div>
      )}

      {activeTab === 'controls' && (
        <ComplianceControlsTab
          selectedDomains={selectedDomains}
          complianceData={complianceData}
          assessing={assessing} setAssessing={setAssessing}
          assessForm={assessForm} setAssessForm={setAssessForm}
          detailControl={detailControl} setDetailControl={setDetailControl}
          cascadeAssessment={cascadeAssessment} setCascadeAssessment={setCascadeAssessment}
          auditorMode={auditorMode}
          handleAssess={handleAssess}
          handleStatusChange={handleStatusChange}
        />
      )}

      {activeTab === 'mapping' && (
        <ComplianceMappingTab tripleMappings={tripleMappings} />
      )}

      {activeTab === 'matrix' && (
        <ComplianceMatrixTab selectedDomains={selectedDomains} complianceData={complianceData} selectedFramework={selectedFramework} />
      )}

      {activeTab === 'evidence' && <EvidenceTab auditorMode={auditorMode} />}
      {activeTab === 'tracker' && <TrackerTab />}
    </div>
  )
}
