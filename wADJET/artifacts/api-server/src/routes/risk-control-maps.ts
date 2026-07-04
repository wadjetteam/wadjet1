import { Router, type IRouter } from "express";
import {
  RiskControlMap,
  Control,
  Risk,
  ControlRejectionLog,
  insertRiskControlMapSchema,
  approveRiskControlMapSchema,
  rejectSuggestionSchema,
} from "@workspace/db";

const router: IRouter = Router();

// ── Weight formula: W_i = min(50, R_i × 6 + D_i × 4) ──
type KeywordSeedEntry = {
  refs: string[];
  reasoning: string;
  weight: number;
  frameworkCode: string;
  regulatoryImportance: number;
  domainApplicability: number;
};

function computeWeight(ri: number, di: number): number {
  return Math.min(50, ri * 6 + di * 4);
}

// ── Keyword-to-control seed rules ──
// frameworkCode: ISO27001 | PCI_DSS | CBE | GRC | HYBRID
// regulatoryImportance (R_i 1-8): PCI_DSS=8 ISO27001=6 CBE=5 GRC=3
// domainApplicability (D_i 1-5): exact=5 partial=3 tangential=1
const KEYWORD_SEED: Record<string, KeywordSeedEntry> = {
  phishing: {
    refs: ["7.1", "8.3", "IAM-1", "2", "7"],
    reasoning: "Risk involves phishing attacks — requires access control and authentication controls",
    frameworkCode: "HYBRID",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  credential: {
    refs: ["7.1", "7.2", "8.3", "IAM-1", "IAM-2", "IAM-3", "2", "7", "8.4"],
    reasoning: "Credential-related risk — identity and access management controls apply",
    frameworkCode: "HYBRID",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  ransomware: {
    refs: ["6.1", "6.2", "6.3", "8.7", "OPS-1", "OPS-2", "3", "4", "5", "6"],
    reasoning: "Ransomware risk — malware protection and operational security controls needed",
    frameworkCode: "HYBRID",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  malware: {
    refs: ["6.1", "6.2", "6.3", "8.7", "OPS-1", "OPS-2", "3", "4", "5", "6"],
    reasoning: "Malware risk — protective controls and monitoring required",
    frameworkCode: "HYBRID",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  encryption: {
    refs: ["6.1", "6.3", "8.5", "8.6", "DAT-1", "DAT-2", "DAT-3", "3", "4"],
    reasoning: "Encryption risk — cryptographic controls and data protection apply",
    frameworkCode: "HYBRID",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  "data leak": {
    refs: ["6.1", "6.3", "8.5", "8.6", "8.7", "8.8", "DAT-1", "DAT-2", "DAT-3", "3", "4"],
    reasoning: "Data leakage risk — data protection and monitoring controls needed",
    frameworkCode: "HYBRID",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  leakage: {
    refs: ["6.1", "6.3", "8.5", "8.6", "8.7", "8.8", "DAT-1", "DAT-2", "DAT-3", "3", "4"],
    reasoning: "Data leakage risk — data protection and monitoring controls needed",
    frameworkCode: "HYBRID",
    regulatoryImportance: 6,
    domainApplicability: 4,
    weight: computeWeight(6, 4),
  },
  breach: {
    refs: ["6.1", "6.3", "8.7", "8.8", "OPS-1", "OPS-2", "3", "4", "5", "6", "10"],
    reasoning: "Breach risk — incident detection, response, and operational controls apply",
    frameworkCode: "HYBRID",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  incident: {
    refs: ["6.1", "6.5", "6.6", "6.7", "6.8", "OPS-1", "OPS-2", "OPS-3", "10", "11", "12"],
    reasoning: "Incident-related risk — incident management and reporting controls needed",
    frameworkCode: "HYBRID",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  "incident response": {
    refs: ["6.5", "6.6", "6.7", "6.8", "OPS-1", "OPS-2", "OPS-3", "10", "11", "12"],
    reasoning: "Incident response risk — formal incident management process required",
    frameworkCode: "HYBRID",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  fraud: {
    refs: ["5.1", "5.2", "5.3", "6.1", "6.2", "GOV-1", "GOV-2", "1", "2", "3", "4"],
    reasoning: "Fraud risk — governance and monitoring controls recommended",
    frameworkCode: "CBE",
    regulatoryImportance: 5,
    domainApplicability: 5,
    weight: computeWeight(5, 5),
  },
  "insider threat": {
    refs: ["6.1", "6.2", "6.3", "7.1", "7.2", "IAM-1", "IAM-2", "OPS-1", "3", "4", "5"],
    reasoning: "Insider threat risk — access control and monitoring controls needed",
    frameworkCode: "HYBRID",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  "unauthorized access": {
    refs: ["7.1", "7.2", "8.1", "8.2", "8.3", "IAM-1", "IAM-2", "IAM-3", "1", "2", "7"],
    reasoning: "Unauthorized access risk — identity and access management controls critical",
    frameworkCode: "HYBRID",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  "privileged access": {
    refs: ["7.1", "7.2", "8.1", "8.2", "8.3", "IAM-1", "IAM-2", "IAM-3", "1", "2", "7"],
    reasoning: "Privileged access risk — privileged access management controls required",
    frameworkCode: "HYBRID",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  access: {
    refs: ["7.1", "7.2", "7.3", "8.1", "8.2", "8.3", "IAM-1", "IAM-2", "7"],
    reasoning: "Access-related risk — access control and identity management controls apply",
    frameworkCode: "GRC",
    regulatoryImportance: 3,
    domainApplicability: 3,
    weight: computeWeight(3, 3),
  },
  vendor: {
    refs: ["5.3", "5.19", "5.20", "5.21", "5.22", "TPR-1", "TPR-2", "TPR-3", "5", "9", "12"],
    reasoning: "Third-party/vendor risk — supplier security and vendor management controls needed",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  "third party": {
    refs: ["5.19", "5.20", "5.21", "5.22", "TPR-1", "TPR-2", "TPR-3", "5", "9", "12"],
    reasoning: "Third-party risk — vendor security assessment and oversight controls required",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  supplier: {
    refs: ["5.19", "5.20", "5.21", "5.22", "TPR-1", "TPR-2", "TPR-3", "5", "9", "12"],
    reasoning: "Supplier risk — third-party risk management controls apply",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 4,
    weight: computeWeight(6, 4),
  },
  continuity: {
    refs: ["5.4", "5.29", "5.30", "BCP-1", "BCP-2", "BCP-3", "5", "9", "11"],
    reasoning: "Business continuity risk — BC/DR controls and contingency planning needed",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  "business continuity": {
    refs: ["5.29", "5.30", "BCP-1", "BCP-2", "BCP-3", "5", "9", "11"],
    reasoning: "Business continuity risk — formal BCMS and disaster recovery controls required",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  disaster: {
    refs: ["5.29", "5.30", "BCP-1", "BCP-2", "BCP-3", "5", "9", "11"],
    reasoning: "Disaster risk — business continuity and disaster recovery controls required",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 4,
    weight: computeWeight(6, 4),
  },
  backup: {
    refs: ["5.29", "5.30", "8.9", "8.10", "BCP-1", "BCP-2", "BCP-3", "5", "9", "11"],
    reasoning: "Backup risk — data backup and recovery controls needed",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 4,
    weight: computeWeight(6, 4),
  },
  restore: {
    refs: ["5.29", "5.30", "8.9", "8.10", "BCP-1", "BCP-2", "BCP-3", "5", "9", "11"],
    reasoning: "Restore risk — data recovery and business continuity controls apply",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 3,
    weight: computeWeight(6, 3),
  },
  awareness: {
    refs: ["5.8", "5.9", "5.10", "7.4", "COM-1", "COM-2", "COM-3", "1", "2", "12"],
    reasoning: "Awareness gap — security awareness training and communication controls needed",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  training: {
    refs: ["5.8", "5.9", "5.10", "7.4", "COM-1", "COM-2", "COM-3", "1", "2", "12"],
    reasoning: "Training risk — security awareness and competency controls apply",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 4,
    weight: computeWeight(6, 4),
  },
  compliance: {
    refs: ["5.1", "5.2", "5.3", "5.4", "COM-1", "COM-2", "COM-3", "1", "12"],
    reasoning: "Compliance risk — governance, policy, and regulatory compliance controls needed",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  regulatory: {
    refs: ["5.1", "5.2", "5.3", "5.4", "COM-1", "COM-2", "COM-3", "1", "12"],
    reasoning: "Regulatory risk — compliance monitoring and regulatory controls required",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  "non-compliance": {
    refs: ["5.1", "5.2", "5.3", "5.4", "COM-1", "COM-2", "COM-3", "1", "12"],
    reasoning: "Non-compliance risk — policy enforcement and compliance monitoring controls critical",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  asset: {
    refs: ["5.1", "5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "GOV-1", "GOV-2", "GOV-3", "5", "9"],
    reasoning: "Asset-related risk — asset management and inventory controls needed",
    frameworkCode: "GRC",
    regulatoryImportance: 3,
    domainApplicability: 3,
    weight: computeWeight(3, 3),
  },
  "asset management": {
    refs: ["5.1", "5.2", "5.3", "5.4", "GOV-1", "GOV-2", "GOV-3", "5", "9"],
    reasoning: "Asset management risk — formal asset inventory and classification controls required",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  logging: {
    refs: ["6.1", "6.3", "8.7", "8.8", "OPS-1", "OPS-2", "OPS-3", "3", "4", "10"],
    reasoning: "Logging risk — audit logging and monitoring controls needed",
    frameworkCode: "HYBRID",
    regulatoryImportance: 6,
    domainApplicability: 4,
    weight: computeWeight(6, 4),
  },
  monitoring: {
    refs: ["6.1", "6.3", "6.5", "6.6", "8.7", "8.8", "OPS-1", "OPS-2", "OPS-3", "3", "4", "10"],
    reasoning: "Monitoring risk — continuous monitoring and detection controls apply",
    frameworkCode: "HYBRID",
    regulatoryImportance: 6,
    domainApplicability: 4,
    weight: computeWeight(6, 4),
  },
  "risk assessment": {
    refs: ["5.1", "5.2", "5.3", "5.4", "RSK-1", "RSK-2", "RSK-3", "1", "5", "12"],
    reasoning: "Risk assessment — formal risk assessment and treatment controls required",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  "risk management": {
    refs: ["5.1", "5.2", "5.3", "RSK-1", "RSK-2", "RSK-3", "1", "5", "12"],
    reasoning: "Risk management — enterprise risk management framework controls apply",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 4,
    weight: computeWeight(6, 4),
  },
  change: {
    refs: ["5.1", "5.2", "5.3", "5.4", "5.5", "5.6", "GOV-1", "GOV-2", "GOV-3", "5"],
    reasoning: "Change-related risk — change management and configuration controls needed",
    frameworkCode: "GRC",
    regulatoryImportance: 3,
    domainApplicability: 3,
    weight: computeWeight(3, 3),
  },
  "change management": {
    refs: ["5.5", "5.6", "GOV-1", "GOV-2", "GOV-3", "5"],
    reasoning: "Change management risk — formal change control and approval process required",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  password: {
    refs: ["7.1", "7.2", "8.3", "IAM-1", "IAM-2", "IAM-3", "1", "2", "7", "8.4"],
    reasoning: "Password-related risk — authentication policy and credential management controls needed",
    frameworkCode: "HYBRID",
    regulatoryImportance: 6,
    domainApplicability: 4,
    weight: computeWeight(6, 4),
  },
  authentication: {
    refs: ["7.1", "7.2", "8.3", "8.4", "IAM-1", "IAM-2", "IAM-3", "2", "7"],
    reasoning: "Authentication risk — multi-factor authentication and identity controls apply",
    frameworkCode: "HYBRID",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  audit: {
    refs: ["5.1", "5.2", "5.3", "GOV-1", "GOV-2", "COM-1", "1", "12"],
    reasoning: "Audit risk — internal audit and compliance monitoring controls needed",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 4,
    weight: computeWeight(6, 4),
  },
  // ── ISO 27001:2022 Annex A keywords ──
  "threat intelligence": {
    refs: ["5.7", "5.24", "5.25"],
    reasoning: "Threat intelligence risk — ISO 27001:2022 A.5.7 requires threat intel collection and analysis",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  cloud: {
    refs: ["5.23", "8.18"],
    reasoning: "Cloud services risk — ISO 27001:2022 A.5.23 governs information security for cloud services",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  "secure coding": {
    refs: ["8.28", "8.25"],
    reasoning: "Secure coding risk — ISO 27001:2022 A.8.28 mandates secure coding principles",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  segmentation: {
    refs: ["8.22", "1"],
    reasoning: "Network segmentation risk — ISO 27001:2022 A.8.22 requires network segregation controls",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 4,
    weight: computeWeight(6, 4),
  },
  "network security": {
    refs: ["8.20", "8.21", "8.22", "1"],
    reasoning: "Network security risk — ISO 27001:2022 A.8.20-A.8.22 govern network security controls",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  "web filtering": {
    refs: ["8.23"],
    reasoning: "Web filtering risk — ISO 27001:2022 A.8.23 requires web filtering controls",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 4,
    weight: computeWeight(6, 4),
  },
  "data masking": {
    refs: ["8.11"],
    reasoning: "Data masking risk — ISO 27001:2022 A.8.11 requires data masking controls",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 4,
    weight: computeWeight(6, 4),
  },
  deletion: {
    refs: ["8.10"],
    reasoning: "Information deletion risk — ISO 27001:2022 A.8.10 governs secure information deletion",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 4,
    weight: computeWeight(6, 4),
  },
  "capacity management": {
    refs: ["8.6"],
    reasoning: "Capacity management risk — ISO 27001:2022 A.8.6 requires capacity monitoring and planning",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 3,
    weight: computeWeight(6, 3),
  },
  redundancy: {
    refs: ["8.14", "5.29", "5.30"],
    reasoning: "Redundancy risk — ISO 27001:2022 A.8.14 requires redundancy of information processing facilities",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 4,
    weight: computeWeight(6, 4),
  },
  teleworking: {
    refs: ["7.7"],
    reasoning: "Teleworking risk — ISO 27001:2022 A.7.7 governs teleworking security",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 4,
    weight: computeWeight(6, 4),
  },
  "clear desk": {
    refs: ["7.8"],
    reasoning: "Clear desk risk — ISO 27001:2022 A.7.8 requires clear desk and clear screen policy",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 3,
    weight: computeWeight(6, 3),
  },
  "asset inventory": {
    refs: ["5.9"],
    reasoning: "Asset inventory risk — ISO 27001:2022 A.5.9 requires asset inventory and ownership",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  classification: {
    refs: ["5.12", "5.13"],
    reasoning: "Classification risk — ISO 27001:2022 A.5.12-A.5.13 govern information classification and labelling",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  "information transfer": {
    refs: ["8.34"],
    reasoning: "Information transfer risk — ISO 27001:2022 A.8.34 governs secure information transfer",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 3,
    weight: computeWeight(6, 3),
  },
  screening: {
    refs: ["6.1"],
    reasoning: "Screening risk — ISO 27001:2022 A.6.1 requires background verification checks",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 4,
    weight: computeWeight(6, 4),
  },
  "equipment maintenance": {
    refs: ["7.10"],
    reasoning: "Equipment maintenance risk — ISO 27001:2022 A.7.10 governs equipment maintenance security",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 3,
    weight: computeWeight(6, 3),
  },
  "cabling security": {
    refs: ["7.6"],
    reasoning: "Cabling security risk — ISO 27001:2022 A.7.6 requires cabling protection",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 3,
    weight: computeWeight(6, 3),
  },
  "application security": {
    refs: ["8.25", "8.26", "8.27"],
    reasoning: "Application security risk — ISO 27001:2022 A.8.25-A.8.27 govern secure development lifecycle",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  "outsourced development": {
    refs: ["8.30"],
    reasoning: "Outsourced development risk — ISO 27001:2022 A.8.30 governs outsourced development security",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 3,
    weight: computeWeight(6, 3),
  },
  "environment separation": {
    refs: ["8.31"],
    reasoning: "Environment separation risk — ISO 27001:2022 A.8.31 requires separation of dev/test/prod",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 4,
    weight: computeWeight(6, 4),
  },
  "vulnerability management": {
    refs: ["8.8", "6"],
    reasoning: "Vulnerability management risk — ISO 27001:2022 A.8.8 requires technical vulnerability management",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  "change control": {
    refs: ["8.32", "5.5", "5.6"],
    reasoning: "Change control risk — ISO 27001:2022 A.8.32 requires formal change management",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  "physical security": {
    refs: ["7.1", "7.2", "7.3", "7.4", "7.9"],
    reasoning: "Physical security risk — ISO 27001:2022 A.7.1-A.7.4, A.7.9 govern physical perimeter and entry controls",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  cryptography: {
    refs: ["8.24"],
    reasoning: "Cryptography risk — ISO 27001:2022 A.8.24 governs use of cryptography policy",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 4,
    weight: computeWeight(6, 4),
  },
  "key management": {
    refs: ["8.24", "3", "4"],
    reasoning: "Key management risk — cryptographic key management controls required under ISO 27001 and PCI DSS",
    frameworkCode: "HYBRID",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
  "clock synchronisation": {
    refs: ["8.17"],
    reasoning: "Clock sync risk — ISO 27001:2022 A.8.17 requires time synchronization for audit logs",
    frameworkCode: "ISO27001",
    regulatoryImportance: 6,
    domainApplicability: 3,
    weight: computeWeight(6, 3),
  },
  // ── PCI DSS Requirement keywords ──
  "cardholder data": {
    refs: ["PCI-3", "PCI-4", "PCI-7", "PCI-10"],
    reasoning: "Cardholder data risk — PCI DSS Req 3-4 govern storage and transmission; Req 7 restricts access",
    frameworkCode: "PCI_DSS",
    regulatoryImportance: 8,
    domainApplicability: 5,
    weight: computeWeight(8, 5),
  },
  "payment card": {
    refs: ["PCI-3", "PCI-4", "PCI-9"],
    reasoning: "Payment card risk — PCI DSS requires protection of cardholder data at rest and in transit",
    frameworkCode: "PCI_DSS",
    regulatoryImportance: 8,
    domainApplicability: 5,
    weight: computeWeight(8, 5),
  },
  pan: {
    refs: ["PCI-3", "PCI-4"],
    reasoning: "PAN exposure risk — PCI DSS Req 3 requires PAN encryption; Req 4 encrypted transmission",
    frameworkCode: "PCI_DSS",
    regulatoryImportance: 8,
    domainApplicability: 5,
    weight: computeWeight(8, 5),
  },
  cvv: {
    refs: ["PCI-3"],
    reasoning: "CVV storage risk — PCI DSS Req 3 explicitly prohibits storage of CVV after authorization",
    frameworkCode: "PCI_DSS",
    regulatoryImportance: 8,
    domainApplicability: 5,
    weight: computeWeight(8, 5),
  },
  tokenization: {
    refs: ["PCI-3", "PCI-4"],
    reasoning: "Tokenization risk — PCI DSS Req 3 allows tokenization to reduce PCI scope",
    frameworkCode: "PCI_DSS",
    regulatoryImportance: 8,
    domainApplicability: 5,
    weight: computeWeight(8, 5),
  },
  "pci dss": {
    refs: ["PCI-1", "PCI-2", "PCI-3", "PCI-4", "PCI-5", "PCI-6", "PCI-7", "PCI-8", "PCI-9", "PCI-10", "PCI-11", "PCI-12"],
    reasoning: "PCI DSS compliance risk — all 12 PCI DSS requirements applicable",
    frameworkCode: "PCI_DSS",
    regulatoryImportance: 8,
    domainApplicability: 5,
    weight: computeWeight(8, 5),
  },
  firewall: {
    refs: ["PCI-1", "8.20", "8.22"],
    reasoning: "Firewall risk — PCI DSS Req 1 requires firewall configuration; ISO 27001 A.8.20/A.8.22",
    frameworkCode: "PCI_DSS",
    regulatoryImportance: 8,
    domainApplicability: 5,
    weight: computeWeight(8, 5),
  },
  "network segmentation": {
    refs: ["PCI-1", "PCI-11", "8.22"],
    reasoning: "Network segmentation risk — PCI DSS Req 1/11 requires CDE segmentation; ISO 27001 A.8.22",
    frameworkCode: "PCI_DSS",
    regulatoryImportance: 8,
    domainApplicability: 5,
    weight: computeWeight(8, 5),
  },
  "default password": {
    refs: ["PCI-2", "IAM-1"],
    reasoning: "Default password risk — PCI DSS Req 2 prohibits vendor-default passwords",
    frameworkCode: "PCI_DSS",
    regulatoryImportance: 8,
    domainApplicability: 5,
    weight: computeWeight(8, 5),
  },
  "cardholder environment": {
    refs: ["PCI-1", "PCI-7", "PCI-11"],
    reasoning: "Cardholder environment risk — PCI DSS scoping of CDE boundaries required",
    frameworkCode: "PCI_DSS",
    regulatoryImportance: 8,
    domainApplicability: 5,
    weight: computeWeight(8, 5),
  },
  scoping: {
    refs: ["PCI-1", "PCI-7", "PCI-11"],
    reasoning: "PCI scope risk — proper CDE scoping is foundational to PCI DSS compliance",
    frameworkCode: "PCI_DSS",
    regulatoryImportance: 8,
    domainApplicability: 4,
    weight: computeWeight(8, 4),
  },
  "penetration test": {
    refs: ["PCI-11", "8.29"],
    reasoning: "Penetration test risk — PCI DSS Req 11 requires annual penetration testing",
    frameworkCode: "PCI_DSS",
    regulatoryImportance: 8,
    domainApplicability: 5,
    weight: computeWeight(8, 5),
  },
  "vulnerability scan": {
    refs: ["PCI-11", "8.8"],
    reasoning: "Vulnerability scan risk — PCI DSS Req 11 requires quarterly external/internal ASV scans",
    frameworkCode: "PCI_DSS",
    regulatoryImportance: 8,
    domainApplicability: 5,
    weight: computeWeight(8, 5),
  },
  "visitor log": {
    refs: ["PCI-9", "7.2"],
    reasoning: "Visitor log risk — PCI DSS Req 9 requires visitor logs and physical access controls",
    frameworkCode: "PCI_DSS",
    regulatoryImportance: 8,
    domainApplicability: 4,
    weight: computeWeight(8, 4),
  },
  "media destruction": {
    refs: ["PCI-9", "7.10", "8.10"],
    reasoning: "Media destruction risk — PCI DSS Req 9 requires secure media destruction",
    frameworkCode: "PCI_DSS",
    regulatoryImportance: 8,
    domainApplicability: 4,
    weight: computeWeight(8, 4),
  },
  "unique id": {
    refs: ["PCI-8", "IAM-1", "IAM-2"],
    reasoning: "Unique ID risk — PCI DSS Req 8 requires unique user IDs for all system access",
    frameworkCode: "PCI_DSS",
    regulatoryImportance: 8,
    domainApplicability: 5,
    weight: computeWeight(8, 5),
  },
  "multi-factor": {
    refs: ["PCI-8", "8.5", "8.3"],
    reasoning: "Multi-factor authentication risk — PCI DSS Req 8 requires MFA for remote/privileged access",
    frameworkCode: "PCI_DSS",
    regulatoryImportance: 8,
    domainApplicability: 5,
    weight: computeWeight(8, 5),
  },
  "access review": {
    refs: ["PCI-7", "PCI-8", "5.15"],
    reasoning: "Access review risk — PCI DSS Req 7/8 require periodic access rights review",
    frameworkCode: "PCI_DSS",
    regulatoryImportance: 8,
    domainApplicability: 4,
    weight: computeWeight(8, 4),
  },
  "encryption key management": {
    refs: ["PCI-3", "PCI-4", "8.24"],
    reasoning: "Encryption key management risk — PCI DSS Req 3/4 and ISO 27001 require proper key management",
    frameworkCode: "HYBRID",
    regulatoryImportance: 8,
    domainApplicability: 5,
    weight: computeWeight(8, 5),
  },
  "luhn": {
    refs: ["PCI-3"],
    reasoning: "Luhn algorithm risk — PCI DSS requires card number validation via Luhn check",
    frameworkCode: "PCI_DSS",
    regulatoryImportance: 8,
    domainApplicability: 3,
    weight: computeWeight(8, 3),
  },
  saq: {
    refs: ["PCI-12"],
    reasoning: "Self-assessment questionnaire risk — PCI DSS SAQ type determines compliance validation scope",
    frameworkCode: "PCI_DSS",
    regulatoryImportance: 8,
    domainApplicability: 4,
    weight: computeWeight(8, 4),
  },
  "file integrity": {
    refs: ["PCI-11", "8.16"],
    reasoning: "File integrity monitoring risk — PCI DSS Req 11 requires FIM for critical files",
    frameworkCode: "PCI_DSS",
    regulatoryImportance: 8,
    domainApplicability: 4,
    weight: computeWeight(8, 4),
  },
  "anti-malware": {
    refs: ["PCI-5", "6.2", "8.7"],
    reasoning: "Anti-malware risk — PCI DSS Req 5 requires anti-malware on all systems in CDE",
    frameworkCode: "PCI_DSS",
    regulatoryImportance: 8,
    domainApplicability: 5,
    weight: computeWeight(8, 5),
  },
  "secure systems": {
    refs: ["PCI-6", "8.25", "8.26", "8.27"],
    reasoning: "Secure systems risk — PCI DSS Req 6 requires secure development and patching",
    frameworkCode: "PCI_DSS",
    regulatoryImportance: 8,
    domainApplicability: 5,
    weight: computeWeight(8, 5),
  },
  "security awareness": {
    refs: ["PCI-12", "5.8", "5.9"],
    reasoning: "Security awareness risk — PCI DSS Req 12 and ISO 27001 A.5.8-A.5.9 require awareness programs",
    frameworkCode: "HYBRID",
    regulatoryImportance: 6,
    domainApplicability: 5,
    weight: computeWeight(6, 5),
  },
};

// ── Contextual category mapping (fallback) ──
const CATEGORY_SEED: Record<string, KeywordSeedEntry> = {
  "cybersecurity": {
    refs: ["6.1", "6.2", "6.3", "6.5", "6.6", "8.7", "8.8", "OPS-1", "OPS-2", "3", "4", "5", "6", "10"],
    reasoning: "Cybersecurity risk category — protective and detective technical controls apply",
    frameworkCode: "HYBRID",
    regulatoryImportance: 5,
    domainApplicability: 4,
    weight: computeWeight(5, 4),
  },
  "information security": {
    refs: ["5.1", "5.2", "6.1", "6.3", "7.1", "7.2", "8.1", "8.2", "8.3", "OPS-1", "IAM-1", "1", "2"],
    reasoning: "Information security risk — ISMS and security controls framework applies",
    frameworkCode: "ISO27001",
    regulatoryImportance: 5,
    domainApplicability: 4,
    weight: computeWeight(5, 4),
  },
  "operational": {
    refs: ["5.4", "5.5", "5.6", "6.1", "6.3", "8.7", "8.8", "OPS-1", "OPS-2", "OPS-3", "5"],
    reasoning: "Operational risk — operational process and continuity controls apply",
    frameworkCode: "GRC",
    regulatoryImportance: 3,
    domainApplicability: 3,
    weight: computeWeight(3, 3),
  },
  "compliance": {
    refs: ["5.1", "5.2", "5.3", "5.4", "COM-1", "COM-2", "COM-3", "1", "12"],
    reasoning: "Compliance risk category — regulatory and policy controls needed",
    frameworkCode: "ISO27001",
    regulatoryImportance: 5,
    domainApplicability: 4,
    weight: computeWeight(5, 4),
  },
};

// ── Helpers ──
function calcConfidence(riskText: string, keyword: string, seed: typeof KEYWORD_SEED[string]): number {
  let score = 0;
  // Title match carries more weight
  const lowerTitle = riskText.toLowerCase();
  if (lowerTitle.startsWith(keyword) || lowerTitle.includes(` ${keyword} `) || lowerTitle.includes(` ${keyword}`)) {
    score += seed.weight;
  } else if (lowerTitle.includes(keyword)) {
    score += seed.weight * 0.7;
  }
  return score;
}

function extractReason(riskText: string, keyword: string, seed: typeof KEYWORD_SEED[string]): string[] {
  const reasons: string[] = [];
  const lower = riskText.toLowerCase();
  if (lower.includes(keyword)) {
    reasons.push(seed.reasoning);
  }
  return reasons;
}

// ── GET maps (seed + manual, excludes rejected) ──
router.get("/risk-control-maps", async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.riskId) filter.riskId = req.query.riskId;
    if (req.query.controlId) filter.controlId = req.query.controlId;
    // By default exclude rejected; only include seed + manual
    // We apply source filter if source param provided
    if (req.query.source) filter.source = req.query.source;
    let items = await RiskControlMap.find(filter as any).sort({ createdAt: -1 }).lean();
    if (!req.query.source) items = items.filter((m: any) => m.source !== "rejected");
    const controls = await Control.find({} as any).lean();
    const controlMap = new Map(controls.map((c: any) => [c._id ?? "", c]));
    const enriched = items.map((m: any) => ({
      ...m,
      control: controlMap.get(m.controlId) ?? null,
    }));
    res.json({ items: enriched });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch risk-control mappings" });
  }
});

// ── GET suggestions (keyword engine) ──
router.get("/risk-control-maps/suggestions", async (req, res) => {
  try {
    const riskId = req.query.riskId as string;
    if (!riskId) { res.status(400).json({ error: "riskId required" }); return; }

    const risks = await Risk.find({ _id: riskId } as any).lean();
    const risk = risks[0] as Record<string, any> | undefined;
    if (!risk) { res.status(404).json({ error: "Risk not found" }); return; }

    const allControls = await Control.find({} as any).lean();
    const controlByRef = new Map<string, any>();
    for (const c of allControls) controlByRef.set((c as any).controlId || "", c);

    // Load already-mapped controls (both seed + manual)
    const existingMaps = await RiskControlMap.find({ riskId } as any).lean();
    const mappedControlIds = new Set(existingMaps.map((m: any) => m.controlId));

    // Load rejection logs for this risk
    const rejectionLogs = await ControlRejectionLog.find({ riskId } as any).lean();
    const rejectedMap = new Map<string, number>();
    for (const log of rejectionLogs as any[]) {
      rejectedMap.set(log.controlId, log.count || 1);
    }

    const searchText = ((risk.riskTitle || "") + " " + (risk.threat || "") + " " + (risk.riskCategory || "")).toLowerCase();

    // Score suggestions: tracked fields
    // confidence = accumulated (for UI bar), maxCi = highest single keyword weight (Eq 10 for mapping type)
    const scored = new Map<string, { control: any; confidence: number; maxCi: number; reasons: string[]; mappingType: string }>();

    // 1. Keyword seed matching
    for (const [keyword, seed] of Object.entries(KEYWORD_SEED)) {
      if (!searchText.includes(keyword)) continue;
      for (const ref of seed.refs) {
        const control = controlByRef.get(ref);
        if (!control || mappedControlIds.has(control._id)) continue;
        const existing = scored.get(control._id);
        const addScore = calcConfidence(searchText, keyword, seed);
        if (existing) {
          existing.confidence = Math.min(100, existing.confidence + addScore);  // Eq 8: accumulation cap
          existing.maxCi = Math.max(existing.maxCi, addScore);                  // Eq 10: track highest single
          existing.reasons.push(...extractReason(searchText, keyword, seed));
        } else {
          scored.set(control._id, {
            control,
            confidence: addScore,
            maxCi: addScore,
            reasons: extractReason(searchText, keyword, seed),
            mappingType: addScore >= 40 ? "Primary" : "Supporting",            // Eq 10: initial based on single weight
          });
        }
      }
    }

    // 2. Category fallback matching
    const categoryText = (risk.riskCategory || "").toLowerCase();
    for (const [cat, seed] of Object.entries(CATEGORY_SEED)) {
      if (!categoryText.includes(cat)) continue;
      for (const ref of seed.refs) {
        const control = controlByRef.get(ref);
        if (!control || mappedControlIds.has(control._id)) continue;
        const existing = scored.get(control._id);
        if (existing) {
          existing.confidence = Math.min(100, existing.confidence + seed.weight);
          existing.reasons.push(seed.reasoning);
        } else {
          scored.set(control._id, {
            control,
            confidence: seed.weight,
            maxCi: seed.weight,
            reasons: [seed.reasoning],
            mappingType: "Supporting",                                          // category matches always Supporting
          });
        }
      }
    }

    // 3. Penalize previously-rejected mappings (Eq 9)
    for (const [ctrlId, suggestion] of scored) {
      const rejectCount = rejectedMap.get(ctrlId) || 0;
      if (rejectCount > 0) {
        suggestion.confidence = Math.max(0, suggestion.confidence - rejectCount * 25);
        suggestion.reasons.push(`Previously rejected (${rejectCount}x) — confidence reduced`);
      }
    }

    // Deduplicate reasons
    for (const suggestion of scored.values()) {
      suggestion.reasons = [...new Set(suggestion.reasons)];
    }

    // Final mapping type determination (Eq 10): based on maxCi (highest single keyword)
    for (const suggestion of scored.values()) {
      suggestion.mappingType = suggestion.maxCi >= 40 ? "Primary" : "Supporting";
    }

    // Sort by confidence desc, filter > 0
    const suggestions = Array.from(scored.values())
      .filter(s => s.confidence > 0)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 20)
      .map(s => ({
        controlId: s.control._id,
        controlRef: s.control.controlId || "",
        controlName: s.control.name || "",
        frameworkCode: s.control.frameworkCode || "",
        domainCode: s.control.domainCode || "",
        confidenceScore: Math.round(s.confidence),
        reasoning: s.reasons,
        suggestedMappingType: s.mappingType,
      }));

    res.json({ suggestions });
  } catch (err) {
    console.error("Suggestions error:", err);
    res.status(500).json({ error: "Failed to generate suggestions" });
  }
});

// ── POST approve suggestion (creates manual mapping) ──
router.post("/risk-control-maps/approve", async (req, res) => {
  const parsed = approveRiskControlMapSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  // Eq 6 (audit): notes must be >= 10 chars for proper audit trail
  if (parsed.data.notes.trim().length < 10) {
    res.status(400).json({ error: "Audit justification must be at least 10 characters" });
    return;
  }
  try {
    // Check if already mapped (manual or seed)
    const existing = await (RiskControlMap.find({
      riskId: parsed.data.riskId,
      controlId: parsed.data.controlId,
    } as any) as any).lean();
    if ((existing as any[]).length > 0) {
      // Update existing to manual
      const existingDoc = (existing as any[])[0];
      await RiskControlMap.findByIdAndUpdate(existingDoc._id!, {
        ...parsed.data,
        source: "manual",
        approvedBy: parsed.data.approvedBy,
        notes: parsed.data.notes,
      } as any);
      const updated = await (RiskControlMap.find({
        riskId: parsed.data.riskId,
        controlId: parsed.data.controlId,
      } as any) as any).lean();
      res.json({ item: (updated as any[])[0] });
      return;
    }
    const item = await RiskControlMap.create({
      ...parsed.data,
      source: "manual",
      createdAt: new Date().toISOString(),
    });
    res.status(201).json({ item });
  } catch (err) {
    res.status(500).json({ error: "Failed to approve mapping" });
  }
});

// ── POST reject suggestion (logs feedback — persistent ControlRejectionLog) ──
router.post("/risk-control-maps/reject", async (req, res) => {
  const parsed = rejectSuggestionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    // Upsert rejection log — increment count atomically
    const existing = await (ControlRejectionLog.find({
      riskId: parsed.data.riskId,
      controlId: parsed.data.controlId,
    } as any) as any).lean();
    const doc = (existing as any[])[0];
    if (doc) {
      await ControlRejectionLog.findByIdAndUpdate(doc._id!, {
        count: (doc.count || 0) + 1,
        lastRejectedAt: new Date().toISOString(),
      } as any);
    } else {
      await ControlRejectionLog.create({
        riskId: parsed.data.riskId,
        controlId: parsed.data.controlId,
        frameworkCode: "",
        controlRef: "",
        count: 1,
        lastRejectedAt: new Date().toISOString(),
      });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to log rejection" });
  }
});

// ── POST legacy (keep for backward compat, redirects to approve) ──
router.post("/risk-control-maps", async (req, res) => {
  const parsed = insertRiskControlMapSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }
  try {
    const item = await RiskControlMap.create(parsed.data);
    res.status(201).json({ item });
  } catch (err) {
    res.status(500).json({ error: "Failed to create mapping" });
  }
});

// ── DELETE mapping ──
// ── PATCH update mapping (e.g. change mappingType/notes) ──
router.patch("/risk-control-maps/:id", async (req, res) => {
  try {
    const allowed = ["mappingType", "notes", "approvedBy"];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const item = await RiskControlMap.findByIdAndUpdate(req.params.id, updates as any, { new: true });
    if (!item) { res.status(404).json({ error: "Mapping not found" }); return; }
    res.json({ item });
  } catch (err) {
    res.status(500).json({ error: "Failed to update mapping" });
  }
});

router.delete("/risk-control-maps/:id", async (req, res) => {
  try {
    const item = await RiskControlMap.findByIdAndDelete(req.params.id);
    if (!item) { res.status(404).json({ error: "Mapping not found" }); return; }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete mapping" });
  }
});

export default router;
