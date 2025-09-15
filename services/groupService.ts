import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Group } from '@/types'
import { ValidationUtils } from '@/utils/validation'

/**
 * 団体データのサービスクラス
 */
export class GroupService {
  private static readonly COLLECTION_NAME = 'groups'

  /**
   * 全ての団体を取得
   * @returns 団体の配列（order順）
   */
  static async getAllGroups(): Promise<Group[]> {
    try {
      const groupsRef = collection(db, this.COLLECTION_NAME)
      const q = query(groupsRef, orderBy('order', 'asc'))
      const snapshot = await getDocs(q)
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Group))
    } catch (error) {
      console.error('Error fetching groups:', error)
      throw new Error('団体リストの取得に失敗しました')
    }
  }

  /**
   * 指定したIDの団体を取得
   * @param id 団体ID
   * @returns 団体データ、存在しない場合はnull
   */
  static async getGroupById(id: string): Promise<Group | null> {
    if (!id) {
      return null
    }

    try {
      const docRef = doc(db, this.COLLECTION_NAME, id)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        return null
      }
      
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Group
    } catch (error) {
      console.error('Error fetching group:', error)
      throw new Error('団体の取得に失敗しました')
    }
  }

  /**
   * 新しい団体を追加（管理者用）
   * @param name 団体名
   * @returns 作成された団体のID
   */
  static async addGroup(name: string): Promise<string> {
    // バリデーション
    if (!name || name.trim() === '') {
      throw new Error('団体名は必須です')
    }
    
    if (!ValidationUtils.isValidGroupName(name)) {
      throw new Error('団体名は50文字以内で入力してください')
    }

    try {
      // 現在の団体数を取得してorderを決定
      const groupsRef = collection(db, this.COLLECTION_NAME)
      const snapshot = await getDocs(groupsRef)
      const nextOrder = snapshot.size + 1

      // 新しい団体を作成
      const docRef = doc(collection(db, this.COLLECTION_NAME))
      await setDoc(docRef, {
        name: name.trim(),
        order: nextOrder,
        createdAt: serverTimestamp(),
      })
      
      return docRef.id
    } catch (error) {
      console.error('Error adding group:', error)
      throw new Error('団体の追加に失敗しました')
    }
  }

  /**
   * 団体情報を更新（管理者用）
   * @param id 団体ID
   * @param data 更新データ
   */
  static async updateGroup(id: string, data: Partial<Omit<Group, 'id'>>): Promise<void> {
    if (!id) {
      throw new Error('団体IDは必須です')
    }

    // 名前のバリデーション
    if (data.name !== undefined) {
      if (!data.name || data.name.trim() === '') {
        throw new Error('団体名は必須です')
      }
      if (!ValidationUtils.isValidGroupName(data.name)) {
        throw new Error('団体名は50文字以内で入力してください')
      }
    }

    try {
      const docRef = doc(db, this.COLLECTION_NAME, id)
      const updateData: any = { ...data }
      
      // 名前はトリムする
      if (updateData.name) {
        updateData.name = updateData.name.trim()
      }
      
      // 更新日時を追加
      updateData.updatedAt = serverTimestamp()
      
      await updateDoc(docRef, updateData)
    } catch (error) {
      console.error('Error updating group:', error)
      throw new Error('団体の更新に失敗しました')
    }
  }

  /**
   * 団体を削除（管理者用）
   * @param id 団体ID
   */
  static async deleteGroup(id: string): Promise<void> {
    if (!id) {
      throw new Error('団体IDは必須です')
    }

    try {
      // 投票があるかチェック
      const votesRef = collection(db, 'votes')
      const q = query(votesRef, where('groupId', '==', id))
      const votesSnapshot = await getDocs(q)
      
      if (!votesSnapshot.empty) {
        throw new Error('投票がある団体は削除できません')
      }

      // 団体を削除
      const docRef = doc(db, this.COLLECTION_NAME, id)
      await deleteDoc(docRef)
    } catch (error) {
      if (error instanceof Error && error.message === '投票がある団体は削除できません') {
        throw error
      }
      console.error('Error deleting group:', error)
      throw new Error('団体の削除に失敗しました')
    }
  }

  /**
   * 団体の順序を更新（管理者用）
   * @param groupOrders { groupId: order } の形式
   */
  static async updateGroupOrders(groupOrders: Record<string, number>): Promise<void> {
    try {
      const updatePromises = Object.entries(groupOrders).map(([groupId, order]) => {
        const docRef = doc(db, this.COLLECTION_NAME, groupId)
        return updateDoc(docRef, { order })
      })
      
      await Promise.all(updatePromises)
    } catch (error) {
      console.error('Error updating group orders:', error)
      throw new Error('団体の順序更新に失敗しました')
    }
  }
}