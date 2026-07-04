import {
  Framework, Domain, Control, CrossMapping, TripleMapping,
  ComplianceAssessment
} from "../models/compliance";
import { ISO_CBE_PCI_MAPPINGS } from "./iso-cbe-pci-mappings";
import { TRIPLE_MAPPINGS } from "./triple-mappings-data";

export async function seedComplianceData() {
  const existing = await Framework.find().lean();
  if (existing.length > 0) {
    return; // Data already exists — don't clear on restart, preserve user data
  }

  // =========================================================
  // 1. FRAMEWORKS
  // =========================================================
  const frameworks = [
    { code: "ISO27001", name: "ISO/IEC 27001:2022", version: "2022", description: "Information security, cybersecurity and privacy protection — Information security management systems", authority: "ISO/IEC", domainCount: 4, controlCount: 93 },
    { code: "PCI_DSS", name: "PCI DSS v4.0.1", version: "4.0.1", description: "Payment Card Industry Data Security Standard", authority: "PCI Security Standards Council", domainCount: 6, controlCount: 12 },
    { code: "CBE_CSF", name: "Egypt Financial Cybersecurity Framework", version: "1.0", description: "Central Bank of Egypt — Cybersecurity Framework for Financial Sector", authority: "Central Bank of Egypt", domainCount: 8, controlCount: 64 },
  ];
  for (const f of frameworks) await Framework.create(f);

  // =========================================================
  // 2. DOMAINS
  // =========================================================
  const domains = [
    // ISO 27001 Domains
    { frameworkCode: "ISO27001", code: "ORG", name: "Organizational Controls", description: "Clause 5 — 37 controls addressing governance, policy, and organizational security", order: 1 },
    { frameworkCode: "ISO27001", code: "PPL", name: "People Controls", description: "Clause 6 — 8 controls addressing personnel security and awareness", order: 2 },
    { frameworkCode: "ISO27001", code: "PHY", name: "Physical Controls", description: "Clause 7 — 14 controls addressing physical and environmental security", order: 3 },
    { frameworkCode: "ISO27001", code: "TECH", name: "Technological Controls", description: "Clause 8 — 34 controls addressing technology and cybersecurity", order: 4 },

    // PCI DSS Domains (Goals)
    { frameworkCode: "PCI_DSS", code: "G1", name: "Build and Maintain a Secure Network and Systems", description: "Requirements 1-2: Firewall, secure configurations", order: 1 },
    { frameworkCode: "PCI_DSS", code: "G2", name: "Protect Cardholder Data", description: "Requirements 3-4: Storage, encryption, transmission", order: 2 },
    { frameworkCode: "PCI_DSS", code: "G3", name: "Maintain a Vulnerability Management Program", description: "Requirements 5-6: Anti-malware, secure development", order: 3 },
    { frameworkCode: "PCI_DSS", code: "G4", name: "Implement Strong Access Control Measures", description: "Requirements 7-9: Access control, authentication, physical", order: 4 },
    { frameworkCode: "PCI_DSS", code: "G5", name: "Regularly Monitor and Test Networks", description: "Requirements 10-11: Logging, monitoring, testing", order: 5 },
    { frameworkCode: "PCI_DSS", code: "G6", name: "Maintain an Information Security Policy", description: "Requirement 12: Policy, risk, awareness", order: 6 },

    // CBE CSF Domains
    { frameworkCode: "CBE_CSF", code: "GOV", name: "Governance", description: "Board oversight, cybersecurity strategy, roles and responsibilities", order: 1 },
    { frameworkCode: "CBE_CSF", code: "RISK", name: "Risk Management", description: "Cyber risk assessment, treatment, and reporting", order: 2 },
    { frameworkCode: "CBE_CSF", code: "OPS", name: "Security Operations", description: "Security monitoring, incident response, threat intelligence", order: 3 },
    { frameworkCode: "CBE_CSF", code: "IAM", name: "Identity & Access Management", description: "User access, privilege management, authentication", order: 4 },
    { frameworkCode: "CBE_CSF", code: "DAT", name: "Data Protection & Privacy", description: "Data classification, encryption, DLP", order: 5 },
    { frameworkCode: "CBE_CSF", code: "BCP", name: "Business Continuity & Resilience", description: "BCP, DRP, crisis management", order: 6 },
    { frameworkCode: "CBE_CSF", code: "TPR", name: "Third Party Risk", description: "Vendor security, supply chain, cloud", order: 7 },
    { frameworkCode: "CBE_CSF", code: "COM", name: "Compliance & Audit", description: "Regulatory compliance, internal audit, reporting", order: 8 },

  ];
  for (const d of domains) await Domain.create(d);

  // =========================================================
  // 3. CONTROLS — ISO 27001:2022 (All 93)
  // =========================================================
  const isoControls = [
    // Organizational (ORG) — 5.1 to 5.37
    { controlId: "5.1", name: "Policies for information security", purpose: "Define and maintain information security policies", guidance: "Policies must be approved by management, communicated to employees, and reviewed periodically" },
    { controlId: "5.2", name: "Information security roles and responsibilities", purpose: "Assign and communicate security roles", guidance: "Define RACI matrix for all security-related positions" },
    { controlId: "5.3", name: "Segregation of duties", purpose: "Reduce risk of fraud and error", guidance: "No single person should have conflicting responsibilities" },
    { controlId: "5.4", name: "Management responsibilities", purpose: "Ensure management drives security culture", guidance: "Management must demonstrate commitment to security" },
    { controlId: "5.5", name: "Contact with authorities", purpose: "Establish liaison with regulatory bodies", guidance: "Maintain contacts for incident reporting and regulatory consultation" },
    { controlId: "5.6", name: "Contact with special interest groups", purpose: "Stay informed on security trends", guidance: "Participate in ISACAs, FIRST, or sector-specific groups" },
    { controlId: "5.7", name: "Threat intelligence", purpose: "Collect and analyze threat information", guidance: "Subscribe to threat feeds and integrate with SIEM" },
    { controlId: "5.8", name: "Information security in project management", purpose: "Embed security in projects", guidance: "Apply security requirements throughout project lifecycle" },
    { controlId: "5.9", name: "Inventory of information and other associated assets", purpose: "Maintain asset inventory", guidance: "Classify assets by criticality and sensitivity" },
    { controlId: "5.10", name: "Acceptable use of information and other associated assets", purpose: "Define acceptable use rules", guidance: "Document and communicate acceptable use policies" },
    { controlId: "5.11", name: "Return of assets", purpose: "Ensure asset return upon termination", guidance: "Include in offboarding process" },
    { controlId: "5.12", name: "Classification of information", purpose: "Classify information by sensitivity", guidance: "Use confidentiality, integrity, availability labels" },
    { controlId: "5.13", name: "Labelling of information", purpose: "Label classified information", guidance: "Apply consistent labels (Confidential, Internal, Public)" },
    { controlId: "5.14", name: "Information transfer", purpose: "Secure information sharing", guidance: "Encrypt sensitive data in transit" },
    { controlId: "5.15", name: "Access control", purpose: "Control access to information", guidance: "Apply least privilege principle" },
    { controlId: "5.16", name: "Identity management", purpose: "Manage user identities", guidance: "Implement full identity lifecycle management" },
    { controlId: "5.17", name: "Authentication information", purpose: "Secure authentication credentials", guidance: "Enforce password policies, MFA" },
    { controlId: "5.18", name: "Access rights", purpose: "Review and manage access rights", guidance: "Conduct periodic access reviews" },
    { controlId: "5.19", name: "Information security in supplier relationships", purpose: "Manage supplier security risk", guidance: "Assess suppliers before engagement" },
    { controlId: "5.20", name: "Addressing security within supplier agreements", purpose: "Include security in contracts", guidance: "Define SLAs, security requirements, audit rights" },
    { controlId: "5.21", name: "Managing information security in the ICT supply chain", purpose: "Secure supply chain", guidance: "Assess sub-suppliers and dependencies" },
    { controlId: "5.22", name: "Monitoring, review and change management of supplier services", purpose: "Monitor supplier compliance", guidance: "Review supplier performance against SLAs" },
    { controlId: "5.23", name: "Information security for use of cloud services", purpose: "Secure cloud adoption", guidance: "Assess cloud provider certifications and data residency" },
    { controlId: "5.24", name: "Information security incident management planning and preparation", purpose: "Prepare incident response", guidance: "Develop IR plan, form incident response team" },
    { controlId: "5.25", name: "Assessment and decision on information security events", purpose: "Evaluate security events", guidance: "Triage and classify security events" },
    { controlId: "5.26", name: "Response to information security incidents", purpose: "Respond effectively to incidents", guidance: "Contain, eradicate, recover according to plan" },
    { controlId: "5.27", name: "Learning from information security incidents", purpose: "Improve from incidents", guidance: "Conduct post-incident reviews" },
    { controlId: "5.28", name: "Collection of evidence", purpose: "Gather forensic evidence", guidance: "Follow chain of custody procedures" },
    { controlId: "5.29", name: "Information security during disruption", purpose: "Maintain security during crises", guidance: "Integrate security into business continuity" },
    { controlId: "5.30", name: "ICT readiness for business continuity", purpose: "Ensure ICT resilience", guidance: "Test disaster recovery procedures" },
    { controlId: "5.31", name: "Legal, statutory, regulatory and contractual requirements", purpose: "Identify applicable requirements", guidance: "Maintain legal register" },
    { controlId: "5.32", name: "Intellectual property rights", purpose: "Protect IP", guidance: "Ensure licensed software usage" },
    { controlId: "5.33", name: "Protection of records", purpose: "Safeguard records", guidance: "Implement records retention according to legal requirements" },
    { controlId: "5.34", name: "Privacy and protection of PII", purpose: "Protect personal data", guidance: "Comply with PDPL and privacy regulations" },
    { controlId: "5.35", name: "Independent review of information security", purpose: "Conduct independent audits", guidance: "Schedule periodic internal and external audits" },
    { controlId: "5.36", name: "Compliance with policies, rules and standards for information security", purpose: "Enforce policy compliance", guidance: "Use automated compliance monitoring tools" },
    { controlId: "5.37", name: "Documented operating procedures", purpose: "Maintain operational procedures", guidance: "Document and version-control all operational procedures" },

    // People (PPL) — 6.1 to 6.8
    { controlId: "6.1", name: "Screening", purpose: "Vet personnel before engagement", guidance: "Conduct background checks proportionate to role" },
    { controlId: "6.2", name: "Terms and conditions of employment", purpose: "Include security in contracts", guidance: "Include confidentiality and security clauses" },
    { controlId: "6.3", name: "Information security awareness, education and training", purpose: "Build security culture", guidance: "Conduct annual training and phishing simulations" },
    { controlId: "6.4", name: "Disciplinary process", purpose: "Enforce security violations", guidance: "Define disciplinary measures for policy violations" },
    { controlId: "6.5", name: "Responsibilities after termination or change of employment", purpose: "Manage offboarding", guidance: "Revoke access, collect assets, debrief" },
    { controlId: "6.6", name: "Confidentiality or non-disclosure agreements", purpose: "Protect confidential information", guidance: "NDAs for employees, contractors, and third parties" },
    { controlId: "6.7", name: "Remote working", purpose: "Secure remote access", guidance: "VPN, endpoint security, secure collaboration tools" },
    { controlId: "6.8", name: "Information security event reporting", purpose: "Encourage incident reporting", guidance: "Provide clear reporting channels" },

    // Physical (PHY) — 7.1 to 7.14
    { controlId: "7.1", name: "Physical security perimeters", purpose: "Define security boundaries", guidance: "Use barriers, fences, access control points" },
    { controlId: "7.2", name: "Physical entry controls", purpose: "Control facility access", guidance: "Use card readers, biometrics, visitor logs" },
    { controlId: "7.3", name: "Securing offices, rooms and facilities", purpose: "Protect workspaces", guidance: "Lock doors, secure equipment, clear desk policy" },
    { controlId: "7.4", name: "Physical security monitoring", purpose: "Monitor facilities", guidance: "CCTV, intrusion detection, security patrols" },
    { controlId: "7.5", name: "Protecting against physical and environmental threats", purpose: "Mitigate environmental risks", guidance: "Fire suppression, UPS, climate control" },
    { controlId: "7.6", name: "Working in secure areas", purpose: "Control secure zone access", guidance: "Escort visitors, prohibit recording devices" },
    { controlId: "7.7", name: "Clear desk and clear screen", purpose: "Prevent information exposure", guidance: "Lock screens, secure documents when unattended" },
    { controlId: "7.8", name: "Equipment siting and protection", purpose: "Protect equipment", guidance: "Climate-controlled racks, cable management" },
    { controlId: "7.9", name: "Security of assets off-premises", purpose: "Secure mobile assets", guidance: "Encrypt laptops, track devices" },
    { controlId: "7.10", name: "Storage media", purpose: "Manage media lifecycle", guidance: "Cryptographically erase or physically destroy media" },
    { controlId: "7.11", name: "Supporting utilities", purpose: "Ensure utility resilience", guidance: "UPS, generator, redundant power feeds" },
    { controlId: "7.12", name: "Cabling security", purpose: "Protect network cabling", guidance: "Conceal cables, label, tamper-detect" },
    { controlId: "7.13", name: "Equipment maintenance", purpose: "Maintain equipment integrity", guidance: "Schedule maintenance, log servicing" },
    { controlId: "7.14", name: "Secure disposal or re-use of equipment", purpose: "Sanitize before disposal", guidance: "Degauss, shred, or certified destruction" },

    // Technological (TECH) — 8.1 to 8.34
    { controlId: "8.1", name: "User endpoint devices", purpose: "Secure endpoints", guidance: "MDM, antivirus, disk encryption" },
    { controlId: "8.2", name: "Privileged access rights", purpose: "Control administrative privileges", guidance: "Just-in-time access, PAM solution" },
    { controlId: "8.3", name: "Information access restriction", purpose: "Restrict access to information", guidance: "RBAC, ABAC, need-to-know" },
    { controlId: "8.4", name: "Access to source code", purpose: "Protect source code", guidance: "Version control, code review, access logging" },
    { controlId: "8.5", name: "Secure authentication", purpose: "Implement strong authentication", guidance: "MFA, passwordless, biometrics" },
    { controlId: "8.6", name: "Capacity management", purpose: "Ensure sufficient capacity", guidance: "Monitor utilization, plan for growth" },
    { controlId: "8.7", name: "Protection against malware", purpose: "Defend against malicious code", guidance: "Anti-malware, EDR, application whitelisting" },
    { controlId: "8.8", name: "Management of technical vulnerabilities", purpose: "Patch and remediate vulnerabilities", guidance: "Vulnerability scanning, patch management SLAs" },
    { controlId: "8.9", name: "Configuration management", purpose: "Secure baseline configurations", guidance: "CIS benchmarks, automated configuration validation" },
    { controlId: "8.10", name: "Information deletion", purpose: "Delete data when no longer needed", guidance: "Automated retention and deletion policies" },
    { controlId: "8.11", name: "Data masking", purpose: "Mask sensitive data", guidance: "Dynamic data masking, tokenization" },
    { controlId: "8.12", name: "Data leakage prevention", purpose: "Prevent unauthorized data exfiltration", guidance: "DLP solutions, content inspection" },
    { controlId: "8.13", name: "Information backup", purpose: "Ensure data recoverability", guidance: "3-2-1 backup rule, periodic testing" },
    { controlId: "8.14", name: "Redundancy of information processing facilities", purpose: "Ensure availability", guidance: "HA, failover clusters, geo-redundancy" },
    { controlId: "8.15", name: "Logging", purpose: "Record security events", guidance: "Centralized logging, log retention, SIEM" },
    { controlId: "8.16", name: "Monitoring activities", purpose: "Detect anomalous activity", guidance: "24/7 SOC monitoring, UEBA" },
    { controlId: "8.17", name: "Clock synchronisation", purpose: "Synchronize system clocks", guidance: "NTP, audit trail accuracy" },
    { controlId: "8.18", name: "Use of privileged utility programs", purpose: "Control system utilities", guidance: "Restrict usage, log all privileged commands" },
    { controlId: "8.19", name: "Installation of software on operational systems", purpose: "Control software deployment", guidance: "Change management, approval workflow" },
    { controlId: "8.20", name: "Networks security", purpose: "Secure network infrastructure", guidance: "Firewalls, segmentation, IDS/IPS" },
    { controlId: "8.21", name: "Security of network services", purpose: "Secure network services", guidance: "Baseline security for DHCP, DNS, VPN" },
    { controlId: "8.22", name: "Segregation of networks", purpose: "Isolate sensitive systems", guidance: "VLANs, DMZs, air-gapped networks" },
    { controlId: "8.23", name: "Web filtering", purpose: "Block malicious web content", guidance: "Proxy, URL filtering, DNS filtering" },
    { controlId: "8.24", name: "Use of cryptography", purpose: "Protect data with cryptography", guidance: "Encryption standards, key management lifecycle" },
    { controlId: "8.25", name: "Secure development life cycle", purpose: "Build security into development", guidance: "SSDLC, threat modeling, security requirements" },
    { controlId: "8.26", name: "Application security requirements", purpose: "Define security requirements for apps", guidance: "OWASP ASVS, security acceptance criteria" },
    { controlId: "8.27", name: "Secure system architecture and engineering principles", purpose: "Design secure systems", guidance: "Defense-in-depth, least privilege" },
    { controlId: "8.28", name: "Secure coding", purpose: "Write secure code", guidance: "SAST, code review, secure coding standards" },
    { controlId: "8.29", name: "Security testing in development and acceptance", purpose: "Test for vulnerabilities", guidance: "DAST, penetration testing, UAT" },
    { controlId: "8.30", name: "Outsourced development", purpose: "Manage external development", guidance: "Security requirements, acceptance testing" },
    { controlId: "8.31", name: "Separation of development, test and production environments", purpose: "Isolate environments", guidance: "No production data in test, access controls" },
    { controlId: "8.32", name: "Change management", purpose: "Manage system changes", guidance: "CAB, change approval, backout plans" },
    { controlId: "8.33", name: "Test information", purpose: "Protect test data", guidance: "Anonymize production data used in testing" },
    { controlId: "8.34", name: "Audit logging", purpose: "Log security-relevant events", guidance: "Immutable logs, SIEM integration" },
  ];

  for (const c of isoControls) {
    const domainCode = c.controlId.startsWith("5") ? "ORG" : c.controlId.startsWith("6") ? "PPL" : c.controlId.startsWith("7") ? "PHY" : "TECH";
    await Control.create({
      frameworkCode: "ISO27001", domainCode, controlId: c.controlId,
      name: c.name, purpose: c.purpose, guidance: c.guidance,
      weight: 1, order: parseInt(c.controlId.split(".")[1]),
    });
  }

  // =========================================================
  // 4. CONTROLS — PCI DSS v4.0.1 (12 Requirements)
  // =========================================================
  const pciControls = [
    { controlId: "1", domainCode: "G1", name: "Install and Maintain Network Security Controls", description: "Firewalls, segmentation, network diagrams", guidance: "Implement firewalls between cardholder data and untrusted networks" },
    { controlId: "2", domainCode: "G1", name: "Apply Secure Configurations to All System Components", description: "Remove defaults, hardening standards", guidance: "Disable unnecessary services, change default passwords" },
    { controlId: "3", domainCode: "G2", name: "Protect Stored Account Data", description: "Encryption, truncation, hashing, tokenization", guidance: "Render PAN unreadable anywhere it is stored" },
    { controlId: "4", domainCode: "G2", name: "Protect Cardholder Data with Strong Cryptography During Transmission", description: "TLS, SSH, SFTP", guidance: "Use strong encryption for all open/public networks" },
    { controlId: "5", domainCode: "G3", name: "Protect All Systems and Networks from Malicious Software", description: "Anti-malware, EDR, scans", guidance: "Deploy anti-malware on all systems, keep definitions current" },
    { controlId: "6", domainCode: "G3", name: "Develop and Maintain Secure Systems and Software", description: "Patch management, SDLC, vuln scanning", guidance: "Apply critical patches within 30 days" },
    { controlId: "7", domainCode: "G4", name: "Restrict Access to System Components and Cardholder Data by Business Need-to-Know", description: "RBAC, access reviews", guidance: "Limit access to minimum necessary for job function" },
    { controlId: "8", domainCode: "G4", name: "Identify Users and Authenticate Access to System Components", description: "Unique IDs, MFA, password policy", guidance: "Assign unique IDs, implement MFA for all admin access" },
    { controlId: "9", domainCode: "G4", name: "Restrict Physical Access to Cardholder Data", description: "Physical security, visitor controls, media disposal", guidance: "Securely destroy cardholder data when no longer needed" },
    { controlId: "10", domainCode: "G5", name: "Log and Monitor All Access to System Components and Cardholder Data", description: "Audit trails, log retention, SIEM", guidance: "Log all access to cardholder data, retain logs for 12 months" },
    { controlId: "11", domainCode: "G5", name: "Test Security of Systems and Networks Regularly", description: "Vulnerability scans, penetration tests, IDS/IPS", guidance: "Quarterly internal/external scans, annual pen tests" },
    { controlId: "12", domainCode: "G6", name: "Support Information Security with Organizational Policies and Programs", description: "Risk assessment, awareness, incident response", guidance: "Annual review of security policies and risk assessments" },
  ];
  for (const c of pciControls) {
    await Control.create({
      frameworkCode: "PCI_DSS", domainCode: c.domainCode, controlId: c.controlId,
      name: c.name, description: c.description, purpose: c.description, guidance: c.guidance,
      weight: 1, order: parseInt(c.controlId),
    });
  }

  // =========================================================
  // 5. CONTROLS — CBE CSF (64 controls across 8 domains)
  // =========================================================
  const cbeControls = [
    // Governance
    { controlId: "GOV-1", domainCode: "GOV", name: "Cybersecurity Strategy", guidance: "Board-approved cybersecurity strategy aligned with business objectives" },
    { controlId: "GOV-2", domainCode: "GOV", name: "Board Oversight", guidance: "Board members with cybersecurity expertise, regular reporting" },
    { controlId: "GOV-3", domainCode: "GOV", name: "Roles and Responsibilities", guidance: "CISO, security committees, clear accountability" },
    { controlId: "GOV-4", domainCode: "GOV", name: "Cybersecurity Policy Framework", guidance: "Tiered policy structure with annual review" },
    { controlId: "GOV-5", domainCode: "GOV", name: "Resource Allocation", guidance: "Adequate budget and staffing for cybersecurity program" },
    { controlId: "GOV-6", domainCode: "GOV", name: "Cybersecurity Metrics and Reporting", guidance: "KRI/KPI dashboards for management reporting" },
    { controlId: "GOV-7", domainCode: "GOV", name: "Independent Assurance", guidance: "Internal and external audits of cybersecurity program" },
    { controlId: "GOV-8", domainCode: "GOV", name: "Cyber Insurance", guidance: "Evaluate and maintain cyber risk insurance coverage" },

    // Risk Management
    { controlId: "RSK-1", domainCode: "RISK", name: "Cyber Risk Assessment Framework", guidance: "Formal methodology for cyber risk identification and assessment" },
    { controlId: "RSK-2", domainCode: "RISK", name: "Risk Register", guidance: "Maintain and update cyber risk register" },
    { controlId: "RSK-3", domainCode: "RISK", name: "Risk Treatment Plan", guidance: "Documented risk treatment with remediation timelines" },
    { controlId: "RSK-4", domainCode: "RISK", name: "Risk Appetite Statement", guidance: "Defined risk tolerance levels for cyber risks" },
    { controlId: "RSK-5", domainCode: "RISK", name: "Emerging Risk Monitoring", guidance: "Monitor new and emerging cyber threats" },
    { controlId: "RSK-6", domainCode: "RISK", name: "Risk Reporting to Board", guidance: "Quarterly cyber risk reporting to board" },
    { controlId: "RSK-7", domainCode: "RISK", name: "Business Impact Analysis", guidance: "BIA for critical systems and processes" },
    { controlId: "RSK-8", domainCode: "RISK", name: "Risk Acceptance", guidance: "Formal risk acceptance process with approval levels" },

    // Security Operations
    { controlId: "OPS-1", domainCode: "OPS", name: "Security Operations Center", guidance: "24/7 SOC or MSSP arrangement" },
    { controlId: "OPS-2", domainCode: "OPS", name: "Incident Response Plan", guidance: "Documented IR plan with defined roles and procedures" },
    { controlId: "OPS-3", domainCode: "OPS", name: "Threat Intelligence", guidance: "Subscribe to threat intelligence feeds" },
    { controlId: "OPS-4", domainCode: "OPS", name: "Vulnerability Management", guidance: "Continuous vulnerability scanning and remediation" },
    { controlId: "OPS-5", domainCode: "OPS", name: "Penetration Testing", guidance: "Annual penetration testing on critical systems" },
    { controlId: "OPS-6", domainCode: "OPS", name: "Malware Protection", guidance: "Anti-malware, EDR, application control" },
    { controlId: "OPS-7", domainCode: "OPS", name: "Email and Web Security", guidance: "Email filtering, web proxy, DLP" },
    { controlId: "OPS-8", domainCode: "OPS", name: "Forensic Readiness", guidance: "Forensic capabilities, evidence collection procedures" },

    // Identity & Access Management
    { controlId: "IAM-1", domainCode: "IAM", name: "User Access Management", guidance: "Full identity lifecycle management (join/move/leave)" },
    { controlId: "IAM-2", domainCode: "IAM", name: "Privileged Access Management", guidance: "PAM solution, just-in-time admin access" },
    { controlId: "IAM-3", domainCode: "IAM", name: "Multi-Factor Authentication", guidance: "MFA for all privileged and remote access" },
    { controlId: "IAM-4", domainCode: "IAM", name: "Access Reviews", guidance: "Quarterly access rights reviews" },
    { controlId: "IAM-5", domainCode: "IAM", name: "Role-Based Access Control", guidance: "RBAC with segregation of duties" },
    { controlId: "IAM-6", domainCode: "IAM", name: "Authentication Mechanisms", guidance: "Password policy, SSO, certificate-based auth" },
    { controlId: "IAM-7", domainCode: "IAM", name: "Session Management", guidance: "Session timeout, concurrent session limits" },
    { controlId: "IAM-8", domainCode: "IAM", name: "Third-Party Access", guidance: "Controlled access for vendors and consultants" },

    // Data Protection & Privacy
    { controlId: "DAT-1", domainCode: "DAT", name: "Data Classification", guidance: "Classification scheme with handling requirements" },
    { controlId: "DAT-2", domainCode: "DAT", name: "Data Encryption at Rest", guidance: "Encrypt sensitive data at rest using AES-256" },
    { controlId: "DAT-3", domainCode: "DAT", name: "Data Encryption in Transit", guidance: "TLS 1.2+ for all data in transit" },
    { controlId: "DAT-4", domainCode: "DAT", name: "Data Loss Prevention", guidance: "DLP controls for data exfiltration prevention" },
    { controlId: "DAT-5", domainCode: "DAT", name: "Data Retention and Disposal", guidance: "Retention schedules, secure deletion" },
    { controlId: "DAT-6", domainCode: "DAT", name: "Database Security", guidance: "Database activity monitoring, masking" },
    { controlId: "DAT-7", domainCode: "DAT", name: "Privacy Impact Assessment", guidance: "DPIA for high-risk processing activities" },
    { controlId: "DAT-8", domainCode: "DAT", name: "Consent Management", guidance: "Manage data processing consents" },

    // Business Continuity
    { controlId: "BCP-1", domainCode: "BCP", name: "Business Continuity Strategy", guidance: "BC strategy aligned with risk appetite" },
    { controlId: "BCP-2", domainCode: "BCP", name: "Disaster Recovery Plans", guidance: "IT DR plans for critical systems" },
    { controlId: "BCP-3", domainCode: "BCP", name: "Backup and Restoration", guidance: "Regular backups with restoration testing" },
    { controlId: "BCP-4", domainCode: "BCP", name: "BCP/DR Testing", guidance: "Annual testing of BCP and DR plans" },
    { controlId: "BCP-5", domainCode: "BCP", name: "Crisis Management", guidance: "Crisis management team, communication plan" },
    { controlId: "BCP-6", domainCode: "BCP", name: "Alternative Sites", guidance: "Hot/warm/cold sites as per criticality" },
    { controlId: "BCP-7", domainCode: "BCP", name: "Cyber Resilience", guidance: "Resilience testing against cyber attacks" },
    { controlId: "BCP-8", domainCode: "BCP", name: "Supply Chain Continuity", guidance: "Vendor BCP alignment" },

    // Third Party Risk
    { controlId: "TPR-1", domainCode: "TPR", name: "Vendor Risk Assessment", guidance: "Risk-based assessment before onboarding" },
    { controlId: "TPR-2", domainCode: "TPR", name: "Contractual Security Requirements", guidance: "Security clauses in all vendor contracts" },
    { controlId: "TPR-3", domainCode: "TPR", name: "Vendor Monitoring", guidance: "Continuous monitoring of critical vendors" },
    { controlId: "TPR-4", domainCode: "TPR", name: "Cloud Service Provider Assessment", guidance: "Cloud security assessment (CSA STAR, SOC 2)" },
    { controlId: "TPR-5", domainCode: "TPR", name: "Vendor Access Control", guidance: "Control and audit vendor access to systems" },
    { controlId: "TPR-6", domainCode: "TPR", name: "Vendor Incident Reporting", guidance: "Vendors must report security incidents" },
    { controlId: "TPR-7", domainCode: "TPR", name: "Vendor Termination", guidance: "Secure offboarding, data return/destruction" },
    { controlId: "TPR-8", domainCode: "TPR", name: "Concentration Risk", guidance: "Monitor vendor concentration risk" },

    // Compliance & Audit
    { controlId: "COM-1", domainCode: "COM", name: "Regulatory Compliance Monitoring", guidance: "Track compliance with CBE regulations" },
    { controlId: "COM-2", domainCode: "COM", name: "Internal Audit", guidance: "Independent internal audit of cybersecurity controls" },
    { controlId: "COM-3", domainCode: "COM", name: "External Audit", guidance: "Periodic external audits and assessments" },
    { controlId: "COM-4", domainCode: "COM", name: "Regulatory Reporting", guidance: "Timely reporting to CBE and regulators" },
    { controlId: "COM-5", domainCode: "COM", name: "Compliance with International Standards", guidance: "Adopt ISO 27001, PCI DSS as applicable" },
    { controlId: "COM-6", domainCode: "COM", name: "Findings Management", guidance: "Track and remediate audit findings" },
    { controlId: "COM-7", domainCode: "COM", name: "Policy Compliance Monitoring", guidance: "Automated policy compliance checks" },
    { controlId: "COM-8", domainCode: "COM", name: "Board Reporting", guidance: "Comprehensive compliance reporting to board" },
  ];
  for (const c of cbeControls) {
    await Control.create({
      frameworkCode: "CBE_CSF", domainCode: c.domainCode, controlId: c.controlId,
      name: c.name, purpose: c.name, guidance: c.guidance,
      weight: 1, order: parseInt(c.controlId.split("-")[1]),
    });
  }

  // =========================================================
  // 6. CROSS MAPPINGS (ISO ↔ CBE ↔ PCI — from Excel sheet)
  // =========================================================
  for (const m of ISO_CBE_PCI_MAPPINGS) await CrossMapping.create({ ...m, createdAt: new Date().toISOString() });

  // Seed TripleMappings from the Excel sheet data
  const CBE_CAT_PREFIX: Record<string, string> = {
    '1': 'GOV', '2': 'RSK', '3': 'OPS', '4': 'IAM',
    '5': 'DAT', '6': 'BCP', '7': 'TPR', '8': 'COM',
    '9': 'GOV', '10': 'GOV', '11': 'OPS', '12': 'COM', '13': 'OPS', '14': 'DAT',
  };
  const firstRef = (s: string) => s.split(' / ')[0].trim();
  const cbeToDb = (ref: string) => {
    if (ref === '—' || !ref) return '';
    const r = firstRef(ref);
    const p = r.split('.');
    if (p.length < 2) return '';
    return `${CBE_CAT_PREFIX[p[0]] || ''}-${p[1]}`;
  };
  const pciToDb = (ref: string) => {
    if (ref === '—' || !ref) return '';
    const r = firstRef(ref);
    return r.split('.')[0];
  };
  const isoToDb = (ref: string) => {
    let r = ref;
    if (r.startsWith('A.')) r = r.slice(2);
    else if (r.startsWith('Cl.')) r = r.slice(3);
    return r;
  };
  const existingTriples = await TripleMapping.find().lean();
  if (existingTriples.length === 0) {
    for (const m of TRIPLE_MAPPINGS) {
      await TripleMapping.create({
        ...m,
        isoDbControlId: isoToDb(m.isoRef),
        cbeDbControlId: cbeToDb(m.cbeRef),
        pciDbControlId: pciToDb(m.pciRef),
        isCustom: false, createdAt: new Date().toISOString()
      });
    }
  }

  console.log(`Seeded ${frameworks.length} frameworks, ${domains.length} domains, ${isoControls.length + pciControls.length + cbeControls.length} controls, ${ISO_CBE_PCI_MAPPINGS.length} cross-mappings, ${TRIPLE_MAPPINGS.length} triple mappings`);
}
