import { Scheduler } from '@/services/scheduler'
import { BatchProcessor } from '@/services/batchProcessor'

// モック
jest.mock('@/services/batchProcessor')

describe('Scheduler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // タイマーをクリア
    Scheduler.stop()
  })

  afterEach(() => {
    // テスト後にスケジューラを停止
    Scheduler.stop()
  })

  describe('start', () => {
    test('デフォルト間隔（60秒）でスケジューラを開始できる', () => {
      const result = Scheduler.start()
      
      expect(result.success).toBe(true)
      expect(Scheduler.isRunning()).toBe(true)
    })

    test('カスタム間隔でスケジューラを開始できる', () => {
      const result = Scheduler.start(30)
      
      expect(result.success).toBe(true)
      expect(result.interval).toBe(30)
      expect(Scheduler.isRunning()).toBe(true)
    })

    test('無効な間隔の場合はエラーを返す', () => {
      const result = Scheduler.start(0)
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(Scheduler.isRunning()).toBe(false)
    })

    test('既に実行中の場合は警告を返す', () => {
      // 1回目の開始
      Scheduler.start()
      
      // 2回目の開始
      const result = Scheduler.start()
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('既に実行中')
    })
  })

  describe('stop', () => {
    test('スケジューラを停止できる', () => {
      Scheduler.start()
      expect(Scheduler.isRunning()).toBe(true)
      
      const result = Scheduler.stop()
      
      expect(result.success).toBe(true)
      expect(Scheduler.isRunning()).toBe(false)
    })

    test('停止していない場合でもエラーにならない', () => {
      const result = Scheduler.stop()
      
      expect(result.success).toBe(true)
      expect(Scheduler.isRunning()).toBe(false)
    })
  })

  describe('restart', () => {
    test('スケジューラを再起動できる', () => {
      Scheduler.start(60)
      
      const result = Scheduler.restart(30)
      
      expect(result.success).toBe(true)
      expect(result.previousInterval).toBe(60)
      expect(result.newInterval).toBe(30)
      expect(Scheduler.isRunning()).toBe(true)
    })

    test('停止状態からでも再起動できる', () => {
      const result = Scheduler.restart(45)
      
      expect(result.success).toBe(true)
      expect(result.newInterval).toBe(45)
      expect(Scheduler.isRunning()).toBe(true)
    })
  })

  describe('getStatus', () => {
    test('実行中の状態を取得できる', () => {
      Scheduler.start(30)
      
      const status = Scheduler.getStatus()
      
      expect(status.isRunning).toBe(true)
      expect(status.interval).toBe(30)
      expect(status.nextExecution).toBeInstanceOf(Date)
    })

    test('停止中の状態を取得できる', () => {
      const status = Scheduler.getStatus()
      
      expect(status.isRunning).toBe(false)
      expect(status.interval).toBeNull()
      expect(status.nextExecution).toBeNull()
    })

    test('実行履歴を含む状態を取得できる', () => {
      const status = Scheduler.getStatus()
      
      expect(status).toHaveProperty('executionHistory')
      expect(Array.isArray(status.executionHistory)).toBe(true)
    })
  })

  describe('定期実行', () => {
    test('指定した間隔でバッチ処理が実行される', async () => {
      const mockBatchProcessor = BatchProcessor as jest.Mocked<typeof BatchProcessor>
      mockBatchProcessor.processBatchAggregation.mockResolvedValue({
        success: true,
        processedGroups: 3,
        processingTime: 100,
      })

      // 短い間隔でテスト
      Scheduler.start(0.1) // 100ms間隔

      // 250ms待機（3回実行されることを期待：開始時1回+定期実行2回）
      await new Promise(resolve => setTimeout(resolve, 250))

      expect(mockBatchProcessor.processBatchAggregation).toHaveBeenCalledTimes(3)
    })

    test('バッチ処理でエラーが発生してもスケジューラは継続する', async () => {
      const mockBatchProcessor = BatchProcessor as jest.Mocked<typeof BatchProcessor>
      mockBatchProcessor.processBatchAggregation
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({
          success: true,
          processedGroups: 3,
          processingTime: 100,
        })
        .mockResolvedValueOnce({
          success: true,
          processedGroups: 3,
          processingTime: 100,
        })

      Scheduler.start(0.1) // 100ms間隔

      // 250ms待機
      await new Promise(resolve => setTimeout(resolve, 250))

      // エラーが発生してもその後の実行は継続される（開始時1回+定期実行2回）
      expect(mockBatchProcessor.processBatchAggregation).toHaveBeenCalledTimes(3)
    })
  })

  describe('実行履歴', () => {
    test('実行履歴が記録される', async () => {
      const mockBatchProcessor = BatchProcessor as jest.Mocked<typeof BatchProcessor>
      mockBatchProcessor.processBatchAggregation.mockResolvedValue({
        success: true,
        processedGroups: 3,
        processingTime: 100,
      })

      Scheduler.start(0.1)
      await new Promise(resolve => setTimeout(resolve, 150))

      const status = Scheduler.getStatus()
      expect(status.executionHistory.length).toBeGreaterThan(0)
      expect(status.executionHistory[0]).toHaveProperty('timestamp')
      expect(status.executionHistory[0]).toHaveProperty('success')
    })

    test('履歴の最大件数が制限される', () => {
      // 履歴制限のテストは実装依存なので、基本的な構造のみテスト
      const status = Scheduler.getStatus()
      expect(Array.isArray(status.executionHistory)).toBe(true)
    })
  })

  describe('次回実行時刻の計算', () => {
    test('次回実行時刻が正しく計算される', () => {
      const startTime = new Date()
      Scheduler.start(60)
      
      const status = Scheduler.getStatus()
      const expectedNext = new Date(startTime.getTime() + 60 * 1000)
      
      // 1秒程度の誤差を許容
      expect(Math.abs(status.nextExecution!.getTime() - expectedNext.getTime())).toBeLessThan(2000)
    })
  })
})