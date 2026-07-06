import { Risk } from "@workspace/db"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const excelDateToISO = (v: unknown): string | null => {
  if (!v || typeof v !== "number") return null
  return new Date(Math.round((v - 25569) * 86400 * 1000)).toISOString().slice(0, 10)
}

async function main() {
  const xlsx = await import("xlsx")
  const workbook = xlsx.default.readFile(
    path.resolve(__dirname, "../../attached_assets/Risk_Assessment_v3 (1).xlsx")
  )
  const ws = workbook.Sheets["Risk Rigister"]
  const data: unknown[][] = xlsx.default.utils.sheet_to_json(ws, { header: 1 }) as unknown[][]
  const rows = data.slice(3).filter((r: any) => r[0] && String(r[0]).startsWith("R-"))

  let updated = 0
  for (const r of rows) {
    const riskId = String(r[0] ?? "")
    const rawDate = r[11]
    const riskDate = excelDateToISO(rawDate)
    if (!riskDate) continue

    const existing = await Risk.findOneAndUpdate(
      { riskId },
      { $setOnInsert: {} },
      { upsert: false }
    )
    if (existing) {
      await Risk.findByIdAndUpdate(existing._id!, { riskDate })
      updated++
    }
  }

  console.log(`Updated ${updated} risks with Risk Date from Excel.`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
