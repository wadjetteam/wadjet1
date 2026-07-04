import xlsx from "xlsx"
import path from "path"
import { fileURLToPath } from "url"
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const w = xlsx.readFile(path.join(__dirname, "../../../New folder/Security_CrossMapping_Triple_Final (1).xlsx"))
console.log("Sheets:", w.SheetNames)
for (const name of w.SheetNames) {
  const s = w.Sheets[name]
  const d = xlsx.utils.sheet_to_json(s, { header: 1 })
  console.log("\n=== " + name + " ===")
  const h = d[0] || []
  h.forEach((c, i) => { if (c) console.log("  Col " + i + ": " + String(c).slice(0, 60)) })
  console.log("Rows:", d.length)
  for (let i = 1; i < Math.min(3, d.length); i++) {
    console.log("Row" + i + ":", JSON.stringify(d[i]?.slice(0, 12)))
  }
}
