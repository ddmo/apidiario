import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = 'BCOinMnaMc3ABWtoiDeY5yJIc1JSarwyOZsLHFgxuBA0krLmtu1Y61AUTP5XJb6XfwG3Sc5QKH_z-xHBCvIfg8Y'

function urlB64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const buf = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i)
  return buf
}

/** Register the push‑only service worker. Noop if already registered. */
export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready
    return reg
  } catch {
    console.warn('[push] SW registration failed')
    return null
  }
}

function db() {
  return supabase.from('push_subscriptions')
}

/** Subscribe the current user to push notifications. Stores subscription in DB. */
export async function subscribeToPush(): Promise<boolean> {
  const reg = await registerSW()
  if (!reg) return false

  // Request permission
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  // Get or create subscription
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    })
  }

  // Save to database
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const subJSON = sub.toJSON()
  const { error } = await db().upsert(
    {
      user_id: user.id,
      endpoint: sub.endpoint,
      keys: subJSON.keys ?? {},
    },
    { onConflict: 'endpoint' },
  )

  return !error
}

/** Unsubscribe the current user from push notifications. */
export async function unsubscribeFromPush(): Promise<boolean> {
  const reg = await registerSW()
  if (!reg) return false

  const sub = await reg.pushManager.getSubscription()
  if (sub) {
    // Remove from DB, then unsubscribe from push service
    await db().delete().eq('endpoint', sub.endpoint)
    await sub.unsubscribe()
  } else {
    // No active subscription — clean up orphaned DB entries for this user.
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await db().delete().eq('user_id', user.id)
    }
  }

  return true
}

/** Get the current subscription status. */
export async function getPushStatus(): Promise<{
  supported: boolean
  permission: NotificationPermission | null
  subscribed: boolean
}> {
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  if (!supported) return { supported: false, permission: null, subscribed: false }

  const permission = Notification.permission
  const reg = await registerSW()
  let subscribed = false
  if (reg) {
    const sub = await reg.pushManager.getSubscription()
    subscribed = !!sub
  }

  return { supported, permission, subscribed }
}
