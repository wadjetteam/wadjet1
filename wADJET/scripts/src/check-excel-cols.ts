import xlsx from "xlsx"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const wb = xlsx.readFile(path.resolve(__dirname, "../../attached_assets/Risk_Assessment_v3 (1).xlsx"))
const ws = wb.Sheets["Risk Rigister"]
const data: unknown[][] = xlsx.utils.sheet_to_json(ws, { header: 1 }) as unknown[][]

const headers = data[2] as string[]
console.log("====== ALL HEADERS ======")
headers.forEach((c, i) => { if (c) console.log(i + ": " + JSON.stringify(c)) })

const rows = data.slice(3).filter((r: any) => r[0] && String(r[0]).startsWith("R-"))
console.log("\n====== MAX COL INDEX ======")
let max = 0
for (const r of rows) {
  const keys = Object.keys(r).map(Number).filter(k => !isNaN(k))
  if (keys.length > 0) max = Math.max(max, ...keys)
}
console.log("Max column index:", max)

console.log("\n====== COL 32-40 SAMPLE (first 3 rows) ======")
for (let i = 0; i < 3 && i < rows.length; i++) {
  console.log(`Row ${i}: `, rows[i][32], "|", rows[i][33], "|", rows[i][34], "|", rows[i][35], "|", rows[i][36], "|", rows[i][37], "|", rows[i][38], "|", rows[i][39], "|", rows[i][40])
}
process.exit(0)
