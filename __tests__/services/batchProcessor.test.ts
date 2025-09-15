import { BatchProcessor } from '@/services/batchProcessor'
import { AggregationService } from '@/services/aggregationService'
import { ResultService } from '@/services/resultService'
import { ConfigService } from '@/services/configService'

// モック
jest.mock('@/services/aggregationService')
jest.mock('@/services/resultService')
jest.mock('@/services/configService')

describe('BatchProcessor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    BatchProcessor.clearHistory()
  })

  describe('processBatchAggregation', () => {
    test('集計バッチ処理を実行できる', async () => {
      const mockAggregationService = AggregationService as jest.Mocked<typeof AggregationService>
      
      // 正常に実行されることを期待
      mockAggregationService.batchAggregate.mockResolvedValue(undefined)

      const result = await BatchProcessor.processBatchAggregation()

      expect(result.success).toBe(true)
      expect(result.processedGroups).toBeGreaterThan(0)
      expect(mockAggregationService.batchAggregate).toHaveBeenCalled()
    })

    test('エラーが発生した場合は失敗を返す', async () => {
      const mockAggregationService = AggregationService as jest.Mocked<typeof AggregationService>
      
      mockAggregationService.batchAggregate.mockRejectedValue(new Error('Database error'))

      const result = await BatchProcessor.processBatchAggregation()

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    test('処理時間を記録する', async () => {
      const mockAggregationService = AggregationService as jest.Mocked<typeof AggregationService>
      
      mockAggregationService.batchAggregate.mockImplementation(async () => {
        // 100ms待機
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      const result = await BatchProcessor.processBatchAggregation()

      expect(result.processingTime).toBeGreaterThan(90) // 多少の誤差を許容
    })
  })

  describe('isProcessingEnabled', () => {
    test('設定で集計処理が有効な場合はtrueを返す', async () => {
      const mockConfigService = ConfigService as jest.Mocked<typeof ConfigService>
      mockConfigService.getConfig.mockResolvedValue({
        votingEnabled: true,
        resultsVisible: true,
        updateInterval: 60,
        aggregationEnabled: true,
      })

      const result = await BatchProcessor.isProcessingEnabled()

      expect(result).toBe(true)
    })

    test('設定で集計処理が無効な場合はfalseを返す', async () => {
      const mockConfigService = ConfigService as jest.Mocked<typeof ConfigService>
      mockConfigService.getConfig.mockResolvedValue({
        votingEnabled: true,
        resultsVisible: true,
        updateInterval: 60,
        aggregationEnabled: false,
      })

      const result = await BatchProcessor.isProcessingEnabled()

      expect(result).toBe(false)
    })

    test('設定取得エラーの場合はfalseを返す', async () => {
      const mockConfigService = ConfigService as jest.Mocked<typeof ConfigService>
      mockConfigService.getConfig.mockRejectedValue(new Error('Config error'))

      const result = await BatchProcessor.isProcessingEnabled()

      expect(result).toBe(false)
    })
  })

  describe('getProcessingStatus', () => {
    test('処理状況を取得できる', async () => {
      const mockResultService = ResultService as jest.Mocked<typeof ResultService>
      mockResultService.getLatestUpdateTime.mockResolvedValue(new Date('2025-01-15T10:00:00'))

      const status = await BatchProcessor.getProcessingStatus()

      expect(status.lastProcessed).toEqual(new Date('2025-01-15T10:00:00'))
      expect(status.isProcessing).toBe(false)
    })

    test('処理中の場合はisProcessingがtrueになる', async () => {
      // 処理開始をシミュレート
      BatchProcessor.setProcessingState(true)

      const status = await BatchProcessor.getProcessingStatus()

      expect(status.isProcessing).toBe(true)

      // クリーンアップ
      BatchProcessor.setProcessingState(false)
    })

    test('データがない場合はnullを返す', async () => {
      const mockResultService = ResultService as jest.Mocked<typeof ResultService>
      mockResultService.getLatestUpdateTime.mockResolvedValue(null)

      const status = await BatchProcessor.getProcessingStatus()

      expect(status.lastProcessed).toBeNull()
    })
  })

  describe('重複処理防止', () => {
    test('処理中は新しい処理を開始しない', async () => {
      const mockAggregationService = AggregationService as jest.Mocked<typeof AggregationService>
      
      // 長時間の処理をシミュレート
      mockAggregationService.batchAggregate.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 200))
      })

      // 2つの処理を同時開始
      const promise1 = BatchProcessor.processBatchAggregation()
      const promise2 = BatchProcessor.processBatchAggregation()

      const [result1, result2] = await Promise.all([promise1, promise2])

      // 1つは成功、1つはスキップされる
      const successCount = [result1, result2].filter(r => r.success).length
      const skippedCount = [result1, result2].filter(r => r.skipped).length
      
      expect(successCount).toBe(1)
      expect(skippedCount).toBe(1)
    })
  })

  describe('処理履歴管理', () => {
    test('処理履歴を記録できる', async () => {
      const mockAggregationService = AggregationService as jest.Mocked<typeof AggregationService>
      mockAggregationService.batchAggregate.mockResolvedValue(undefined)

      await BatchProcessor.processBatchAggregation()

      const history = BatchProcessor.getProcessingHistory()
      
      expect(history).toHaveLength(1)
      expect(history[0].success).toBe(true)
      expect(history[0].timestamp).toBeInstanceOf(Date)
    })

    test('履歴の最大件数は制限される', async () => {
      const mockAggregationService = AggregationService as jest.Mocked<typeof AggregationService>
      mockAggregationService.batchAggregate.mockResolvedValue(undefined)

      // 20回実行（制限は10件と仮定）
      for (let i = 0; i < 20; i++) {
        await BatchProcessor.processBatchAggregation()
      }

      const history = BatchProcessor.getProcessingHistory()
      
      expect(history.length).toBeLessThanOrEqual(10)
    })
  })
})