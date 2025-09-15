import { useState, useCallback } from 'react'
import { VoteService, VoteInput, VoteResult } from '@/services/voteService'
import { VoteHistoryManager } from '@/utils/voteHistory'
import { DeviceIdManager } from '@/utils/deviceId'

/**
 * useVoteフックの返り値
 */
export interface UseVoteReturn {
  submitVote: (voteData: Omit<VoteInput, 'deviceId'>) => Promise<void>
  voting: boolean
  voteResult: VoteResult | null
  error: Error | null
  hasVoted: (groupId: string) => boolean
  clearError: () => void
}

/**
 * 投票機能を管理するカスタムフック
 */
export function useVote(): UseVoteReturn {
  const [voting, setVoting] = useState(false)
  const [voteResult, setVoteResult] = useState<VoteResult | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const submitVote = useCallback(async (voteData: Omit<VoteInput, 'deviceId'>) => {
    setVoting(true)
    setError(null)
    setVoteResult(null)

    try {
      // 端末IDを取得
      const deviceId = DeviceIdManager.getDeviceId()
      
      // 投票データを作成
      const fullVoteData: VoteInput = {
        ...voteData,
        deviceId,
      }

      // 投票を送信
      const voteId = await VoteService.submitVote(fullVoteData)
      
      // ローカルに投票履歴を記録
      VoteHistoryManager.recordVote(voteData.groupId)
      
      // 成功結果を設定
      setVoteResult({
        success: true,
        voteId,
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('投票に失敗しました')
      setError(error)
      console.error('Error submitting vote:', error)
    } finally {
      setVoting(false)
    }
  }, [])

  const hasVoted = useCallback((groupId: string): boolean => {
    return VoteHistoryManager.hasVoted(groupId)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    submitVote,
    voting,
    voteResult,
    error,
    hasVoted,
    clearError,
  }
}
