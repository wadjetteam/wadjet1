import { Risk } from "@workspace/db"

function isExcelSerial(v: string): boolean {
  return /^\d{5}$/.test(v)
}

function excelSerialToISO(v: string): string {
  const n = Number(v)
  return new Date(Math.round((n - 25569) * 86400 * 1000)).toISOString().slice(0, 10)
}

async function main() {
  const all = await Risk.find().lean()
  const now = new Date().toISOString()
  let count = 0

  for (const r of all) {
    const doc = r as Record<string, any>
    const updates: Record<string, any> = {}

    // Fix: riskRef has Risk Date data (from wrong seed mapping)
    if (doc.riskRef && isExcelSerial(doc.riskRef)) {
      updates.riskDate = excelSerialToISO(doc.riskRef)
      updates.riskRef = ''
    } else if (doc.riskRef && /^\d{4}-\d{2}-\d{2}$/.test(doc.riskRef)) {
      updates.riskDate = doc.riskRef
      updates.riskRef = ''
    }

    if (!updates.riskDate && !doc.riskDate) {
      updates.riskDate = new Date().toISOString().split('T')[0]
    }
    if (!doc.createdAt) updates.createdAt = now
    if (!doc.riskSource) updates.riskSource = 'Internal'
    if (!doc.reviewFreq) updates.reviewFreq = 'Quarterly'
    if (doc.budget == null) updates.budget = ''
    if (doc.issuesBlockers == null) updates.issuesBlockers = ''

    if (Object.keys(updates).length > 0) {
      await Risk.findByIdAndUpdate(doc._id, updates)
      count++
    }
  }

  console.log(`Fixed ${count} risks.`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
