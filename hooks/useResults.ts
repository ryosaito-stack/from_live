import { useState, useEffect, useCallback, useRef } from 'react'
import { Result } from '@/types'
import { ResultService } from '@/services/resultService'

/**
 * 結果データを取得・管理するカスタムフック
 * @param updateInterval 更新間隔（ミリ秒）、デフォルト60000（1分）
 * @returns 結果データと管理用関数
 */
export function useResults(updateInterval = 60000) {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * 結果データを取得
   */
  const fetchResults = useCallback(async (isManualRefetch = false) => {
    try {
      // 手動更新の場合はisUpdatingをtrueに
      if (isManualRefetch) {
        setIsUpdating(true)
      }
      
      const data = await ResultService.getAllResults()
      setResults(data)
      setError(null)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to fetch results:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
      if (isManualRefetch) {
        setIsUpdating(false)
      }
    }
  }, [])

  /**
   * 手動更新
   */
  const refetch = useCallback(async () => {
    await fetchResults(true)
  }, [fetchResults])

  /**
   * 初回ロードと自動更新の設定
   */
  useEffect(() => {
    // 初回ロード
    fetchResults(false)

    // 自動更新の設定
    if (updateInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchResults(false)
      }, updateInterval)
    }

    // クリーンアップ
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [updateInterval, fetchResults])

  return {
    results,
    loading,
    error,
    lastUpdated,
    isUpdating,
    refetch,
  }
}