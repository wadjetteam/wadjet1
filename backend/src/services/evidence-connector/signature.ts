import { createHash, randomUUID } from "node:crypto";

export interface SignatureInput {
  controlId: string;
  rawPayload: unknown;
  compliant: boolean;
  checkedAt: string;
  signedBy: string;
}

export interface SignatureOutput {
  evidenceId: string;
  digitalSignature: string;
  signedAt: string;
}

function canonicalJson(input: unknown): string {
  // Deterministic JSON serialisation — sorted keys, no whitespace
  if (input === null || input === undefined) return "null";
  if (typeof input === "string") return JSON.stringify(input);
  if (typeof input === "number" || typeof input === "boolean") return String(input);
  if (Array.isArray(input)) {
    return `[${input.map(canonicalJson).join(",")}]`;
  }
  const keys = Object.keys(input as Record<string, unknown>).sort();
  const pairs = keys.map(k =>
    `${JSON.stringify(k)}:${canonicalJson((input as Record<string, unknown>)[k])}`,
  );
  return `{${pairs.join(",")}}`;
}

export function signEvidence(input: SignatureInput): SignatureOutput {
  const evidenceId = randomUUID();
  const signedAt = new Date().toISOString();

  const payload = {
    evidenceId,
    controlId: input.controlId,
    rawPayload: input.rawPayload,
    compliant: input.compliant,
    checkedAt: input.checkedAt,
    signedBy: input.signedBy,
    signedAt,
    nonce: randomUUID(),
  };

  const canonical = canonicalJson(payload);
  const digitalSignature = createHash("sha256").update(canonical).digest("hex");

  return { evidenceId, digitalSignature, signedAt };
}

export function verifySignature(
  payload: Record<string, unknown>,
  expectedSignature: string,
): boolean {
  const { digitalSignature: _discard, ...rest } = payload;
  const canonical = canonicalJson(rest);
  const recomputed = createHash("sha256").update(canonical).digest("hex");
  return recomputed === expectedSignature;
}
