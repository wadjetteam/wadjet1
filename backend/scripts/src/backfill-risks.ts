import { Risk } from "@workspace/db"

async function main() {
  const all = await Risk.find().lean()
  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toISOString()
  let count = 0

  for (const r of all) {
    const doc = r as Record<string, any>
    const updates: Record<string, any> = {}
    if (!doc.riskDate) updates.riskDate = today
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

  console.log(`Backfilled ${count} risks with missing fields.`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
