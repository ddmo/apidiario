import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEffect, useState } from 'react'
import { t } from '@/i18n/it'
import { ArrowLeft } from 'lucide-react'

interface UserInfo {
  id: string
  email: string
  displayName: string
  createdAt: string | null
  lastSignInAt: string | null
  isConfirmed: boolean
  isAdmin: boolean
}

type PageStatus = 'loading' | 'error' | 'denied' | 'ready'

export const Route = createFileRoute('/admin/users')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw redirect({ to: '/login' })
    }
  },
  component: AdminUsersPage,
})

function AdminUsersPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [pageStatus, setPageStatus] = useState<PageStatus>('loading')
  const [users, setUsers] = useState<UserInfo[]>([])
  const [pageError, setPageError] = useState('')

  // Invite form state
  const [email, setEmail] = useState('')
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [inviteMsg, setInviteMsg] = useState('')

  // Revoke state (user_id being revoked)
  const [revoking, setRevoking] = useState<string | null>(null)
  // Delete state (user_id being deleted)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setCurrentUserId(session.user.id)
    })
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setPageStatus('loading')
    setPageError('')

    const { data, error: fetchErr } = await supabase.functions.invoke('admin-list-users')

    if (fetchErr) {
      // Verifica se e' un errore 403
      const isForbidden = fetchErr.message?.includes('403')
        || (fetchErr as { context?: { status: number } })?.context?.status === 403

      if (isForbidden) {
        setPageStatus('denied')
      } else {
        setPageStatus('error')
        setPageError(fetchErr.message || t.admin.error)
      }
      return
    }

    setUsers(data.users ?? [])
    setPageStatus('ready')
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteStatus('loading')
    setInviteMsg('')

    const { error: inviteErr } = await supabase.functions.invoke('admin-invite-user', {
      body: { email: email.trim() },
    })

    if (inviteErr) {
      setInviteStatus('error')
      setInviteMsg(inviteErr.message || t.admin.inviteError)
    } else {
      setInviteStatus('success')
      setEmail('')
      fetchUsers()
    }
  }

  async function handleRevoke(targetUserId: string) {
    if (!window.confirm('Rimuovere questo utente dagli amministratori?')) return
    setRevoking(targetUserId)

    const { error } = await supabase.functions.invoke('admin-remove-admin', {
      body: { user_id: targetUserId },
    })

    setRevoking(null)
    if (error) {
      alert(error.message || 'Errore durante la revoca.')
    } else {
      fetchUsers()
    }
  }

  async function handleDeleteUser(targetUserId: string) {
    if (!window.confirm(`Eliminare definitivamente questo utente? Tutti i suoi dati andranno persi.`)) return
    setDeleting(targetUserId)

    const { error } = await supabase.functions.invoke('admin-delete-user', {
      body: { user_id: targetUserId },
    })

    setDeleting(null)
    if (error) {
      alert(error.message || "Errore durante l'eliminazione.")
    } else {
      fetchUsers()
    }
  }

  if (pageStatus === 'loading') {
    return (
      <PageLayout>
        <p className="text-wood-500 text-center py-8">{t.admin.loading}</p>
      </PageLayout>
    )
  }

  if (pageStatus === 'denied') {
    return (
      <PageLayout>
        <div className="text-center py-8">
          <p className="text-danger-500 mb-2">{t.admin.accessDenied}</p>
          <p className="text-wood-500 text-sm mb-6">{t.admin.accessDeniedHint}</p>
          <Link to="/" className="text-honey-600 underline underline-offset-2 text-sm">
            {t.admin.backToHome}
          </Link>
        </div>
      </PageLayout>
    )
  }

  if (pageStatus === 'error') {
    return (
      <PageLayout>
        <div className="text-center py-8">
          <p className="text-danger-500 mb-4">{pageError}</p>
          <Button variant="primary" size="sm" onClick={fetchUsers}>
            {t.admin.retry}
          </Button>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      {/* Invite form */}
      <section className="mb-8">
        <h2 className="text-lg font-medium text-wood-800 mb-1">{t.admin.inviteUser}</h2>
        <p className="text-sm text-wood-500 mb-4">{t.admin.inviteDescription}</p>

        <form onSubmit={handleInvite} className="flex flex-col gap-3">
          <Input
            id="invite-email"
            type="email"
            label={t.admin.emailLabel}
            placeholder={t.admin.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            inputMode="email"
            required
            disabled={inviteStatus === 'loading'}
          />
          {inviteStatus === 'error' && (
            <p className="text-sm text-danger-500">{inviteMsg}</p>
          )}
          {inviteStatus === 'success' && (
            <p className="text-sm text-wood-600">{t.admin.inviteSent}</p>
          )}
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={inviteStatus === 'loading'}
            className="self-start"
          >
            {t.admin.inviteBtn}
          </Button>
        </form>
      </section>

      {/* User list */}
      <section>
        <h2 className="text-lg font-medium text-wood-800 mb-3">
          {t.admin.users} &middot; {t.admin.usersCount(users.length)}
        </h2>

        {users.length === 0 && (
          <p className="text-sm text-wood-400">Nessun utente trovato.</p>
        )}

        <div className="flex flex-col gap-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="rounded-lg border border-wood-200 bg-white px-4 py-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-wood-800 text-sm truncate">
                  {user.email}
                </span>
                <div className="flex gap-2 shrink-0 items-center">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.isAdmin
                        ? 'bg-honey-100 text-honey-700'
                        : 'bg-wood-100 text-wood-500'
                    }`}
                  >
                    {user.isAdmin ? t.admin.admin : t.admin.notAdmin}
                  </span>
                  {user.isAdmin && user.id !== currentUserId && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(user.id)}
                      disabled={revoking === user.id}
                      className="text-xs text-danger-500 hover:text-danger-700 underline underline-offset-2 whitespace-nowrap"
                    >
                      {revoking === user.id ? '…' : 'Rimuovi'}
                    </button>
                  )}
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.isConfirmed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-wood-100 text-wood-400'
                    }`}
                  >
                    {user.isConfirmed ? t.admin.confirmed : t.admin.notConfirmed}
                  </span>
                </div>
              </div>
              <div className="flex gap-4 text-xs text-wood-400">
                <span>
                  {t.admin.invitedAt}: {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('it-IT')
                    : '—'}
                </span>
                {user.lastSignInAt && (
                  <span>
                    {t.admin.lastLogin}: {new Date(user.lastSignInAt).toLocaleDateString('it-IT')}
                  </span>
                )}
                {user.id !== currentUserId && (
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={deleting === user.id}
                    className="ml-auto text-danger-500 hover:text-danger-700 underline underline-offset-2"
                  >
                    {deleting === user.id ? '…' : 'Elimina'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageLayout>
  )
}

function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh px-4 py-6">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-wood-500 hover:text-wood-700"
        >
          <ArrowLeft size={16} />
          {t.admin.backToHome}
        </Link>
      </div>
      <div className="max-w-lg mx-auto">
        <h1 className="font-display text-2xl font-medium text-wood-800 mb-6">
          {t.admin.title}
        </h1>
        {children}
      </div>
    </main>
  )
}
