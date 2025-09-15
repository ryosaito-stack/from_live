import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface SystemConfig {
  currentGroup?: string
  votingEnabled: boolean
  resultsVisible: boolean
  updateInterval: number
  aggregationEnabled?: boolean
}

/**
 * システム設定のサービスクラス
 */
export class ConfigService {
  private static readonly COLLECTION_NAME = 'config'
  private static readonly CONFIG_DOC_ID = 'system'

  /**
   * デフォルト設定
   */
  private static readonly DEFAULT_CONFIG: SystemConfig = {
    votingEnabled: true,
    resultsVisible: true,
    updateInterval: 60, // 秒
    aggregationEnabled: true,
  }

  /**
   * 現在の設定を取得
   * @returns 設定オブジェクト
   */
  static async getConfig(): Promise<SystemConfig> {
    try {
      const configRef = doc(db, this.COLLECTION_NAME, this.CONFIG_DOC_ID)
      const configDoc = await getDoc(configRef)

      if (configDoc.exists()) {
        return configDoc.data() as SystemConfig
      }

      // 設定が存在しない場合はデフォルト設定を作成して返す
      await this.initializeConfig()
      return this.DEFAULT_CONFIG
    } catch (error) {
      console.error('Error fetching config:', error)
      return this.DEFAULT_CONFIG
    }
  }

  /**
   * 設定を初期化
   */
  private static async initializeConfig(): Promise<void> {
    try {
      const configRef = doc(db, this.COLLECTION_NAME, this.CONFIG_DOC_ID)
      await setDoc(configRef, this.DEFAULT_CONFIG)
    } catch (error) {
      console.error('Error initializing config:', error)
    }
  }

  /**
   * 設定を更新
   * @param config 更新する設定
   * @returns 更新成功の場合true
   */
  static async updateConfig(config: Partial<SystemConfig>): Promise<boolean> {
    try {
      const configRef = doc(db, this.COLLECTION_NAME, this.CONFIG_DOC_ID)
      await updateDoc(configRef, config)
      return true
    } catch (error) {
      console.error('Error updating config:', error)
      return false
    }
  }

  /**
   * 投票の有効/無効を設定
   * @param enabled 有効/無効
   * @returns 更新成功の場合true
   */
  static async setVotingEnabled(enabled: boolean): Promise<boolean> {
    return this.updateConfig({ votingEnabled: enabled })
  }

  /**
   * 結果表示の有効/無効を設定
   * @param visible 表示/非表示
   * @returns 更新成功の場合true
   */
  static async setResultsVisible(visible: boolean): Promise<boolean> {
    return this.updateConfig({ resultsVisible: visible })
  }

  /**
   * 更新間隔を設定
   * @param interval 更新間隔（秒）
   * @returns 更新成功の場合true
   */
  static async setUpdateInterval(interval: number): Promise<boolean> {
    if (interval < 1) {
      console.error('Update interval must be at least 1 second')
      return false
    }
    return this.updateConfig({ updateInterval: interval })
  }

  /**
   * 現在の団体を設定
   * @param groupId 団体ID
   * @returns 更新成功の場合true
   */
  static async setCurrentGroup(groupId: string): Promise<boolean> {
    return this.updateConfig({ currentGroup: groupId })
  }

  /**
   * 投票が有効かチェック
   * @returns 投票が有効な場合true
   */
  static async isVotingEnabled(): Promise<boolean> {
    const config = await this.getConfig()
    return config.votingEnabled
  }

  /**
   * 結果が表示可能かチェック
   * @returns 結果が表示可能な場合true
   */
  static async areResultsVisible(): Promise<boolean> {
    const config = await this.getConfig()
    return config.resultsVisible
  }
}