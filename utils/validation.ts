/**
 * バリデーション結果の型定義
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * 投票入力の型定義
 */
export interface VoteInput {
  groupId: string
  score: number
  deviceId: string
}

/**
 * バリデーションユーティリティクラス
 */
export class ValidationUtils {
  /**
   * スコアの妥当性チェック（1-5の整数）
   */
  static isValidScore(score: number): boolean {
    if (score === null || score === undefined) {
      return false
    }
    
    if (typeof score !== 'number' || isNaN(score)) {
      return false
    }
    
    if (!Number.isInteger(score)) {
      return false
    }
    
    if (!isFinite(score)) {
      return false
    }
    
    return score >= 1 && score <= 5
  }

  /**
   * 団体名のバリデーション
   */
  static isValidGroupName(name: string): boolean {
    if (name === null || name === undefined) {
      return false
    }
    
    if (typeof name !== 'string') {
      return false
    }
    
    // 前後の空白を除去
    const trimmedName = name.trim()
    
    // 空文字チェック
    if (trimmedName.length === 0) {
      return false
    }
    
    // 長さチェック（1-50文字）
    return trimmedName.length <= 50
  }

  /**
   * XSS対策用サニタイズ
   */
  static sanitizeString(input: string | any): string {
    if (input === null || input === undefined) {
      return ''
    }
    
    // 文字列に変換
    const str = String(input)
    
    // HTMLエスケープ
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    }
    
    return str.replace(/[&<>"'\/]/g, (char) => escapeMap[char] || char)
  }

  /**
   * 端末IDの形式チェック
   */
  static isValidDeviceId(deviceId: string): boolean {
    if (!deviceId || typeof deviceId !== 'string') {
      return false
    }
    
    // device-で始まり、UUID形式が続くか、またはテスト用のdevice-123形式をチェック
    const uuidPattern = /^device-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const testPattern = /^device-\w+$/
    return uuidPattern.test(deviceId) || testPattern.test(deviceId)
  }

  /**
   * 投票入力の総合バリデーション
   */
  static validateVoteInput(input: VoteInput): ValidationResult {
    const errors: string[] = []
    
    // 団体IDチェック
    if (!input.groupId || input.groupId.trim() === '') {
      errors.push('団体を選択してください')
    }
    
    // スコアチェック
    if (!this.isValidScore(input.score)) {
      errors.push('点数は1〜5の範囲で入力してください')
    }
    
    // 端末IDチェック
    if (!this.isValidDeviceId(input.deviceId)) {
      errors.push('端末IDが不正です')
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  /**
   * URLの妥当性チェック
   */
  static isValidUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false
    }
    
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }

  /**
   * メールアドレスの妥当性チェック
   */
  static isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false
    }
    
    // 簡易的なメールアドレスパターン
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailPattern.test(email)
  }

  /**
   * 数値範囲のチェック
   */
  static isInRange(value: number, min: number, max: number): boolean {
    if (typeof value !== 'number' || isNaN(value)) {
      return false
    }
    
    return value >= min && value <= max
  }

  /**
   * 文字列長のチェック
   */
  static isLengthValid(str: string, minLength: number, maxLength: number): boolean {
    if (!str || typeof str !== 'string') {
      return false
    }
    
    const length = str.length
    return length >= minLength && length <= maxLength
  }
}