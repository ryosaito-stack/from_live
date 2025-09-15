import { GroupService } from '@/services/groupService'
import { Group } from '@/types'

// Firestore関数のモック
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  where: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
}))

jest.mock('@/lib/firebase', () => ({
  db: {},
}))

describe('GroupService', () => {
  const mockGroups: Group[] = [
    { id: 'group1', name: '団体A', order: 1, createdAt: new Date() },
    { id: 'group2', name: '団体B', order: 2, createdAt: new Date() },
    { id: 'group3', name: '団体C', order: 3, createdAt: new Date() },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllGroups', () => {
    test('全ての団体を取得できる', async () => {
      const { getDocs, collection, query, orderBy } = require('firebase/firestore')
      
      // モックの設定
      const mockSnapshot = {
        docs: mockGroups.map(group => ({
          id: group.id,
          data: () => ({ name: group.name, order: group.order, createdAt: group.createdAt }),
        })),
      }
      getDocs.mockResolvedValue(mockSnapshot)
      query.mockReturnValue('mock-query')
      orderBy.mockReturnValue('mock-orderBy')
      collection.mockReturnValue('mock-collection')

      const result = await GroupService.getAllGroups()

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual(mockGroups[0])
      expect(collection).toHaveBeenCalledWith(expect.anything(), 'groups')
      expect(orderBy).toHaveBeenCalledWith('order', 'asc')
    })

    test('団体が存在しない場合は空配列を返す', async () => {
      const { getDocs } = require('firebase/firestore')
      
      getDocs.mockResolvedValue({ docs: [] })

      const result = await GroupService.getAllGroups()

      expect(result).toEqual([])
    })

    test('エラーが発生した場合は例外を投げる', async () => {
      const { getDocs } = require('firebase/firestore')
      
      getDocs.mockRejectedValue(new Error('Firestore error'))

      await expect(GroupService.getAllGroups()).rejects.toThrow('団体リストの取得に失敗しました')
    })
  })

  describe('getGroupById', () => {
    test('指定したIDの団体を取得できる', async () => {
      const { getDoc, doc } = require('firebase/firestore')
      
      const mockDoc = {
        exists: () => true,
        id: 'group1',
        data: () => ({ name: '団体A', order: 1, createdAt: mockGroups[0].createdAt }),
      }
      getDoc.mockResolvedValue(mockDoc)
      doc.mockReturnValue('mock-doc-ref')

      const result = await GroupService.getGroupById('group1')

      expect(result).toEqual(mockGroups[0])
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'groups', 'group1')
    })

    test('存在しないIDの場合はnullを返す', async () => {
      const { getDoc } = require('firebase/firestore')
      
      const mockDoc = {
        exists: () => false,
      }
      getDoc.mockResolvedValue(mockDoc)

      const result = await GroupService.getGroupById('nonexistent')

      expect(result).toBeNull()
    })

    test('空のIDを渡した場合はnullを返す', async () => {
      const result = await GroupService.getGroupById('')
      expect(result).toBeNull()
    })
  })

  describe('addGroup', () => {
    test('新しい団体を追加できる', async () => {
      const { setDoc, doc, getDocs, serverTimestamp } = require('firebase/firestore')
      
      // 既存の団体数を返すモック
      getDocs.mockResolvedValue({ size: 3 })
      
      // docのモック
      const mockDocRef = { id: 'new-group-id' }
      doc.mockReturnValue(mockDocRef)
      
      // setDocのモック
      setDoc.mockResolvedValue(undefined)

      const result = await GroupService.addGroup('新団体')

      expect(result).toBe('new-group-id')
      expect(setDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          name: '新団体',
          order: 4, // 既存3つ + 1
        })
      )
    })

    test('空の名前では追加できない', async () => {
      await expect(GroupService.addGroup('')).rejects.toThrow('団体名は必須です')
    })

    test('50文字を超える名前では追加できない', async () => {
      const longName = 'あ'.repeat(51)
      await expect(GroupService.addGroup(longName)).rejects.toThrow('団体名は50文字以内で入力してください')
    })
  })

  describe('updateGroup', () => {
    test('団体情報を更新できる', async () => {
      const { updateDoc, doc } = require('firebase/firestore')
      
      const mockDocRef = { id: 'group1' }
      doc.mockReturnValue(mockDocRef)
      updateDoc.mockResolvedValue(undefined)

      await GroupService.updateGroup('group1', { name: '更新後の団体名' })

      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          name: '更新後の団体名',
        })
      )
    })

    test('空のIDでは更新できない', async () => {
      await expect(GroupService.updateGroup('', { name: 'test' })).rejects.toThrow('団体IDは必須です')
    })
  })

  describe('deleteGroup', () => {
    test('団体を削除できる', async () => {
      const { deleteDoc, doc, getDocs, query, where } = require('firebase/firestore')
      
      // 投票がないことを確認するモック
      getDocs.mockResolvedValue({ empty: true })
      
      const mockDocRef = { id: 'group1' }
      doc.mockReturnValue(mockDocRef)
      deleteDoc.mockResolvedValue(undefined)

      await GroupService.deleteGroup('group1')

      expect(deleteDoc).toHaveBeenCalledWith(mockDocRef)
    })

    test('投票がある団体は削除できない', async () => {
      const { getDocs } = require('firebase/firestore')
      
      // 投票があることを示すモック
      getDocs.mockResolvedValue({ empty: false })

      await expect(GroupService.deleteGroup('group1')).rejects.toThrow('投票がある団体は削除できません')
    })

    test('空のIDでは削除できない', async () => {
      await expect(GroupService.deleteGroup('')).rejects.toThrow('団体IDは必須です')
    })
  })
})