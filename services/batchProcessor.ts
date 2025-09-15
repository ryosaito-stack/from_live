import { AggregationService } from './aggregationService'
import { ResultService } from './resultService'
import { ConfigService } from './configService'

export interface BatchProcessResult {
  success: boolean
  processedGroups?: number
  processingTime?: number
  error?: string
  skipped?: boolean
}

export interface ProcessingStatus {
  isProcessing: boolean
  lastProcessed: Date | null
  nextScheduled?: Date | null
}

export interface ProcessingHistory {
  timestamp: Date
  success: boolean
  processedGroups?: number
  processingTime?: number
  error?: string
}

/**
 * バッチ集計処理のサービスクラス
 */
export class BatchProcessor {
  private static isProcessing = false
  private static processingHistory: ProcessingHistory[] = []
  private static readonly MAX_HISTORY = 10

  /**
   * 集計バッチ処理を実行
   * @returns 処理結果
   */
  static async processBatchAggregation(): Promise<BatchProcessResult> {
    // 重複処理防止
    if (this.isProcessing) {
      console.log('Batch processing is already running, skipping...')
      return {
        success: false,
        skipped: true,
        error: '既に処理が実行中です',
      }
    }

    const startTime = Date.now()
    this.isProcessing = true

    try {
      console.log('Starting batch aggregation process...')

      // 集計処理を実行
      await AggregationService.batchAggregate()

      const processingTime = Date.now() - startTime
      const result: BatchProcessResult = {
        success: true,
        processedGroups: 1, // AggregationServiceから詳細情報を取得できるように後で改善
        processingTime,
      }

      // 履歴に記録
      this.addToHistory({
        timestamp: new Date(),
        success: true,
        processedGroups: result.processedGroups,
        processingTime: result.processingTime,
      })

      console.log(`Batch aggregation completed successfully in ${processingTime}ms`)
      return result

    } catch (error) {
      const processingTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // 履歴に記録
      this.addToHistory({
        timestamp: new Date(),
        success: false,
        processingTime,
        error: errorMessage,
      })

      console.error('Batch aggregation failed:', error)
      return {
        success: false,
        processingTime,
        error: errorMessage,
      }
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * 処理が有効かチェック
   * @returns 処理が有効な場合true
   */
  static async isProcessingEnabled(): Promise<boolean> {
    try {
      const config = await ConfigService.getConfig()
      return config.aggregationEnabled !== false // デフォルトは有効
    } catch (error) {
      console.error('Error checking processing config:', error)
      return false
    }
  }

  /**
   * 処理状況を取得
   * @returns 処理状況
   */
  static async getProcessingStatus(): Promise<ProcessingStatus> {
    try {
      const lastProcessed = await ResultService.getLatestUpdateTime()
      
      return {
        isProcessing: this.isProcessing,
        lastProcessed,
      }
    } catch (error) {
      console.error('Error getting processing status:', error)
      return {
        isProcessing: this.isProcessing,
        lastProcessed: null,
      }
    }
  }

  /**
   * 処理中状態を設定（テスト用）
   * @param state 処理中状態
   */
  static setProcessingState(state: boolean): void {
    this.isProcessing = state
  }

  /**
   * 処理履歴を取得
   * @returns 処理履歴の配列
   */
  static getProcessingHistory(): ProcessingHistory[] {
    return [...this.processingHistory]
  }

  /**
   * 履歴に追加
   * @param entry 履歴エントリ
   */
  private static addToHistory(entry: ProcessingHistory): void {
    this.processingHistory.unshift(entry)
    
    // 最大件数を超えた場合は古いものを削除
    if (this.processingHistory.length > this.MAX_HISTORY) {
      this.processingHistory = this.processingHistory.slice(0, this.MAX_HISTORY)
    }
  }

  /**
   * 履歴をクリア（テスト用）
   */
  static clearHistory(): void {
    this.processingHistory = []
  }
}