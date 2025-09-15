import { renderHook, act, waitFor } from '@testing-library/react'
import { useResults } from '@/hooks/useResults'
import { ResultService } from '@/services/resultService'
import { Result } from '@/types'

jest.mock('@/services/resultService')

describe('useResults', () => {
  const mockResults: Result[] = [
    {
      id: 'result1',
      groupId: 'group1',
      groupName: '団体A',
      totalScore: 45,
      voteCount: 10,
      averageScore: 4.5,
      rank: 1,
      updatedAt: new Date('2025-01-15T10:00:00'),
    },
    {
      id: 'result2',
      groupId: 'group2',
      groupName: '団体B',
      totalScore: 35,
      voteCount: 8,
      averageScore: 4.375,
      rank: 2,
      updatedAt: new Date('2025-01-15T10:00:00'),
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('初期状態ではローディング中', () => {
    const mockResultService = ResultService as jest.Mocked<typeof ResultService>
    mockResultService.getAllResults.mockImplementation(
      () => new Promise(() => {}) // 永遠に解決しない
    )

    const { result } = renderHook(() => useResults())

    expect(result.current.loading).toBe(true)
    expect(result.current.results).toEqual([])
    expect(result.current.error).toBeNull()
    expect(result.current.lastUpdated).toBeNull()
    expect(result.current.isUpdating).toBe(false)
  })

  test('結果データを取得できる', async () => {
    const mockResultService = ResultService as jest.Mocked<typeof ResultService>
    mockResultService.getAllResults.mockResolvedValue(mockResults)

    const { result } = renderHook(() => useResults())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.results).toEqual(mockResults)
    expect(result.current.error).toBeNull()
    expect(result.current.lastUpdated).toBeInstanceOf(Date)
  })

  test('エラーハンドリング', async () => {
    const mockResultService = ResultService as jest.Mocked<typeof ResultService>
    const error = new Error('Failed to fetch')
    mockResultService.getAllResults.mockRejectedValue(error)

    const { result } = renderHook(() => useResults())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.results).toEqual([])
    expect(result.current.error).toEqual(error)
  })

  test('手動更新ができる', async () => {
    const mockResultService = ResultService as jest.Mocked<typeof ResultService>
    mockResultService.getAllResults.mockResolvedValue(mockResults)

    const { result } = renderHook(() => useResults())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    mockResultService.getAllResults.mockResolvedValue([
      ...mockResults,
      {
        id: 'result3',
        groupId: 'group3',
        groupName: '団体C',
        totalScore: 25,
        voteCount: 5,
        averageScore: 5,
        rank: 3,
        updatedAt: new Date(),
      },
    ])

    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.results).toHaveLength(3)
  })

  test('自動更新が設定できる（デフォルト60秒）', async () => {
    const mockResultService = ResultService as jest.Mocked<typeof ResultService>
    mockResultService.getAllResults.mockResolvedValue(mockResults)

    const { result } = renderHook(() => useResults())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockResultService.getAllResults).toHaveBeenCalledTimes(1)

    // 60秒経過
    act(() => {
      jest.advanceTimersByTime(60000)
    })

    await waitFor(() => {
      expect(mockResultService.getAllResults).toHaveBeenCalledTimes(2)
    })
  })

  test('カスタム更新間隔を設定できる', async () => {
    const mockResultService = ResultService as jest.Mocked<typeof ResultService>
    mockResultService.getAllResults.mockResolvedValue(mockResults)

    const { result } = renderHook(() => useResults(30000)) // 30秒

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockResultService.getAllResults).toHaveBeenCalledTimes(1)

    // 30秒経過
    act(() => {
      jest.advanceTimersByTime(30000)
    })

    await waitFor(() => {
      expect(mockResultService.getAllResults).toHaveBeenCalledTimes(2)
    })
  })

  test('更新中はisUpdatingがtrueになる', async () => {
    const mockResultService = ResultService as jest.Mocked<typeof ResultService>
    let resolvePromise: (value: Result[]) => void
    
    mockResultService.getAllResults.mockImplementation(
      () => new Promise((resolve) => {
        resolvePromise = resolve
      })
    )

    const { result } = renderHook(() => useResults())

    // 初回ロード
    expect(result.current.loading).toBe(true)
    expect(result.current.isUpdating).toBe(false)

    // 初回ロード完了
    await act(async () => {
      resolvePromise!(mockResults)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // 手動更新開始
    mockResultService.getAllResults.mockImplementation(
      () => new Promise((resolve) => {
        resolvePromise = resolve
      })
    )

    act(() => {
      result.current.refetch()
    })

    expect(result.current.isUpdating).toBe(true)

    // 更新完了
    await act(async () => {
      resolvePromise!(mockResults)
    })

    await waitFor(() => {
      expect(result.current.isUpdating).toBe(false)
    })
  })

  test('コンポーネントのアンマウント時にタイマーがクリアされる', async () => {
    const mockResultService = ResultService as jest.Mocked<typeof ResultService>
    mockResultService.getAllResults.mockResolvedValue(mockResults)

    const { result, unmount } = renderHook(() => useResults())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    unmount()

    // タイマーが進んでも新しい呼び出しがない
    act(() => {
      jest.advanceTimersByTime(60000)
    })

    expect(mockResultService.getAllResults).toHaveBeenCalledTimes(1)
  })
})