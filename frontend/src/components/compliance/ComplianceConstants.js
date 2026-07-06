export const GOLD = '#d4a832'
export const SILVER = '#ced4da'
export const WHITE = '#f8f9fa'
export const EMERALD = '#20c997'
export const AMBER = '#fd7e14'
export const CRIMSON = '#dc3545'

export const TEMPLATES = {
  'Update Policy': 'Policy document needs to be updated to reflect current requirements. Evidence of version control and approval workflow attached.',
  'Missing Evidence': 'No evidence of control implementation was provided. Required: screenshots, configuration exports, or signed attestation.',
  'Partially Met': 'Control is partially implemented. Gap identified in [specific area]. Remediation plan submitted with target date.',
  'Fully Compliant': 'All requirements reviewed and confirmed compliant. Evidence verified and approved.',
  'Procedure Gap': 'Technical control exists but supporting procedure/documentation is missing or outdated.',
  'Training Gap': 'Staff awareness/training records for this control requirement could not be verified.',
}

export const STATUS_COLOR = {
  'Compliant': { bg: 'rgba(32,201,151,0.12)', text: '#20c997', border: 'rgba(32,201,151,0.25)' },
  'Non-Compliant': { bg: 'rgba(220,53,69,0.12)', text: '#dc3545', border: 'rgba(220,53,69,0.25)' },
  'Partially Compliant': { bg: 'rgba(253,126,20,0.10)', text: '#fd7e14', border: 'rgba(253,126,20,0.22)' },
  'Not Assessed': { bg: 'rgba(206,212,218,0.08)', text: '#ced4da', border: 'rgba(206,212,218,0.18)' },
  'Not Applicable': { bg: 'rgba(206,212,218,0.05)', text: '#ced4da', border: 'rgba(206,212,218,0.12)' },
}

export const TRACKER_SEV_COLORS = { Critical: '#dc3545', High: '#fd7e14', Medium: '#d4a832', Low: '#20c997' }
export const SEV_ORDER = ['Critical', 'High', 'Medium', 'Low']
export const TRACKER_BG = 'rgba(5,5,5,0.85)'
export const TRACKER_BORDER = '1px solid rgba(212,168,50,0.12)'
