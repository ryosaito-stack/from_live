import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
  and,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Vote } from '@/types'
import { GroupService } from './groupService'
import { ValidationUtils } from '@/utils/validation'
import { DeviceIdManager } from '@/utils/deviceId'

export interface VoteInput {
  groupId: string
  score: number
  deviceId: string
}

export interface VoteResult {
  success: boolean
  voteId?: string
  error?: string
}

/**
 * 投票データのサービスクラス
 */
export class VoteService {
  private static readonly COLLECTION_NAME = 'votes'

  /**
   * 指定した端末が指定した団体に投票済みかチェック
   * @param deviceId 端末ID
   * @param groupId 団体ID
   * @returns 投票済みの場合true
   */
  static async hasVoted(deviceId: string, groupId: string): Promise<boolean> {
    if (!deviceId || !groupId) {
      return false
    }

    try {
      const votesRef = collection(db, this.COLLECTION_NAME)
      const q = query(
        votesRef,
        and(
          where('deviceId', '==', deviceId),
          where('groupId', '==', groupId)
        )
      )
      const snapshot = await getDocs(q)
      return !snapshot.empty
    } catch (error) {
      console.error('Error checking vote status:', error)
      return false
    }
  }

  /**
   * 投票を保存
   * @param voteInput 投票データ
   * @returns 作成された投票のID
   */
  static async submitVote(voteInput: VoteInput): Promise<string> {
    // バリデーション
    if (!ValidationUtils.isValidScore(voteInput.score)) {
      throw new Error('点数は1〜5の範囲で入力してください')
    }

    if (!ValidationUtils.isValidDeviceId(voteInput.deviceId)) {
      throw new Error('端末IDが不正です')
    }

    // 団体の存在確認
    const group = await GroupService.getGroupById(voteInput.groupId)
    if (!group) {
      throw new Error('団体が見つかりません')
    }

    // 重複投票チェック
    const alreadyVoted = await this.hasVoted(voteInput.deviceId, voteInput.groupId)
    if (alreadyVoted) {
      throw new Error('この団体には既に投票済みです')
    }

    try {
      const votesRef = collection(db, this.COLLECTION_NAME)
      const docRef = await addDoc(votesRef, {
        groupId: voteInput.groupId,
        groupName: group.name,
        score: voteInput.score,
        deviceId: voteInput.deviceId,
        createdAt: serverTimestamp()
      })
      
      return docRef.id
    } catch (error) {
      console.error('Error submitting vote:', error)
      throw new Error('投票の保存に失敗しました')
    }
  }

  /**
   * 指定した端末の投票履歴を取得
   * @param deviceId 端末ID
   * @returns 投票履歴の配列（新しい順）
   */
  static async getVoteHistory(deviceId: string): Promise<Vote[]> {
    if (!deviceId) {
      return []
    }

    try {
      const votesRef = collection(db, this.COLLECTION_NAME)
      const q = query(
        votesRef,
        where('deviceId', '==', deviceId),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      
      return snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
        } as Vote
      })
    } catch (error) {
      console.error('Error fetching vote history:', error)
      return []
    }
  }

  /**
   * 指定した団体の全投票を取得
   * @param groupId 団体ID
   * @returns 投票の配列
   */
  static async getVotesByGroup(groupId: string): Promise<Vote[]> {
    if (!groupId) {
      return []
    }

    try {
      const votesRef = collection(db, this.COLLECTION_NAME)
      const q = query(votesRef, where('groupId', '==', groupId))
      const snapshot = await getDocs(q)
      
      return snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
        } as Vote
      })
    } catch (error) {
      console.error('Error fetching votes by group:', error)
      return []
    }
  }

  /**
   * トランザクションを使用した投票の検証と保存
   * @param voteInput 投票データ
   * @returns 投票結果
   */
  static async validateAndSaveVote(voteInput: VoteInput): Promise<VoteResult> {
    // バリデーション
    if (!ValidationUtils.isValidScore(voteInput.score)) {
      throw new Error('点数は1〜5の範囲で入力してください')
    }

    if (!ValidationUtils.isValidDeviceId(voteInput.deviceId)) {
      throw new Error('端末IDが不正です')
    }

    // 団体の存在確認
    const group = await GroupService.getGroupById(voteInput.groupId)
    if (!group) {
      throw new Error('団体が見つかりません')
    }

    try {
      const voteId = `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      await runTransaction(db, async (transaction) => {
        // トランザクション内で重複チェック
        const votesRef = collection(db, this.COLLECTION_NAME)
        const q = query(
          votesRef,
          and(
            where('deviceId', '==', voteInput.deviceId),
            where('groupId', '==', voteInput.groupId)
          )
        )
        const snapshot = await getDocs(q)
        
        if (!snapshot.empty) {
          throw new Error('この団体には既に投票済みです')
        }

        // 新しい投票を作成
        const voteDocRef = doc(db, this.COLLECTION_NAME, voteId)
        transaction.set(voteDocRef, {
          groupId: voteInput.groupId,
          groupName: group.name,
          score: voteInput.score,
          deviceId: voteInput.deviceId,
          createdAt: serverTimestamp()
        })
      })

      return {
        success: true,
        voteId
      }
    } catch (error) {
      console.error('Error in transaction:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('投票の保存に失敗しました')
    }
  }

  /**
   * 団体の投票数を取得
   * @param groupId 団体ID
   * @returns 投票数
   */
  static async getVoteCount(groupId: string): Promise<number> {
    if (!groupId) {
      return 0
    }

    try {
      const votesRef = collection(db, this.COLLECTION_NAME)
      const q = query(votesRef, where('groupId', '==', groupId))
      const snapshot = await getDocs(q)
      return snapshot.size
    } catch (error) {
      console.error('Error getting vote count:', error)
      return 0
    }
  }

  /**
   * 団体の合計点を取得
   * @param groupId 団体ID
   * @returns 合計点
   */
  static async getTotalScore(groupId: string): Promise<number> {
    if (!groupId) {
      return 0
    }

    try {
      const votesRef = collection(db, this.COLLECTION_NAME)
      const q = query(votesRef, where('groupId', '==', groupId))
      const snapshot = await getDocs(q)
      
      let totalScore = 0
      snapshot.docs.forEach(doc => {
        const data = doc.data()
        totalScore += data.score || 0
      })
      
      return totalScore
    } catch (error) {
      console.error('Error getting total score:', error)
      return 0
    }
  }

  /**
   * 全ての投票を取得（管理者用）
   * @returns 全投票データ
   */
  static async getAllVotes(): Promise<Vote[]> {
    try {
      const votesRef = collection(db, this.COLLECTION_NAME)
      const q = query(votesRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      
      return snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
        } as Vote
      })
    } catch (error) {
      console.error('Error fetching all votes:', error)
      return []
    }
  }

  /**
   * 期間指定で投票を取得（管理者用）
   * @param startDate 開始日
   * @param endDate 終了日
   * @returns 期間内の投票データ
   */
  static async getVotesByDateRange(startDate: Date, endDate: Date): Promise<Vote[]> {
    try {
      const votesRef = collection(db, this.COLLECTION_NAME)
      const q = query(
        votesRef,
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate),
        orderBy('createdAt', 'desc')
      )
      const snapshot = await getDocs(q)
      
      return snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
        } as Vote
      })
    } catch (error) {
      console.error('Error fetching votes by date range:', error)
      return []
    }
  }

  /**
   * 投票を削除（管理者用）
   * @param voteId 投票ID
   * @returns 削除成功の場合true
   */
  static async deleteVote(voteId: string): Promise<boolean> {
    if (!voteId) {
      return false
    }

    try {
      const voteRef = doc(db, this.COLLECTION_NAME, voteId)
      await deleteDoc(voteRef)
      return true
    } catch (error) {
      console.error('Error deleting vote:', error)
      return false
    }
  }

  /**
   * 全ての投票を削除（管理者用）
   * @returns 削除成功の場合true
   */
  static async deleteAllVotes(): Promise<boolean> {
    try {
      const votesRef = collection(db, this.COLLECTION_NAME)
      const snapshot = await getDocs(votesRef)
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deletePromises)
      
      return true
    } catch (error) {
      console.error('Error deleting all votes:', error)
      return false
    }
  }
}