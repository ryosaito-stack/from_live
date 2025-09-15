import { v4 as uuidv4 } from 'uuid'

const DEVICE_ID_KEY = 'form-live-device-id'
const DEVICE_ID_PREFIX = 'device-'

/**
 * 端末ID管理クラス
 * ブラウザのlocalStorageを使用して端末固有のIDを管理
 */
export class DeviceIdManager {
  private static currentDeviceId: string | null = null

  /**
   * 端末IDを取得（存在しない場合は新規生成）
   * @returns 端末ID
   */
  static getDeviceId(): string {
    // メモリキャッシュがある場合はそれを返す
    if (this.currentDeviceId) {
      return this.currentDeviceId
    }

    try {
      // localStorageから取得を試みる
      const storedId = localStorage.getItem(DEVICE_ID_KEY)
      
      if (storedId && this.isValidDeviceId(storedId)) {
        this.currentDeviceId = storedId
        return storedId
      }
      
      // 存在しないか無効な場合は新規生成
      const newDeviceId = this.generateDeviceId()
      
      // localStorageに保存を試みる
      try {
        localStorage.setItem(DEVICE_ID_KEY, newDeviceId)
      } catch (error) {
        // 保存に失敗してもIDは返す
        console.warn('Failed to save device ID to localStorage:', error)
      }
      
      this.currentDeviceId = newDeviceId
      return newDeviceId
      
    } catch (error) {
      // localStorageが使用できない場合も新規生成
      console.warn('localStorage is not available:', error)
      const newDeviceId = this.generateDeviceId()
      this.currentDeviceId = newDeviceId
      return newDeviceId
    }
  }

  /**
   * 新規端末IDを生成
   * @returns 新しい端末ID
   */
  private static generateDeviceId(): string {
    return `${DEVICE_ID_PREFIX}${uuidv4()}`
  }

  /**
   * 端末IDのバリデーション
   * @param deviceId チェックする端末ID
   * @returns 有効な形式の場合true
   */
  static isValidDeviceId(deviceId: string): boolean {
    if (!deviceId || typeof deviceId !== 'string') {
      return false
    }

    // device-で始まり、UUID形式が続くかチェック
    if (!deviceId.startsWith(DEVICE_ID_PREFIX)) {
      return false
    }

    const uuidPart = deviceId.substring(DEVICE_ID_PREFIX.length)
    
    // UUID形式の正規表現パターン（v4に限定しない）
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    
    return uuidPattern.test(uuidPart)
  }

  /**
   * 端末IDをリセット（テスト用）
   */
  static resetDeviceId(): void {
    this.currentDeviceId = null
    
    try {
      localStorage.removeItem(DEVICE_ID_KEY)
    } catch (error) {
      console.warn('Failed to remove device ID from localStorage:', error)
    }
  }
}