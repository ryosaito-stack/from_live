/**
 * 投票記録の型定義
 */
export interface VoteRecord {
  groupId: string
  votedAt: number // タイムスタンプ（ミリ秒）
}

/**
 * 投票履歴管理クラス
 * localStorageを使用して投票履歴を管理し、重複投票を防ぐ
 */
export class VoteHistoryManager {
  private static readonly HISTORY_KEY = 'form-live-vote-history'
  private static cachedHistory: VoteRecord[] | null = null

  /**
   * 指定した団体に投票済みかチェック
   * @param groupId 団体ID
   * @returns 投票済みの場合true
   */
  static hasVoted(groupId: string): boolean {
    if (!groupId) {
      return false
    }

    const history = this.getHistory()
    return history.some(record => record.groupId === groupId)
  }

  /**
   * 投票を記録
   * @param groupId 団体ID
   * @throws 既に投票済みの場合、団体IDが空の場合
   */
  static recordVote(groupId: string): void {
    if (!groupId) {
      throw new Error('団体IDが指定されていません')
    }

    if (this.hasVoted(groupId)) {
      throw new Error('この団体には既に投票済みです')
    }

    const history = this.getHistory()
    const newRecord: VoteRecord = {
      groupId,
      votedAt: Date.now(),
    }

    history.push(newRecord)

    try {
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history))
      this.cachedHistory = history
    } catch (error) {
      // キャッシュをクリアして次回は再読み込み
      this.cachedHistory = null
      throw new Error('投票の保存に失敗しました')
    }
  }

  /**
   * 投票履歴を取得
   * @returns 投票履歴の配列（時系列順）
   */
  static getHistory(): VoteRecord[] {
    // キャッシュがある場合はそれを返す
    if (this.cachedHistory !== null) {
      return [...this.cachedHistory] // コピーを返す
    }

    try {
      const stored = localStorage.getItem(this.HISTORY_KEY)
      
      if (!stored) {
        this.cachedHistory = []
        return []
      }

      try {
        const history = JSON.parse(stored) as VoteRecord[]
        
        // データの検証
        if (!Array.isArray(history)) {
          this.cachedHistory = []
          return []
        }

        // 各レコードの検証
        const validHistory = history.filter(record => 
          record && 
          typeof record.groupId === 'string' && 
          typeof record.votedAt === 'number'
        )

        this.cachedHistory = validHistory
        return [...validHistory]
        
      } catch (parseError) {
        // JSONパースエラーの場合は空配列を返す
        console.warn('Failed to parse vote history:', parseError)
        this.cachedHistory = []
        return []
      }
      
    } catch (error) {
      // localStorageアクセスエラーの場合も空配列を返す
      console.warn('Failed to access localStorage:', error)
      return []
    }
  }

  /**
   * 投票履歴をクリア
   */
  static clearHistory(): void {
    this.cachedHistory = null // nullに設定してキャッシュをクリア
    
    try {
      localStorage.removeItem(this.HISTORY_KEY)
    } catch (error) {
      console.warn('Failed to clear vote history from localStorage:', error)
    }
  }
  
  /**
   * キャッシュをクリア（テスト用）
   */
  static clearCache(): void {
    this.cachedHistory = null
  }

  /**
   * 特定の団体の投票記録を取得
   * @param groupId 団体ID
   * @returns 投票記録、存在しない場合はnull
   */
  static getVoteRecord(groupId: string): VoteRecord | null {
    const history = this.getHistory()
    return history.find(record => record.groupId === groupId) || null
  }

  /**
   * 投票数を取得
   * @returns 投票済みの団体数
   */
  static getVoteCount(): number {
    return this.getHistory().length
  }
}