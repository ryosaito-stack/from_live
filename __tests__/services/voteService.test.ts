import { VoteService } from '@/services/voteService'
import { Vote } from '@/types'
import { ErrorCode } from '@/types/errors'

// Firestore関数のモック
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  addDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  and: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  runTransaction: jest.fn(),
  Timestamp: class {
    toDate() {
      return new Date()
    }
  },
}))

jest.mock('@/lib/firebase', () => ({
  db: {},
}))

// GroupServiceのモック
jest.mock('@/services/groupService', () => ({
  GroupService: {
    getGroupById: jest.fn(),
  },
}))

describe('VoteService', () => {
  const mockVote: Vote = {
    id: 'vote1',
    groupId: 'group1',
    groupName: '団体A',
    score: 4,
    deviceId: 'device-123',
    createdAt: new Date(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('hasVoted', () => {
    test('投票済みの場合はtrueを返す', async () => {
      const { getDocs, query, where, and } = require('firebase/firestore')
      
      // 投票が存在することを示すモック
      getDocs.mockResolvedValue({ empty: false })
      query.mockReturnValue('mock-query')
      where.mockReturnValue('mock-where')
      and.mockReturnValue('mock-and')

      const result = await VoteService.hasVoted('device-123', 'group1')

      expect(result).toBe(true)
      expect(where).toHaveBeenCalledWith('deviceId', '==', 'device-123')
      expect(where).toHaveBeenCalledWith('groupId', '==', 'group1')
    })

    test('未投票の場合はfalseを返す', async () => {
      const { getDocs } = require('firebase/firestore')
      
      // 投票が存在しないことを示すモック
      getDocs.mockResolvedValue({ empty: true })

      const result = await VoteService.hasVoted('device-123', 'group1')

      expect(result).toBe(false)
    })

    test('パラメータが空の場合はfalseを返す', async () => {
      const result1 = await VoteService.hasVoted('', 'group1')
      const result2 = await VoteService.hasVoted('device-123', '')
      
      expect(result1).toBe(false)
      expect(result2).toBe(false)
    })
  })

  describe('submitVote', () => {
    test('有効な投票を保存できる', async () => {
      const { addDoc, collection, serverTimestamp } = require('firebase/firestore')
      const { GroupService } = require('@/services/groupService')
      
      // 団体が存在することを示すモック
      GroupService.getGroupById.mockResolvedValue({
        id: 'group1',
        name: '団体A',
      })
      
      // hasVotedのモック（未投票）
      const { getDocs } = require('firebase/firestore')
      getDocs.mockResolvedValue({ empty: true })
      
      // addDocのモック
      const mockDocRef = { id: 'new-vote-id' }
      addDoc.mockResolvedValue(mockDocRef)
      collection.mockReturnValue('mock-collection')

      const voteInput = {
        groupId: 'group1',
        score: 4,
        deviceId: 'device-123',
      }

      const result = await VoteService.submitVote(voteInput)

      expect(result).toBe('new-vote-id')
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          groupId: 'group1',
          groupName: '団体A',
          score: 4,
          deviceId: 'device-123',
        })
      )
    })

    test('重複投票の場合はエラーを投げる', async () => {
      const { getDocs } = require('firebase/firestore')
      
      // 投票済みを示すモック
      getDocs.mockResolvedValue({ empty: false })

      const voteInput = {
        groupId: 'group1',
        score: 4,
        deviceId: 'device-123',
      }

      await expect(VoteService.submitVote(voteInput)).rejects.toThrow('この団体には既に投票済みです')
    })

    test('存在しない団体への投票はエラーを投げる', async () => {
      const { GroupService } = require('@/services/groupService')
      
      // 団体が存在しないことを示すモック
      GroupService.getGroupById.mockResolvedValue(null)

      const voteInput = {
        groupId: 'nonexistent',
        score: 4,
        deviceId: 'device-123',
      }

      await expect(VoteService.submitVote(voteInput)).rejects.toThrow('団体が見つかりません')
    })

    test('無効なスコアの場合はエラーを投げる', async () => {
      const voteInput = {
        groupId: 'group1',
        score: 10, // 無効なスコア
        deviceId: 'device-123',
      }

      await expect(VoteService.submitVote(voteInput)).rejects.toThrow('点数は1〜5の範囲で入力してください')
    })

    test('無効なdeviceIdの場合はエラーを投げる', async () => {
      const voteInput = {
        groupId: 'group1',
        score: 4,
        deviceId: 'invalid-device', // 無効な形式
      }

      await expect(VoteService.submitVote(voteInput)).rejects.toThrow('端末IDが不正です')
    })
  })

  describe('getVoteHistory', () => {
    test('指定したデバイスの投票履歴を取得できる', async () => {
      const { getDocs, query, where, orderBy, collection } = require('firebase/firestore')
      
      const mockSnapshot = {
        docs: [
          {
            id: 'vote1',
            data: () => ({
              groupId: 'group1',
              groupName: '団体A',
              score: 4,
              deviceId: 'device-123',
              createdAt: { toDate: () => new Date('2025-01-01') },
            }),
          },
          {
            id: 'vote2',
            data: () => ({
              groupId: 'group2',
              groupName: '団体B',
              score: 5,
              deviceId: 'device-123',
              createdAt: { toDate: () => new Date('2025-01-02') },
            }),
          },
        ],
      }
      getDocs.mockResolvedValue(mockSnapshot)
      collection.mockReturnValue('mock-collection')
      query.mockReturnValue('mock-query')
      where.mockReturnValue('mock-where')
      orderBy.mockReturnValue('mock-orderBy')

      const result = await VoteService.getVoteHistory('device-123')

      expect(result).toHaveLength(2)
      expect(result[0].groupName).toBe('団体A')
      expect(where).toHaveBeenCalledWith('deviceId', '==', 'device-123')
      expect(orderBy).toHaveBeenCalledWith('createdAt', 'desc')
    })

    test('投票履歴がない場合は空配列を返す', async () => {
      const { getDocs } = require('firebase/firestore')
      
      getDocs.mockResolvedValue({ docs: [] })

      const result = await VoteService.getVoteHistory('device-123')

      expect(result).toEqual([])
    })

    test('空のdeviceIdの場合は空配列を返す', async () => {
      const result = await VoteService.getVoteHistory('')
      expect(result).toEqual([])
    })
  })

  describe('getVotesByGroup', () => {
    test('指定した団体の全投票を取得できる', async () => {
      const { getDocs, query, where, collection } = require('firebase/firestore')
      
      const mockSnapshot = {
        docs: [
          {
            id: 'vote1',
            data: () => ({
              groupId: 'group1',
              score: 4,
              deviceId: 'device-123',
              createdAt: { toDate: () => new Date() },
            }),
          },
          {
            id: 'vote2',
            data: () => ({
              groupId: 'group1',
              score: 5,
              deviceId: 'device-456',
              createdAt: { toDate: () => new Date() },
            }),
          },
        ],
      }
      getDocs.mockResolvedValue(mockSnapshot)
      collection.mockReturnValue('mock-collection')
      query.mockReturnValue('mock-query')
      where.mockReturnValue('mock-where')

      const result = await VoteService.getVotesByGroup('group1')

      expect(result).toHaveLength(2)
      expect(where).toHaveBeenCalledWith('groupId', '==', 'group1')
    })
  })

  describe('validateAndSaveVote', () => {
    test('トランザクションで投票を保存できる', async () => {
      const { runTransaction, getDocs, collection, query, where, and, doc } = require('firebase/firestore')
      const { GroupService } = require('@/services/groupService')
      
      // 団体が存在することを示すモック
      GroupService.getGroupById.mockResolvedValue({
        id: 'group1',
        name: '団体A',
      })
      
      // getDocsのモック（未投票）
      getDocs.mockResolvedValue({ empty: true })
      collection.mockReturnValue('mock-collection')
      query.mockReturnValue('mock-query')
      where.mockReturnValue('mock-where')
      and.mockReturnValue('mock-and')
      doc.mockReturnValue('mock-doc')
      
      // トランザクションのモック
      runTransaction.mockImplementation(async (_db, callback) => {
        const mockTransaction = {
          set: jest.fn(),
        }
        return callback(mockTransaction)
      })

      const voteInput = {
        groupId: 'group1',
        score: 4,
        deviceId: 'device-123',
      }

      const result = await VoteService.validateAndSaveVote(voteInput)

      expect(result.success).toBe(true)
      expect(result.voteId).toBeTruthy()
      expect(runTransaction).toHaveBeenCalled()
    })

    test('トランザクション内で重複投票を検出できる', async () => {
      const { runTransaction, getDocs, collection, query, where, and } = require('firebase/firestore')
      const { GroupService } = require('@/services/groupService')
      
      // 団体が存在することを示すモック
      GroupService.getGroupById.mockResolvedValue({
        id: 'group1',
        name: '団体A',
      })
      
      // getDocsのモック（投票済み）
      getDocs.mockResolvedValue({ empty: false })
      collection.mockReturnValue('mock-collection')
      query.mockReturnValue('mock-query')
      where.mockReturnValue('mock-where')
      and.mockReturnValue('mock-and')
      
      // トランザクションのモック（投票済み）
      runTransaction.mockImplementation(async (_db, callback) => {
        const mockTransaction = {
          set: jest.fn(),
        }
        try {
          await callback(mockTransaction)
        } catch (error) {
          throw error
        }
      })

      const voteInput = {
        groupId: 'group1',
        score: 4,
        deviceId: 'device-123',
      }

      await expect(VoteService.validateAndSaveVote(voteInput)).rejects.toThrow('この団体には既に投票済みです')
    })
  })

  describe('getVoteCount', () => {
    test('団体の投票数を取得できる', async () => {
      const { getDocs } = require('firebase/firestore')
      
      getDocs.mockResolvedValue({ size: 42 })

      const result = await VoteService.getVoteCount('group1')

      expect(result).toBe(42)
    })

    test('投票がない場合は0を返す', async () => {
      const { getDocs } = require('firebase/firestore')
      
      getDocs.mockResolvedValue({ size: 0 })

      const result = await VoteService.getVoteCount('group1')

      expect(result).toBe(0)
    })
  })

  describe('getTotalScore', () => {
    test('団体の合計点を計算できる', async () => {
      const { getDocs } = require('firebase/firestore')
      
      const mockSnapshot = {
        docs: [
          { data: () => ({ score: 4 }) },
          { data: () => ({ score: 5 }) },
          { data: () => ({ score: 3 }) },
        ],
      }
      getDocs.mockResolvedValue(mockSnapshot)

      const result = await VoteService.getTotalScore('group1')

      expect(result).toBe(12) // 4 + 5 + 3
    })

    test('投票がない場合は0を返す', async () => {
      const { getDocs } = require('firebase/firestore')
      
      getDocs.mockResolvedValue({ docs: [] })

      const result = await VoteService.getTotalScore('group1')

      expect(result).toBe(0)
    })
  })
})