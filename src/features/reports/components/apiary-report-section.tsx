import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { Eye, Mail } from 'lucide-react'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { supabase } from '@/lib/supabase'
import { useApiaries } from '@/features/apiaries/hooks/use-apiaries'
import { useToast } from '@/hooks/use-toast'
import { useApiaryReportData } from '../hooks/use-apiary-report-data'
import { ApiaryReportDocument } from '../pdf/apiary-report-document'

type DeliveryMode = 'view' | 'email'

const DELIVERY_OPTIONS: { value: DeliveryMode; label: string }[] = [
  { value: 'view', label: 'Visualizza' },
  { value: 'email', label: 'Invia per email' },
]

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

export function ApiaryReportSection() {
  const { data: apiaries = [] } = useApiaries()
  const [apiaryId, setApiaryId] = useState('')
  const [mode, setMode] = useState<DeliveryMode>('view')
  const [generating, setGenerating] = useState(false)
  const { showToast } = useToast()
  const { refetch } = useApiaryReportData(apiaryId || null)

  async function handleGenerate() {
    if (!apiaryId) return
    setGenerating(true)
    try {
      const { data, error } = await refetch()
      if (error) throw error
      if (!data) throw new Error('Dati report non disponibili')

      const blob = await pdf(<ApiaryReportDocument data={data} />).toBlob()
      const fileName = `report-${slugify(data.apiaryName)}-${new Date().toISOString().slice(0, 10)}.pdf`

      if (mode === 'view') {
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank')
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
      } else {
        const pdfBase64 = arrayBufferToBase64(await blob.arrayBuffer())
        const hiveCount = data.hives.length
        const inspectionCount = data.hives.reduce((s, h) => s + h.inspections.length, 0)
        const { error: fnError } = await supabase.functions.invoke('send-apiary-report', {
          body: { apiaryId, apiaryName: data.apiaryName, pdfBase64, fileName, hiveCount, inspectionCount, generatedAt: data.generatedAt },
        })
        if (fnError) throw fnError
        showToast('Report inviato alla tua email', 'success')
      }
    } catch (err) {
      console.error('[ApiaryReport] generazione fallita', err)
      showToast(mode === 'email' ? 'Invio email fallito. Riprova.' : 'Generazione report fallita. Riprova.', 'error')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <section>
      <h2 className="text-xs font-semibold text-wood-400 uppercase tracking-wider mb-3">Report PDF</h2>
      <div className="rounded-lg bg-cream-100 p-4 flex flex-col gap-3">
        <Select
          id="report-apiary"
          label="Apiario"
          value={apiaryId}
          onChange={(e) => setApiaryId(e.target.value)}
          options={apiaries.map((a) => ({ value: a.id, label: a.name }))}
        />
        <SegmentedControl
          options={DELIVERY_OPTIONS}
          value={mode}
          onChange={(v) => setMode(v as DeliveryMode)}
          ariaLabel="Modalità di consegna report"
        />
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={!apiaryId}
          loading={generating}
          className="w-full"
        >
          {mode === 'email' ? <Mail size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
          {mode === 'email' ? 'Invia per email' : 'Visualizza'}
        </Button>
      </div>
    </section>
  )
}
