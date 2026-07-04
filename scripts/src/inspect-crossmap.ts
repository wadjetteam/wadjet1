import xlsx from "xlsx"

const w = xlsx.readFile(
  "C:/Users/Admin/Desktop/واجيت/New folder/Security_CrossMapping_Triple_Final (1).xlsx"
)
console.log("Sheets:", w.SheetNames)
for (const name of w.SheetNames) {
  const s = w.Sheets[name]
  const d: any[][] = xlsx.utils.sheet_to_json(s, { header: 1 }) as any[][]
  console.log("\n=== " + name + " ===")
  const h = d[0] || []
  h.forEach((c: any, i: number) => {
    if (c) console.log("  Col " + i + ": " + String(c).slice(0, 60))
  })
  console.log("Total rows:", d.length)
  for (let i = 1; i < Math.min(4, d.length); i++) {
    console.log("Row" + i + ":", JSON.stringify(d[i]?.slice(0, 15)))
  }
}
