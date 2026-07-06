import { Control, waitForDB } from "@workspace/db"
async function main() {
  await waitForDB()
  const items = await Control.find().lean()
  const byFw = {}
  for (const c of items) {
    const fw = c.frameworkCode || '?'
    if (!byFw[fw]) byFw[fw] = []
    byFw[fw].push(c.controlId)
  }
  for (const [fw, ids] of Object.entries(byFw)) {
    console.log(`${fw}:`, ids.join(', '))
  }
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
