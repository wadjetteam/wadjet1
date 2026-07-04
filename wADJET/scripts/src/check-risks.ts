import { DatabaseSync } from "node:sqlite"

function main() {
  const db = new DatabaseSync(
    "C:/Users/Admin/Desktop/واجيت/wADJET/artifacts/api-server/data/wadjet.db"
  )
  const rows = db.prepare("SELECT id, data FROM collections WHERE name = 'risks' LIMIT 5").all()
  for (const r of rows) {
    const d = JSON.parse(r.data as string)
    console.log(d.riskId, "riskRef:", JSON.stringify(d.riskRef), "riskDate:", JSON.stringify(d.riskDate))
  }
  db.close()
}
main()
