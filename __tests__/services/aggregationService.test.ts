import { AggregationService } from '@/services/aggregationService'
import { Vote, Group, Result } from '@/types'
import { VoteService } from '@/services/voteService'
import { GroupService } from '@/services/groupService'
import { ResultService } from '@/services/resultService'

jest.mock('@/services/voteService')
jest.mock('@/services/groupService')
jest.mock('@/services/resultService')

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
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

describe('AggregationService', () => {
  const mockGroups: Group[] = [
    { id: 'group1', name: '団体A' },
    { id: 'group2', name: '団体B' },
    { id: 'group3', name: '団体C' },
  ]

  const mockVotes: Vote[] = [
    {
      id: 'vote1',
      groupId: 'group1',
      groupName: '団体A',
      score: 5,
      deviceId: 'device1',
      createdAt: new Date('2025-01-15T10:00:00'),
    },
    {
      id: 'vote2',
      groupId: 'group1',
      groupName: '団体A',
      score: 4,
      deviceId: 'device2',
      createdAt: new Date('2025-01-15T10:01:00'),
    },
    {
      id: 'vote3',
      groupId: 'group1',
      groupName: '団体A',
      score: 5,
      deviceId: 'device3',
      createdAt: new Date('2025-01-15T10:02:00'),
    },
    {
      id: 'vote4',
      groupId: 'group2',
      groupName: '団体B',
      score: 4,
      deviceId: 'device1',
      createdAt: new Date('2025-01-15T10:03:00'),
    },
    {
      id: 'vote5',
      groupId: 'group2',
      groupName: '団体B',
      score: 3,
      deviceId: 'device4',
      createdAt: new Date('2025-01-15T10:04:00'),
    },
    {
      id: 'vote6',
      groupId: 'group3',
      groupName: '団体C',
      score: 5,
      deviceId: 'device1',
      createdAt: new Date('2025-01-15T10:05:00'),
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('aggregateAllVotes', () => {
    test('全団体の投票を集計できる', async () => {
      const mockGroupService = GroupService as jest.Mocked<typeof GroupService>
      const mockVoteService = VoteService as jest.Mocked<typeof VoteService>
      
      mockGroupService.getAllGroups.mockResolvedValue(mockGroups)
      mockVoteService.getVotesByGroup.mockImplementation(async (groupId) => {
        return mockVotes.filter(v => v.groupId === groupId)
      })

      const results = await AggregationService.aggregateAllVotes()

      expect(results).toHaveLength(3)
      
      const group1Result = results.find(r => r.groupId === 'group1')
      expect(group1Result).toEqual(expect.objectContaining({
        groupId: 'group1',
        groupName: '団体A',
        totalScore: 14,
        voteCount: 3,
        averageScore: 4.67,
      }))

      const group2Result = results.find(r => r.groupId === 'group2')
      expect(group2Result).toEqual(expect.objectContaining({
        groupId: 'group2',
        groupName: '団体B',
        totalScore: 7,
        voteCount: 2,
        averageScore: 3.5,
      }))

      const group3Result = results.find(r => r.groupId === 'group3')
      expect(group3Result).toEqual(expect.objectContaining({
        groupId: 'group3',
        groupName: '団体C',
        totalScore: 5,
        voteCount: 1,
        averageScore: 5,
      }))
    })

    test('投票がない団体も0点で集計される', async () => {
      const mockGroupService = GroupService as jest.Mocked<typeof GroupService>
      const mockVoteService = VoteService as jest.Mocked<typeof VoteService>
      
      mockGroupService.getAllGroups.mockResolvedValue(mockGroups)
      mockVoteService.getVotesByGroup.mockResolvedValue([])

      const results = await AggregationService.aggregateAllVotes()

      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(result.totalScore).toBe(0)
        expect(result.voteCount).toBe(0)
        expect(result.averageScore).toBe(0)
      })
    })

    test('団体がない場合は空配列を返す', async () => {
      const mockGroupService = GroupService as jest.Mocked<typeof GroupService>
      mockGroupService.getAllGroups.mockResolvedValue([])

      const results = await AggregationService.aggregateAllVotes()

      expect(results).toEqual([])
    })
  })

  describe('aggregateGroupVotes', () => {
    test('特定団体の投票を集計できる', async () => {
      const mockVoteService = VoteService as jest.Mocked<typeof VoteService>
      const group1Votes = mockVotes.filter(v => v.groupId === 'group1')
      mockVoteService.getVotesByGroup.mockResolvedValue(group1Votes)

      const result = await AggregationService.aggregateGroupVotes('group1', '団体A')

      expect(result).toEqual(expect.objectContaining({
        groupId: 'group1',
        groupName: '団体A',
        totalScore: 14,
        voteCount: 3,
        averageScore: 4.67,
      }))
    })

    test('投票がない場合は0を返す', async () => {
      const mockVoteService = VoteService as jest.Mocked<typeof VoteService>
      mockVoteService.getVotesByGroup.mockResolvedValue([])

      const result = await AggregationService.aggregateGroupVotes('group1', '団体A')

      expect(result).toEqual(expect.objectContaining({
        groupId: 'group1',
        groupName: '団体A',
        totalScore: 0,
        voteCount: 0,
        averageScore: 0,
      }))
    })
  })

  describe('calculateAverageScore', () => {
    test('平均点を計算できる', () => {
      const votes = mockVotes.filter(v => v.groupId === 'group1')
      const average = AggregationService.calculateAverageScore(votes)

      expect(average).toBeCloseTo(14 / 3, 2)
    })

    test('投票がない場合は0を返す', () => {
      const average = AggregationService.calculateAverageScore([])

      expect(average).toBe(0)
    })

    test('小数点以下2桁に丸める', () => {
      const votes: Vote[] = [
        { ...mockVotes[0], score: 5 },
        { ...mockVotes[1], score: 4 },
        { ...mockVotes[2], score: 4 },
      ]
      const average = AggregationService.calculateAverageScore(votes)

      expect(average).toBe(4.33)
    })
  })

  describe('countVotes', () => {
    test('投票数をカウントできる', () => {
      const votes = mockVotes.filter(v => v.groupId === 'group1')
      const count = AggregationService.countVotes(votes)

      expect(count).toBe(3)
    })

    test('空配列の場合は0を返す', () => {
      const count = AggregationService.countVotes([])

      expect(count).toBe(0)
    })
  })

  describe('batchAggregate', () => {
    test('バッチ集計処理を実行できる', async () => {
      const mockGroupService = GroupService as jest.Mocked<typeof GroupService>
      const mockVoteService = VoteService as jest.Mocked<typeof VoteService>
      const mockResultService = ResultService as jest.Mocked<typeof ResultService>
      
      mockGroupService.getAllGroups.mockResolvedValue(mockGroups)
      mockVoteService.getVotesByGroup.mockImplementation(async (groupId) => {
        return mockVotes.filter(v => v.groupId === groupId)
      })
      mockResultService.calculateRanking.mockImplementation((results) => {
        return results.map((r, i) => ({ ...r, rank: i + 1 }))
      })
      mockResultService.cacheResults.mockResolvedValue(undefined)

      await AggregationService.batchAggregate()

      expect(mockGroupService.getAllGroups).toHaveBeenCalled()
      expect(mockVoteService.getVotesByGroup).toHaveBeenCalledTimes(3)
      expect(mockResultService.calculateRanking).toHaveBeenCalled()
      expect(mockResultService.cacheResults).toHaveBeenCalled()
    })

    test('エラーが発生した場合は例外を投げる', async () => {
      const mockGroupService = GroupService as jest.Mocked<typeof GroupService>
      mockGroupService.getAllGroups.mockRejectedValue(new Error('Database error'))

      await expect(AggregationService.batchAggregate()).rejects.toThrow('集計処理に失敗しました')
    })
  })
})