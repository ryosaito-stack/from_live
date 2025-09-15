import { ResultService } from '@/services/resultService'
import { Result } from '@/types'

// Firestore関数のモック
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  Timestamp: class {
    toDate() {
      return new Date()
    }
  },
}))

jest.mock('@/lib/firebase', () => ({
  db: {},
}))

describe('ResultService', () => {
  const mockResults: Result[] = [
    {
      id: 'result1',
      groupId: 'group1',
      groupName: '団体A',
      totalScore: 45,
      voteCount: 10,
      averageScore: 4.5,
      rank: 1,
      updatedAt: new Date('2025-01-15T10:00:00'),
    },
    {
      id: 'result2',
      groupId: 'group2',
      groupName: '団体B',
      totalScore: 35,
      voteCount: 8,
      averageScore: 4.375,
      rank: 2,
      updatedAt: new Date('2025-01-15T10:00:00'),
    },
    {
      id: 'result3',
      groupId: 'group3',
      groupName: '団体C',
      totalScore: 30,
      voteCount: 7,
      averageScore: 4.286,
      rank: 3,
      updatedAt: new Date('2025-01-15T10:00:00'),
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getAllResults', () => {
    test('全ての集計結果を取得できる', async () => {
      const { getDocs, collection, query, orderBy } = require('firebase/firestore')
      
      const mockSnapshot = {
        docs: mockResults.map(result => ({
          id: result.id,
          data: () => ({
            groupId: result.groupId,
            groupName: result.groupName,
            totalScore: result.totalScore,
            voteCount: result.voteCount,
            averageScore: result.averageScore,
            rank: result.rank,
            updatedAt: result.updatedAt,
          }),
        })),
      }
      getDocs.mockResolvedValue(mockSnapshot)
      query.mockReturnValue('mock-query')
      orderBy.mockReturnValue('mock-orderBy')
      collection.mockReturnValue('mock-collection')

      const results = await ResultService.getAllResults()

      expect(results).toHaveLength(3)
      expect(results[0].rank).toBe(1)
      expect(results[0].groupName).toBe('団体A')
      expect(orderBy).toHaveBeenCalledWith('rank', 'asc')
    })

    test('結果が存在しない場合は空配列を返す', async () => {
      const { getDocs } = require('firebase/firestore')
      
      getDocs.mockResolvedValue({ docs: [] })

      const results = await ResultService.getAllResults()

      expect(results).toEqual([])
    })

    test('エラーが発生した場合は例外を投げる', async () => {
      const { getDocs } = require('firebase/firestore')
      
      getDocs.mockRejectedValue(new Error('Firestore error'))

      await expect(ResultService.getAllResults()).rejects.toThrow('集計結果の取得に失敗しました')
    })
  })

  describe('getResultByGroup', () => {
    test('指定した団体の結果を取得できる', async () => {
      const { getDoc, doc } = require('firebase/firestore')
      
      const mockDoc = {
        exists: () => true,
        id: 'result1',
        data: () => ({
          groupId: 'group1',
          groupName: '団体A',
          totalScore: 45,
          voteCount: 10,
          averageScore: 4.5,
          rank: 1,
          updatedAt: new Date('2025-01-15T10:00:00'),
        }),
      }
      getDoc.mockResolvedValue(mockDoc)
      doc.mockReturnValue('mock-doc-ref')

      const result = await ResultService.getResultByGroup('group1')

      expect(result).toEqual(mockResults[0])
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'results', 'group1')
    })

    test('存在しない団体の場合はnullを返す', async () => {
      const { getDoc } = require('firebase/firestore')
      
      const mockDoc = {
        exists: () => false,
      }
      getDoc.mockResolvedValue(mockDoc)

      const result = await ResultService.getResultByGroup('nonexistent')

      expect(result).toBeNull()
    })

    test('空のIDを渡した場合はnullを返す', async () => {
      const result = await ResultService.getResultByGroup('')
      expect(result).toBeNull()
    })
  })

  describe('updateResult', () => {
    test('結果を更新できる', async () => {
      const { setDoc, doc, serverTimestamp } = require('firebase/firestore')
      
      const mockDocRef = { id: 'group1' }
      doc.mockReturnValue(mockDocRef)
      setDoc.mockResolvedValue(undefined)

      const updateData = {
        totalScore: 50,
        voteCount: 11,
        averageScore: 4.545,
      }

      await ResultService.updateResult('group1', updateData)

      expect(setDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          ...updateData,
          groupId: 'group1',
          updatedAt: expect.any(Date),
        }),
        { merge: true }
      )
    })

    test('空のIDでは更新できない', async () => {
      await expect(ResultService.updateResult('', {})).rejects.toThrow('団体IDは必須です')
    })
  })

  describe('calculateRanking', () => {
    test('平均スコアでランキングを計算できる', () => {
      const unrankedResults: Result[] = [
        { ...mockResults[1], rank: 0 }, // 平均 4.375
        { ...mockResults[0], rank: 0 }, // 平均 4.5
        { ...mockResults[2], rank: 0 }, // 平均 4.286
      ]

      const rankedResults = ResultService.calculateRanking(unrankedResults)

      expect(rankedResults[0].groupName).toBe('団体A')
      expect(rankedResults[0].rank).toBe(1)
      expect(rankedResults[1].groupName).toBe('団体B')
      expect(rankedResults[1].rank).toBe(2)
      expect(rankedResults[2].groupName).toBe('団体C')
      expect(rankedResults[2].rank).toBe(3)
    })

    test('同点の場合は同順位にする', () => {
      const unrankedResults: Result[] = [
        { ...mockResults[0], averageScore: 4.5, rank: 0 },
        { ...mockResults[1], averageScore: 4.5, rank: 0 }, // 同点
        { ...mockResults[2], averageScore: 4.0, rank: 0 },
      ]

      const rankedResults = ResultService.calculateRanking(unrankedResults)

      expect(rankedResults[0].rank).toBe(1)
      expect(rankedResults[1].rank).toBe(1) // 同順位
      expect(rankedResults[2].rank).toBe(3) // 2人が1位なので3位
    })

    test('空の配列を渡した場合は空の配列を返す', () => {
      const rankedResults = ResultService.calculateRanking([])
      expect(rankedResults).toEqual([])
    })
  })

  describe('cacheResults', () => {
    test('結果をキャッシュに保存できる', async () => {
      const { setDoc, doc } = require('firebase/firestore')
      
      doc.mockReturnValue('mock-doc-ref')
      setDoc.mockResolvedValue(undefined)

      await ResultService.cacheResults(mockResults)

      expect(setDoc).toHaveBeenCalledTimes(3)
      
      // 各結果が保存されることを確認
      mockResults.forEach((result) => {
        expect(doc).toHaveBeenCalledWith(
          expect.anything(),
          'results',
          result.groupId
        )
      })
    })

    test('空の配列を渡してもエラーにならない', async () => {
      const { setDoc } = require('firebase/firestore')
      
      await ResultService.cacheResults([])

      expect(setDoc).not.toHaveBeenCalled()
    })
  })

  describe('getLatestUpdateTime', () => {
    test('最新の更新時刻を取得できる', async () => {
      const { getDocs } = require('firebase/firestore')
      
      const mockSnapshot = {
        docs: mockResults.map(result => ({
          data: () => ({
            updatedAt: result.updatedAt,
          }),
        })),
      }
      getDocs.mockResolvedValue(mockSnapshot)

      const latestTime = await ResultService.getLatestUpdateTime()

      expect(latestTime).toEqual(new Date('2025-01-15T10:00:00'))
    })

    test('結果がない場合はnullを返す', async () => {
      const { getDocs } = require('firebase/firestore')
      
      getDocs.mockResolvedValue({ docs: [] })

      const latestTime = await ResultService.getLatestUpdateTime()

      expect(latestTime).toBeNull()
    })
  })
})
