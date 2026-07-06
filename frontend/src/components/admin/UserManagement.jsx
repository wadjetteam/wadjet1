import { useState, useEffect } from 'react'
import { Users, Plus, Edit2, Trash2, X, Save, Search } from 'lucide-react'

const GOLD = '#d4a832'
const SILVER = '#ced4da'
const WHITE = '#f8f9fa'
const CRIMSON = '#dc3545'
const DARK_BG = 'rgba(10,10,10,0.85)'
const BORDER = '1px solid rgba(212,168,50,0.08)'
const INPUT_BG = 'rgba(255,255,255,0.04)'
const INPUT_BORDER = '1px solid rgba(212,168,50,0.12)'
const GRADIENT = 'linear-gradient(135deg, rgba(212,168,50,0.12), rgba(212,168,50,0.04))'

const cardStyle = { background: DARK_BG, border: BORDER, borderRadius: 16, padding: 20 }
const baseInput = { background: INPUT_BG, border: INPUT_BORDER, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: WHITE, outline: 'none', width: '100%' }

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)

  const showToast = (msg, type) => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [usersRes, permsRes] = await Promise.all([
        fetch('/api/users-management/users'),
        fetch('/api/users-management/permissions'),
      ])
      if (!usersRes.ok) throw new Error('Failed to load users')
      if (!permsRes.ok) throw new Error('Failed to load permissions')
      const usersData = await usersRes.json()
      const permsData = await permsRes.json()
      setUsers(Array.isArray(usersData.users) ? usersData.users : [])
      setPermissions(Array.isArray(permsData.permissions) ? permsData.permissions : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const handleSave = async (form) => {
    try {
      const isEdit = !!editingUser
      const url = isEdit
        ? `/api/users-management/users/${editingUser.userId}`
        : '/api/users-management/users'
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save user')
      showToast(isEdit ? 'User updated' : 'User created', 'success')
      setShowModal(false)
      setEditingUser(null)
      fetchAll()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user?')) return
    try {
      const res = await fetch(`/api/users-management/users/${userId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      showToast('User deleted', 'success')
      fetchAll()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const filteredUsers = users.filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.jobTitle?.toLowerCase().includes(q)
  })

  if (loading) return <div className="h-full overflow-y-auto p-6"><div className="flex items-center justify-center py-20"><span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: GOLD }} /></div></div>
  if (error) return <div className="h-full overflow-y-auto p-6"><p style={{ color: CRIMSON }}>{error}</p></div>

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5 scrollbar-thin">
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 20px', borderRadius: 10, fontSize: 12, fontWeight: 600,
          background: toast.type === 'success' ? 'rgba(32,201,151,0.15)' : 'rgba(220,53,69,0.15)',
          border: toast.type === 'success' ? '1px solid rgba(32,201,151,0.3)' : '1px solid rgba(220,53,69,0.3)',
          color: toast.type === 'success' ? '#20c997' : CRIMSON,
          backdropFilter: 'blur(8px)',
        }}>{toast.msg}</div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: GRADIENT, border: BORDER }}>
            <Users size={16} style={{ color: GOLD }} />
          </div>
          <h1 className="text-lg font-bold" style={{ color: WHITE }}>User Management</h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(212,168,50,0.08)', color: GOLD }}>
            {users.length} users
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Search size={12} style={{ color: 'rgba(206,212,218,0.3)' }} />
            <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...baseInput, width: 200, fontSize: 10 }} />
          </div>
          <button onClick={() => { setEditingUser(null); setShowModal(true) }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ background: GRADIENT, border: BORDER, color: GOLD }}>
            <Plus size={12} /> Add User
          </button>
        </div>
      </div>

      <div style={cardStyle}>
        <table className="w-full" style={{ fontSize: 11, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(212,168,50,0.08)' }}>
              {['Name', 'Email', 'Job Title', 'Permissions', ''].map(h => (
                <th key={h} className="text-left py-2.5 px-3 font-medium"
                  style={{ color: 'rgba(206,212,218,0.5)', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u, i) => (
              <tr key={u.userId || i} style={{ borderBottom: '1px solid rgba(212,168,50,0.04)' }}>
                <td className="py-2.5 px-3 font-medium" style={{ color: WHITE }}>{u.name}</td>
                <td className="py-2.5 px-3" style={{ color: SILVER }}>{u.email}</td>
                <td className="py-2.5 px-3" style={{ color: GOLD }}>{u.jobTitle || '—'}</td>
                <td className="py-2.5 px-3">
                  <div className="flex flex-wrap gap-1">
                    {(u.permissions || []).length === 0 ? (
                      <span style={{ color: 'rgba(206,212,218,0.3)', fontSize: 9 }}>No permissions</span>
                    ) : (
                      u.permissions.map(p => (
                        <span key={p} style={{
                          padding: '1px 6px', borderRadius: 6, fontSize: 9,
                          background: 'rgba(212,168,50,0.08)', color: GOLD,
                        }}>{p}</span>
                      ))
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingUser(u); setShowModal(true) }}
                      className="p-1.5 rounded-lg transition-all" style={{ color: 'rgba(206,212,218,0.4)' }}>
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDelete(u.userId)}
                      className="p-1.5 rounded-lg transition-all" style={{ color: CRIMSON }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <UserFormModal
        user={editingUser}
        allPermissions={permissions}
        onSave={handleSave}
        onClose={() => { setShowModal(false); setEditingUser(null) }}
      />}
    </div>
  )
}

function UserFormModal({ user, allPermissions, onSave, onClose }) {
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || '')
  const [selectedPerms, setSelectedPerms] = useState(user?.permissions || [])
  const [saving, setSaving] = useState(false)

  const togglePerm = (code) => {
    setSelectedPerms(prev =>
      prev.includes(code) ? prev.filter(p => p !== code) : [...prev, code]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setSaving(true)
    await onSave({ name: name.trim(), email: email.trim(), jobTitle: jobTitle.trim(), permissions: selectedPerms })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <form onSubmit={handleSubmit} style={{
        background: '#0a0f18', border: BORDER, borderRadius: 20, padding: 28,
        width: 480, maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto',
      }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold" style={{ color: WHITE }}>
            {user ? 'Edit User' : 'Add User'}
          </h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg" style={{ color: 'rgba(206,212,218,0.4)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: SILVER }}>Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} required style={baseInput} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: SILVER }}>Email *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={baseInput} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: SILVER }}>Job Title</label>
            <input value={jobTitle} onChange={e => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Compliance Officer" style={baseInput} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: SILVER }}>Permissions</label>
            <div className="grid grid-cols-2 gap-2">
              {allPermissions.map(p => (
                <label key={p.code} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all"
                  style={{
                    background: selectedPerms.includes(p.code) ? 'rgba(212,168,50,0.08)' : INPUT_BG,
                    border: selectedPerms.includes(p.code) ? '1px solid rgba(212,168,50,0.2)' : INPUT_BORDER,
                  }}>
                  <input type="checkbox" checked={selectedPerms.includes(p.code)}
                    onChange={() => togglePerm(p.code)}
                    style={{ accentColor: GOLD }} />
                  <span className="text-xs" style={{ color: selectedPerms.includes(p.code) ? GOLD : SILVER }}>{p.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all"
            style={{ background: INPUT_BG, border: INPUT_BORDER, color: SILVER }}>
            Cancel
          </button>
          <button type="submit" disabled={saving || !name.trim() || !email.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={{
              background: GRADIENT, border: BORDER, color: GOLD,
              opacity: (saving || !name.trim() || !email.trim()) ? 0.5 : 1,
            }}>
            {saving ? 'Saving...' : <><Save size={12} /> {user ? 'Update' : 'Create'}</>}
          </button>
        </div>
      </form>
    </div>
  )
}
