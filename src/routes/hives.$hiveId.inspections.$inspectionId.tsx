import { createFileRoute, redirect, useNavigate, useRouter } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/query-client'
import { useToast } from '@/hooks/use-toast'
import { InspectionScreen } from '@/features/inspections/inspection-screen'
import { useDeleteInspection } from '@/features/inspections/hooks/use-inspections'
import { logActivity } from '@/lib/activity-log'
import type { InspectionFormState, InspectionMode } from '@/features/inspections/types'
import type { TablesUpdate } from '@/types/database'

export const Route = createFileRoute('/hives/$hiveId/inspections/$inspectionId')({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw redirect({ to: '/login' })
  },
  component: EditInspectionPage,
})

function EditInspectionPage() {
  const { hiveId, inspectionId } = Route.useParams()
  const navigate = useNavigate()
  const router = useRouter()
  const { showToast } = useToast()

  const { data: hive } = useQuery({
    queryKey: ['hive', hiveId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hives')
        .select('id, identifier, apiary_id')
        .eq('id', hiveId)
        .single()
      if (error) throw error
      return data
    },
  })

  const { data: apiary } = useQuery({
    queryKey: ['apiary', hive?.apiary_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('apiaries')
        .select('id, name')
        .eq('id', hive?.apiary_id ?? '')
        .single()
      if (error) throw error
      return data
    },
    enabled: !!hive?.apiary_id,
  })

  const { data: inspection, isPending: isLoadingInspection } = useQuery({
    queryKey: ['inspection', inspectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('id', inspectionId)
        .single()
      if (error) throw error
      return data
    },
  })

  const { mutate: deleteInspection, isPending: isDeleting } = useDeleteInspection()

  const { mutateAsync: updateInspection, isPending: isSaving } = useMutation({
    mutationFn: async ({ formState, mode }: { formState: InspectionFormState; mode: string }) => {
      const { data: { session: s } } = await supabase.auth.getSession()
      if (!s?.user?.id) throw new Error('Not authenticated')
      const isExpress = mode === 'express'

      const payload: TablesUpdate<'inspections'> = {
        queen_seen: formState.queen,
        brood_eggs: formState.hasBrood ? formState.brood.uova : false,
        brood_larvae: formState.hasBrood ? formState.brood.larve : false,
        brood_capped: formState.hasBrood ? formState.brood.opercolata : false,
        population: formState.population,
        notes: [formState.notes, formState.otherInterventions ? `Altri interventi: ${formState.otherInterventions}` : ''].filter(Boolean).join('\n') || null,
        brood_frame_count: isExpress ? null : formState.frames.covata,
        honey_frame_count: isExpress ? null : formState.frames.miele,
        pollen_frame_count: isExpress ? null : formState.frames.polline,
        empty_frame_count: isExpress ? null : formState.frames.vuoti,
        has_queen_cells: formState.hasQueenCells,
        queen_cells_removed: formState.hasQueenCells ? formState.queenCellsRemoved : [],
        queen_cells_remaining: formState.hasQueenCells ? formState.queenCellsRemaining : [],
        pollen_importation: isExpress ? null : formState.pollenIncoming,
        behavior: isExpress ? null : formState.behavior,
        pathologies: isExpress ? null : Array.from(formState.pathologies),
        varroa_count: isExpress || !formState.varroaCount ? null : Number(formState.varroaCount),
        varroa_count_method: isExpress || !formState.varroaCount ? null : formState.varroaMethod,
        interventions: isExpress ? [] : Array.from(formState.interventions),
      }
      const { error } = await supabase
        .from('inspections')
        .update(payload)
        .eq('id', inspectionId)
      if (error) throw error
      return s.user.id
    },
    onSuccess: async (userId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['inspection', inspectionId] }),
        queryClient.invalidateQueries({ queryKey: ['inspections', hiveId] }),
        queryClient.invalidateQueries({ queryKey: ['lastInspection', hiveId] }),
        queryClient.invalidateQueries({ queryKey: ['hives'] }),
      ])
      logActivity(userId, 'update', 'inspection', hiveId, `Ispezione aggiornata per arnia ${hive?.identifier ?? hiveId}`)
      router.history.back()
    },
    onError: (err) => {
      console.error('[EditInspection] save failed', err)
      showToast('Salvataggio fallito. Riprova.', 'error')
    },
  })

  // Map DB row → InspectionFormState
  const prefillState: Partial<InspectionFormState> | undefined = inspection
    ? {
        queen: inspection.queen_seen,
        hasBrood: inspection.brood_eggs != null || inspection.brood_larvae != null || inspection.brood_capped != null,
        brood: {
          uova: (inspection.brood_eggs ?? null) as boolean | null,
          larve: (inspection.brood_larvae ?? null) as boolean | null,
          opercolata: (inspection.brood_capped ?? null) as boolean | null,
        },
        population: inspection.population ?? 'media',
        frames: {
          covata: inspection.brood_frame_count ?? 0,
          miele: inspection.honey_frame_count ?? 0,
          polline: inspection.pollen_frame_count ?? 0,
          vuoti: inspection.empty_frame_count ?? 0,
        },
        hasQueenCells: inspection.has_queen_cells ?? false,
        queenCellsRemoved: (inspection.queen_cells_removed ?? []) as InspectionFormState['queenCellsRemoved'],
        queenCellsRemaining: (inspection.queen_cells_remaining ?? []) as InspectionFormState['queenCellsRemaining'],
        pollenIncoming: inspection.pollen_importation ?? false,
        behavior: inspection.behavior ?? 'calmo',
        notes: inspection.notes ?? '',
        pathologies: new Set(inspection.pathologies ?? []),
        varroaCount: inspection.varroa_count != null ? String(inspection.varroa_count) : '',
        varroaMethod: inspection.varroa_count_method ?? 'caduta_naturale',
        interventions: new Set(inspection.interventions ?? []),
      }
    : undefined

  const initialMode: InspectionMode =
    inspection?.brood_frame_count == null ? 'express' : 'standard'

  const inspectionDate = inspection
    ? new Date(inspection.performed_at).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : undefined

  if (isLoadingInspection) return null

  function handleDelete() {
    deleteInspection(
      { inspectionId, hiveId },
      {
        onSuccess: () => {
          showToast('Ispezione eliminata', 'success')
          void navigate({ to: '/hives/$hiveId/inspections', params: { hiveId }, replace: true })
        },
        onError: (err) => {
          console.error('[EditInspection] delete failed', err)
          showToast('Eliminazione fallita. Riprova.', 'error')
        },
      },
    )
  }

  return (
    <InspectionScreen
      hiveId={hiveId}
      inspectionId={inspectionId}
      hiveInfo={hive && apiary ? { identifier: hive.identifier, apiaryName: apiary.name } : undefined}
      prefillState={prefillState}
      initialMode={initialMode}
      hasPrefill={false}
      prefillDate={inspectionDate}
      isLoadingHistory={false}
      isSaving={isSaving}
      isDeleting={isDeleting}
      onSave={(formState, mode, commit) => { updateInspection({ formState, mode }); commit(inspectionId) }}
      onBack={() => router.history.back()}
      onDelete={handleDelete}
    />
  )
}
