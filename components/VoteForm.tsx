'use client'

import React, { useState, useCallback } from 'react'
import { useGroups } from '@/hooks/useGroups'
import { useVote } from '@/hooks/useVote'
import { SelectGroup } from './ui/SelectGroup'
import { ScoreSelector } from './ui/ScoreSelector'
import { SubmitButton } from './ui/SubmitButton'
import { FeedbackMessage } from './ui/FeedbackMessage'
import { LoadingSpinner } from './ui/LoadingSpinner'

export function VoteForm() {
  const { groups, loading: groupsLoading, error: groupsError, refetch } = useGroups()
  const { submitVote, voting, voteResult, error: voteError, hasVoted, clearError } = useVote()
  
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [selectedScore, setSelectedScore] = useState<number>(0)
  const [validationError, setValidationError] = useState<string>('')

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')

    // バリデーション
    if (!selectedGroupId) {
      setValidationError('団体を選択してください')
      return
    }

    if (selectedScore === 0) {
      setValidationError('評価を選択してください')
      return
    }

    // 投票を送信
    await submitVote({
      groupId: selectedGroupId,
      score: selectedScore,
    })
  }, [selectedGroupId, selectedScore, submitVote])

  const handleGroupChange = useCallback((groupId: string) => {
    setSelectedGroupId(groupId)
    setValidationError('')
  }, [])

  const handleScoreChange = useCallback((score: number) => {
    setSelectedScore(score)
    setValidationError('')
  }, [])

  const handleClearError = useCallback(() => {
    clearError()
    setValidationError('')
  }, [clearError])

  // ローディング中
  if (groupsLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">団体リストを読み込み中...</p>
        <SubmitButton disabled={true} loading={false}>
          投票する
        </SubmitButton>
      </div>
    )
  }

  // 団体リスト取得エラー
  if (groupsError) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <FeedbackMessage type="error" message="団体リストの取得に失敗しました" />
        <button
          onClick={refetch}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          再読み込み
        </button>
      </div>
    )
  }

  // 全団体に投票済みかチェック
  const allVoted = groups.length > 0 && groups.every(group => hasVoted(group.id))

  // 投票完了
  if (voteResult?.success) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <FeedbackMessage type="success" message="投票が完了しました！" />
        <SubmitButton disabled={true} loading={false}>
          投票する
        </SubmitButton>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 space-y-6">
      {/* エラーメッセージ */}
      {voteError && (
        <FeedbackMessage
          type="error"
          message={voteError.message}
          onClose={handleClearError}
        />
      )}
      
      {validationError && (
        <FeedbackMessage type="error" message={validationError} />
      )}

      {/* 全団体投票済みメッセージ */}
      {allVoted && (
        <FeedbackMessage type="info" message="すべての団体に投票済みです" />
      )}

      {/* 団体選択 */}
      <div>
        <label htmlFor="group-select" className="block text-sm font-medium text-gray-700 mb-2">
          団体を選択
        </label>
        <SelectGroup
          groups={groups}
          value={selectedGroupId}
          onChange={handleGroupChange}
          hasVoted={hasVoted}
          disabled={voting || allVoted}
        />
      </div>

      {/* スコア選択 */}
      <div>
        <label htmlFor="score-selector" className="block text-sm font-medium text-gray-700 mb-2">
          評価
        </label>
        <ScoreSelector
          value={selectedScore}
          onChange={handleScoreChange}
          disabled={voting || allVoted || !selectedGroupId || hasVoted(selectedGroupId)}
        />
      </div>

      {/* 送信ボタン */}
      <SubmitButton
        disabled={allVoted || voting || !selectedGroupId || selectedScore === 0 || hasVoted(selectedGroupId)}
        loading={voting}
      >
        {voting ? '投票中...' : '投票する'}
      </SubmitButton>
    </form>
  )
}
