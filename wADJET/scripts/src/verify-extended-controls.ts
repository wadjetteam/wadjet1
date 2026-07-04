/**
 * verify-extended-controls.ts
 *
 * Creates test risks with ISO 27001 / PCI DSS trigger keywords and verifies
 * that the suggestion engine returns framework-specific control mappings.
 *
 * Usage: pnpm --filter @workspace/scripts start:verify
 * (after adding the script to package.json)
 */

const BASE = process.env["API_BASE"] ?? "http://localhost:3001/api";

interface RiskPayload {
  riskId: string;
  riskTitle: string;
  threat: string;
  riskCategory: string;
  likelihood: number;
  impactFinance: number;
  impactRegulatory: number;
  impactReputational: number;
  impactOperational: number;
  impactC: number;
  impactI: number;
  impactA: number;
  riskOwnerId: string;
  controlStatus: string;
}

interface Suggestion {
  controlRef: string;
  controlName: string;
  frameworkCode: string;
  domainCode: string;
  confidenceScore: number;
  reasoning: string[];
  suggestedMappingType: string;
}

interface SuggestionsResponse {
  suggestions: Suggestion[];
}

function formatSummary(label: string, suggestions: Suggestion[]): void {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`  ${label}`);
  console.log(`=".repeat(70)}`);
  if (suggestions.length === 0) {
    console.log("  No suggestions returned.");
    return;
  }
  console.log(`  ${suggestions.length} suggestions:`);
  console.log();
  for (const s of suggestions) {
    const framework = s.frameworkCode?.padEnd(10) ?? "".padEnd(10);
    const conf = String(s.confidenceScore).padStart(3);
    const mtype = s.suggestedMappingType?.padEnd(12) ?? "".padEnd(12);
    console.log(`  ${conf}%  ${framework}  ${mtype}  ${s.controlRef.padEnd(8)}  ${s.controlName}`);
    if (s.reasoning.length > 0) {
      for (const r of s.reasoning.slice(0, 2)) {
        console.log(`         ${r}`);
      }
    }
  }
}

async function createRisk(payload: RiskPayload): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/risks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "Unknown");
      console.error(`  POST /risks failed (${res.status}): ${err}`);
      return null;
    }
    const body = await res.json();
    return body.item?._id ?? null;
  } catch (err) {
    console.error(`  POST /risks network error: ${err}`);
    return null;
  }
}

async function getSuggestions(riskId: string): Promise<Suggestion[]> {
  try {
    const res = await fetch(`${BASE}/risk-control-maps/suggestions?riskId=${riskId}`);
    if (!res.ok) {
      console.error(`  GET suggestions failed (${res.status})`);
      return [];
    }
    const body = (await res.json()) as SuggestionsResponse;
    return body.suggestions ?? [];
  } catch (err) {
    console.error(`  GET suggestions network error: ${err}`);
    return [];
  }
}

async function verify(): Promise<void> {
  console.log(`WADJET — Extended Control Suggestion Verification`);
  console.log(`API Base: ${BASE}`);
  console.log(`Date: ${new Date().toISOString()}`);

  // ── Scenario 1: Banking + Cardholder Data + Cloud (PCI + ISO) ──
  let riskId = await createRisk({
    riskId: "VERIFY-PCI-" + Date.now(),
    riskTitle: "Cardholder data breach via cloud payment system phishing attack",
    threat: "Phishing attack targeting payment card processing systems exposes PAN and CVV data stored in cloud environment",
    riskCategory: "cybersecurity",
    likelihood: 4,
    impactFinance: 5,
    impactRegulatory: 5,
    impactReputational: 5,
    impactOperational: 4,
    impactC: 5,
    impactI: 5,
    impactA: 5,
    riskOwnerId: "CRO",
    controlStatus: "Planned",
  });

  if (riskId) {
    const suggestions = await getSuggestions(riskId);
    formatSummary("Scenario 1: Cardholder data breach + phishing + cloud (PCI + ISO)", suggestions);

    const pciRefs = suggestions.filter((s) => s.frameworkCode === "PCI_DSS");
    const isoRefs = suggestions.filter((s) => s.frameworkCode === "ISO27001");
    console.log(`\n  PCI DSS refs: ${pciRefs.length}, ISO 27001 refs: ${isoRefs.length}`);
    if (pciRefs.length > 0) {
      console.log("  ✓ PCI DSS controls triggered — PCI integration verified");
    } else {
      console.log("  ✗ No PCI DSS controls — check keyword matching");
    }
    if (isoRefs.length > 0) {
      console.log("  ✓ ISO 27001 controls triggered — ISO integration verified");
    } else {
      console.log("  ✗ No ISO 27001 controls — check keyword matching");
    }
  }

  // ── Scenario 2: Ransomware + Network (ISO 27001) ──
  riskId = await createRisk({
    riskId: "VERIFY-ISO-" + Date.now(),
    riskTitle: "Ransomware encrypts critical systems — network segmentation bypass",
    threat: "Malware infection spreads across network due to lack of segmentation and web filtering, encrypting business continuity data",
    riskCategory: "cybersecurity",
    likelihood: 3,
    impactFinance: 5,
    impactRegulatory: 4,
    impactReputational: 5,
    impactOperational: 5,
    impactC: 5,
    impactI: 5,
    impactA: 5,
    riskOwnerId: "CISO",
    controlStatus: "None",
  });

  if (riskId) {
    const suggestions = await getSuggestions(riskId);
    formatSummary("Scenario 2: Ransomware + network segmentation + web filtering (ISO 27001)", suggestions);
    const segControls = suggestions.filter((s) => s.controlRef.includes("8.22") || s.controlRef.includes("8.23") || s.controlRef.includes("8.7"));
    if (segControls.length > 0) {
      console.log("  ✓ Network/web/anti-malware ISO controls triggered");
    }
  }

  // ── Scenario 3: Compliance + Vendor + Physical (Hybrid) ──
  riskId = await createRisk({
    riskId: "VERIFY-HYB-" + Date.now(),
    riskTitle: "Third-party vendor non-compliance with physical security at data center",
    threat: "Supplier data center lacks clear desk policy, visitor logs, and media destruction procedures — classified assets at risk",
    riskCategory: "compliance",
    likelihood: 2,
    impactFinance: 3,
    impactRegulatory: 5,
    impactReputational: 4,
    impactOperational: 3,
    impactC: 4,
    impactI: 3,
    impactA: 4,
    riskOwnerId: "COMPLIANCE",
    controlStatus: "Partially Implemented",
  });

  if (riskId) {
    const suggestions = await getSuggestions(riskId);
    formatSummary("Scenario 3: Vendor non-compliance + physical security + classification (Hybrid)", suggestions);
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log("  Verification complete.");
  console.log(`"=".repeat(70)}\n`);
}

verify().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
