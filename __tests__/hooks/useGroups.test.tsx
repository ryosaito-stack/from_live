import React from 'react'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useGroups } from '@/hooks/useGroups'
import { GroupService } from '@/services/groupService'
import { Group } from '@/types'

// GroupServiceのモック
jest.mock('@/services/groupService')

describe('useGroups', () => {
  const mockGroups: Group[] = [
    { id: 'group1', name: '団体A', order: 1, createdAt: new Date() },
    { id: 'group2', name: '団体B', order: 2, createdAt: new Date() },
    { id: 'group3', name: '団体C', order: 3, createdAt: new Date() },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('初期状態', () => {
    test('初期状態でloadingがtrueになる', () => {
      ;(GroupService.getAllGroups as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // 永久にpending
      )

      const { result } = renderHook(() => useGroups())

      expect(result.current.loading).toBe(true)
      expect(result.current.groups).toEqual([])
      expect(result.current.error).toBeNull()
    })
  })

  describe('データの取得', () => {
    test('団体リストを正常に取得できる', async () => {
      ;(GroupService.getAllGroups as jest.Mock).mockResolvedValue(mockGroups)

      const { result } = renderHook(() => useGroups())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.groups).toEqual(mockGroups)
      expect(result.current.error).toBeNull()
      expect(GroupService.getAllGroups).toHaveBeenCalledTimes(1)
    })

    test('空の団体リストを取得できる', async () => {
      ;(GroupService.getAllGroups as jest.Mock).mockResolvedValue([])

      const { result } = renderHook(() => useGroups())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.groups).toEqual([])
      expect(result.current.error).toBeNull()
    })
  })

  describe('エラーハンドリング', () => {
    test('取得エラー時にエラー状態になる', async () => {
      const mockError = new Error('団体リストの取得に失敗しました')
      ;(GroupService.getAllGroups as jest.Mock).mockRejectedValue(mockError)

      const { result } = renderHook(() => useGroups())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.groups).toEqual([])
      expect(result.current.error).toEqual(mockError)
    })

    test('ネットワークエラー時にエラー状態になる', async () => {
      const networkError = new Error('Network error')
      ;(GroupService.getAllGroups as jest.Mock).mockRejectedValue(networkError)

      const { result } = renderHook(() => useGroups())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toEqual(networkError)
    })
  })

  describe('リフェッチ機能', () => {
    test('refetch関数で再取得できる', async () => {
      ;(GroupService.getAllGroups as jest.Mock).mockResolvedValue(mockGroups)

      const { result } = renderHook(() => useGroups())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(GroupService.getAllGroups).toHaveBeenCalledTimes(1)

      // refetchを実行
      act(() => {
        result.current.refetch()
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(GroupService.getAllGroups).toHaveBeenCalledTimes(2)
      expect(result.current.groups).toEqual(mockGroups)
    })

    test('refetch時にエラーがクリアされる', async () => {
      const mockError = new Error('エラー')
      ;(GroupService.getAllGroups as jest.Mock).mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useGroups())

      await waitFor(() => {
        expect(result.current.error).toEqual(mockError)
      })

      // 次回は成功するようにモック
      ;(GroupService.getAllGroups as jest.Mock).mockResolvedValueOnce(mockGroups)

      act(() => {
        result.current.refetch()
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBeNull()
      })

      expect(result.current.groups).toEqual(mockGroups)
    })
  })

  describe('マウント/アンマウント', () => {
    test('コンポーネントマウント時に自動で取得する', async () => {
      ;(GroupService.getAllGroups as jest.Mock).mockResolvedValue(mockGroups)

      renderHook(() => useGroups())

      expect(GroupService.getAllGroups).toHaveBeenCalledTimes(1)
    })

    test('アンマウント時にクリーンアップされる', async () => {
      ;(GroupService.getAllGroups as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockGroups), 100))
      )

      const { unmount } = renderHook(() => useGroups())

      unmount()

      // アンマウント後もエラーが発生しないことを確認
      await new Promise(resolve => setTimeout(resolve, 150))
    })
  })
})
