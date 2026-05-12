import { supabase } from '@/lib/supabase'

type EntityType = 'apiary' | 'hive' | 'treatment' | 'bloom_observation'
type Action = 'insert' | 'update' | 'delete'

export async function logActivity(
  userId: string,
  action: Action,
  entityType: EntityType,
  entityId: string | null,
  description: string,
) {
  const { error } = await supabase.from('activity_log').insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    description,
  })
  if (error) console.error('[logActivity] failed', error)
}
