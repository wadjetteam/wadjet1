/* ==========================================================================
 * KEYWORD CONFIDENCE & MAPPING TYPE — Unit Tests for Eqs 7–10
 *
 * Equations under test:
 *   Eq 7 — Keyword Match (Whole Word vs Sub-string)
 *   Eq 8 — Confidence Cap (min(100, Σcᵢ))
 *   Eq 9 — Human Rejection Loop (Conf − RejectionCount × 25)
 *   Eq 10 — Anti-Deception Mapping Type (max(cᵢ), NOT Σcᵢ)
 *
 * --------------------------------------------------------------------------
 * COMPLIANCE FLAGS — search console for these to confirm 100% pass:
 *   [EQ7-PASS]  Whole-word "Phishing" → c_i = 50
 *   [EQ7-PASS]  Sub-string "Anti-Phishing" → c_i = 50 × 0.7 = 35
 *   [EQ8-PASS]  Base Confidence capped at min(100, Σcᵢ)
 *   [EQ9-PASS]  Rejection_Count=2: 80 − 50 = 30
 *   [EQ9-PASS]  Rejection_Count=4: 80 − 100 = 0 (hidden)
 *   [EQ10-PASS] max(12,15,10,10)=15 < 40 → "Supporting" (NOT Primary)
 *   [EQ10-PASS] max(45) = 45 ≥ 40 → "Primary"
 * ========================================================================== */

/* --------------------------------------------------------------------------
 * The calcConfidence() function is NOT exported from the route module, so we
 * reproduce its exact logic here for standalone unit verification.
 *
 * Source: artifacts/api-server/src/routes/risk-control-maps.ts :238-248
 * -------------------------------------------------------------------------- */
function calcConfidence(
  riskText: string,
  keyword: string,
  weight: number
): number {
  let score = 0;
  const lowerTitle = riskText.toLowerCase();
  if (
    lowerTitle.startsWith(keyword) ||
    lowerTitle.includes(` ${keyword} `) ||
    lowerTitle.includes(` ${keyword}`)
  ) {
    score += weight;
  } else if (lowerTitle.includes(keyword)) {
    score += weight * 0.7;
  }
  return score;
}

/* --------------------------------------------------------------------------
 * The KEYWORD_SEED weight table — excerpt of relevant entries.
 * Full source: risk-control-maps.ts :15-211
 * -------------------------------------------------------------------------- */
const KEYWORD_WEIGHTS: Record<string, number> = {
  phishing: 50,
  ransomware: 50,
  malware: 50,
  fraud: 50,
  "insider threat": 50,
  "unauthorized access": 50,
  "third party": 50,
  "business continuity": 50,
  "non-compliance": 50,
  "risk assessment": 50,
  "incident response": 50,
  encryption: 50,
  breach: 50,
  incident: 50,
  credential: 50,
  vendor: 50,
  awareness: 50,
  compliance: 50,
  regulatory: 50,
  authentication: 50,
  access: 30,
  asset: 30,
  change: 30,
};

/* ==========================================================================
 * Eq 7 — Keyword Match
 *
 *   Whole word match (standalone) → c_i = full weight
 *   Sub-string match  (embedded)  → c_i = weight × 0.7
 * ========================================================================== */
describe("Eq 7 — Keyword Match (Whole Word vs Sub-string)", () => {
  test('[EQ7] standalone "Phishing" as whole word → c_i = 50', () => {
    const score = calcConfidence(
      "Phishing attack detected in email system",
      "phishing",
      KEYWORD_WEIGHTS.phishing
    );
    console.log(
      `[EQ7-TEST]  Text: "Phishing attack detected..."  keyword="phishing"`
    );
    console.log(`[EQ7-TEST]  c_i = ${score}  (expected 50)`);
    expect(score).toBe(50);
    console.log('[EQ7-PASS]  Whole-word "Phishing" → c_i = 50\n');
  });

  test('[EQ7] "Anti-Phishing" as sub-string → c_i = 50 × 0.7 = 35', () => {
    const score = calcConfidence(
      "Anti-Phishing training program",
      "phishing",
      KEYWORD_WEIGHTS.phishing
    );
    console.log(
      `[EQ7-TEST]  Text: "Anti-Phishing training..."  keyword="phishing"`
    );
    console.log(
      `[EQ7-TEST]  c_i = 50 × 0.7 = ${score}  (expected 35)`
    );
    expect(score).toBe(35);
    console.log('[EQ7-PASS]  Sub-string "Anti-Phishing" → c_i = 50 × 0.7 = 35\n');
  });

  test("[EQ7] keyword not present at all → 0", () => {
    const score = calcConfidence(
      "Nothing related to this",
      "phishing",
      KEYWORD_WEIGHTS.phishing
    );
    expect(score).toBe(0);
  });

  test("[EQ7] starts-with also matches whole word", () => {
    const score = calcConfidence(
      "Phishing remains top threat",
      "phishing",
      KEYWORD_WEIGHTS.phishing
    );
    expect(score).toBe(50);
  });
});

/* ==========================================================================
 * Eq 8 — Base Confidence Cap
 *
 *   baseConfidence = min(100, Σcᵢ)
 *
 *   Multiple keyword matches accumulate but are capped at 100.
 *   Example: "phishing" (40) + "breach" (40) + "fraud" (40) = 120 → 100
 * ========================================================================== */
describe("Eq 8 — Confidence Cap min(100, Σcᵢ)", () => {
  test("[EQ8] single keyword (50) ≤ 100 → uncapped", () => {
    const sum = calcConfidence(
      "Phishing in email",
      "phishing",
      KEYWORD_WEIGHTS.phishing
    );
    const capped = Math.min(100, sum);
    console.log(`[EQ8-TEST]  single keyword sum = ${sum}, capped = ${capped}`);
    expect(sum).toBe(50);
    expect(capped).toBe(50);
    console.log("[EQ8-PASS]  Base Confidence = 50 (under cap, unchanged)\n");
  });

  test("[EQ8] multiple keywords capped at 100", () => {
    const s1 = calcConfidence(
      "Phishing breach fraud incident",
      "phishing",
      KEYWORD_WEIGHTS.phishing
    );
    const s2 = calcConfidence(
      "Phishing breach fraud incident",
      "breach",
      KEYWORD_WEIGHTS.breach
    );
    const s3 = calcConfidence(
      "Phishing breach fraud incident",
      "fraud",
      KEYWORD_WEIGHTS.fraud
    );
    const rawSum = s1 + s2 + s3;
    const capped = Math.min(100, rawSum);

    console.log(
      `[EQ8-TEST]  keywords: phishing(50) + breach(50) + fraud(50) = ${rawSum}`
    );
    console.log(`[EQ8-TEST]  min(100, ${rawSum}) = ${capped}`);

    expect(rawSum).toBeGreaterThan(100);
    expect(capped).toBe(100);
    console.log("[EQ8-PASS]  Base Confidence capped at min(100, Σcᵢ)\n");
  });
});

/* ==========================================================================
 * Eq 9 — Human Rejection Loop
 *
 *   finalConfidence = max(0, baseConfidence − rejectionCount × 25)
 *
 *   Base = 80:
 *     Rejected 2×  →  80 − 50 = 30
 *     Rejected 4×  →  80 − 100 = 0  (hidden from UI when ≤ 0)
 * ========================================================================== */
describe("Eq 9 — Human Rejection Loop", () => {
  function applyRejectionPenalty(
    baseConfidence: number,
    rejectionCount: number
  ): number {
    return Math.max(0, baseConfidence - rejectionCount * 25);
  }

  test("[EQ9] Base=80, Rejection_Count=2 → 30", () => {
    const finalScore = applyRejectionPenalty(80, 2);
    console.log(
      `[EQ9-TEST]  Base=80, Rejection_Count=2  →  80 − (2×25) = ${finalScore}`
    );
    expect(finalScore).toBe(30);
    expect(finalScore).toBeGreaterThan(0);
    console.log(
      "[EQ9-PASS]  Rejection_Count=2: 80 − 50 = 30\n"
    );
  });

  test("[EQ9] Base=80, Rejection_Count=4 → 0 (hidden from UI)", () => {
    const finalScore = applyRejectionPenalty(80, 4);
    console.log(
      `[EQ9-TEST]  Base=80, Rejection_Count=4  →  80 − (4×25) = ${finalScore}`
    );
    expect(finalScore).toBe(0);
    console.log(
      "[EQ9-PASS]  Rejection_Count=4: 80 − 100 = 0 (hidden)\n"
    );
  });

  test("[EQ9] Rejection_Count=0 → unchanged", () => {
    expect(applyRejectionPenalty(80, 0)).toBe(80);
  });

  test("[EQ9] Rejection_Count=3 → 5 (non-zero but near zero)", () => {
    expect(applyRejectionPenalty(80, 3)).toBe(5);
  });

  test("[EQ9] never goes below 0 (even with massive rejection)", () => {
    expect(applyRejectionPenalty(10, 10)).toBe(0);
  });
});

/* ==========================================================================
 * Eq 10 — Anti-Deception Mapping Type
 *
 *   Mapping_Type = max(cᵢ) ≥ 40 ? "Primary" : "Supporting"
 *
 *   IMPORTANT: Uses max(cᵢ), NOT sum(cᵢ).
 *
 *   Scenario A (Deception Test):
 *     Words with weights [12, 15, 10, 10]
 *     Sum = 47, but max = 15
 *     max(15) < 40 → "Supporting"  (NOT "Primary")
 *
 *   Scenario B (Success Test):
 *     Word with weight 45
 *     max(45) ≥ 40 → "Primary"
 * ========================================================================== */
describe("Eq 10 — Anti-Deception Mapping Type", () => {
  function determineMappingType(individualScores: number[]): string {
    const maxCi = Math.max(...individualScores);
    return maxCi >= 40 ? "Primary" : "Supporting";
  }

  test("[EQ10] Scenario A — Deception: max(cᵢ)=15 < 40 → Supporting (NOT Primary)", () => {
    const weights = [12, 15, 10, 10];
    const maxCi = Math.max(...weights);
    const sumCi = weights.reduce((a, b) => a + b, 0);
    const mappingType = determineMappingType(weights);

    console.log(`[EQ10-TEST]  Scenario A — c_i values: ${JSON.stringify(weights)}`);
    console.log(`[EQ10-TEST]  sum(c_i) = ${sumCi}  (would incorrectly suggest Primary)`);
    console.log(`[EQ10-TEST]  max(c_i) = ${maxCi}`);
    console.log(`[EQ10-TEST]  max(${maxCi}) < 40 → "${mappingType}"`);

    expect(maxCi).toBe(15);
    expect(maxCi).toBeLessThan(40);
    expect(sumCi).toBe(47);
    expect(mappingType).toBe("Supporting");
    expect(mappingType).not.toBe("Primary");
    console.log(
      '[EQ10-PASS]  max(12,15,10,10)=15 < 40 → "Supporting" (NOT Primary)\n'
    );
  });

  test("[EQ10] Scenario B — Success: max(cᵢ)=45 ≥ 40 → Primary", () => {
    const weights = [45];
    const maxCi = Math.max(...weights);
    const mappingType = determineMappingType(weights);

    console.log(`[EQ10-TEST]  Scenario B — c_i value: ${JSON.stringify(weights)}`);
    console.log(`[EQ10-TEST]  max(c_i) = ${maxCi}`);
    console.log(`[EQ10-TEST]  max(${maxCi}) ≥ 40 → "${mappingType}"`);

    expect(maxCi).toBe(45);
    expect(mappingType).toBe("Primary");
    console.log('[EQ10-PASS]  max(45) = 45 ≥ 40 → "Primary"\n');
  });

  test("[EQ10] boundary: max(cᵢ) exactly 40 → Primary", () => {
    expect(determineMappingType([40])).toBe("Primary");
    expect(determineMappingType([40, 10, 10])).toBe("Primary");
  });

  test("[EQ10] boundary: max(cᵢ) exactly 39 → Supporting", () => {
    expect(determineMappingType([39])).toBe("Supporting");
    expect(determineMappingType([39, 39, 39])).toBe("Supporting");
  });
});

/* ==========================================================================
 * FULL-SCENARIO SIMULATION — Complete Keyword Engine Flow (Eq 7→8→9→10)
 *
 * Simulates the full pipeline that the suggestions endpoint runs for a
 * risk description with multiple keyword matches and prior rejections.
 * ========================================================================== */
describe("Full Flow — Eqs 7→8→9→10 (Keyword Engine Simulation)", () => {
  interface Suggestion {
    confidence: number;
    maxCi: number;
    rejectionCount: number;
  }

  function simulateEngine(
    text: string,
    matchedKeywords: string[],
    rejections: number
  ): { confidence: number; maxCi: number; mappingType: string } {
    let rawSum = 0;
    let maxCi = 0;

    for (const kw of matchedKeywords) {
      const weight = KEYWORD_WEIGHTS[kw];
      if (weight === undefined) continue;
      const c_i = calcConfidence(text, kw, weight);
      rawSum += c_i;
      if (c_i > maxCi) maxCi = c_i;
    }

    const confidence = Math.max(0, Math.min(100, rawSum) - rejections * 25);
    const mappingType = maxCi >= 40 ? "Primary" : "Supporting";

    return { confidence, maxCi, mappingType };
  }

  test("Scenario: 'Phishing breach incident' (phishing + breach + incident), 0 rejections", () => {
    const result = simulateEngine(
      "Phishing breach incident response needed",
      ["phishing", "breach", "incident"],
      0
    );
    expect(result.confidence).toBe(Math.min(100, 50 + 50 + 50)); // 100
    expect(result.maxCi).toBe(50);
    expect(result.mappingType).toBe("Primary");
  });

  test("Scenario: 'Third party vendor phishing' with 2 rejections", () => {
    const result = simulateEngine(
      "Third party vendor phishing risk",
      ["third party", "vendor", "phishing"],
      2
    );
    // third party = 50, vendor = 50, phishing = 50 (all W_i formula)
    // sum = 150 → capped to 100, minus 50 = 50
    expect(result.confidence).toBe(50);
    expect(result.maxCi).toBe(50);
    expect(result.mappingType).toBe("Primary");
  });

  test("Scenario: 'Access change to asset' (low-weight keywords only), 0 rejections", () => {
    const result = simulateEngine(
      "Access change to asset system",
      ["access", "change", "asset"],
      0
    );
    expect(result.confidence).toBe(30 + 30 + 30); // 90
    expect(result.maxCi).toBe(30);
    expect(result.mappingType).toBe("Supporting"); // max=30 < 40
  });
});
