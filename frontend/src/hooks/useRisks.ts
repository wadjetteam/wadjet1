import { useState, useEffect } from 'react'

interface Risk {
  _id?: string
  riskId: string
  riskTitle: string
  riskDescription: string
  riskCategory: string
  severity: string
  status: string
  likelihood: number
  overallScore: number
  residualScore: number
  owner: string
  [key: string]: unknown
}

export function useRisks() {
  const [risks, setRisks] = useState<Risk[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRisks = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/risks')
      const data = await res.json()
      setRisks(data.risks || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch risks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRisks() }, [])

  return { risks, loading, error, refetch: fetchRisks }
}
