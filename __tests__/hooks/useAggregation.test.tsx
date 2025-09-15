import { renderHook, act, waitFor } from '@testing-library/react'
import { useAggregation } from '@/hooks/useAggregation'
import { AggregationService } from '@/services/aggregationService'

jest.mock('@/services/aggregationService')

describe('useAggregation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('初期状態', () => {
    const { result } = renderHook(() => useAggregation())

    expect(result.current.aggregating).toBe(false)
    expect(result.current.aggregationResult).toBeNull()
    expect(result.current.aggregationError).toBeNull()
  })

  test('集計処理をトリガーできる', async () => {
    const mockAggregationService = AggregationService as jest.Mocked<typeof AggregationService>
    mockAggregationService.batchAggregate.mockResolvedValue(undefined)

    const { result } = renderHook(() => useAggregation())

    await act(async () => {
      await result.current.triggerAggregation()
    })

    expect(mockAggregationService.batchAggregate).toHaveBeenCalledTimes(1)
    expect(result.current.aggregating).toBe(false)
    expect(result.current.aggregationResult).toEqual({ success: true, message: '\u96c6\u8a08\u304c\u5b8c\u4e86\u3057\u307e\u3057\u305f' })
  })

  test('集計中はaggregatingがtrueになる', async () => {
    const mockAggregationService = AggregationService as jest.Mocked<typeof AggregationService>
    let resolvePromise: () => void
    
    mockAggregationService.batchAggregate.mockImplementation(
      () => new Promise((resolve) => {
        resolvePromise = resolve
      })
    )

    const { result } = renderHook(() => useAggregation())

    // 集計開始
    act(() => {
      result.current.triggerAggregation()
    })

    expect(result.current.aggregating).toBe(true)

    // 集計完了
    await act(async () => {
      resolvePromise!()
    })

    await waitFor(() => {
      expect(result.current.aggregating).toBe(false)
    })
  })

  test('エラーハンドリング', async () => {
    const mockAggregationService = AggregationService as jest.Mocked<typeof AggregationService>
    const error = new Error('Aggregation failed')
    mockAggregationService.batchAggregate.mockRejectedValue(error)

    const { result } = renderHook(() => useAggregation())

    await act(async () => {
      await result.current.triggerAggregation()
    })

    expect(result.current.aggregating).toBe(false)
    expect(result.current.aggregationError).toEqual(error)
    expect(result.current.aggregationResult).toBeNull()
  })

  test('集計が実行中の場合は新しい集計をスキップ', async () => {
    const mockAggregationService = AggregationService as jest.Mocked<typeof AggregationService>
    let resolvePromise: () => void
    
    mockAggregationService.batchAggregate.mockImplementation(
      () => new Promise((resolve) => {
        resolvePromise = resolve
      })
    )

    const { result } = renderHook(() => useAggregation())

    // 最初の集計を開始
    act(() => {
      result.current.triggerAggregation()
    })

    expect(result.current.aggregating).toBe(true)
    expect(mockAggregationService.batchAggregate).toHaveBeenCalledTimes(1)

    // 実行中に再度トリガー（スキップされる）
    await act(async () => {
      await result.current.triggerAggregation()
    })

    expect(mockAggregationService.batchAggregate).toHaveBeenCalledTimes(1) // 増えない

    // 最初の集計を完了
    await act(async () => {
      resolvePromise!()
    })

    await waitFor(() => {
      expect(result.current.aggregating).toBe(false)
    })
  })
})