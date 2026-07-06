export default function ScoreSlider({ label, value, onChange }) {
  const color = value >= 4 ? '#dc3545' : value >= 3 ? '#fd7e14' : value >= 2 ? '#d4a832' : '#20c997'
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-pharaoh-400/70">{label}</span>
        <span className="text-[11px] font-bold mono" style={{ color }}>{value}</span>
      </div>
      <input type="range" min="1" max="5" value={value} onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer accent-[#ced4da]" />
      <div className="flex justify-between text-[8px] text-pharaoh-500/30 mt-0.5">
        <span>1–Very Low</span><span>3–Medium</span><span>5–Critical</span>
      </div>
    </div>
  )
}
