import { useState, useRef, useEffect, useCallback } from 'react'

export default function useColumnResize() {
  const [widths, setWidths] = useState({})
  const drag = useRef(null)
  useEffect(() => {
    const onMove = (e) => {
      if (!drag.current) return
      const { colKey, startX, startW } = drag.current
      const diff = e.clientX - startX
      const w = Math.max(50, startW + diff)
      setWidths(p => ({ ...p, [colKey]: w }))
    }
    const onUp = () => {
      if (!drag.current) return
      drag.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
  }, [])
  const startResize = useCallback((colKey, startX, startW) => {
    drag.current = { colKey, startX, startW }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])
  return { colWidths: widths, startResize }
}
