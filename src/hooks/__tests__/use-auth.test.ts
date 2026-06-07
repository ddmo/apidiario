import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useAuth } from '../use-auth'

const mockSingle = vi.fn()
const mockEq = vi.fn(() => ({ single: mockSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))
const mockUnsubscribe = vi.fn()
const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: mockUnsubscribe } },
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useAuth', () => {
  it('loading starts true, becomes false when no session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })

    const { result } = renderHook(() => useAuth())

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.session).toBeNull()
    expect(result.current.profile).toBeNull()
  })

  it('sets session and profile on successful fetch', async () => {
    const fakeSession = { user: { id: 'user-1' } }
    const fakeProfile = { id: 'user-1', display_name: 'Test' }

    mockGetSession.mockResolvedValue({ data: { session: fakeSession } })
    mockSingle.mockResolvedValue({ data: fakeProfile, error: null })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.session).toEqual(fakeSession)
      expect(result.current.profile).toEqual(fakeProfile)
    })
    expect(mockFrom).toHaveBeenCalledWith('profiles')
  })

  it('loading becomes false even when fetchProfile fails', async () => {
    const fakeSession = { user: { id: 'user-1' } }

    mockGetSession.mockResolvedValue({ data: { session: fakeSession } })
    mockSingle.mockRejectedValue(new Error('DB error'))

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.profile).toBeNull()
    expect(result.current.session).toEqual(fakeSession)
  })

  it('handles onAuthStateChange SIGNED_IN', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })

    const { result } = renderHook(() => useAuth())

    // Wait for initial load
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.session).toBeNull()

    // Simulate login
    const newSession = { user: { id: 'user-2' } }
    const profile = { id: 'user-2', display_name: 'New' }
    mockSingle.mockResolvedValue({ data: profile, error: null })

    // Grab the callback passed to onAuthStateChange
    const handler = mockOnAuthStateChange.mock.calls[0][0]
    act(() => handler('SIGNED_IN', newSession))

    await waitFor(() => {
      expect(result.current.session).toEqual(newSession)
      expect(result.current.profile).toEqual(profile)
    })
  })

  it('handles onAuthStateChange SIGNED_OUT', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
    mockSingle.mockResolvedValue({ data: { id: 'u1', display_name: 'U' }, error: null })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.session).not.toBeNull()
    })

    const handler = mockOnAuthStateChange.mock.calls[0][0]
    act(() => handler('SIGNED_OUT', null))

    expect(result.current.session).toBeNull()
    expect(result.current.profile).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('unsubscribes on unmount', () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })

    const { unmount } = renderHook(() => useAuth())
    unmount()

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })
})
