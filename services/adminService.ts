import { VoteService } from './voteService'
import { GroupService } from './groupService'
import { ConfigService } from './configService'
import { Vote, Group } from '@/types'

export interface Config {
  currentGroup?: string
  votingEnabled: boolean
  resultsVisible: boolean
  updateInterval: number
}

/**
 * 管理者機能のサービスクラス
 */
export class AdminService {
  /**
   * 投票履歴管理
   */
  
  /**
   * 全投票履歴を取得
   * @returns 全投票データ
   */
  static async getAllVotes(): Promise<Vote[]> {
    try {
      return await VoteService.getAllVotes()
    } catch (error) {
      console.error('Error fetching all votes:', error)
      throw new Error('投票履歴の取得に失敗しました')
    }
  }

  /**
   * 期間指定で投票履歴を取得
   * @param startDate 開始日
   * @param endDate 終了日
   * @returns 期間内の投票データ
   */
  static async getVotesByDateRange(startDate: Date, endDate: Date): Promise<Vote[]> {
    try {
      return await VoteService.getVotesByDateRange(startDate, endDate)
    } catch (error) {
      console.error('Error fetching votes by date range:', error)
      throw new Error('期間指定での投票履歴取得に失敗しました')
    }
  }

  /**
   * 団体別の投票履歴を取得
   * @param groupId 団体ID
   * @returns 団体の投票データ
   */
  static async getVotesByGroup(groupId: string): Promise<Vote[]> {
    try {
      return await VoteService.getVotesByGroup(groupId)
    } catch (error) {
      console.error('Error fetching votes by group:', error)
      throw new Error('団体別投票履歴の取得に失敗しました')
    }
  }

  /**
   * 投票を削除
   * @param voteId 投票ID
   * @returns 削除成功の場合true
   */
  static async deleteVote(voteId: string): Promise<boolean> {
    try {
      return await VoteService.deleteVote(voteId)
    } catch (error) {
      console.error('Error deleting vote:', error)
      throw new Error('投票の削除に失敗しました')
    }
  }

  /**
   * 団体管理
   */
  
  /**
   * 新しい団体を作成
   * @param name 団体名
   * @returns 作成された団体のID
   */
  static async createGroup(name: string): Promise<string> {
    try {
      return await GroupService.addGroup(name)
    } catch (error) {
      console.error('Error creating group:', error)
      throw new Error('団体の作成に失敗しました')
    }
  }

  /**
   * 団体情報を更新
   * @param groupId 団体ID
   * @param name 新しい団体名
   * @returns 更新成功の場合true
   */
  static async updateGroup(groupId: string, name: string): Promise<boolean> {
    try {
      await GroupService.updateGroup(groupId, { name })
      return true
    } catch (error) {
      console.error('Error updating group:', error)
      throw new Error('団体の更新に失敗しました')
    }
  }

  /**
   * 団体を削除
   * @param groupId 団体ID
   * @returns 削除成功の場合true
   */
  static async deleteGroup(groupId: string): Promise<boolean> {
    try {
      // 投票データが存在する場合は削除不可
      const votes = await VoteService.getVotesByGroup(groupId)
      if (votes.length > 0) {
        throw new Error('投票データが存在する団体は削除できません')
      }

      await GroupService.deleteGroup(groupId)
      return true
    } catch (error) {
      if (error instanceof Error && error.message === '投票データが存在する団体は削除できません') {
        throw error
      }
      console.error('Error deleting group:', error)
      throw new Error('団体の削除に失敗しました')
    }
  }

  /**
   * 全団体を取得
   * @returns 団体の配列
   */
  static async getAllGroups(): Promise<Group[]> {
    try {
      return await GroupService.getAllGroups()
    } catch (error) {
      console.error('Error fetching all groups:', error)
      throw new Error('団体一覧の取得に失敗しました')
    }
  }

  /**
   * 設定管理
   */
  
  /**
   * 現在の設定を取得
   * @returns 設定オブジェクト
   */
  static async getConfig(): Promise<Config> {
    try {
      return await ConfigService.getConfig()
    } catch (error) {
      console.error('Error fetching config:', error)
      throw new Error('設定の取得に失敗しました')
    }
  }

  /**
   * 設定を更新
   * @param config 更新する設定
   * @returns 更新成功の場合true
   */
  static async updateConfig(config: Partial<Config>): Promise<boolean> {
    try {
      return await ConfigService.updateConfig(config)
    } catch (error) {
      console.error('Error updating config:', error)
      throw new Error('設定の更新に失敗しました')
    }
  }

  /**
   * 投票の有効/無効を切り替え
   * @param enabled 有効/無効
   * @returns 更新成功の場合true
   */
  static async toggleVoting(enabled: boolean): Promise<boolean> {
    try {
      return await ConfigService.setVotingEnabled(enabled)
    } catch (error) {
      console.error('Error toggling voting:', error)
      throw new Error('投票設定の変更に失敗しました')
    }
  }

  /**
   * データエクスポート
   */
  
  /**
   * 投票データをCSV形式でエクスポート
   * @returns CSV文字列
   */
  static async exportVotesToCSV(): Promise<string> {
    try {
      const votes = await VoteService.getAllVotes()
      
      if (votes.length === 0) {
        return 'groupId,groupName,score,deviceId,createdAt\n'
      }

      const header = 'groupId,groupName,score,deviceId,createdAt'
      const rows = votes.map(vote => {
        const createdAt = vote.createdAt instanceof Date 
          ? vote.createdAt.toISOString() 
          : vote.createdAt.toDate().toISOString()
        return `${vote.groupId},${vote.groupName},${vote.score},${vote.deviceId},${createdAt}`
      })

      return [header, ...rows].join('\n')
    } catch (error) {
      console.error('Error exporting votes to CSV:', error)
      throw new Error('投票データのエクスポートに失敗しました')
    }
  }

  /**
   * バルク操作
   */
  
  /**
   * 全投票データをリセット
   * @returns リセット成功の場合true
   */
  static async resetAllVotes(): Promise<boolean> {
    try {
      return await VoteService.deleteAllVotes()
    } catch (error) {
      console.error('Error resetting all votes:', error)
      throw new Error('投票データのリセットに失敗しました')
    }
  }

  /**
   * 複数の団体を一括作成
   * @param groupNames 団体名の配列
   * @returns 作成された団体IDの配列
   */
  static async bulkCreateGroups(groupNames: string[]): Promise<string[]> {
    try {
      const createdIds: string[] = []
      
      for (const name of groupNames) {
        const id = await GroupService.addGroup(name)
        createdIds.push(id)
      }

      return createdIds
    } catch (error) {
      console.error('Error bulk creating groups:', error)
      throw new Error('団体の一括作成に失敗しました')
    }
  }
}