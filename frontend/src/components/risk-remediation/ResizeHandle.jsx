export default function ResizeHandle({ colKey, startResize, initialWidth }) {
  const onMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    startResize(colKey, e.clientX, initialWidth || 80)
  }
  return (
    <div onMouseDown={onMouseDown}
      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-pharaoh-500/40 active:bg-pharaoh-500/60 z-10"
      style={{ backgroundClip: 'content-box' }} />
  )
}
