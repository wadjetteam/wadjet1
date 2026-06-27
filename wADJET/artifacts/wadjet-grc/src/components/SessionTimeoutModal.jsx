import { useState, useEffect, useRef } from 'react'
import { Clock, LogOut, User } from 'lucide-react'

export default function SessionTimeoutModal({ onStayLoggedIn, onLogout }) {
  const [timeLeft, setTimeLeft] = useState(60)
  const intervalRef = useRef(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          onLogout()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [onLogout])

  const progress = (timeLeft / 60) * 100
  const barColor = timeLeft > 30 ? '#d4af37' : timeLeft > 10 ? '#c9a82e' : '#c41e3a'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ background: 'rgba(10,22,40,0.9)' }}>
      <div className="bg-nile-900 border border-pharaoh-500/15 rounded-2xl shadow-2xl w-[420px] animate-fade-in overflow-hidden">
        <div className="h-1.5 bg-pharaoh-500/5">
          <div className="h-full transition-all duration-1000" style={{ width: `${progress}%`, backgroundColor: barColor }} />
        </div>

        <div className="p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-pharaoh-500/10 border border-pharaoh-500/20 flex items-center justify-center mx-auto mb-4">
            <Clock size="32" className="text-pharaoh-400" />
          </div>

          <h2 className="text-lg font-bold text-pharaoh-200 mb-2" style={{ fontFamily: "'Cairo', serif" }}>Session Timeout Warning</h2>
          <p className="text-sm text-pharaoh-400/70 mb-1">No activity detected for 5 minutes</p>
          <p className="text-xs text-pharaoh-500/40 mb-6">Your session will be automatically terminated for security</p>

          <div className="mb-6">
            <div className="text-5xl font-bold mono mb-1" style={{ color: barColor }}>
              {String(timeLeft).padStart(2, '0')}
            </div>
            <div className="text-xs text-pharaoh-400/60">seconds remaining</div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-6 px-4 py-3 rounded-xl bg-pharaoh-900/30 border border-pharaoh-500/10">
            <User size="12" className="text-pharaoh-400/60" />
            <span className="text-xs text-pharaoh-500/40 mono">USR-A7X3K9 · 10.88.142.37</span>
          </div>

          <div className="flex gap-3">
            <button onClick={onLogout}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border border-pharaoh-500/15 text-pharaoh-500/40 hover:text-pharaoh-300 hover:border-pharaoh-500/30 transition-all">
              <LogOut size="14" />
              Logout
            </button>
            <button onClick={onStayLoggedIn}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-bold gold-gradient text-nile-900 transition-all shadow-lg shadow-pharaoh-500/20 hover:opacity-90">
              Stay Logged In
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
