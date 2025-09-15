import { BatchProcessor } from './batchProcessor'

export interface SchedulerResult {
  success: boolean
  interval?: number
  previousInterval?: number
  newInterval?: number
  error?: string
}

export interface SchedulerStatus {
  isRunning: boolean
  interval: number | null
  nextExecution: Date | null
  executionHistory: ExecutionHistory[]
}

export interface ExecutionHistory {
  timestamp: Date
  success: boolean
  processingTime?: number
  error?: string
}

/**
 * 定期実行スケジューラのサービスクラス
 */
export class Scheduler {
  private static intervalId: NodeJS.Timeout | null = null
  private static currentInterval: number | null = null
  private static nextExecutionTime: Date | null = null
  private static executionHistory: ExecutionHistory[] = []
  private static readonly MAX_HISTORY = 50

  /**
   * スケジューラを開始
   * @param intervalSeconds 実行間隔（秒）デフォルト60秒
   * @returns 結果
   */
  static start(intervalSeconds: number = 60): SchedulerResult {
    // 既に実行中かチェック
    if (this.intervalId !== null) {
      return {
        success: false,
        error: 'スケジューラは既に実行中です',
      }
    }

    // 間隔の検証
    if (intervalSeconds <= 0) {
      return {
        success: false,
        error: '実行間隔は0より大きい値である必要があります',
      }
    }

    try {
      // 最初の実行を即座に行う
      this.executeTask()

      // 定期実行を設定
      this.intervalId = setInterval(() => {
        this.executeTask()
      }, intervalSeconds * 1000)

      this.currentInterval = intervalSeconds
      this.updateNextExecutionTime()

      console.log(`Scheduler started with interval: ${intervalSeconds} seconds`)
      return {
        success: true,
        interval: intervalSeconds,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * スケジューラを停止
   * @returns 結果
   */
  static stop(): SchedulerResult {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
      this.currentInterval = null
      this.nextExecutionTime = null
      console.log('Scheduler stopped')
    }

    return {
      success: true,
    }
  }

  /**
   * スケジューラを再起動
   * @param intervalSeconds 新しい実行間隔（秒）
   * @returns 結果
   */
  static restart(intervalSeconds: number = 60): SchedulerResult {
    const previousInterval = this.currentInterval
    
    // 停止
    this.stop()
    
    // 再開始
    const result = this.start(intervalSeconds)
    
    if (result.success) {
      return {
        success: true,
        previousInterval: previousInterval || undefined,
        newInterval: intervalSeconds,
      }
    }
    
    return result
  }

  /**
   * スケジューラが実行中かチェック
   * @returns 実行中の場合true
   */
  static isRunning(): boolean {
    return this.intervalId !== null
  }

  /**
   * スケジューラの状態を取得
   * @returns 状態情報
   */
  static getStatus(): SchedulerStatus {
    return {
      isRunning: this.isRunning(),
      interval: this.currentInterval,
      nextExecution: this.nextExecutionTime,
      executionHistory: [...this.executionHistory],
    }
  }

  /**
   * タスクを実行
   */
  private static async executeTask(): Promise<void> {
    const startTime = Date.now()

    try {
      console.log('Executing scheduled batch processing...')
      
      const result = await BatchProcessor.processBatchAggregation()
      const processingTime = Date.now() - startTime

      this.addToHistory({
        timestamp: new Date(),
        success: result.success,
        processingTime,
        error: result.error,
      })

      if (result.success) {
        console.log(`Scheduled batch processing completed successfully in ${processingTime}ms`)
      } else {
        console.error(`Scheduled batch processing failed: ${result.error}`)
      }

      // 次回実行時刻を更新
      this.updateNextExecutionTime()

    } catch (error) {
      const processingTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      this.addToHistory({
        timestamp: new Date(),
        success: false,
        processingTime,
        error: errorMessage,
      })

      console.error('Error in scheduled task execution:', error)
      
      // 次回実行時刻を更新
      this.updateNextExecutionTime()
    }
  }

  /**
   * 次回実行時刻を更新
   */
  private static updateNextExecutionTime(): void {
    if (this.currentInterval !== null) {
      this.nextExecutionTime = new Date(Date.now() + this.currentInterval * 1000)
    }
  }

  /**
   * 実行履歴に追加
   * @param entry 履歴エントリ
   */
  private static addToHistory(entry: ExecutionHistory): void {
    this.executionHistory.unshift(entry)
    
    // 最大件数を超えた場合は古いものを削除
    if (this.executionHistory.length > this.MAX_HISTORY) {
      this.executionHistory = this.executionHistory.slice(0, this.MAX_HISTORY)
    }
  }

  /**
   * 実行履歴をクリア（テスト用）
   */
  static clearHistory(): void {
    this.executionHistory = []
  }
}