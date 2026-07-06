export default function Field({ label, children, required }) {
  return (
    <div>
      <label className="block text-[10px] text-pharaoh-400/70 mb-1.5 font-medium">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
