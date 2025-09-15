import { useState, useCallback } from 'react'
import { AggregationService } from '@/services/aggregationService'

export interface AggregationResult {
  success: boolean
  message?: string
}

/**
 * 集計処理を管理するカスタムフック
 * @returns 集計状態とトリガー関数
 */
export function useAggregation() {
  const [aggregating, setAggregating] = useState(false)
  const [aggregationResult, setAggregationResult] = useState<AggregationResult | null>(null)
  const [aggregationError, setAggregationError] = useState<Error | null>(null)

  /**
   * 集計処理をトリガー
   */
  const triggerAggregation = useCallback(async () => {
    // 既に集計中の場合はスキップ
    if (aggregating) {
      console.log('Aggregation already in progress, skipping...')
      return
    }

    setAggregating(true)
    setAggregationError(null)
    
    try {
      await AggregationService.batchAggregate()
      setAggregationResult({ success: true, message: '集計が完了しました' })
    } catch (error) {
      console.error('Aggregation failed:', error)
      setAggregationError(error instanceof Error ? error : new Error('Unknown error'))
      setAggregationResult(null)
    } finally {
      setAggregating(false)
    }
  }, [aggregating])

  return {
    aggregating,
    aggregationResult,
    aggregationError,
    triggerAggregation,
  }
}