import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Trees, Share2, Trash2, Pencil, AlertTriangle, CloudRain, FlaskRound, X, Flower2 } from 'lucide-react'
import { useState } from 'react'
import { useApiaryCards } from '@/features/home/hooks/use-apiary-cards'
import { useTodaysAlerts } from '@/features/home/hooks/use-home-alerts'
import { useRecentActivityByOthers, type ActivityItem } from '@/features/home/hooks/use-recent-activity'
import { useApiaries, useDeleteApiary } from '@/features/apiaries/hooks/use-apiaries'
import { ApiaryListItem } from '@/features/apiaries/components/apiary-list-item'
import { EmptyState } from '@/components/ui/empty-state'
import { SwipeableRow } from '@/components/ui/swipeable-row'
import { ShareSheet } from '@/features/apiaries/components/share-sheet'
import { useToast } from '@/hooks/use-toast'
import { t } from '@/i18n/it'

export const Route = createFileRoute('/_auth/')({
  component: HomePage,
})

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}min fa`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h fa`
  const days = Math.floor(hours / 24)
  if (days === 0) return 'oggi'
  if (days === 1) return 'ieri'
  return `${days} g fa`
}

function AlertIcon({ type }: { type: string }) {
  if (type === 'active_treatment') return <FlaskRound size={16} className="shrink-0 mt-0.5 text-[#854F0B]" />
  if (type === 'bad_weather') return <CloudRain size={16} className="shrink-0 mt-0.5 text-wood-500" />
  if (type === 'active_bloom') return <Flower2 size={16} className="shrink-0 mt-0.5 text-honey-600" />
  return <AlertTriangle size={16} className="shrink-0 mt-0.5 text-[#A32D2D]" />
}

function SkeletonCard() {
  return (
    <div className="rounded-lg px-3.5 py-3 bg-cream-100 border border-cream-200 animate-pulse shadow-xs"
      style={{ borderLeft: '3px solid #BA7517' }}>
      <div className="flex items-center gap-2">
        <div className="h-4 bg-cream-200 rounded w-2/5" />
        <div className="h-3 bg-cream-200 rounded w-1/6 ml-auto" />
      </div>
      <div className="h-3 bg-cream-200 rounded w-1/4 mt-1.5" />
    </div>
  )
}

function HomePage() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const { data: apiaries, isLoading, isError } = useApiaries()
  const { mutate: deleteApiary } = useDeleteApiary()

  const { alerts, isLoading: alertsLoading } = useTodaysAlerts()
  const { data: activities, isLoading: activityLoading } = useRecentActivityByOthers()
  const { data: cards } = useApiaryCards()

  const [shareTarget, setShareTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  // Dismissed alerts — persisted in localStorage
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('dismissedAlerts')
      return new Set(stored ? JSON.parse(stored) : [])
    } catch { return new Set() }
  })

  function dismissAlert(id: string) {
    setDismissed(prev => {
      const next = new Set(prev)
      next.add(id)
      localStorage.setItem('dismissedAlerts', JSON.stringify([...next]))
      return next
    })
  }

  const activeAlerts = alerts.filter(a => !dismissed.has(a.id))

  // Group activities by inspector name for section heading
  const activityGroups = activities?.reduce<Record<string, ActivityItem[]>>((acc, item) => {
    if (!acc[item.inspectorName]) acc[item.inspectorName] = []
    acc[item.inspectorName]!.push(item)
    return acc
  }, {})

  return (
    <div className="flex flex-col h-full bg-cream-50">
      {/* Top bar */}
      <header className="shrink-0 bg-cream-50 border-b border-cream-200 pl-1 pr-2 h-14 flex items-center gap-1">
        <img src="/icons/icon-no-bg.svg" alt="" className="h-14 w-14" />
        <h1 className="font-display text-2xl font-medium text-wood-800 tracking-tight">
          Apidiario
        </h1>
      </header>
      <div className="flex-1 overflow-y-auto">
        {/* ── Oggi (alert section) ── */}
        {!alertsLoading && activeAlerts.length > 0 && (
          <section className="px-4 pt-4">
            <p className="text-[11px] text-wood-500 mb-2 px-0.5">Oggi</p>
            <div className="flex flex-col gap-2">
              {(() => {
                const bloomAlerts = activeAlerts.filter((a) => a.type === 'active_bloom') as Extract<typeof activeAlerts[number], { type: 'active_bloom' }>[]
                const otherAlerts = activeAlerts.filter((a) => a.type !== 'active_bloom')

                return (
                  <>
                    {otherAlerts.map((alert) => {
                      const isTreatment = alert.type === 'active_treatment'
                      const isWeather = alert.type === 'bad_weather'

                      if (isWeather) {
                        return (
                          <div key={alert.id} className="w-full rounded-lg px-3 py-2.5 flex items-start gap-2 bg-cream-100 border border-cream-200">
                            <AlertIcon type={alert.type} />
                            <span className="text-xs text-wood-700 leading-snug">{alert.message}</span>
                          </div>
                        )
                      }

                      const isTreatmentBg = isTreatment ? '#FAEEDA' : '#FCEBEB'

                      return (
                        <button
                          key={alert.id}
                          type="button"
                          onClick={() => void navigate({ to: '/apiaries/$apiaryId', params: { apiaryId: alert.apiaryId } })}
                          className="w-full rounded-lg px-3 py-2.5 flex items-start gap-2.5 text-left transition-colors"
                          style={{ backgroundColor: isTreatmentBg }}
                        >
                          <AlertIcon type={alert.type} />
                          <div className="flex-1 min-w-0">
                            {isTreatment ? (
                              <>
                                <p className="text-xs font-medium text-[#412402] leading-tight">
                                  {alert.message.split(' —')[0]}
                                </p>
                                <p className="text-[10px] text-[#633806] mt-0.5">
                                  {alert.message.includes('—') ? alert.message.split('—')[1]?.trim() : ''}
                                </p>
                              </>
                            ) : (
                              <p className="text-xs font-medium text-[#501313] leading-tight">{alert.message}</p>
                            )}
                          </div>
                          <span
                            onClick={(e) => { e.stopPropagation(); dismissAlert(alert.id) }}
                            className="shrink-0 size-6 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors cursor-pointer"
                            aria-label="Nascondi avviso"
                          >
                            <X size={14} className={isTreatment ? 'text-[#633806]' : 'text-[#791F1F]'} />
                          </span>
                        </button>
                      )
                    })}

                    {bloomAlerts.length > 0 && (
                      <div className="w-full rounded-lg px-3.5 py-3 bg-[#F1F6E8] border border-[#DCE8C5]">
                        <div className="flex items-center gap-2 mb-2">
                          <Flower2 size={16} className="shrink-0 text-honey-600" />
                          <span className="text-xs font-semibold text-[#3D5A1F]">
                            Fioriture in arrivo
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          {bloomAlerts.map((alert) => (
                            <button
                              key={alert.id}
                              type="button"
                              onClick={() => void navigate({ to: '/apiaries/$apiaryId', params: { apiaryId: alert.apiaryId } })}
                              className="w-full text-left text-xs text-[#3D5A1F]/80 leading-relaxed hover:text-[#3D5A1F] transition-colors"
                            >
                              {alert.message}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </section>
        )}

        {/* ── I tuoi apiari ── */}
        <section className="px-4 pt-5">
          <p className="text-[11px] text-wood-500 mb-2 px-0.5">I tuoi apiari</p>

          {isLoading && (
            <div className="flex flex-col gap-2">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {isError && (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm text-danger-500">{t.common.error}</p>
            </div>
          )}

          {!isLoading && !isError && apiaries?.length === 0 && (
            <div className="py-10">
              <EmptyState
                icon={<Trees size={48} strokeWidth={1.5} />}
                title={t.apiaries.empty.title}
                description={t.apiaries.empty.description}
                action={{
                  label: t.apiaries.empty.cta,
                  onClick: () => void navigate({ to: '/apiaries/new' }),
                }}
              />
            </div>
          )}

          {!isLoading && !isError && apiaries && apiaries.length > 0 && (
            <div className="flex flex-col gap-2 pb-4">
              {apiaries.map((apiary) => {
                const cardData = cards?.find((c) => c.id === apiary.id)

                return (
                  <SwipeableRow
                    key={apiary.id}
                    revealWidth={240}
                    revealContent={
                      <div className="flex-1 flex items-stretch">
                        <button
                          type="button"
                          onClick={() => setShareTarget({ id: apiary.id, name: apiary.name })}
                          className="flex-1 flex flex-col items-center justify-center gap-1 bg-honey-500 text-white"
                        >
                          <Share2 size={18} strokeWidth={1.75} />
                          <span className="text-[11px] font-semibold leading-none">Condividi</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void navigate({ to: '/apiaries/$apiaryId/edit', params: { apiaryId: apiary.id } })}
                          className="flex-1 flex flex-col items-center justify-center gap-1 bg-[#5B8FA0] text-white"
                        >
                          <Pencil size={18} strokeWidth={1.75} />
                          <span className="text-[11px] font-semibold leading-none">Modifica</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ id: apiary.id, name: apiary.name })}
                          className="flex-1 flex flex-col items-center justify-center gap-1 bg-danger-500 text-white"
                        >
                          <Trash2 size={18} strokeWidth={1.75} />
                          <span className="text-[11px] font-semibold leading-none">Elimina</span>
                        </button>
                      </div>
                    }
                  >
                    <ApiaryListItem
                      apiary={apiary}
                      lastInspectionAt={cardData?.lastInspectionAt}
                      hasActiveTreatment={cardData?.hasActiveTreatment ?? false}
                      accessLevel={cardData?.accessLevel}
                      weather={cardData?.weather}
                      photoUrl={cardData?.photoUrl}
                      onClick={() => void navigate({ to: '/apiaries/$apiaryId', params: { apiaryId: apiary.id } })}
                    />
                  </SwipeableRow>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Attività recente da altri ── */}
        {!activityLoading && activityGroups && Object.keys(activityGroups).length > 0 && (
          <section className="px-4 pb-4">
            {Object.entries(activityGroups).map(([inspectorName, items]) => (
              <div key={inspectorName} className="mb-3 last:mb-0">
                <p className="text-[11px] text-wood-500 mb-2 px-0.5">Da {inspectorName}</p>
                <div className="rounded-lg border border-cream-200 bg-cream-100 overflow-hidden">
                  {items.map((item, i) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => void navigate({
                        to: '/hives/$hiveId/inspections/$inspectionId',
                        params: { hiveId: item.hiveId, inspectionId: item.id },
                      })}
                      className={`w-full px-3.5 py-2.5 text-left hover:bg-cream-200/50 transition-colors ${
                        i < items.length - 1 ? 'border-b border-cream-200' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-wood-700">
                          {item.hiveIdentifier} · {item.apiaryName}
                        </span>
                        <span className="text-[10px] text-wood-400 shrink-0">
                          {formatTimeAgo(item.inspectedAt)}
                        </span>
                      </div>
                      {item.tags.length > 0 && (
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          {item.tags.map((tag, ti) => (
                            <span
                              key={ti}
                              className={`text-[9px] px-1.5 py-0.5 rounded-full leading-none font-medium ${
                                tag.type === 'melari'
                                  ? 'bg-[#FAEEDA] text-[#633806]'
                                  : 'bg-cream-200 text-wood-500'
                              }`}
                            >
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Bottom spacer */}
        <div className="h-20" />
      </div>

      <ShareSheet
        open={shareTarget !== null}
        apiaryId={shareTarget?.id ?? ''}
        apiaryName={shareTarget?.name ?? ''}
        onClose={() => setShareTarget(null)}
        onShared={() => setShareTarget(null)}
      />

      {deleteTarget && (
        <>
          <div
            className="fixed inset-0 z-30 bg-wood-900/40"
            onClick={() => setDeleteTarget(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Elimina apiario"
            className="fixed inset-x-0 bottom-0 z-40 bg-cream-50 rounded-t-xl shadow-lg"
          >
            <div className="flex justify-center pt-2.5 pb-1">
              <span className="block w-9 h-1 rounded-full bg-cream-200" aria-hidden="true" />
            </div>
            <div className="px-5 pt-3 pb-4">
              <h2 className="text-lg font-semibold text-wood-800 mb-1">Elimina apiario</h2>
              <p className="text-sm text-wood-500 leading-relaxed">
                Eliminare <strong>{deleteTarget.name}</strong>? Tutte le arnie e ispezioni associate verranno rimosse. L&rsquo;operazione non pu&ograve; essere annullata.
              </p>
            </div>
            <div className="px-4 flex flex-col gap-2 [padding-bottom:calc(1rem+env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => {
                  deleteApiary(deleteTarget.id, {
                    onSuccess: () => showToast('Apiario eliminato', 'success'),
                    onError: () => showToast('Eliminazione fallita', 'error'),
                  })
                  setDeleteTarget(null)
                }}
                className="w-full h-13 flex items-center justify-center gap-2 rounded-md font-medium bg-danger-500 text-cream-50 hover:bg-danger-500/90 transition-colors"
              >
                Elimina
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="w-full h-11 flex items-center justify-center rounded-md font-medium bg-transparent text-wood-700 hover:bg-cream-100 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
