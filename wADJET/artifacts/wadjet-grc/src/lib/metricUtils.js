export function computeKriStatus(catalog, measurement) {
  if (!measurement || measurement.currentValue == null) return null
  const v = measurement.currentValue
  if (catalog.redMin != null && v >= catalog.redMin) return 'red'
  if (catalog.amberMin != null && v >= catalog.amberMin) return 'amber'
  if (catalog.greenMin != null && v >= catalog.greenMin) return 'green'
  return 'green'
}

export function computeKpiStatus(catalog, measurement) {
  if (!measurement || measurement.currentValue == null) return null
  const v = measurement.currentValue
  if (catalog.criticalThreshold != null && v >= catalog.criticalThreshold) return 'red'
  if (catalog.warningThreshold != null && v >= catalog.warningThreshold) return 'amber'
  return 'green'
}

export async function enrichMappingsWithMeasurements(mappings, type, fetchLatest = true) {
  if (!mappings || mappings.length === 0) return mappings
  const endpoint = type === 'KPI' ? '/api/kpi-measurements' : '/api/kri-measurements'
  try {
    const res = await fetch(endpoint)
    if (!res.ok) return mappings
    const data = await res.json()
    const allMeasurements = data.items || []
    return mappings.map(m => {
      const catMeasurements = allMeasurements
        .filter(p => p.catalogId === m.metricCatalogId && (fetchLatest ? p.status === 'Approved' : true))
        .sort((a, b) => (b.period || '').localeCompare(a.period || ''))
      const latest = catMeasurements[0] || null
      const catalog = m.metric || {}
      return {
        ...m,
        latestMeasurement: latest,
        status: type === 'KPI' ? computeKpiStatus(catalog, latest) : computeKriStatus(catalog, latest),
      }
    })
  } catch {
    return mappings
  }
}

export async function enrichMetricMappings(kpiMappings, kriMappings) {
  const [kpis, kris] = await Promise.all([
    enrichMappingsWithMeasurements(kpiMappings, 'KPI'),
    enrichMappingsWithMeasurements(kriMappings, 'KRI'),
  ])
  return { kpis, kris }
}

export async function fetchAllCatalogItems() {
  const [kpiRes, kriRes] = await Promise.all([
    fetch('/api/kpi-catalog'),
    fetch('/api/kri-catalog'),
  ])
  const kpis = kpiRes.ok ? (await kpiRes.json()).items || [] : []
  const kris = kriRes.ok ? (await kriRes.json()).items || [] : []
  return {
    kpis: kpis.filter(c => c.isActive !== false),
    kris: kris.filter(c => c.isActive !== false),
  }
}

export async function saveMetricMappings(riskId, selections) {
  const mappings = selections.map(s => ({
    metricType: s.type,
    metricCatalogId: s.catalogId,
    mappingType: s.mappingType || 'Primary',
  }))
  const res = await fetch('/api/metric-mappings/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ riskId, mappings }),
  })
  return res.ok
}
