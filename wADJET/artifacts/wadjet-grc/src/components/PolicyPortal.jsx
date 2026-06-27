import { useState, useRef } from 'react'
import { downloadPolicyAttestationCSV, downloadPolicyPDF } from '../lib/downloadUtils'
import { FileText, Download, Search, CheckCircle, Clock, User, Fingerprint, Monitor, Shield, ChevronDown, Eye } from 'lucide-react'

const ar = {
  'Policy Lifecycle & Attestation Portal': 'بوابة السياسات واللوائح',
  'Document viewer, digital sign-off, and compliance attestation tracking': 'عرض المستندات، التوقيع الرقمي، وتتبع إقرار الامتثال التنظيمي',
  'Document Viewer': 'عارض المستندات',
  'Attestation Tracker': 'متتبع الإقرارات',
  'Export Excel': 'تصدير إكسل',
  'Export PDF': 'تصدير PDF',
  'Unified Information Security Policy': 'سياسة أمن المعلومات الموحدة',
  'Unified Information Security and Regulatory Compliance Policy': 'سياسة أمن المعلومات الموحدة والامتثال التنظيمي',
  'Active': 'نشط',
  'Digital Sign-Off': 'التوقيع الرقمي',
  'Compliance Attestation': 'إقرار الامتثال',
  'Digital Sign-Off and Compliance Attestation': 'التوقيع الرقمي وإقرار الامتثال',
  'Please scroll to the bottom of the document to enable attestation': 'يرجى التمرير إلى أسفل المستند لتفعيل الإقرار',
  'Scrolled to bottom &middot; Ready for signature': 'تم التمرير للنهاية · جاهز للتوقيع',
  'Sign-off disabled in Auditor View': 'التوقيع معطل في وضع المراجع',
  'Document read progress': 'تقدم قراءة المستند',
  'Scroll to the bottom to enable sign-off': 'قم بالتمرير للنهاية لتفعيل التوقيع',
  'Full document read': 'تمت قراءة المستند بالكامل',
  'Attestation Completed Successfully': 'تم إتمام الإقرار بنجاح',
  'User ID': 'معرف المستخدم',
  'Timestamp': 'الطابع الزمني',
  'Client IP': 'عنوان IP',
  'Signature Hash': 'توقيع التجزئة',
  'Policy Version': 'نسخة السياسة',
  'Total Employees': 'إجمالي الموظفين',
  'Attested': 'مُقر',
  'Overall Rate': 'نسبة الإنجاز',
  'Pending': 'معلق',
  'Attestation Compliance by Branch & Department': 'الامتثال للإقرارات حسب الفرع والإدارة',
  'Search branch or department...': 'ابحث عن فرع أو إدارة...',
  'Branch / Division': 'الفرع / القسم',
  'Department': 'الإدارة',
  'Completed': 'مكتمل',
  'Total': 'الإجمالي',
  'Rate': 'النسبة',
  'Last Attestation': 'آخر إقرار',
  'Status': 'الحالة',
  'Complete': 'مكتمل',
  'In Progress': 'قيد التنفيذ',
  'Attention': 'يتطلب انتباهاً',
  'branches and departments': 'فرع وإدارة',
  'Excellent (90%+)': 'ممتاز (٩٠٪ فأكثر)',
  'Moderate (70-89%)': 'متوسط (٧٠-٨٩٪)',
  'Needs Improvement (<70%)': 'يحتاج تحسين (أقل من ٧٠٪)',
  'Data Privacy Policy (Law 151)': 'سياسة خصوصية البيانات (قانون ١٥١)',
  'Access Control & Identity Policy': 'سياسة التحكم في الوصول وإدارة الهويات',
  'Status: Approved': 'الحالة: معتمد',
  'Status: Under Review': 'الحالة: قيد المراجعة',
  'Last Updated': 'آخر تحديث',
  'Read & Attest': 'قراءة وإقرار السياسة',
  'SECTION 1: SCOPE AND OBJECTIVES': 'القسم ١: النطاق والأهداف',
  'SECTION 2: INFORMATION SECURITY PRINCIPLES': 'القسم ٢: مبادئ أمن المعلومات',
  'SECTION 3: DATA CLASSIFICATION AND ASSET MANAGEMENT': 'القسم ٣: تصنيف البيانات وإدارة الأصول',
  'SECTION 4: ACCESS CONTROL AND AUTHORIZATION': 'القسم ٤: التحكم في الوصول والتفويض',
  'SECTION 5: SECURITY RISK MANAGEMENT': 'القسم ٥: إدارة المخاطر الأمنية',
  'SECTION 6: INCIDENT RESPONSE AND BREACH MANAGEMENT': 'القسم ٦: الاستجابة للحوادث وإدارة الاختراقات',
  'SECTION 7: BUSINESS CONTINUITY AND DISASTER RECOVERY': 'القسم ٧: استمرارية الأعمال والتعافي من الكوارث',
  'SECTION 8: REGULATORY COMPLIANCE AND DATA PROTECTION': 'القسم ٨: الامتثال التنظيمي وحماية البيانات',
  'SECTION 9: ACKNOWLEDGMENT AND COMMITMENT': 'القسم ٩: الإقرار والالتزام',
}

const arabicSection9 = `المادة 9: الإقرار والالتزام

أنا، الموقع أدناه، أقر بموجبي بأنني قد قرأت واستوعبت بالكامل سياسة أمن المعلومات الموحدة والامتثال التنظيمي للبنك. أتعهد بالامتثال الكامل لجميع أحكامها دون تحفظ.

كما أتعهد بالإبلاغ الفوري عن أي انتهاكات أو خروقات أمنية قد تؤثر على سرية أو سلامة أو توفر معلومات البنك، وبالحفاظ على سرية جميع المعلومات المصرفية التي أطلع عليها من خلال عملي.

أدرك أن مخالفة هذه السياسة تعرضني للمساءلة القانونية والتأديبية وفقاً للوائح البنك وقوانين جمهورية مصر العربية.`

const policyText = (lang) => {
  const en = ` ${lang === 'ar' ? arabicSection9 : `
SECTION 9: ACKNOWLEDGMENT AND COMMITMENT

I, the undersigned, hereby acknowledge that I have read and fully understood the Unified Information Security and Regulatory Compliance Policy of the bank. I commit to full compliance with all its provisions without reservation.

I further commit to immediately report any security violations or breaches that may affect the confidentiality, integrity, or availability of bank information, and to safeguard all confidential banking information accessed through my work.

I understand that violation of this policy subjects me to legal and disciplinary accountability in accordance with bank regulations and the laws of the Arab Republic of Egypt.`}
`
  const base = `
UNIFIED INFORMATION SECURITY AND REGULATORY COMPLIANCE POLICY

Version 3.2 · Effective Date: January 1, 2026 · Classification: Internal Use Only

SECTION 1: SCOPE AND OBJECTIVES

This policy establishes the overarching framework for information security governance, risk management, and regulatory compliance across the bank, in accordance with the Central Bank of Egypt (CBE) Cybersecurity Framework, ISO/IEC 27001:2022, PCI DSS v4.0, and Egyptian Law 151/2020 for Personal Data Protection.

This policy applies to all banking entities, including central directorates, regional branches, subsidiaries, and all permanent or temporary personnel. Compliance with this policy is mandatory and non-negotiable.

SECTION 2: INFORMATION SECURITY PRINCIPLES

The bank adheres to the following fundamental principles:

A. Confidentiality: Ensuring information is disclosed only to authorized individuals in accordance with their functional roles and legal entitlements.

B. Integrity: Maintaining the accuracy and completeness of information and preventing unauthorized modification.

C. Availability: Ensuring that information and systems are accessible to authorized personnel when required, in compliance with agreed Service Level Agreements (SLAs).

D. Compliance: Adhering to all legal and regulatory requirements issued by competent supervisory authorities, including CBE, FRA, and NTRA.

E. Privacy: Protecting personal data of customers and employees in accordance with Law 151/2020 and its executive regulations.

SECTION 3: DATA CLASSIFICATION AND ASSET MANAGEMENT

Bank data and information shall be classified into the following categories:

1. Top Secret: Includes sensitive banking customer information, payment card data, encryption keys, and master passwords. Must be encrypted using AES-256 at minimum.

2. Secret: Includes internal financial information, audit reports, business continuity plans, and security incident records.

3. Internal: Includes internal policies and procedures, administrative reports, and employee data not classified as secret.

4. Public: Information that may be published to the public in accordance with applicable laws and regulations.

SECTION 4: ACCESS CONTROL AND AUTHORIZATION

Access to bank systems and information is governed by:

1. Principle of Least Privilege: Each user is granted the minimum access permissions necessary to perform their job functions.

2. Segregation of Duties: Development, operations, and audit functions must be segregated to prevent concentration of authority.

3. Multi-Factor Authentication (MFA): MFA is mandatory for all sensitive systems and remote access.

4. Periodic Review: Access permissions must be reviewed quarterly. Permissions for terminated personnel must be revoked within 24 hours.

SECTION 5: SECURITY RISK MANAGEMENT

The security risk management methodology follows:

1. Risk Identification: All potential security risks must be identified and classified using threat scenarios.

2. Risk Assessment: Risks are evaluated based on likelihood and impact using the quantitative model: Risk Score = Probability × Impact.

3. Risk Treatment: Management selects from: Risk Mitigation, Risk Transfer, Risk Avoidance, or Risk Acceptance based on organizational context.

4. Risk Reporting: Risk reports are submitted monthly to the Risk Management Committee. Risks exceeding a threshold of 70 points require immediate escalation.

SECTION 6: INCIDENT RESPONSE AND BREACH MANAGEMENT

Security incidents are handled as follows:

1. Classification: Incidents are classified by severity (Critical, High, Medium, Low) within 15 minutes of discovery.

2. Containment: Critical incidents must be contained within 4 hours; High severity within 24 hours.

3. Investigation: The incident response team investigates root causes within 28 hours of containment.

4. Remediation: Corrective actions for critical incidents must be completed within 48 hours per SLA requirements.

5. Regulatory Notification: Serious security incidents must be reported to regulatory authorities within 72 hours of discovery per CBE requirements.

SECTION 7: BUSINESS CONTINUITY AND DISASTER RECOVERY

The bank ensures business continuity through:

1. Business Continuity Plan (BCP) tested at least quarterly.

2. Disaster Recovery Plan (DRP) with a Recovery Time Objective (RTO) not exceeding 4 hours for critical systems.

3. Recovery Point Objective (RPO) not exceeding 15 minutes of data loss for core banking systems.

4. A secondary data center located at least 50 km from the primary facility.

SECTION 8: REGULATORY COMPLIANCE AND DATA PROTECTION

The bank complies with all applicable regulatory requirements:

1. CBE Cybersecurity Framework — all 115 controls as mandated.

2. ISO/IEC 27001:2022 Information Security Management System.

3. PCI DSS v4.0 for payment card data security.

4. Law 151/2020 for Personal Data Protection and its executive regulations.

5. Law 194/2020 for the Central Bank and Banking Sector.

${lang === 'ar' ? arabicSection9 : 'SECTION 9: ACKNOWLEDGMENT AND COMMITMENT\n\nI, the undersigned, hereby acknowledge that I have read and fully understood the Unified Information Security and Regulatory Compliance Policy of the bank. I commit to full compliance with all its provisions without reservation.\n\nI further commit to immediately report any security violations or breaches that may affect the confidentiality, integrity, or availability of bank information, and to safeguard all confidential banking information accessed through my work.\n\nI understand that violation of this policy subjects me to legal and disciplinary accountability in accordance with bank regulations and the laws of the Arab Republic of Egypt.'}
`
  return base
}
const mockBranches = [
  { name: 'Head Office - Cairo', dept: 'Information Technology', completed: 118, total: 120, lastAttestation: '2026-06-07 14:30:22' },
  { name: 'Alexandria Branch', dept: 'Banking Operations', completed: 87, total: 95, lastAttestation: '2026-06-06 11:15:44' },
  { name: 'Giza Branch', dept: 'Treasury', completed: 72, total: 80, lastAttestation: '2026-06-05 09:45:10' },
  { name: 'Dokki Branch', dept: 'Credit', completed: 55, total: 55, lastAttestation: '2026-06-07 08:00:33' },
  { name: 'Nasr City Branch', dept: 'Risk Management', completed: 64, total: 68, lastAttestation: '2026-06-06 16:20:55' },
  { name: 'Maadi Branch', dept: 'Marketing', completed: 27, total: 42, lastAttestation: '2026-06-04 13:10:18' },
  { name: '10th of Ramadan Branch', dept: 'Human Resources', completed: 49, total: 60, lastAttestation: '2026-06-05 10:30:00' },
  { name: 'Hurghada Branch', dept: 'Legal Affairs', completed: 35, total: 35, lastAttestation: '2026-06-07 12:00:00' },
]

export default function PolicyPortal({ auditorMode }) {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState(null)
  const [activeTab, setActiveTab] = useState('viewer')
  const [lang, setLang] = useState('en')
  const docRef = useRef(null)

  const t = (key) => lang === 'ar' && ar[key] ? ar[key] : key

  const handleScroll = (e) => {
    const el = e.currentTarget
    const scrollTop = el.scrollTop
    const scrollHeight = el.scrollHeight - el.clientHeight
    const progress = Math.min(Math.round((scrollTop / scrollHeight) * 100), 100)
    setScrollProgress(progress)
    setIsScrolledToBottom(scrollHeight - scrollTop < 5)
  }

  const handleSignOff = () => {
    setReceiptData({
      userId: 'USR-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      timestamp: new Date().toISOString(),
      ip: '10.88.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255),
      hash: '0x' + Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase(),
      policyVersion: 'GRC-POL-SEC-2026/v3.2',
    })
    setShowReceipt(true)
  }

  const tabs = [
    { id: 'viewer', label: t('Document Viewer'), icon: FileText },
    { id: 'tracker', label: t('Attestation Tracker'), icon: Shield },
  ]

  const totalCompleted = mockBranches.reduce((s, b) => s + b.completed, 0)
  const totalAll = mockBranches.reduce((s, b) => s + b.total, 0)
  const overallRate = Math.round((totalCompleted / totalAll) * 100)

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 scrollbar-thin" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="page-title">{t('Policy Lifecycle & Attestation Portal')}</h1>
          <p className="page-subtitle">{t('Document viewer, digital sign-off, and compliance attestation tracking')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => downloadPolicyAttestationCSV(mockBranches)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-egyptian-green/10 border border-egyptian-green/20 text-egyptian-green text-xs font-medium hover:bg-egyptian-green/15 transition-all"><Download size="12" /> {t('Export Excel')}</button>
          <button onClick={() => downloadPolicyPDF(mockBranches)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pharaoh-500/10 border border-pharaoh-500/20 text-pharaoh-300 text-xs font-medium hover:bg-pharaoh-500/15 transition-all"><FileText size="12" /> {t('Export PDF')}</button>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-nile-900 rounded-xl p-1 border border-pharaoh-500/15 w-fit animate-fade-in" style={{ animationDelay: '0.05s' }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-pharaoh-500/10 text-pharaoh-300 border border-pharaoh-500/20' : 'text-pharaoh-500/40 hover:text-pharaoh-300'}`}>
              <Icon size="16" /><span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {activeTab === 'viewer' && (
        <div className="grid grid-cols-3 gap-5 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="col-span-2 space-y-5">
            <div className="pharaoh-card overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-5 py-3 border-b border-pharaoh-500/10" style={{ background: 'rgba(10,22,40,0.5)' }}>
                <div className="flex items-center gap-2">
                  <FileText size="16" className="text-pharaoh-400" />
                  <span className="text-sm font-medium text-pharaoh-200">{t('Unified Information Security Policy')}</span>
                  <span className="text-[10px] text-pharaoh-500/40">GRC-POL-SEC-2026/v3.2</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-nile-900 rounded-lg p-0.5 border border-pharaoh-500/15">
                    <button onClick={() => setLang('en')}
                      className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-all ${lang === 'en' ? 'gold-gradient text-nile-900' : 'text-pharaoh-400/60 hover:text-pharaoh-300'}`}>EN</button>
                    <button onClick={() => setLang('ar')}
                      className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-all ${lang === 'ar' ? 'gold-gradient text-nile-900' : 'text-pharaoh-400/60 hover:text-pharaoh-300'}`}>AR</button>
                  </div>
                  <span className="text-[10px] text-egyptian-green font-medium bg-egyptian-green/10 px-2 py-0.5 rounded border border-egyptian-green/20">{t('Active')}</span>
                </div>
              </div>
              <div className="h-1 bg-pharaoh-500/5"><div className="h-full bg-pharaoh-400 transition-all duration-200" style={{ width: `${scrollProgress}%` }} /></div>
              <div ref={docRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-6 max-h-[450px] scrollbar-thin" style={{ lineHeight: '1.8', background: 'rgba(10,22,40,0.3)' }}>
                <div className={`max-w-3xl mx-auto ${lang === 'ar' ? 'font-sans leading-relaxed' : ''}`} style={{ fontFamily: lang === 'ar' ? "'Cairo', 'Tajawal', sans-serif" : undefined }}>
                  {policyText(lang).split('\n').map((line, idx) => {
                    const translatedLine = lang === 'ar' && ar[line.trim()] ? ar[line.trim()] : line
                    if (line.startsWith('SECTION ')) return <h2 key={idx} className="text-base font-bold text-pharaoh-300 mb-3 mt-5">{translatedLine}</h2>
                    if (line.match(/^[A-E]\./)) return <p key={idx} className="text-sm text-pharaoh-400/70 mb-2 pr-4">{translatedLine}</p>
                    if (line.match(/^\d\./)) return <p key={idx} className="text-sm text-pharaoh-400/70 mb-2 pr-4">{translatedLine}</p>
                    if (line.match(/^UNIFIED /)) return <h1 key={idx} className="text-xl font-bold text-pharaoh-200 mb-1 mt-2">{translatedLine}</h1>
                    if (line.match(/^Version/)) return <p key={idx} className="text-xs text-pharaoh-500/40 mb-5">{translatedLine}</p>
                    if (line.trim() === '') return <div key={idx} className="h-2" />
                    return <p key={idx} className="text-sm text-pharaoh-400/70 mb-2 leading-7">{translatedLine}</p>
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="pharaoh-card p-5 text-center">
              <div className="text-4xl font-bold text-pharaoh-200 mb-2 font-mono">{scrollProgress}%</div>
              <div className="text-xs text-pharaoh-500/40">{t('Document read progress')}</div>
              <div className="w-full h-2 rounded-full bg-pharaoh-500/5 mt-3 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${scrollProgress}%`, backgroundColor: scrollProgress >= 100 ? '#2d7d46' : '#b8860b' }} />
              </div>
              {scrollProgress < 100 && <p className="text-[10px] text-pharaoh-500/40 mt-3">{t('Scroll to the bottom to enable sign-off')}</p>}
              {scrollProgress >= 100 && <div className="flex items-center justify-center gap-1.5 mt-3"><CheckCircle size="12" className="text-egyptian-green" /><span className="text-[10px] text-egyptian-green font-medium">{t('Full document read')}</span></div>}
            </div>

            <div className="pharaoh-card p-5">
              <h3 className="text-sm font-semibold text-pharaoh-200 mb-1">{t('Digital Sign-Off')}</h3>
              <p className="text-xs text-pharaoh-500/40 mb-4">{t('Compliance Attestation')}</p>
              <button onClick={handleSignOff} disabled={!isScrolledToBottom || auditorMode}
                className={`w-full py-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  isScrolledToBottom && !auditorMode
                    ? 'gold-gradient text-nile-900 shadow-lg shadow-pharaoh-500/20 cursor-pointer hover:opacity-90'
                    : 'bg-pharaoh-500/5 text-pharaoh-500/40 cursor-not-allowed'
                }`}>
                <Fingerprint size="18" /> {t('Digital Sign-Off and Compliance Attestation')}
              </button>
              {!isScrolledToBottom && !auditorMode && (
                <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-pharaoh-500/10 border border-pharaoh-500/20">
                  <ChevronDown size="12" className="text-pharaoh-400 animate-bounce" />
                  <span className="text-[10px] text-pharaoh-300">{t('Please scroll to the bottom of the document to enable attestation')}</span>
                </div>
              )}
              {isScrolledToBottom && !auditorMode && (
                <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-egyptian-green/10 border border-egyptian-green/20">
                  <CheckCircle size="12" className="text-egyptian-green" />
                  <span className="text-[10px] text-egyptian-green">{t('Scrolled to bottom &middot; Ready for signature')}</span>
                </div>
              )}
              {auditorMode && (
                <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-pharaoh-500/5 border border-pharaoh-500/15">
                  <Eye size="12" className="text-pharaoh-500/40" />
                  <span className="text-[10px] text-pharaoh-500/40">{t('Sign-off disabled in Auditor View')}</span>
                </div>
              )}
            </div>

            {showReceipt && receiptData && (
              <div className="pharaoh-card p-5 animate-fade-in" style={{ borderColor: 'rgba(45,125,70,0.3)' }}>
                <div className="flex items-center gap-2 mb-4"><CheckCircle size="16" className="text-egyptian-green" /><h3 className="text-sm font-semibold text-egyptian-green">{t('Attestation Completed Successfully')}</h3></div>
                <div className="space-y-2 text-xs">
                  {[
                    { label: t('User ID'), value: receiptData.userId, icon: User },
                    { label: t('Timestamp'), value: new Date(receiptData.timestamp).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US'), icon: Clock },
                    { label: t('Client IP'), value: receiptData.ip, icon: Monitor },
                    { label: t('Signature Hash'), value: receiptData.hash, icon: Fingerprint },
                    { label: t('Policy Version'), value: receiptData.policyVersion, icon: FileText },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center justify-between py-1.5 border-b border-pharaoh-500/10 last:border-0">
                      <div className="flex items-center gap-1.5"><Icon size="10" className="text-pharaoh-500/40" /><span className="text-pharaoh-500/40">{label}</span></div>
                      <span className="text-pharaoh-300 font-mono text-[10px]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'tracker' && (
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="grid grid-cols-4 gap-4 mb-5">
            {[
              { label: t('Total Employees'), value: totalAll, color: '#b8860b' },
              { label: t('Attested'), value: totalCompleted, color: '#2d7d46' },
              { label: t('Overall Rate'), value: `${overallRate}%`, color: '#c9a82e' },
              { label: t('Pending'), value: totalAll - totalCompleted, color: '#c41e3a' },
            ].map(stat => (
              <div key={stat.label} className="pharaoh-card p-4 text-center">
                <div className="text-2xl font-bold font-mono" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-xs text-pharaoh-500/40 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="pharaoh-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-pharaoh-200">{t('Attestation Compliance by Branch & Department')}</h3>
              <div className="relative"><Search size="14" className="absolute left-3 top-1/2 -translate-y-1/2 text-pharaoh-500/40" />
                <input type="text" placeholder={t('Search branch or department...')} className="w-56 bg-pharaoh-900/30 border border-pharaoh-500/15 rounded-lg py-1.5 pl-9 pr-3 text-xs text-pharaoh-300 placeholder-pharaoh-500/40 focus:border-pharaoh-500/30 focus:outline-none transition-all" /></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-pharaoh-500/10">
                    <th className="text-left py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">{t('Branch / Division')}</th>
                    <th className="text-left py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">{t('Department')}</th>
                    <th className="text-center py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">{t('Completed')}</th>
                    <th className="text-center py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">{t('Total')}</th>
                    <th className="text-center py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">{t('Rate')}</th>
                    <th className="text-center py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">{t('Last Attestation')}</th>
                    <th className="text-center py-3 px-3 text-[10px] text-pharaoh-400/60 font-medium">{t('Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {mockBranches.map((branch, idx) => {
                    const rate = Math.round((branch.completed / branch.total) * 100)
                    return (
                      <tr key={idx} className="border-b border-pharaoh-500/8 hover:bg-pharaoh-500/5 transition-colors">
                        <td className="py-3 px-3 text-xs text-pharaoh-300 font-medium">{branch.name}</td>
                        <td className="py-3 px-3 text-xs text-pharaoh-400/70">{branch.dept}</td>
                        <td className="py-3 px-3 text-center text-xs font-mono text-pharaoh-300">{branch.completed}</td>
                        <td className="py-3 px-3 text-center text-xs font-mono text-pharaoh-500/40">{branch.total}</td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-16 h-1.5 rounded-full bg-pharaoh-500/5 overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${rate}%`, backgroundColor: rate >= 90 ? '#2d7d46' : rate >= 70 ? '#c9a82e' : '#c41e3a' }} />
                            </div>
                            <span className={`text-xs font-medium font-mono ${rate >= 90 ? 'text-egyptian-green' : rate >= 70 ? 'text-pharaoh-400' : 'text-egyptian-red'}`}>{rate}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center"><div className="flex items-center justify-center gap-1"><Clock size="10" className="text-pharaoh-500/40" /><span className="text-[10px] text-pharaoh-500/40 font-mono">{branch.lastAttestation}</span></div></td>
                        <td className="py-3 px-3 text-center">
                          {rate >= 100 ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-egyptian-green/10 text-egyptian-green border border-egyptian-green/20">{t('Complete')}</span>
                          ) : rate >= 70 ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-pharaoh-500/10 text-pharaoh-300 border border-pharaoh-500/20">{t('In Progress')}</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-egyptian-red/10 text-egyptian-red border border-egyptian-red/20">{t('Attention')}</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-pharaoh-500/10">
              <span className="text-[10px] text-pharaoh-500/40">{mockBranches.length} {t('branches and departments')}</span>
              <div className="flex items-center gap-3 text-[10px] text-pharaoh-500/40">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-egyptian-green" /><span>{t('Excellent (90%+)')}</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-pharaoh-400" /><span>{t('Moderate (70-89%)')}</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-egyptian-red" /><span>{t('Needs Improvement (<70%)')}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
