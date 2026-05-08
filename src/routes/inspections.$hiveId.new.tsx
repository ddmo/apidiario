import { createFileRoute, redirect, useNavigate, useRouter } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/query-client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { InspectionScreen } from '@/features/inspections/inspection-screen'
import type { InspectionFormState } from '@/features/inspections/types'
import type { TablesInsert } from '@/types/database'

export const Route = createFileRoute('/inspections/$hiveId/new')({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) throw redirect({ to: '/login' })
  },
  component: NewInspectionPage,
})

function NewInspectionPage() {
  const { hiveId } = Route.useParams()
  const navigate = useNavigate()
  const router = useRouter()
  const { session } = useAuth()
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
        .eq('id', hive!.apiary_id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!hive?.apiary_id,
  })

  // isPending = true while loading, false once settled (null or object)
  const { data: lastInspection, isPending: isLoadingHistory } = useQuery({
    queryKey: ['lastInspection', hiveId],
    queryFn: async () => {
      const { data } = await supabase
        .from('inspections')
        .select('*')
        .eq('hive_id', hiveId)
        .order('performed_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return data ?? null
    },
  })

  const { mutate: saveInspection, isPending: isSaving } = useMutation({
    mutationFn: async ({ formState, mode }: { formState: InspectionFormState; mode: string }) => {
      if (!session?.user?.id) throw new Error('Not authenticated')
      const isExpress = mode === 'express'

      const payload: TablesInsert<'inspections'> = {
        hive_id: hiveId,
        performed_by: session.user.id,
        queen_seen: formState.queen,
        brood_eggs: formState.brood.uova,
        brood_larvae: formState.brood.larve,
        brood_capped: formState.brood.opercolata,
        population: formState.population,
        notes: formState.notes || null,
        brood_frame_count: isExpress ? null : formState.frames.covata,
        honey_frame_count: isExpress ? null : formState.frames.miele,
        pollen_frame_count: isExpress ? null : formState.frames.polline,
        melari_count: isExpress ? 0 : formState.supers,
        queen_cells: isExpress ? null : formState.queenCells,
        pollen_importation: isExpress ? null : formState.pollenIncoming,
        behavior: isExpress ? null : formState.behavior,
        pathologies: isExpress ? null : Array.from(formState.pathologies),
        varroa_count: isExpress || !formState.varroaCount ? null : Number(formState.varroaCount),
        varroa_count_method: isExpress || !formState.varroaCount ? null : formState.varroaMethod,
        interventions: isExpress ? [] : Array.from(formState.interventions),
      }
      const { error } = await supabase.from('inspections').insert(payload)
      if (error) throw error
    },
    onSuccess: () => {
      showToast('Ispezione salvata', 'success')
      void queryClient.invalidateQueries({ queryKey: ['lastInspection', hiveId] })
      void queryClient.invalidateQueries({ queryKey: ['hives'] })
      void navigate({ to: '/hives/$hiveId/inspections', params: { hiveId }, replace: true })
    },
    onError: () => {
      showToast('Salvataggio fallito. Riprova.', 'error')
    },
  })

  const prefillState: Partial<InspectionFormState> | undefined = lastInspection
    ? {
        queen: lastInspection.queen_seen,
        brood: {
          uova: lastInspection.brood_eggs ?? false,
          larve: lastInspection.brood_larvae ?? false,
          opercolata: lastInspection.brood_capped ?? false,
        },
        population: lastInspection.population ?? 'media',
        frames: {
          covata: lastInspection.brood_frame_count ?? 0,
          miele: lastInspection.honey_frame_count ?? 0,
          polline: lastInspection.pollen_frame_count ?? 0,
        },
        supers: lastInspection.melari_count ?? 0,
        queenCells: lastInspection.queen_cells ?? 'nessuna',
        pollenIncoming: lastInspection.pollen_importation ?? false,
        behavior: lastInspection.behavior ?? 'calmo',
      }
    : undefined

  const prefillDate = lastInspection
    ? new Date(lastInspection.performed_at).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short',
      })
    : undefined

  return (
    <InspectionScreen
      hiveId={hiveId}
      hiveInfo={hive && apiary ? { identifier: hive.identifier, apiaryName: apiary.name } : undefined}
      prefillState={prefillState}
      hasPrefill={lastInspection !== null && lastInspection !== undefined}
      prefillDate={prefillDate}
      isLoadingHistory={isLoadingHistory}
      isSaving={isSaving}
      onSave={(formState, mode) => saveInspection({ formState, mode })}
      onBack={() => router.history.back()}
    />
  )
}
