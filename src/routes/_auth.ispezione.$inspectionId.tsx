import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useInspection } from '@/features/inspections/hooks/use-inspections'
import {
  PATHOLOGY_LABELS,
  VARROA_METHOD_LABELS,
} from '@/features/inspections/constants'
import { t } from '@/i18n/it'

export const Route = createFileRoute('/_auth/ispezione/$inspectionId')({
  component: InspectionDetailPage,
})

function InspectionDetailPage() {
  const { inspectionId } = Route.useParams()
  const navigate = useNavigate()
  const { data: insp, isLoading } = useInspection(inspectionId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-wood-400 bg-cream-50">
        {t.common.loading}
      </div>
    )
  }

  if (!insp) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-wood-400 bg-cream-50">
        Visita non trovata.
      </div>
    )
  }

  const isExpress = insp.brood_frame_count === null
  const date = new Date(insp.performed_at)
  const dateLabel = date.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const timeLabel = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  const pathologies = insp.pathologies ?? []
  const interventions = insp.interventions ?? []
  const hasBrood = insp.brood_eggs || insp.brood_larvae || insp.brood_capped

  return (
    <div className="flex flex-col min-h-full bg-cream-50">
      <header className="bg-cream-50 border-b border-cream-200 px-2 h-14 flex items-center gap-2 shrink-0">
        <button
          type="button"
          aria-label="Indietro"
          onClick={() => void navigate({ to: -1 as never })}
          className="size-11 flex items-center justify-center text-wood-700 hover:bg-cream-100 rounded-md transition-colors"
        >
          <ArrowLeft size={22} strokeWidth={1.75} />
        </button>
        <div className="flex-1 min-w-0 px-1">
          <p className="text-xs text-wood-400 leading-none mb-0.5">{t.inspection.detail.title}</p>
          <h1 className="text-sm font-semibold text-wood-800 truncate leading-tight capitalize">
            {dateLabel}
          </h1>
        </div>
        <span
          className={`text-[11px] font-semibold px-2 py-1 rounded-md mr-2 ${
            isExpress
              ? 'bg-honey-100 text-honey-700'
              : 'bg-cream-200 text-wood-600'
          }`}
        >
          {isExpress ? t.inspection.mode.express : t.inspection.mode.standard}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="px-4 pt-4 flex flex-col gap-3">

          {/* Time */}
          <p className="text-xs text-wood-400 -mb-1">{timeLabel}</p>

          {/* Regina & Covata */}
          <Section title="Regina & Covata">
            <Row label={t.inspection.detail.queen}>
              <QueenLabel value={insp.queen_seen} />
            </Row>
            {!isExpress && insp.queen_cells && (
              <Row label={t.inspection.detail.queenCells}>
                <span>{(t.inspection.queenCells as Record<string, string>)[insp.queen_cells] ?? insp.queen_cells}</span>
              </Row>
            )}
            <Row label={t.inspection.detail.brood}>
              {hasBrood ? (
                <div className="flex gap-1 flex-wrap">
                  {insp.brood_eggs && <Chip label="Uova" />}
                  {insp.brood_larvae && <Chip label="Larve" />}
                  {insp.brood_capped && <Chip label="Opercolata" />}
                </div>
              ) : (
                <span className="text-wood-400">—</span>
              )}
            </Row>
            {!isExpress && insp.brood_frame_count != null && (
              <Row label={t.inspection.detail.frames}>
                <span>{insp.brood_frame_count} telai covata</span>
              </Row>
            )}
          </Section>

          {/* Popolazione & Scorte */}
          <Section title="Popolazione & Scorte">
            {insp.population && (
              <Row label={t.inspection.detail.population}>
                <PopLabel value={insp.population} />
              </Row>
            )}
            {!isExpress && (
              <>
                {insp.honey_frame_count != null && (
                  <Row label="Telai miele">
                    <span>{insp.honey_frame_count}</span>
                  </Row>
                )}
                {insp.pollen_frame_count != null && (
                  <Row label="Telai polline">
                    <span>{insp.pollen_frame_count}</span>
                  </Row>
                )}
                <Row label={t.inspection.detail.pollenImport}>
                  <span>{insp.pollen_importation ? 'Sì' : 'No'}</span>
                </Row>
              </>
            )}
          </Section>

          {/* Melari */}
          <Section title={t.inspection.detail.melari}>
            <Row label="Numero">
              <span>{insp.melari_count}</span>
            </Row>
          </Section>

          {/* Comportamento */}
          {!isExpress && insp.behavior && (
            <Section title={t.inspection.detail.behavior}>
              <Row label="">
                <span className="capitalize">
                  {(t.inspection.behavior as Record<string, string>)[insp.behavior] ?? insp.behavior}
                </span>
              </Row>
            </Section>
          )}

          {/* Patologie */}
          {!isExpress && (
            <Section title={t.inspection.detail.pathologies}>
              {pathologies.length === 0 ? (
                <p className="text-sm text-wood-400 py-0.5">Nessuna</p>
              ) : (
                <div className="flex gap-1.5 flex-wrap">
                  {pathologies.map((p) => (
                    <span
                      key={p}
                      className="text-xs bg-danger-100 text-danger-500 px-2 py-1 rounded-md font-medium"
                    >
                      {PATHOLOGY_LABELS[p] ?? p}
                    </span>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Varroa */}
          {insp.varroa_count != null && (
            <Section title={t.inspection.detail.varroa}>
              <Row label="Conteggio">
                <span>{insp.varroa_count}</span>
              </Row>
              {insp.varroa_count_method && (
                <Row label="Metodo">
                  <span>{VARROA_METHOD_LABELS[insp.varroa_count_method] ?? insp.varroa_count_method}</span>
                </Row>
              )}
            </Section>
          )}

          {/* Interventi */}
          {!isExpress && interventions.length > 0 && (
            <Section title={t.inspection.detail.interventions}>
              <ul className="flex flex-col gap-1">
                {interventions.map((iv, i) => (
                  <li key={i} className="text-sm text-wood-700 flex items-start gap-2">
                    <span className="text-wood-300 mt-0.5">•</span>
                    {iv}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Meteo */}
          {(insp.weather_summary || insp.temperature_c != null) && (
            <Section title="Meteo">
              {insp.temperature_c != null && (
                <Row label="Temperatura">
                  <span>{insp.temperature_c} °C</span>
                </Row>
              )}
              {insp.weather_summary && (
                <Row label="">
                  <span>{insp.weather_summary}</span>
                </Row>
              )}
            </Section>
          )}

          {/* Note */}
          {insp.notes && (
            <Section title={t.inspection.detail.notes}>
              <p className="text-sm text-wood-700 leading-relaxed whitespace-pre-wrap">
                {insp.notes}
              </p>
            </Section>
          )}

        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-cream-100 border border-cream-200 rounded-xl overflow-hidden">
      <div className="px-4 py-2 border-b border-cream-200 bg-cream-100">
        <p className="text-xs font-semibold text-wood-500 uppercase tracking-wider">{title}</p>
      </div>
      <div className="px-4 py-3 flex flex-col gap-2">{children}</div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={`flex items-start gap-2 ${label ? 'justify-between' : ''}`}>
      {label && <span className="text-xs text-wood-400 shrink-0 pt-0.5 w-28">{label}</span>}
      <span className="text-sm text-wood-700 text-right">{children}</span>
    </div>
  )
}

function Chip({ label }: { label: string }) {
  return (
    <span className="text-xs bg-cream-200 text-wood-600 px-2 py-0.5 rounded-md font-medium">
      {label}
    </span>
  )
}

function QueenLabel({ value }: { value: string }) {
  const styles: Record<string, string> = {
    vista: 'text-success-500 font-semibold',
    non_vista: 'text-danger-500',
    non_cercata: 'text-wood-400',
  }
  const labels = t.inspection.queenSeen as Record<string, string>
  return (
    <span className={`text-sm ${styles[value] ?? 'text-wood-700'}`}>
      {labels[value] ?? value}
    </span>
  )
}

function PopLabel({ value }: { value: string }) {
  const styles: Record<string, string> = {
    debole: 'text-danger-500',
    media: 'text-wood-700',
    forte: 'text-[#4A6E3C] font-semibold',
  }
  const labels = t.inspection.population as Record<string, string>
  return (
    <span className={`text-sm ${styles[value] ?? 'text-wood-700'}`}>
      {labels[value] ?? value}
    </span>
  )
}
