import { beforeEach, describe, expect, it, vi } from 'vitest'

const { api, setAccessToken, clearAccessToken } = vi.hoisted(() => ({
  api: { post: vi.fn(), get: vi.fn() }, setAccessToken: vi.fn(), clearAccessToken: vi.fn(),
}))
vi.mock('../api/axios', () => ({ default: api, setAccessToken, clearAccessToken }))

import useAuthStore from './useAuthStore'

describe('authentication memory lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: { getItem: vi.fn(() => null), setItem: vi.fn(), removeItem: vi.fn() },
    })
    useAuthStore.setState({ user: null, isAuthenticated: false })
  })

  it('keeps an access token in memory after login and never writes browser storage', async () => {
    api.post.mockResolvedValueOnce({ data: { access: 'access-token' } })
    api.get.mockResolvedValueOnce({ data: { email: 'user@example.com' } })
    await useAuthStore.getState().login('user@example.com', 'password')
    expect(setAccessToken).toHaveBeenCalledWith('access-token')
    expect(window.localStorage.setItem).not.toHaveBeenCalled()
  })

  it('restores state only after a cookie refresh succeeds and clears it on failure', async () => {
    api.post.mockResolvedValueOnce({ data: { access: 'renewed' } })
    api.get.mockResolvedValueOnce({ data: { email: 'user@example.com' } })
    await useAuthStore.getState().fetchUser()
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    api.post.mockRejectedValueOnce(new Error('expired'))
    await useAuthStore.getState().fetchUser()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(clearAccessToken).toHaveBeenCalled()
  })
})
