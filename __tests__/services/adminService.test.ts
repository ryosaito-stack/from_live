import { AdminService } from '@/services/adminService'
import { VoteService } from '@/services/voteService'
import { GroupService } from '@/services/groupService'
import { ConfigService } from '@/services/configService'
import { Vote, Group } from '@/types'

// モック
jest.mock('@/services/voteService')
jest.mock('@/services/groupService')
jest.mock('@/services/configService')

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
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

describe('AdminService', () => {
  const mockVotes: Vote[] = [
    {
      id: 'vote1',
      groupId: 'group1',
      groupName: '団体A',
      score: 5,
      deviceId: 'device-123',
      createdAt: new Date('2025-01-15T10:00:00'),
    },
    {
      id: 'vote2',
      groupId: 'group2',
      groupName: '団体B',
      score: 4,
      deviceId: 'device-456',
      createdAt: new Date('2025-01-15T11:00:00'),
    },
  ]

  const mockGroups: Group[] = [
    { id: 'group1', name: '団体A' },
    { id: 'group2', name: '団体B' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('投票履歴管理', () => {
    test('全投票履歴を取得できる', async () => {
      const mockVoteService = VoteService as jest.Mocked<typeof VoteService>
      mockVoteService.getAllVotes.mockResolvedValue(mockVotes)

      const result = await AdminService.getAllVotes()

      expect(result).toEqual(mockVotes)
      expect(mockVoteService.getAllVotes).toHaveBeenCalled()
    })

    test('投票履歴を期間でフィルタリングできる', async () => {
      const mockVoteService = VoteService as jest.Mocked<typeof VoteService>
      mockVoteService.getVotesByDateRange.mockResolvedValue([mockVotes[0]])

      const startDate = new Date('2025-01-15')
      const endDate = new Date('2025-01-16')
      const result = await AdminService.getVotesByDateRange(startDate, endDate)

      expect(result).toHaveLength(1)
      expect(mockVoteService.getVotesByDateRange).toHaveBeenCalledWith(startDate, endDate)
    })

    test('団体別の投票履歴を取得できる', async () => {
      const mockVoteService = VoteService as jest.Mocked<typeof VoteService>
      mockVoteService.getVotesByGroup.mockResolvedValue([mockVotes[0]])

      const result = await AdminService.getVotesByGroup('group1')

      expect(result).toHaveLength(1)
      expect(result[0].groupId).toBe('group1')
    })

    test('投票を削除できる', async () => {
      const mockVoteService = VoteService as jest.Mocked<typeof VoteService>
      mockVoteService.deleteVote.mockResolvedValue(true)

      const result = await AdminService.deleteVote('vote1')

      expect(result).toBe(true)
      expect(mockVoteService.deleteVote).toHaveBeenCalledWith('vote1')
    })
  })

  describe('団体管理', () => {
    test('新しい団体を追加できる', async () => {
      const mockGroupService = GroupService as jest.Mocked<typeof GroupService>
      mockGroupService.addGroup.mockResolvedValue('group3')

      const result = await AdminService.createGroup('団体C')

      expect(result).toBe('group3')
      expect(mockGroupService.addGroup).toHaveBeenCalledWith('団体C')
    })

    test('団体情報を更新できる', async () => {
      const mockGroupService = GroupService as jest.Mocked<typeof GroupService>
      mockGroupService.updateGroup.mockResolvedValue(true)

      const result = await AdminService.updateGroup('group1', '団体A（更新）')

      expect(result).toBe(true)
      expect(mockGroupService.updateGroup).toHaveBeenCalledWith('group1', { name: '団体A（更新）' })
    })

    test('団体を削除できる', async () => {
      const mockGroupService = GroupService as jest.Mocked<typeof GroupService>
      const mockVoteService = VoteService as jest.Mocked<typeof VoteService>
      
      mockVoteService.getVotesByGroup.mockResolvedValue([])
      mockGroupService.deleteGroup.mockResolvedValue(true)

      const result = await AdminService.deleteGroup('group1')

      expect(result).toBe(true)
      expect(mockGroupService.deleteGroup).toHaveBeenCalledWith('group1')
    })

    test('投票がある団体は削除できない', async () => {
      const mockVoteService = VoteService as jest.Mocked<typeof VoteService>
      mockVoteService.getVotesByGroup.mockResolvedValue(mockVotes)

      await expect(AdminService.deleteGroup('group1'))
        .rejects.toThrow('投票データが存在する団体は削除できません')
    })

    test('団体一覧を取得できる', async () => {
      const mockGroupService = GroupService as jest.Mocked<typeof GroupService>
      mockGroupService.getAllGroups.mockResolvedValue(mockGroups)

      const result = await AdminService.getAllGroups()

      expect(result).toEqual(mockGroups)
    })
  })

  describe('設定管理', () => {
    test('現在の設定を取得できる', async () => {
      const mockConfigService = ConfigService as jest.Mocked<typeof ConfigService>
      mockConfigService.getConfig.mockResolvedValue({
        currentGroup: 'group1',
        votingEnabled: true,
        resultsVisible: true,
        updateInterval: 60,
      })

      const result = await AdminService.getConfig()

      expect(result.currentGroup).toBe('group1')
      expect(result.votingEnabled).toBe(true)
    })

    test('設定を更新できる', async () => {
      const mockConfigService = ConfigService as jest.Mocked<typeof ConfigService>
      mockConfigService.updateConfig.mockResolvedValue(true)

      const newConfig = {
        votingEnabled: false,
        resultsVisible: true,
      }
      const result = await AdminService.updateConfig(newConfig)

      expect(result).toBe(true)
      expect(mockConfigService.updateConfig).toHaveBeenCalledWith(newConfig)
    })

    test('投票の有効/無効を切り替えできる', async () => {
      const mockConfigService = ConfigService as jest.Mocked<typeof ConfigService>
      mockConfigService.setVotingEnabled.mockResolvedValue(true)

      const result = await AdminService.toggleVoting(false)

      expect(result).toBe(true)
      expect(mockConfigService.setVotingEnabled).toHaveBeenCalledWith(false)
    })
  })

  describe('データエクスポート', () => {
    test('投票データをCSV形式でエクスポートできる', async () => {
      const mockVoteService = VoteService as jest.Mocked<typeof VoteService>
      mockVoteService.getAllVotes.mockResolvedValue(mockVotes)

      const result = await AdminService.exportVotesToCSV()

      expect(result).toContain('groupId,groupName,score,deviceId,createdAt')
      expect(result).toContain('group1,団体A,5,device-123')
      expect(result).toContain('group2,団体B,4,device-456')
    })
  })

  describe('バルク操作', () => {
    test('全投票データをリセットできる', async () => {
      const mockVoteService = VoteService as jest.Mocked<typeof VoteService>
      mockVoteService.deleteAllVotes.mockResolvedValue(true)

      const result = await AdminService.resetAllVotes()

      expect(result).toBe(true)
      expect(mockVoteService.deleteAllVotes).toHaveBeenCalled()
    })

    test('複数の団体を一括追加できる', async () => {
      const mockGroupService = GroupService as jest.Mocked<typeof GroupService>
      mockGroupService.addGroup.mockResolvedValue('new-group-id')

      const groupNames = ['団体D', '団体E', '団体F']
      const result = await AdminService.bulkCreateGroups(groupNames)

      expect(result).toHaveLength(3)
      expect(mockGroupService.addGroup).toHaveBeenCalledTimes(3)
    })
  })
})