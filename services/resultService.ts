import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Result } from '@/types'

/**
 * 集計結果のサービスクラス
 */
export class ResultService {
  private static readonly COLLECTION_NAME = 'results'

  /**
   * 全ての集計結果を取得
   * @returns 結果の配列（ランク順）
   */
  static async getAllResults(): Promise<Result[]> {
    try {
      const resultsRef = collection(db, this.COLLECTION_NAME)
      const q = query(resultsRef, orderBy('rank', 'asc'))
      const snapshot = await getDocs(q)
      
      return snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
        } as Result
      })
    } catch (error) {
      console.error('Error fetching results:', error)
      throw new Error('集計結果の取得に失敗しました')
    }
  }

  /**
   * 特定の団体の集計結果を取得
   * @param groupId 団体ID
   * @returns 結果データ、存在しない場合はnull
   */
  static async getResultByGroup(groupId: string): Promise<Result | null> {
    if (!groupId) {
      return null
    }

    try {
      const docRef = doc(db, this.COLLECTION_NAME, groupId)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        return null
      }
      
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt
      } as Result
    } catch (error) {
      console.error('Error fetching result:', error)
      throw new Error('結果の取得に失敗しました')
    }
  }

  /**
   * 集計結果を更新
   * @param groupId 団体ID
   * @param data 更新データ
   */
  static async updateResult(groupId: string, data: Partial<Result>): Promise<void> {
    if (!groupId) {
      throw new Error('団体IDは必須です')
    }

    try {
      const docRef = doc(db, this.COLLECTION_NAME, groupId)
      await setDoc(docRef, {
        ...data,
        groupId,
        updatedAt: serverTimestamp(),
      }, { merge: true })
    } catch (error) {
      console.error('Error updating result:', error)
      throw new Error('結果の更新に失敗しました')
    }
  }

  /**
   * ランキングを計算
   * @param results 結果の配列
   * @returns ランク付きの結果配列
   */
  static calculateRanking(results: Result[]): Result[] {
    if (results.length === 0) {
      return []
    }

    // 平均スコアでソート（降順）
    const sorted = [...results].sort((a, b) => b.averageScore - a.averageScore)
    
    // ランク付け
    let currentRank = 1
    let previousScore = sorted[0].averageScore
    
    return sorted.map((result, index) => {
      if (index > 0 && result.averageScore < previousScore) {
        currentRank = index + 1
      }
      previousScore = result.averageScore
      
      return {
        ...result,
        rank: currentRank,
      }
    })
  }

  /**
   * 結果をキャッシュに保存
   * @param results 保存する結果の配列
   */
  static async cacheResults(results: Result[]): Promise<void> {
    if (results.length === 0) {
      return
    }

    try {
      const promises = results.map(result => {
        const docRef = doc(db, this.COLLECTION_NAME, result.groupId)
        return setDoc(docRef, {
          ...result,
          updatedAt: serverTimestamp(),
        }, { merge: true })
      })
      
      await Promise.all(promises)
    } catch (error) {
      console.error('Error caching results:', error)
      throw new Error('結果のキャッシュ保存に失敗しました')
    }
  }

  /**
   * 最新の更新時刻を取得
   * @returns 最新更新時刻、データがない場合はnull
   */
  static async getLatestUpdateTime(): Promise<Date | null> {
    try {
      const resultsRef = collection(db, this.COLLECTION_NAME)
      const snapshot = await getDocs(resultsRef)
      
      if (snapshot.docs.length === 0) {
        return null
      }
      
      let latestTime: Date | null = null
      
      snapshot.docs.forEach(doc => {
        const data = doc.data()
        const updatedAt = data.updatedAt instanceof Timestamp 
          ? data.updatedAt.toDate() 
          : data.updatedAt
        
        if (!latestTime || (updatedAt && updatedAt > latestTime)) {
          latestTime = updatedAt
        }
      })
      
      return latestTime
    } catch (error) {
      console.error('Error fetching latest update time:', error)
      return null
    }
  }
}
