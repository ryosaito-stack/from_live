import { Timestamp } from 'firebase/firestore'

/**
 * 日付処理ユーティリティクラス
 */
export class DateUtils {
  /**
   * Firestore TimestampまたはDateをDateオブジェクトに変換
   */
  static toDate(timestamp: Timestamp | Date | null): Date | null {
    if (!timestamp) {
      return null
    }
    
    if (timestamp instanceof Date) {
      return timestamp
    }
    
    // Timestampの場合
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
      return timestamp.toDate()
    }
    
    return null
  }

  /**
   * 日時を「YYYY/MM/DD HH:mm」形式でフォーマット（JST）
   */
  static formatDateTime(date: Date | Timestamp | null): string {
    const dateObj = this.toDate(date)
    if (!dateObj) {
      return ''
    }

    // JSTに変換（UTC+9）
    const jstDate = new Date(dateObj.getTime() + 9 * 60 * 60 * 1000)
    
    const year = jstDate.getUTCFullYear()
    const month = String(jstDate.getUTCMonth() + 1).padStart(2, '0')
    const day = String(jstDate.getUTCDate()).padStart(2, '0')
    const hours = String(jstDate.getUTCHours()).padStart(2, '0')
    const minutes = String(jstDate.getUTCMinutes()).padStart(2, '0')
    
    return `${year}/${month}/${day} ${hours}:${minutes}`
  }

  /**
   * 日付を「YYYY/MM/DD」形式でフォーマット（JST）
   */
  static formatDate(date: Date | Timestamp | null): string {
    const dateObj = this.toDate(date)
    if (!dateObj) {
      return ''
    }

    // JSTに変換（UTC+9）
    const jstDate = new Date(dateObj.getTime() + 9 * 60 * 60 * 1000)
    
    const year = jstDate.getUTCFullYear()
    const month = String(jstDate.getUTCMonth() + 1).padStart(2, '0')
    const day = String(jstDate.getUTCDate()).padStart(2, '0')
    
    return `${year}/${month}/${day}`
  }

  /**
   * 時刻を「HH:mm」または「HH:mm:ss」形式でフォーマット（JST）
   */
  static formatTime(date: Date | Timestamp | null, includeSeconds = false): string {
    const dateObj = this.toDate(date)
    if (!dateObj) {
      return ''
    }

    // JSTに変換（UTC+9）
    const jstDate = new Date(dateObj.getTime() + 9 * 60 * 60 * 1000)
    
    const hours = String(jstDate.getUTCHours()).padStart(2, '0')
    const minutes = String(jstDate.getUTCMinutes()).padStart(2, '0')
    
    if (includeSeconds) {
      const seconds = String(jstDate.getUTCSeconds()).padStart(2, '0')
      return `${hours}:${minutes}:${seconds}`
    }
    
    return `${hours}:${minutes}`
  }

  /**
   * 相対時間表示（例: "5分前"）
   */
  static getRelativeTime(date: Date | Timestamp | null): string {
    const dateObj = this.toDate(date)
    if (!dateObj) {
      return ''
    }

    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    // 未来の場合または1分未満
    if (diffSeconds < 60) {
      return 'たった今'
    }
    
    // 1時間未満
    if (diffMinutes < 60) {
      return `${diffMinutes}分前`
    }
    
    // 24時間未満
    if (diffHours < 24) {
      return `${diffHours}時間前`
    }
    
    // 7日未満
    if (diffDays < 7) {
      return `${diffDays}日前`
    }
    
    // 7日以上前は日付を表示
    return this.formatDate(dateObj)
  }

  /**
   * 更新時刻表示（例: "最終更新: 10:30"）
   */
  static formatUpdateTime(date: Date | Timestamp | null): string {
    if (!date) {
      return '最終更新: --:--'
    }
    
    const time = this.formatTime(date)
    return `最終更新: ${time}`
  }

  /**
   * 次の更新時刻までの秒数を取得
   * @param intervalMinutes 更新間隔（分）
   * @returns 次の更新までの秒数
   */
  static getSecondsUntilNextUpdate(intervalMinutes: number = 1): number {
    if (intervalMinutes <= 0) {
      return 60
    }
    
    const now = new Date()
    const intervalMs = intervalMinutes * 60 * 1000
    const currentMs = now.getTime()
    
    // 次の更新時刻を計算
    const nextUpdateMs = Math.ceil(currentMs / intervalMs) * intervalMs
    const remainingMs = nextUpdateMs - currentMs
    
    // 最小1秒を返す（0を避ける）
    return Math.max(1, Math.ceil(remainingMs / 1000))
  }

  /**
   * ISO 8601形式の文字列をDateに変換
   */
  static parseISO(isoString: string): Date | null {
    try {
      const date = new Date(isoString)
      if (isNaN(date.getTime())) {
        return null
      }
      return date
    } catch {
      return null
    }
  }

  /**
   * DateをISO 8601形式の文字列に変換
   */
  static toISO(date: Date | Timestamp | null): string {
    const dateObj = this.toDate(date)
    if (!dateObj) {
      return ''
    }
    return dateObj.toISOString()
  }
}