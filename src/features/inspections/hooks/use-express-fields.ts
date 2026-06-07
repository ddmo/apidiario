import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { queryClient } from '@/lib/query-client'
import { DEFAULT_EXPRESS_FIELDS, type ExpressField } from '../express-fields-constants'

export function useExpressFields() {
  const { session } = useAuth()

  const { data: fields = DEFAULT_EXPRESS_FIELDS } = useQuery({
    queryKey: ['expressFields', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return DEFAULT_EXPRESS_FIELDS
      const { data } = await supabase
        .from('user_inspection_preferences')
        .select('express_fields')
        .eq('user_id', session.user.id)
        .maybeSingle()
      if (data?.express_fields && Array.isArray(data.express_fields)) {
        return data.express_fields as ExpressField[]
      }
      return DEFAULT_EXPRESS_FIELDS
    },
    enabled: !!session?.user?.id,
    gcTime: 0,
  })

  return fields
}

export function useUpdateExpressFields() {
  const { session } = useAuth()

  return useMutation({
    mutationFn: async (fields: ExpressField[]) => {
      if (!session?.user?.id) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('user_inspection_preferences')
        .upsert({ user_id: session.user.id, express_fields: fields })
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['expressFields'] })
    },
  })
}
