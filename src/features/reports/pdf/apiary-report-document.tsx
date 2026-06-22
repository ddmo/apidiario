import { Document, Page, View, Text, StyleSheet, Image, Svg, Circle } from '@react-pdf/renderer'
import { PATHOLOGY_LABELS } from '@/features/inspections/constants'
import { t } from '@/i18n/it'
import type { ApiaryReportData, ReportHive, ReportTreatment } from '../hooks/use-apiary-report-data'
import { LineChartSvg, BarChartSvg, CategoryTrendSvg, EventTimelineSvg, BloomTimelineSvg, HoneycombBand } from './charts'
import { PDF_COLORS } from './colors'

const INTERVENTION_BAR_COLORS = [PDF_COLORS.honey500, PDF_COLORS.wood500, PDF_COLORS.honey700, PDF_COLORS.wood400]
const BEHAVIOR_LEVELS: Record<string, number> = { calmo: 0, nervoso: 1, aggressivo: 2 }
const BEHAVIOR_COLORS = [PDF_COLORS.success500, PDF_COLORS.honey400, PDF_COLORS.danger500]
const MONTH_LABELS_IT = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']
const MAP_TILE_SIZE = 256
const MAP_ZOOM = 13

/** Slippy-map tile coordinates + pixel offset within that tile, for a single-tile static map. */
function latLonToTilePixel(lat: number, lon: number, zoom: number) {
  const latRad = (lat * Math.PI) / 180
  const n = 2 ** zoom
  const xFloat = ((lon + 180) / 360) * n
  const yFloat = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  const tileX = Math.floor(xFloat)
  const tileY = Math.floor(yFloat)
  return { tileX, tileY, pxX: (xFloat - tileX) * MAP_TILE_SIZE, pxY: (yFloat - tileY) * MAP_TILE_SIZE }
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'numeric' })
}

function capitalize(s: string): string {
  return s.length ? s[0]!.toUpperCase() + s.slice(1) : s
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: PDF_COLORS.cream50,
    color: PDF_COLORS.wood700,
    padding: 36,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  coverPage: {
    backgroundColor: PDF_COLORS.cream50,
    color: PDF_COLORS.wood700,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  coverBody: {
    paddingHorizontal: 36,
    paddingBottom: 36,
  },
  coverEyebrow: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: PDF_COLORS.honey600,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 64,
  },
  coverTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: PDF_COLORS.wood800,
    marginTop: 10,
  },
  coverSubtitle: {
    fontSize: 11,
    color: PDF_COLORS.wood500,
    marginTop: 6,
  },
  coverRule: {
    height: 2,
    width: 64,
    backgroundColor: PDF_COLORS.honey500,
    marginTop: 18,
    marginBottom: 26,
  },
  coverStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  coverStat: {
    backgroundColor: PDF_COLORS.cream100,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 120,
  },
  coverStatValue: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: PDF_COLORS.wood800,
  },
  coverStatLabel: {
    fontSize: 9,
    color: PDF_COLORS.wood500,
    marginTop: 2,
  },
  coverListTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: PDF_COLORS.wood500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  coverListItem: {
    fontSize: 10,
    color: PDF_COLORS.wood700,
    marginBottom: 4,
  },
  hiveHeader: {
    borderBottomWidth: 2,
    borderBottomColor: PDF_COLORS.honey500,
    paddingBottom: 8,
    marginBottom: 14,
  },
  hiveTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: PDF_COLORS.wood800,
  },
  hiveSubtitle: {
    fontSize: 9.5,
    color: PDF_COLORS.honey600,
    marginTop: 2,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  statBox: {
    flex: 1,
    backgroundColor: PDF_COLORS.cream100,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  statBoxValue: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: PDF_COLORS.wood800,
  },
  statBoxLabel: {
    fontSize: 7.5,
    color: PDF_COLORS.wood500,
    marginTop: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: PDF_COLORS.wood700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionCard: {
    backgroundColor: PDF_COLORS.cream100,
    borderRadius: 6,
    padding: 10,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendLabel: {
    fontSize: 8,
    color: PDF_COLORS.wood600,
  },
  queenRow: {
    flexDirection: 'row',
    gap: 10,
  },
  queenStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  queenStatValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
  },
  queenStatLabel: {
    fontSize: 8,
    color: PDF_COLORS.wood500,
    marginTop: 2,
  },
  queenStatPct: {
    fontSize: 7.5,
    color: PDF_COLORS.wood400,
  },
  listItem: {
    fontSize: 9.5,
    color: PDF_COLORS.wood700,
    marginBottom: 3,
  },
  emptyNote: {
    fontSize: 10,
    color: PDF_COLORS.wood400,
    marginTop: 8,
  },
  warningBanner: {
    backgroundColor: PDF_COLORS.danger500,
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 14,
  },
  warningBannerText: {
    fontSize: 9.5,
    color: PDF_COLORS.cream50,
    fontFamily: 'Helvetica-Bold',
  },
  statText: {
    fontSize: 10,
    color: PDF_COLORS.wood700,
  },
  statTextStrong: {
    fontFamily: 'Helvetica-Bold',
    color: PDF_COLORS.wood800,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.wood300,
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: 'row',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.cream200,
    paddingVertical: 7,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: PDF_COLORS.wood500,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableCell: {
    fontSize: 9.5,
    color: PDF_COLORS.wood700,
  },
  pageTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: PDF_COLORS.wood800,
    marginBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: PDF_COLORS.honey500,
    paddingBottom: 8,
  },
  introTopRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 18,
    alignItems: 'flex-start',
  },
  introPhoto: {
    width: 96,
    height: 96,
    borderRadius: 8,
    objectFit: 'cover',
  },
  introMapWrap: {
    width: 130,
    height: 130,
    borderRadius: 8,
    overflow: 'hidden',
  },
  introMapCaption: {
    fontSize: 7,
    color: PDF_COLORS.wood400,
    marginTop: 3,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: PDF_COLORS.wood400,
  },
})

function CoverStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.coverStat}>
      <Text style={styles.coverStatValue}>{value}</Text>
      <Text style={styles.coverStatLabel}>{label}</Text>
    </View>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statBoxValue}>{value}</Text>
      <Text style={styles.statBoxLabel}>{label}</Text>
    </View>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  )
}

function PageFooter({ apiaryName }: { apiaryName: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>apidiario · {apiaryName}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  )
}

function QueenSection({ hive }: { hive: ReportHive }) {
  const total = hive.inspections.length
  const counts = { vista: 0, non_vista: 0, non_cercata: 0 }
  for (const insp of hive.inspections) counts[insp.queenSeen] = (counts[insp.queenSeen] ?? 0) + 1

  const items: { key: keyof typeof counts; label: string; color: string }[] = [
    { key: 'vista', label: t.inspection.queenSeen.vista, color: PDF_COLORS.success500 },
    { key: 'non_vista', label: t.inspection.queenSeen.non_vista, color: PDF_COLORS.danger500 },
    { key: 'non_cercata', label: t.inspection.queenSeen.non_cercata, color: PDF_COLORS.wood400 },
  ]

  return (
    <Section title="Stato regina">
      <View style={styles.queenRow}>
        {items.map((it) => (
          <View key={it.key} style={styles.queenStat}>
            <Text style={[styles.queenStatValue, { color: it.color }]}>{counts[it.key]}</Text>
            <Text style={styles.queenStatLabel}>{it.label}</Text>
            <Text style={styles.queenStatPct}>
              {total > 0 ? `${Math.round((counts[it.key] / total) * 100)}%` : '—'}
            </Text>
          </View>
        ))}
      </View>
    </Section>
  )
}

function FrameTrendSection({ hive }: { hive: ReportHive }) {
  const withFrames = hive.inspections.filter(
    (i) => i.broodFrameCount != null || i.honeyFrameCount != null || i.pollenFrameCount != null || i.emptyFrameCount != null,
  )
  if (withFrames.length < 2) return null

  const labels = withFrames.map((i) => fmtDateShort(i.performedAt))
  const series = [
    { values: withFrames.map((i) => i.broodFrameCount ?? 0), color: PDF_COLORS.wood600, label: 'Covata' },
    { values: withFrames.map((i) => i.honeyFrameCount ?? 0), color: PDF_COLORS.honey500, label: 'Miele' },
    { values: withFrames.map((i) => i.pollenFrameCount ?? 0), color: PDF_COLORS.honey300, label: 'Polline' },
    { values: withFrames.map((i) => i.emptyFrameCount ?? 0), color: PDF_COLORS.wood300, label: 'Vuoti' },
  ]

  return (
    <Section title="Andamento telai nido">
      <View style={styles.legendRow}>
        {series.map((s) => (
          <LegendDot key={s.label} color={s.color} label={s.label} />
        ))}
      </View>
      <LineChartSvg series={series} labels={labels} />
    </Section>
  )
}

const POPULATION_LEVELS: Record<string, number> = { debole: 0, media: 1, forte: 2 }
const POPULATION_COLORS = [PDF_COLORS.danger500, PDF_COLORS.honey400, PDF_COLORS.success500]

function PopulationSection({ hive }: { hive: ReportHive }) {
  const withPop = hive.inspections.filter((i) => i.population != null)
  if (withPop.length < 2) return null

  const labels = withPop.map((i) => fmtDateShort(i.performedAt))
  const points = withPop.map((i) => {
    const levelIndex = POPULATION_LEVELS[i.population as string]!
    return { levelIndex, color: POPULATION_COLORS[levelIndex]! }
  })

  return (
    <Section title="Andamento forza famiglia">
      <CategoryTrendSvg
        points={points}
        labels={labels}
        levels={[t.inspection.population.debole, t.inspection.population.media, t.inspection.population.forte]}
        stepped
      />
    </Section>
  )
}

function PathologiesSection({ hive }: { hive: ReportHive }) {
  const counts = new Map<string, number>()
  for (const insp of hive.inspections) {
    for (const p of insp.pathologies) counts.set(p, (counts.get(p) ?? 0) + 1)
  }
  if (counts.size === 0) return null

  const bars = [...counts.entries()].map(([key, value]) => ({
    label: PATHOLOGY_LABELS[key as keyof typeof PATHOLOGY_LABELS] ?? key,
    value,
    color: PDF_COLORS.danger500,
  }))

  return (
    <Section title="Patologie riscontrate">
      <BarChartSvg bars={bars} height={100} />
    </Section>
  )
}

function BehaviorSection({ hive }: { hive: ReportHive }) {
  const withBehavior = hive.inspections.filter((i) => i.behavior != null)
  if (withBehavior.length < 2) return null

  return (
    <Section title="Andamento comportamento">
      <CategoryTrendSvg
        points={withBehavior.map((insp) => {
          const levelIndex = BEHAVIOR_LEVELS[insp.behavior as string]!
          return { levelIndex, color: BEHAVIOR_COLORS[levelIndex]! }
        })}
        labels={withBehavior.map((i) => fmtDateShort(i.performedAt))}
        levels={[t.inspection.behavior.calmo, t.inspection.behavior.nervoso, t.inspection.behavior.aggressivo]}
        stepped
      />
    </Section>
  )
}

function VarroaSection({ hive }: { hive: ReportHive }) {
  const withVarroa = hive.inspections.filter((i) => i.varroaCount != null)
  if (withVarroa.length === 0) return null

  return (
    <Section title="Rilevazioni varroa">
      {withVarroa.map((insp) => (
        <View key={insp.id} style={styles.tableRow}>
          <Text style={[styles.tableCell, { flex: 1.4 }]}>{fmtDate(insp.performedAt)}</Text>
          <Text style={[styles.tableCell, styles.statTextStrong, { flex: 1, textAlign: 'right' }]}>{insp.varroaCount}</Text>
          <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>
            {insp.varroaCountMethod ? insp.varroaCountMethod.replace(/_/g, ' ') : '—'}
          </Text>
        </View>
      ))}
    </Section>
  )
}

function QueenCellsSection({ hive }: { hive: ReportHive }) {
  const withCellsCount = hive.inspections.filter((i) => i.hasQueenCells).length
  if (hive.inspections.length < 2 || withCellsCount === 0) return null

  return (
    <Section title="Andamento celle reali / sciamatura">
      <EventTimelineSvg
        labels={hive.inspections.map((i) => fmtDateShort(i.performedAt))}
        present={hive.inspections.map((i) => i.hasQueenCells)}
        color={PDF_COLORS.danger500}
      />
      <Text style={[styles.statText, { marginTop: 4 }]}>
        Celle reali rilevate in <Text style={styles.statTextStrong}>{withCellsCount}</Text> ispezion{withCellsCount === 1 ? 'e' : 'i'} su {hive.inspections.length}
      </Text>
    </Section>
  )
}

function InterventionsHistorySection({ hive }: { hive: ReportHive }) {
  const counts = new Map<string, number>()
  for (const insp of hive.inspections) {
    for (const iv of insp.interventions) counts.set(iv, (counts.get(iv) ?? 0) + 1)
  }
  if (counts.size === 0) return null

  const bars = [...counts.entries()].map(([label, value], idx) => ({
    label,
    value,
    color: INTERVENTION_BAR_COLORS[idx % INTERVENTION_BAR_COLORS.length]!,
  }))

  return (
    <Section title="Interventi eseguiti (storico)">
      <BarChartSvg bars={bars} height={100} />
    </Section>
  )
}

function StaleInspectionBanner({ hive }: { hive: ReportHive }) {
  const last = hive.inspections[hive.inspections.length - 1]
  if (!last) return null
  const days = Math.floor((Date.now() - new Date(last.performedAt).getTime()) / 86_400_000)
  if (days < 30) return null

  return (
    <View style={styles.warningBanner}>
      <Text style={styles.warningBannerText}>⚠ Nessuna ispezione da {days} giorni</Text>
    </View>
  )
}

function PendingInterventionsSection({ hive }: { hive: ReportHive }) {
  const last = hive.inspections[hive.inspections.length - 1]
  const pending = last?.pendingInterventions ?? []
  if (pending.length === 0) return null

  return (
    <Section title="Interventi in sospeso (ultima ispezione)">
      {pending.map((p, i) => (
        <Text key={i} style={styles.listItem}>
          • {p}
        </Text>
      ))}
    </Section>
  )
}

function HivePage({ hive, apiaryName }: { hive: ReportHive; apiaryName: string }) {
  const last = hive.inspections[hive.inspections.length - 1] ?? null

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.hiveHeader}>
        <Text style={styles.hiveTitle}>Arnia {hive.identifier}</Text>
        <Text style={styles.hiveSubtitle}>
          {t.hive.hiveTypeLabels[hive.hiveType]} · {t.hive.beeRaceLabels[hive.beeRace]} · {capitalize(hive.status)}
        </Text>
      </View>

      <StaleInspectionBanner hive={hive} />

      <View style={styles.statRow}>
        <StatBox label="Ispezioni totali" value={String(hive.inspections.length)} />
        <StatBox label="Ultima ispezione" value={last ? fmtDate(last.performedAt) : '—'} />
        <StatBox label="Telai nido" value={String(hive.nidoFrameCount)} />
        <StatBox label="Melari" value={String(hive.melariCount)} />
      </View>

      {hive.inspections.length === 0 ? (
        <Text style={styles.emptyNote}>Nessuna ispezione registrata per questa arnia.</Text>
      ) : (
        <>
          <FrameTrendSection hive={hive} />
          <QueenSection hive={hive} />
          <PopulationSection hive={hive} />
          <BehaviorSection hive={hive} />
          <VarroaSection hive={hive} />
          <PathologiesSection hive={hive} />
          <QueenCellsSection hive={hive} />
          <InterventionsHistorySection hive={hive} />
          <PendingInterventionsSection hive={hive} />
        </>
      )}

      <PageFooter apiaryName={apiaryName} />
    </Page>
  )
}

function StaticMap({ lat, lon }: { lat: number; lon: number }) {
  const { tileX, tileY, pxX, pxY } = latLonToTilePixel(lat, lon, MAP_ZOOM)
  const tileUrl = `https://tile.openstreetmap.org/${MAP_ZOOM}/${tileX}/${tileY}.png`

  return (
    <View>
      <View style={styles.introMapWrap}>
        <Image src={tileUrl} style={{ width: MAP_TILE_SIZE, height: MAP_TILE_SIZE }} />
        <Svg width={MAP_TILE_SIZE} height={MAP_TILE_SIZE} style={{ position: 'absolute', top: 0, left: 0 }}>
          <Circle cx={pxX} cy={pxY} r={7} fill={PDF_COLORS.danger500} stroke="#FFFFFF" strokeWidth={2} />
        </Svg>
      </View>
      <Text style={styles.introMapCaption}>© OpenStreetMap</Text>
    </View>
  )
}

function dayOfYear(iso: string): number {
  const d = new Date(iso)
  const start = new Date(d.getFullYear(), 0, 1)
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000)
}

function IntroPage({ data }: { data: ApiaryReportData }) {
  const { apiaryInfo, weeklyWeather, bloomSpecies, seasonYear } = data
  const hasCoords = apiaryInfo.latitude != null && apiaryInfo.longitude != null
  const isLeap = (seasonYear % 4 === 0 && seasonYear % 100 !== 0) || seasonYear % 400 === 0
  const domainDays = isLeap ? 366 : 365

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.pageTitle}>Profilo apiario</Text>

      <View style={styles.introTopRow}>
        {apiaryInfo.photoUrl && <Image src={apiaryInfo.photoUrl} style={styles.introPhoto} />}
        <View style={{ flex: 1 }}>
          <Text style={[styles.statText, styles.statTextStrong, { fontSize: 13 }]}>{apiaryInfo.name}</Text>
          {apiaryInfo.address && <Text style={[styles.statText, { marginTop: 4 }]}>{apiaryInfo.address}</Text>}
          {hasCoords && (
            <Text style={[styles.statText, { marginTop: 4, color: PDF_COLORS.wood500 }]}>
              {apiaryInfo.latitude!.toFixed(5)}, {apiaryInfo.longitude!.toFixed(5)}
            </Text>
          )}
        </View>
        {hasCoords && <StaticMap lat={apiaryInfo.latitude!} lon={apiaryInfo.longitude!} />}
      </View>

      {weeklyWeather.length > 0 && (
        <>
          <Section title={`Andamento meteo ${seasonYear}`}>
            <View style={styles.legendRow}>
              <LegendDot color={PDF_COLORS.danger500} label="Temp. max" />
              <LegendDot color={PDF_COLORS.honey500} label="Temp. min" />
            </View>
            <LineChartSvg
              series={[
                { values: weeklyWeather.map((w) => w.avgTmax), color: PDF_COLORS.danger500 },
                { values: weeklyWeather.map((w) => w.avgTmin), color: PDF_COLORS.honey500 },
              ]}
              labels={weeklyWeather.map((w) => w.weekLabel)}
              showYAxis
              yAxisFormat={(v) => `${Math.round(v)}°`}
            />
          </Section>

          <Section title="Precipitazioni settimanali (mm)">
            <LineChartSvg
              series={[{ values: weeklyWeather.map((w) => w.totalPrecip), color: PDF_COLORS.honey500 }]}
              labels={weeklyWeather.map((w) => w.weekLabel)}
              showYAxis
              yAxisFormat={(v) => `${Math.round(v)}`}
            />
          </Section>

          <Section title="Vento massimo settimanale (km/h)">
            <LineChartSvg
              series={[{ values: weeklyWeather.map((w) => w.maxWind), color: PDF_COLORS.wood500 }]}
              labels={weeklyWeather.map((w) => w.weekLabel)}
              showYAxis
              yAxisFormat={(v) => `${Math.round(v)}`}
            />
          </Section>
        </>
      )}

      {bloomSpecies.length > 0 && (
        <Section title={`Fioriture stagione ${seasonYear}`}>
          <View style={styles.legendRow}>
            <LegendDot color={PDF_COLORS.honey500} label="Previsione (modello GDD)" />
            <LegendDot color={PDF_COLORS.success500} label="Osservato" />
          </View>
          <BloomTimelineSvg
            domainDays={domainDays}
            monthLabels={MONTH_LABELS_IT}
            rows={bloomSpecies.map((s) => ({
              label: s.name,
              predictedStart: s.predictedStart ? dayOfYear(s.predictedStart) : null,
              predictedEnd: s.predictedEnd ? dayOfYear(s.predictedEnd) : null,
              observedStart: s.observedStart ? dayOfYear(s.observedStart) : null,
              observedEnd: s.observedEnd ? dayOfYear(s.observedEnd) : null,
            }))}
          />
        </Section>
      )}

      <PageFooter apiaryName={data.apiaryName} />
    </Page>
  )
}

function TreatmentsPage({ treatments, apiaryName }: { treatments: ReportTreatment[]; apiaryName: string }) {
  if (treatments.length === 0) return null
  const totalCost = treatments.reduce((s, tr) => s + (tr.costEur ?? 0), 0)
  const blockingDays = treatments.filter((tr) => tr.blocksMelari).length

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.pageTitle}>Trattamenti</Text>

      <View style={styles.statRow}>
        <StatBox label="Trattamenti totali" value={String(treatments.length)} />
        <StatBox label="Spesa totale" value={`€ ${totalCost.toFixed(2)}`} />
        <StatBox label="Con blocco melari" value={String(blockingDays)} />
      </View>

      <Section title="Storico trattamenti">
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Prodotto</Text>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Periodo</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Costo</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Melari</Text>
        </View>
        {treatments.map((tr) => (
          <View key={tr.id} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 2 }]}>{tr.productName}</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>
              {fmtDate(tr.startDate)}{tr.endDate ? ` – ${fmtDate(tr.endDate)}` : ''}
            </Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
              {tr.costEur != null ? `€ ${tr.costEur.toFixed(2)}` : '—'}
            </Text>
            <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>{tr.blocksMelari ? 'Sì' : 'No'}</Text>
          </View>
        ))}
      </Section>

      <PageFooter apiaryName={apiaryName} />
    </Page>
  )
}

function SummaryPage({ data }: { data: ApiaryReportData }) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.pageTitle}>Riepilogo arnie</Text>

      <Section title="Confronto tra le arnie dell'apiario">
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Arnia</Text>
          <Text style={[styles.tableHeaderCell, { flex: 0.8, textAlign: 'right' }]}>Isp.</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}>Ultima isp.</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Regina</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.6 }]}>Note</Text>
        </View>
        {data.hives.map((h) => {
          const last = h.inspections[h.inspections.length - 1] ?? null
          const queenLabel = last ? t.inspection.queenSeen[last.queenSeen] : '—'
          const notes: string[] = []
          if (last?.needsIntervention) notes.push('richiede intervento')
          if (last && last.pathologies.length > 0) notes.push(last.pathologies.map((p) => PATHOLOGY_LABELS[p] ?? p).join(', '))
          if (!last) notes.push('mai ispezionata')

          return (
            <View key={h.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1.2 }]}>{h.identifier}</Text>
              <Text style={[styles.tableCell, { flex: 0.8, textAlign: 'right' }]}>{h.inspections.length}</Text>
              <Text style={[styles.tableCell, { flex: 1.4 }]}>{last ? fmtDate(last.performedAt) : '—'}</Text>
              <Text style={[styles.tableCell, { flex: 1.2 }]}>{queenLabel}</Text>
              <Text style={[styles.tableCell, { flex: 1.6 }]}>{notes.join(' · ') || '—'}</Text>
            </View>
          )
        })}
      </Section>

      <PageFooter apiaryName={data.apiaryName} />
    </Page>
  )
}

export function ApiaryReportDocument({ data }: { data: ApiaryReportData }) {
  const totalInspections = data.hives.reduce((s, h) => s + h.inspections.length, 0)

  return (
    <Document title={`Report ${data.apiaryName}`} author="apidiario">
      <Page size="A4" style={styles.coverPage}>
        <HoneycombBand />
        <View style={styles.coverBody}>
          <Text style={styles.coverEyebrow}>Report apiario</Text>
          <Text style={styles.coverTitle}>Report per {data.apiaryName}</Text>
          <Text style={styles.coverSubtitle}>Generato il {fmtDate(data.generatedAt)}</Text>
          <View style={styles.coverRule} />

          <View style={styles.coverStatsRow}>
            <CoverStat label="Arnie" value={data.hives.length} />
            <CoverStat label="Ispezioni totali" value={totalInspections} />
          </View>

          <Text style={styles.coverListTitle}>Arnie incluse</Text>
          {data.hives.map((h) => (
            <Text key={h.id} style={styles.coverListItem}>
              • {h.identifier} — {h.inspections.length} ispezion{h.inspections.length === 1 ? 'e' : 'i'}
            </Text>
          ))}
        </View>

        <PageFooter apiaryName={data.apiaryName} />
      </Page>

      <IntroPage data={data} />

      <TreatmentsPage treatments={data.treatments} apiaryName={data.apiaryName} />

      {data.hives.map((hive) => (
        <HivePage key={hive.id} hive={hive} apiaryName={data.apiaryName} />
      ))}

      <SummaryPage data={data} />
    </Document>
  )
}
