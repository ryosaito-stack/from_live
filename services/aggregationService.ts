import { Vote, Group, Result } from '@/types'
import { VoteService } from './voteService'
import { GroupService } from './groupService'
import { ResultService } from './resultService'

export interface AggregationResult {
  groupId: string
  groupName: string
  totalScore: number
  voteCount: number
  averageScore: number
}

/**
 * 集計処理のサービスクラス
 */
export class AggregationService {
  /**
   * 全団体の投票を集計
   * @returns 集計結果の配列
   */
  static async aggregateAllVotes(): Promise<AggregationResult[]> {
    try {
      const groups = await GroupService.getAllGroups()
      
      if (groups.length === 0) {
        return []
      }

      const results: AggregationResult[] = []

      for (const group of groups) {
        const result = await this.aggregateGroupVotes(group.id, group.name)
        results.push(result)
      }

      return results
    } catch (error) {
      console.error('Error aggregating all votes:', error)
      throw new Error('全団体の集計に失敗しました')
    }
  }

  /**
   * 特定団体の投票を集計
   * @param groupId 団体ID
   * @param groupName 団体名
   * @returns 集計結果
   */
  static async aggregateGroupVotes(groupId: string, groupName: string): Promise<AggregationResult> {
    try {
      const votes = await VoteService.getVotesByGroup(groupId)
      
      const totalScore = votes.reduce((sum, vote) => sum + vote.score, 0)
      const voteCount = votes.length
      const averageScore = this.calculateAverageScore(votes)

      return {
        groupId,
        groupName,
        totalScore,
        voteCount,
        averageScore,
      }
    } catch (error) {
      console.error(`Error aggregating votes for group ${groupId}:`, error)
      throw new Error(`団体${groupName}の集計に失敗しました`)
    }
  }

  /**
   * 平均点を計算
   * @param votes 投票データの配列
   * @returns 平均点（小数点以下2桁）
   */
  static calculateAverageScore(votes: Vote[]): number {
    if (votes.length === 0) {
      return 0
    }

    const total = votes.reduce((sum, vote) => sum + vote.score, 0)
    const average = total / votes.length
    
    // 小数点以下2桁に丸める
    return Math.round(average * 100) / 100
  }

  /**
   * 投票数をカウント
   * @param votes 投票データの配列
   * @returns 投票数
   */
  static countVotes(votes: Vote[]): number {
    return votes.length
  }

  /**
   * バッチ集計処理
   * 全団体の投票を集計し、ランキングを計算してキャッシュに保存
   */
  static async batchAggregate(): Promise<void> {
    try {
      // 全団体の集計を実行
      const aggregationResults = await this.aggregateAllVotes()

      // 集計結果をResult型に変換
      const results: Result[] = aggregationResults.map(ar => ({
        groupId: ar.groupId,
        groupName: ar.groupName,
        totalScore: ar.totalScore,
        voteCount: ar.voteCount,
        averageScore: ar.averageScore,
        rank: 0, // ランキングは次のステップで計算
        updatedAt: new Date(),
      }))

      // ランキングを計算
      const rankedResults = ResultService.calculateRanking(results)

      // 結果をキャッシュに保存
      await ResultService.cacheResults(rankedResults)

      console.log(`Batch aggregation completed: ${rankedResults.length} groups processed`)
    } catch (error) {
      console.error('Batch aggregation failed:', error)
      throw new Error('集計処理に失敗しました')
    }
  }
}