import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useVote } from '@/hooks/useVote'
import { VoteService } from '@/services/voteService'
import { VoteHistoryManager } from '@/utils/voteHistory'

// モック
jest.mock('@/services/voteService')
jest.mock('@/utils/voteHistory')
jest.mock('@/utils/deviceId', () => ({
  DeviceIdManager: {
    getDeviceId: jest.fn(() => 'device-123'),
  },
}))

describe('useVote', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // localStorageのモックをリセット
    localStorage.clear()
  })

  describe('初期状態', () => {
    test('初期状態が正しく設定される', () => {
      const { result } = renderHook(() => useVote())

      expect(result.current.voting).toBe(false)
      expect(result.current.voteResult).toBeNull()
      expect(result.current.error).toBeNull()
    })
  })

  describe('投票処理', () => {
    test('正常に投票できる', async () => {
      const mockVoteId = 'vote-123'
      ;(VoteService.submitVote as jest.Mock).mockResolvedValue(mockVoteId)
      ;(VoteHistoryManager.recordVote as jest.Mock).mockReturnValue(undefined)

      const { result } = renderHook(() => useVote())

      const voteData = {
        groupId: 'group1',
        score: 4,
        deviceId: 'device-123',
      }

      await act(async () => {
        await result.current.submitVote(voteData)
      })

      expect(result.current.voting).toBe(false)
      expect(result.current.voteResult).toEqual({
        success: true,
        voteId: mockVoteId,
      })
      expect(result.current.error).toBeNull()
      expect(VoteService.submitVote).toHaveBeenCalledWith(voteData)
      expect(VoteHistoryManager.recordVote).toHaveBeenCalledWith('group1')
    })

    test('投票中にloading状態になる', async () => {
      ;(VoteService.submitVote as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('vote-123'), 100))
      )

      const { result } = renderHook(() => useVote())

      const voteData = {
        groupId: 'group1',
        score: 4,
        deviceId: 'device-123',
      }

      act(() => {
        result.current.submitVote(voteData)
      })

      expect(result.current.voting).toBe(true)

      await waitFor(() => {
        expect(result.current.voting).toBe(false)
      })
    })

    test('投票エラー時にエラー状態になる', async () => {
      const mockError = new Error('この団体には既に投票済みです')
      ;(VoteService.submitVote as jest.Mock).mockRejectedValue(mockError)

      const { result } = renderHook(() => useVote())

      const voteData = {
        groupId: 'group1',
        score: 4,
        deviceId: 'device-123',
      }

      await act(async () => {
        await result.current.submitVote(voteData)
      })

      expect(result.current.voting).toBe(false)
      expect(result.current.voteResult).toBeNull()
      expect(result.current.error).toEqual(mockError)
      expect(VoteHistoryManager.recordVote).not.toHaveBeenCalled()
    })

    test('バリデーションエラーを処理できる', async () => {
      const validationError = new Error('点数は1〜5の範囲で入力してください')
      ;(VoteService.submitVote as jest.Mock).mockRejectedValue(validationError)

      const { result } = renderHook(() => useVote())

      const invalidVoteData = {
        groupId: 'group1',
        score: 10, // 無効なスコア
        deviceId: 'device-123',
      }

      await act(async () => {
        await result.current.submitVote(invalidVoteData)
      })

      expect(result.current.error).toEqual(validationError)
      expect(result.current.voteResult).toBeNull()
    })
  })

  describe('投票履歴チェック', () => {
    test('hasVoted関数で投票済みか確認できる', async () => {
      ;(VoteHistoryManager.hasVoted as jest.Mock).mockReturnValue(true)

      const { result } = renderHook(() => useVote())

      const hasVoted = result.current.hasVoted('group1')

      expect(hasVoted).toBe(true)
      expect(VoteHistoryManager.hasVoted).toHaveBeenCalledWith('group1')
    })

    test('未投票の場合falseを返す', () => {
      ;(VoteHistoryManager.hasVoted as jest.Mock).mockReturnValue(false)

      const { result } = renderHook(() => useVote())

      const hasVoted = result.current.hasVoted('group1')

      expect(hasVoted).toBe(false)
    })
  })

  describe('エラークリア', () => {
    test('clearErrorでエラーをクリアできる', async () => {
      const mockError = new Error('エラー')
      ;(VoteService.submitVote as jest.Mock).mockRejectedValue(mockError)

      const { result } = renderHook(() => useVote())

      // エラーを発生させる
      await act(async () => {
        await result.current.submitVote({
          groupId: 'group1',
          score: 4,
          deviceId: 'device-123',
        })
      })

      expect(result.current.error).toEqual(mockError)

      // エラーをクリア
      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('楽観的UI更新', () => {
    test('投票成功時に即座に結果を更新する', async () => {
      const mockVoteId = 'vote-123'
      ;(VoteService.submitVote as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockVoteId), 100))
      )

      const { result } = renderHook(() => useVote())

      const voteData = {
        groupId: 'group1',
        score: 4,
        deviceId: 'device-123',
      }

      let promise: Promise<void>
      act(() => {
        promise = result.current.submitVote(voteData)
      })

      // 投票中の状態
      expect(result.current.voting).toBe(true)

      await act(async () => {
        await promise
      })

      // 投票完了後
      expect(result.current.voting).toBe(false)
      expect(result.current.voteResult).toEqual({
        success: true,
        voteId: mockVoteId,
      })
    })
  })
})
