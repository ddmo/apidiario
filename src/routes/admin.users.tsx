import { createFileRoute } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEffect, useState } from 'react'
import { BadgeCheck, Clock, Trash2, ShieldOff } from 'lucide-react'

interface UserInfo {
  id: string
  email: string
  displayName: string
  createdAt: string | null
  lastSignInAt: string | null
  isConfirmed: boolean
  isAdmin: boolean
}

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersPage,
})

function AdminUsersPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserInfo[]>([])
  const [error, setError] = useState('')

  const [email, setEmail] = useState('')
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [inviteMsg, setInviteMsg] = useState('')

  const [revoking, setRevoking] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setCurrentUserId(session.user.id)
    })
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    setError('')
    const { data, error: e } = await supabase.functions.invoke('admin-list-users')
    setLoading(false)
    if (e) { setError(e.message || 'Errore caricamento utenti'); return }
    setUsers(data.users ?? [])
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteStatus('loading')
    setInviteMsg('')
    const { error: e2 } = await supabase.functions.invoke('admin-invite-user', {
      body: { email: email.trim(), redirect_to: window.location.origin + '/auth/callback' },
    })
    if (e2) {
      setInviteStatus('error')
      setInviteMsg(e2.message || 'Errore durante l\'invito')
    } else {
      setInviteStatus('success')
      setInviteMsg('Invito inviato!')
      setEmail('')
      fetchUsers()
    }
  }

  async function handleRevoke(userId: string) {
    if (!window.confirm('Rimuovere questo utente dagli amministratori?')) return
    setRevoking(userId)
    const { error: e } = await supabase.functions.invoke('admin-remove-admin', { body: { user_id: userId } })
    setRevoking(null)
    if (e) alert(e.message || 'Errore')
    else fetchUsers()
  }

  async function handleDelete(userId: string) {
    if (!window.confirm('Eliminare definitivamente questo utente? Tutti i suoi dati andranno persi.')) return
    setDeleting(userId)
    const { error: e } = await supabase.functions.invoke('admin-delete-user', { body: { user_id: userId } })
    setDeleting(null)
    if (e) alert(e.message || 'Errore')
    else fetchUsers()
  }

  return (
    <div className="px-6 py-8 max-w-3xl">
      <h1 className="text-2xl font-semibold text-stone-800 mb-6">Utenti</h1>

      {/* Invite */}
      <section className="bg-white rounded-xl border border-stone-200 px-5 py-5 mb-6">
        <h2 className="text-sm font-semibold text-stone-700 mb-1">Invita un nuovo utente</h2>
        <p className="text-xs text-stone-500 mb-4">L'utente riceverà un'email con il link per impostare la password.</p>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              id="invite-email"
              type="email"
              label=""
              placeholder="email@esempio.it"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setInviteStatus('idle'); setInviteMsg('') }}
              inputMode="email"
              required
              disabled={inviteStatus === 'loading'}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={inviteStatus === 'loading'}
            className="shrink-0 self-start mt-0"
          >
            Invita
          </Button>
        </form>
        {inviteMsg && (
          <p className={`text-sm mt-2 ${inviteStatus === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {inviteMsg}
          </p>
        )}
      </section>

      {/* User list */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-stone-700">
            Tutti gli utenti {users.length > 0 && <span className="text-stone-400 font-normal">· {users.length}</span>}
          </h2>
          <button
            type="button"
            onClick={fetchUsers}
            className="text-xs text-amber-600 hover:text-amber-800 underline underline-offset-2"
          >
            Aggiorna
          </button>
        </div>

        {loading && <p className="text-sm text-stone-400 py-8 text-center">Caricamento…</p>}
        {error && <p className="text-sm text-red-600 py-4">{error}</p>}

        {!loading && !error && (
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            {users.length === 0 && (
              <p className="text-sm text-stone-400 text-center py-8">Nessun utente trovato.</p>
            )}
            {users.map((user, i) => (
              <div
                key={user.id}
                className={`px-4 py-3.5 flex items-start gap-3 ${i < users.length - 1 ? 'border-b border-stone-100' : ''}`}
              >
                {/* Status icon */}
                <div className="mt-0.5 shrink-0">
                  {user.isConfirmed
                    ? <BadgeCheck size={18} className="text-green-500" />
                    : <Clock size={18} className="text-stone-400" aria-label="In attesa di conferma" />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-stone-800 text-sm">{user.displayName || user.email}</span>
                    {user.isAdmin && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Admin</span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 truncate">{user.email}</p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-stone-400">
                    <span>
                      Registrato: {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('it-IT')
                        : '—'}
                    </span>
                    <span>
                      Ultimo accesso: {user.lastSignInAt
                        ? new Date(user.lastSignInAt).toLocaleDateString('it-IT')
                        : '—'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {user.isAdmin && user.id !== currentUserId && (
                    <button
                      type="button"
                      title="Rimuovi amministratore"
                      onClick={() => handleRevoke(user.id)}
                      disabled={revoking === user.id}
                      className="size-8 flex items-center justify-center rounded text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-40"
                    >
                      <ShieldOff size={16} />
                    </button>
                  )}
                  {user.id !== currentUserId && (
                    <button
                      type="button"
                      title="Elimina utente"
                      onClick={() => handleDelete(user.id)}
                      disabled={deleting === user.id}
                      className="size-8 flex items-center justify-center rounded text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
