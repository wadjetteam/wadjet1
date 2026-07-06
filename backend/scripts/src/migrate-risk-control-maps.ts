import { RiskControlMap, waitForDB } from "@workspace/db"

async function main() {
  await waitForDB()

  const all = await RiskControlMap.find({} as any).lean()
  let updated = 0

  for (const m of all as any[]) {
    if (m.source !== 'manual' && m.source !== 'seed') {
      await RiskControlMap.findByIdAndUpdate(m._id!, { source: 'seed' } as any)
      updated++
    } else if (!m.source) {
      await RiskControlMap.findByIdAndUpdate(m._id!, { source: 'seed' } as any)
      updated++
    }
  }

  console.log(`Updated ${updated} mappings with source='seed'. Total mappings: ${all.length}`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
