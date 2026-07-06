import { Risk } from "@workspace/db"

function budgetFor(level: string, idx: number): string {
  const map: Record<string, [number, number]> = {
    Critical: [120000, 200000],
    High: [40000, 80000],
    Medium: [10000, 30000],
    Low: [2000, 8000],
  }
  const [min, max] = map[level] || [10000, 30000]
  const val = min + ((idx * 7919) % (max - min + 1))
  return String(Math.round(val / 1000) * 1000)
}

function issuesFor(status: string, treatment: string, idx: number): string {
  if (status === 'Closed' || status === 'Resolved') return 'None — all resolved'

  const pool: Record<string, string[]> = {
    Mitigate: [
      'Pending vendor selection for security tool',
      'Awaiting budget approval from steering committee',
      'Resource constraints — dedicated team not yet assigned',
      'Integration dependencies with legacy systems',
      'Third-party risk assessment not completed',
      'Remediation plan under development',
    ],
    Transfer: [
      'Insurance policy under negotiation',
      'Service provider SLA review in progress',
      'Contractual terms not finalized with vendor',
    ],
    Accept: ['Risk accepted by management — monitored quarterly'],
    Avoid: ['System decommissioning in progress', 'Process redesign awaiting sign-off'],
  }
  const items = pool[treatment] || pool.Mitigate
  return items[idx % items.length]
}

async function main() {
  const all = (await Risk.find().lean()).sort((a, b) =>
    (a as any).riskId?.localeCompare((b as any).riskId)
  )
  let count = 0

  for (let i = 0; i < all.length; i++) {
    const doc = all[i] as Record<string, any>
    const updates: Record<string, any> = {}
    const level: string = doc.inherentLevel || 'Medium'
    const treatment: string = doc.treatment || 'Mitigate'
    const status: string = doc.status || 'Open'

    if (!doc.budget || doc.budget === '—') {
      updates.budget = budgetFor(level, i)
    }
    if (!doc.issuesBlockers || doc.issuesBlockers === 'None' || doc.issuesBlockers === '—') {
      updates.issuesBlockers = issuesFor(status, treatment, i)
    }

    if (Object.keys(updates).length > 0) {
      await Risk.findByIdAndUpdate(doc._id, updates)
      count++
    }
  }

  console.log(`Filled Budget & Issues for ${count} risks.`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
