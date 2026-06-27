import { useState, useRef, useEffect, useCallback } from 'react'
import { Bot, Send, Sparkles, X, Gavel, AlertTriangle, ClipboardList, Flag, BarChart2, FileSearch, Wifi, WifiOff, RefreshCw, Search, WifiOff as OfflineIcon } from 'lucide-react'

/* ── Suggested question chips (6 contextual questions) ─── */
const promptChips = [
  { label: 'What are our top 3 AML gaps?', icon: Flag },
  { label: 'Analyze current CBE compliance gaps', icon: Gavel },
  { label: 'What critical vulnerabilities breach SLA?', icon: AlertTriangle },
  { label: 'Summarize our Basel III capital position', icon: BarChart2 },
  { label: 'Which CBE deadlines are approaching?', icon: FileSearch },
  { label: 'Audit readiness for CBE examination', icon: ClipboardList },
]

/* ── Built-in fallback knowledge base ─────────────────── */
const knowledgeBase = {
  'What are our top 3 AML gaps?': `## Top 3 AML Gaps — FATF Recommendation 10 (CDD)

**Current AML/FATF R10 Status: ⚠️ 68% Compliant**

| # | Gap | Sub-Requirement | Impact | Timeline |
|---|-----|----------------|--------|----------|
| 1 | Ongoing transaction monitoring covers only 74% of volume | R10-D | 🔴 Critical | 60 days |
| 2 | 312 legacy accounts missing business relationship documentation | R10-C | 🔴 High | July 31, 2026 |
| 3 | 18% of corporate accounts missing beneficial owner (≥25%) | R10-B | 🟡 Medium | 90 days |

### Financial Exposure:
| Risk | Potential Fine |
|------|---------------|
| CBE AML regulation breach | EGP 5M – 15M |
| FATF grey-listing | Correspondent banking restrictions |

### Remediation Actions:
1. Expand transaction monitoring to 100% of volume — **60 days**
2. CDD refresh for 312 legacy accounts — **July 31, 2026**
3. Complete beneficial ownership registry for corporate accounts — **90 days**`,

  'Analyze current CBE compliance gaps': `## CBE Compliance Gap Analysis

**Overall Score: 94.7%** *(Target: 85%) — ON TARGET*

| Domain | Score | Key Gap | Priority |
|--------|-------|---------|----------|
| Access Control (AC) | 82% | AC-03 Remote Access MFA | 🔴 High |
| Cryptography (CR) | 91% | CR-05 Key rotation not automated | 🟡 Medium |
| Incident Response (IR) | 76% | IR-04 Forensic imaging lacking | 🔴 Critical |
| Business Continuity (BC) | 88% | BC-02 DR test overdue | 🔴 High |
| Audit Logging (AU) | 94% | AU-06 SIEM partial | 🟢 Low |
| Data Privacy (DP) | 79% | ART-18 Encryption gaps | 🔴 Critical |

### Top 3 Immediate Actions:
1. **IR-04** — Deploy forensic imaging — **14 days**
2. **ART-18** — Enforce encryption at rest (Law 151/2020 Art.18) — **21 days**
3. **AC-03** — MFA for all remote access — **30 days**`,

  'What critical vulnerabilities breach SLA?': `## Critical Vulnerabilities — SLA Breach Report

| CVE | Affected Asset | CVSS | Status |
|-----|---------------|------|--------|
| CVE-2026-3412 | srv-swift-prod-01 | 9.8 | 🔴 8h OVERDUE |
| CVE-2026-3298 | fw-core-branch-05 | 9.2 | 🔴 Imminent |
| CVE-2026-2891 | db-core-01 | 7.8 | ⚠️ 2h overdue |

| Severity | Total | Within SLA | Breached |
|----------|-------|------------|---------|
| Critical (48h SLA) | 2 | 0 | **2** ❌ |
| High (96h SLA) | 3 | 2 | **1** ⚠️ |
| Medium/Low | 10 | 10 | 0 ✅ |

### Immediate Actions:
1. 🔴 Escalate CVE-2026-3412 to Tier 3 — SWIFT infrastructure at risk
2. Virtual patch for fw-core-branch-05 within 2h`,

  'Summarize our Basel III capital position': `## Basel III/IV Capital Adequacy Summary

| Ratio | Current | CBE Minimum | Status |
|-------|---------|-------------|--------|
| **CET1** | **14.2%** | 7.0% | ✅ Strong (+7.2pp buffer) |
| Tier 1 | 15.8% | 8.5% | ✅ Strong |
| Total Capital | 17.4% | 10.5% | ✅ Strong |
| **LCR** | **128%** | 100% | ✅ Adequate |
| NSFR | 112% | 100% | ✅ Adequate |

**Total RWA: EGP 59.9 billion**
- Credit Risk: 71.4% | Market Risk: 13.5% | Operational Risk: 15.0%

### Basel IV Output Floor — January 2027 Impact:
- Estimated CET1 reduction: **-1.2% to -1.8%** (floor at 72.5% of standardised RWA)
- Post-floor CET1 still above minimum; no capital raise required at current projections`,

  'Which CBE deadlines are approaching?': `## Upcoming CBE & Regulatory Deadlines

| Deadline | Item | Framework | Risk |
|----------|------|-----------|------|
| **June 25, 2026** | Maadi branch attestation completion (15 outstanding) | CBE Policy | 🔴 Overdue risk |
| **July 31, 2026** | CDD refresh for 312 legacy accounts | FATF R10 / CBE AML | 🔴 Critical |
| **Q3 2026** | CBE cybersecurity examination window | CBE Framework | 🟡 Readiness: 87% |
| **30 days** | DLP deployment for data egress (Law 175/2018 Art.14) | Art. 14 | 🔴 EGP 7M exposure |
| **45 days** | Anti-DDoS service procurement (Law 175/2018 Art.8) | Art. 8 | 🔴 EGP 5M exposure |
| **January 2027** | Basel IV output floor implementation | Basel IV | 🟡 Monitor |

### Recommended Sequencing:
1. Maadi attestation — close within 5 business days
2. CDD refresh — assign dedicated team, 3-month sprint
3. Law 175/2018 Art.14 DLP — initiate procurement now`,

  'Audit readiness for CBE examination': `## CBE Examination Readiness — 87% Ready

| Domain | Status | Readiness |
|--------|--------|-----------|
| Policy Documentation | 12/12 current | ✅ 100% |
| Control Testing | 89/115 tested | ⚠️ 77% |
| Risk Register | All 28 documented | ✅ 100% |
| Incident Records | 24-month history | ✅ 100% |
| BCP/DRP Testing | 3 months ago | ⚠️ Partial |

### Critical Gaps Before Examination:
1. PCI DSS v4.0 Req 7.1.1 — access control evidence package — **10 days**
2. ISO 27001:2022 A.9.1.1 — access review overdue — **7 days**
3. Schedule BCP tabletop exercise before examination window opens
4. Complete 26 untested controls in IR and AC domains`,
}

function matchQuery(text) {
  const q = text.toLowerCase()
  if (q.match(/aml|fatf|rec(ommendation)?\s*10|cdd|money launder|kyc|top.*(3|three).*gap/)) return knowledgeBase['What are our top 3 AML gaps?']
  if (q.match(/cbe|compliance gap|framework|cross.framework/)) return knowledgeBase['Analyze current CBE compliance gaps']
  if (q.match(/vulnerabilit|cve|sla|breach|patch|critical/)) return knowledgeBase['What critical vulnerabilities breach SLA?']
  if (q.match(/basel|cet1|tier\s*1|capital|lcr|nsfr|rwa|liquidity/)) return knowledgeBase['Summarize our Basel III capital position']
  if (q.match(/deadline|upcoming|approach|calendar|june|july|schedule/)) return knowledgeBase['Which CBE deadlines are approaching?']
  if (q.match(/audit|cbe exam|examination|readiness/)) return knowledgeBase['Audit readiness for CBE examination']
  if (q.match(/attest|policy|sign.?off|employee/)) return knowledgeBase['Audit readiness for CBE examination']
  return null
}

function renderMarkdown(text) {
  return text
    .replace(/^## (.+)$/gm, '<div class="text-xs font-bold text-amber-300/90 mt-3 mb-1 border-b border-amber-500/15 pb-1">$1</div>')
    .replace(/^### (.+)$/gm, '<div class="text-[11px] font-semibold text-teal-400/80 mt-2 mb-0.5">$1</div>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-amber-200/90 font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-slate-300/80 not-italic">$1</em>')
    .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 rounded text-[10px] font-mono" style="background:rgba(255,255,255,0.08);color:#7dd3fc">$1</code>')
    .replace(/✅/g, '<span class="text-emerald-400">✅</span>')
    .replace(/⚠️/g, '<span class="text-amber-400">⚠️</span>')
    .replace(/❌/g, '<span class="text-red-400">❌</span>')
    .replace(/🔴/g, '<span class="text-red-400">🔴</span>')
    .replace(/🟡/g, '<span class="text-amber-400">🟡</span>')
    .replace(/🟢/g, '<span class="text-emerald-400">🟢</span>')
    .replace(/^(\|.+\|)$/gm, (row) => {
      if (/^(\|[-:]+)+\|$/.test(row.trim())) return ''
      const cells = row.split('|').filter((_, i, a) => i !== 0 && i !== a.length - 1)
      return `<div class="flex text-[10px] border-b border-slate-700/30">${cells.map(c =>
        `<div class="flex-1 min-w-0 px-1.5 py-0.5 text-slate-300/80" style="word-break:break-word">${c.trim()}</div>`
      ).join('')}</div>`
    })
    .replace(/^- (.+)$/gm, '<div class="flex gap-1.5 text-[11px] text-slate-300/75 my-0.5"><span class="text-amber-500/60 mt-0.5 flex-shrink-0">•</span><span>$1</span></div>')
    .replace(/^\d+\. (.+)$/gm, '<div class="text-[11px] text-slate-300/75 my-0.5 pl-2">$1</div>')
    .replace(/^(?!<)([^\n]+)$/gm, (line) => line.trim() ? `<div class="text-[11px] text-slate-300/80 leading-relaxed">${line}</div>` : '')
    .replace(/\n{2,}/g, '<div class="h-1"></div>')
}

export default function AICopilot({ onClose }) {
  const [messages, setMessages] = useState([
    {
      id: '0',
      role: 'assistant',
      content: `## Wadjet GRC AI — Llama Powered

I'm connected to your local Llama model via Ollama to answer compliance questions in natural language.

**Ask me anything, for example:**
- *"What are our top 3 AML gaps?"*
- *"Which CVEs are breaching SLA windows?"*
- *"Summarize our Basel III capital position"*`,
      timestamp: new Date(),
      offline: false,
    },
  ])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [showChips, setShowChips] = useState(true)
  const [ollamaStatus, setOllamaStatus] = useState(null)
  const [ollamaModel, setOllamaModel] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const abortRef = useRef(null)
  const historyRef = useRef([])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  /* ── Check Ollama status on mount and every 30s ── */
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/status', { signal: AbortSignal.timeout(5000) })
      const data = await res.json()
      setOllamaStatus(data)
      if (data.connected && data.bestModel) {
        setOllamaModel(data.bestModel)
      } else if (data.connected && data.models?.length > 0) {
        setOllamaModel(data.models[0])
      }
    } catch {
      setOllamaStatus({ connected: false, host: 'unknown', models: [], bestModel: null })
    }
  }, [])

  useEffect(() => {
    checkStatus()
    const t = setInterval(checkStatus, 30000)
    return () => clearInterval(t)
  }, [checkStatus])

  /* ── Stream from Ollama via API server ── */
  const streamOllama = useCallback(async (userText, botMsgId) => {
    const controller = new AbortController()
    abortRef.current = controller

    const chatHistory = historyRef.current
    const newHistory = [...chatHistory, { role: 'user', content: userText }]

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory, model: ollamaModel }),
        signal: controller.signal,
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const payload = JSON.parse(line.slice(6))
            if (payload.error) throw new Error(payload.message)
            if (payload.content) {
              fullContent += payload.content
              setMessages(prev => prev.map(m =>
                m.id === botMsgId ? { ...m, content: fullContent, streaming: true } : m
              ))
            }
            if (payload.done) {
              setMessages(prev => prev.map(m =>
                m.id === botMsgId ? { ...m, content: fullContent, streaming: false, model: payload.model } : m
              ))
              historyRef.current = [
                ...newHistory,
                { role: 'assistant', content: fullContent },
              ]
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== 'JSON parse error') {
              throw parseErr
            }
          }
        }
      }
    } catch (err) {
      if (err?.name === 'AbortError') return
      throw err
    }
  }, [ollamaModel])

  /* ── Fallback: built-in streaming simulation ── */
  const streamFallback = useCallback((fullText, botMsgId) => {
    return new Promise((resolve) => {
      let idx = 0
      const interval = setInterval(() => {
        idx += 8
        if (idx >= fullText.length) {
          clearInterval(interval)
          setMessages(prev => prev.map(m =>
            m.id === botMsgId ? { ...m, content: fullText, streaming: false, offline: true } : m
          ))
          historyRef.current = [...historyRef.current, { role: 'assistant', content: fullText }]
          resolve()
        } else {
          setMessages(prev => prev.map(m =>
            m.id === botMsgId ? { ...m, content: fullText.slice(0, idx), streaming: true, offline: true } : m
          ))
        }
      }, 12)
    })
  }, [])

  const handleSend = useCallback(async (overrideText) => {
    const text = (overrideText ?? input).trim()
    if (!text || isStreaming) return

    setIsStreaming(true)
    setShowChips(false)
    setInput('')

    const userMsg = { id: `u-${Date.now()}`, role: 'user', content: text, timestamp: new Date() }
    const botMsg = { id: `b-${Date.now() + 1}`, role: 'assistant', content: '', streaming: true, timestamp: new Date(), offline: false }

    setMessages(prev => [...prev, userMsg, botMsg])
    historyRef.current = [...historyRef.current, { role: 'user', content: text }]

    try {
      if (ollamaStatus?.connected) {
        await streamOllama(text, botMsg.id)
      } else {
        const match = matchQuery(text) ?? knowledgeBase[text]
        const fallback = match ?? `## GRC Analysis

I couldn't reach Ollama at the configured URL.

**To enable live Llama AI:**
1. Install Ollama: https://ollama.com
2. Run: \`ollama pull llama3.1:8b\`
3. Set \`OLLAMA_BASE_URL\` in project secrets to your Ollama URL
4. Restart the API server

**Your question:** "${text}"

Meanwhile, try one of the quick questions below — those are answered from the built-in knowledge base.`
        await new Promise(resolve => setTimeout(resolve, 400))
        await streamFallback(fallback, botMsg.id)
      }
    } catch (err) {
      const errMsg = `**Connection error:** ${err?.message ?? 'Could not reach Ollama'}\n\nPlease check your \`OLLAMA_BASE_URL\` setting and ensure Ollama is running.`
      setMessages(prev => prev.map(m =>
        m.id === botMsg.id ? { ...m, content: errMsg, streaming: false } : m
      ))
    } finally {
      setIsStreaming(false)
      setShowChips(true)
    }
  }, [input, isStreaming, ollamaStatus, streamOllama, streamFallback])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const isConnected = ollamaStatus?.connected
  const isChecking = ollamaStatus === null

  return (
    <div className="fixed bottom-24 right-6 z-50 w-[430px] flex flex-col animate-slide-in"
      style={{ height: '640px', background: '#161f30', border: '1px solid rgba(196,160,48,0.18)', borderRadius: '16px', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(196,160,48,0.1)', background: '#1a2540', borderRadius: '16px 16px 0 0' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(196,160,48,0.12)', border: '1px solid rgba(196,160,48,0.2)' }}>
            <Bot size={15} style={{ color: '#c4a030' }} />
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: '#c4a030', fontFamily: "'Cairo', serif" }}>GRC AI Copilot</div>
            <div className="text-[9px]" style={{ color: 'rgba(196,160,48,0.4)' }}>
              {ollamaModel ? `llama · ${ollamaModel}` : 'Local Llama via Ollama'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Ollama connection status pill */}
          <button onClick={checkStatus}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-all"
            style={{
              background: isChecking ? 'rgba(148,163,184,0.08)' : isConnected ? 'rgba(13,191,168,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${isChecking ? 'rgba(148,163,184,0.15)' : isConnected ? 'rgba(13,191,168,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}
            title={isConnected ? `Ollama connected: ${ollamaStatus?.host}` : 'Ollama not connected — click to retry'}>
            {isChecking ? (
              <RefreshCw size={9} className="animate-spin" style={{ color: '#94a3b8' }} />
            ) : isConnected ? (
              <Wifi size={9} style={{ color: '#0dbfa8' }} />
            ) : (
              <WifiOff size={9} style={{ color: '#ef4444' }} />
            )}
            <span className="text-[9px] font-medium" style={{
              color: isChecking ? '#94a3b8' : isConnected ? '#0dbfa8' : '#ef4444'
            }}>
              {isChecking ? 'checking…' : isConnected ? `AI Online · ${ollamaModel ?? 'Llama'}` : 'AI Offline'}
            </span>
          </button>

          <button onClick={onClose}
            className="p-1.5 rounded-lg transition-all hover:bg-white/5"
            style={{ color: 'rgba(196,160,48,0.5)' }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── AI Offline banner ── */}
      {!isChecking && !isConnected && (
        <div className="mx-3 mt-2 px-3 py-2.5 rounded-lg flex-shrink-0 flex gap-2.5 items-start"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <WifiOff size={13} style={{ color: '#ef4444', marginTop: '1px', flexShrink: 0 }} />
          <div>
            <p className="text-[10px] font-bold text-red-400 mb-0.5">AI Offline — Using Cached Knowledge</p>
            <p className="text-[9px] text-slate-400 leading-relaxed">
              Ollama is not reachable. Install Ollama → run <code className="px-1 rounded" style={{ background: 'rgba(255,255,255,0.08)' }}>ollama pull llama3.1:8b</code> → set <code className="px-1 rounded" style={{ background: 'rgba(255,255,255,0.08)' }}>OLLAMA_BASE_URL</code>. Responses below use the built-in GRC knowledge base.
            </p>
          </div>
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin" style={{ minHeight: 0 }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0"
                style={{ background: 'rgba(196,160,48,0.1)', border: '1px solid rgba(196,160,48,0.18)' }}>
                <Sparkles size={10} style={{ color: '#c4a030' }} />
              </div>
            )}
            <div className="max-w-[88%]" style={{
              background: msg.role === 'user' ? 'rgba(13,191,168,0.1)' : 'rgba(255,255,255,0.04)',
              border: msg.role === 'user' ? '1px solid rgba(13,191,168,0.2)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
              padding: '10px 12px',
            }}>
              {msg.role === 'assistant' ? (
                msg.content ? (
                  <>
                    {/* Offline Mode badge */}
                    {msg.offline && !msg.streaming && (
                      <div className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded-md w-fit"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <WifiOff size={8} style={{ color: '#ef4444' }} />
                        <span className="text-[9px] font-semibold" style={{ color: '#ef4444' }}>Offline Mode — cached answer</span>
                      </div>
                    )}
                    <div className="text-[11px] leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                  </>
                ) : (
                  /* Thinking indicator while waiting for first token */
                  <span className="flex items-center gap-2 py-0.5">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-dot" style={{ animationDelay: '0s' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-dot" style={{ animationDelay: '0.2s' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-dot" style={{ animationDelay: '0.4s' }} />
                    </span>
                    <span className="text-[9px] font-medium" style={{ color: 'rgba(196,160,48,0.5)' }}>Thinking…</span>
                  </span>
                )
              ) : (
                <div className="text-xs leading-relaxed" style={{ color: 'rgba(13,191,168,0.9)' }}>{msg.content}</div>
              )}
              {msg.streaming && msg.content && (
                <span className="inline-block w-0.5 h-3 ml-0.5 align-middle animate-blink"
                  style={{ background: '#c4a030', borderRadius: '1px' }} />
              )}
              <div className="text-[8px] mt-1.5 font-mono" style={{ color: 'rgba(255,255,255,0.18)' }}>
                {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Suggested question chips ── */}
      {showChips && !isStreaming && (
        <div className="px-3 pt-2 pb-1 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="text-[9px] font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'rgba(196,160,48,0.38)' }}>
            Suggested Questions
          </div>
          <div className="flex flex-wrap gap-1.5">
            {promptChips.map((chip, idx) => {
              const Icon = chip.icon
              return (
                <button key={idx} onClick={() => handleSend(chip.label)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                  style={{ background: 'rgba(196,160,48,0.06)', border: '1px solid rgba(196,160,48,0.12)', color: 'rgba(196,160,48,0.65)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,160,48,0.12)'; e.currentTarget.style.color = 'rgba(196,160,48,0.9)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(196,160,48,0.06)'; e.currentTarget.style.color = 'rgba(196,160,48,0.65)' }}>
                  <Icon size={9} /><span className="truncate max-w-[180px]">{chip.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Input ── */}
      <div className="flex items-center gap-2 p-3 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#1a2540', borderRadius: '0 0 16px 16px' }}>
        <div className="relative flex-1">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(196,160,48,0.35)' }} />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? `Ask Llama about compliance…` : 'Ask a GRC question (offline mode)…'}
            disabled={isStreaming}
            className="w-full text-xs rounded-xl pl-8 pr-3 py-2.5 transition-all focus:outline-none disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(196,160,48,0.12)', color: 'rgba(255,255,255,0.85)' }}
            onFocus={e => { e.target.style.borderColor = 'rgba(196,160,48,0.3)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(196,160,48,0.12)' }}
          />
        </div>
        <button onClick={() => handleSend()} disabled={!input.trim() || isStreaming}
          className="p-2.5 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #8a6c00, #c4a030)', color: '#0a1628' }}>
          <Send size={13} />
        </button>
      </div>
    </div>
  )
}
