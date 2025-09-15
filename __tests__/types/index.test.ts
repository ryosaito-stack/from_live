import { isVote, isGroup, isResult, isConfig } from '@/types'
import { Timestamp } from 'firebase/firestore'

describe('型定義のテスト', () => {
  describe('Vote型', () => {
    test('必須フィールドが全て存在する場合、isVoteがtrueを返す', () => {
      const validVote = {
        groupId: 'group-1',
        score: 3,
        deviceId: 'device-123',
        createdAt: new Date(),
      }
      expect(isVote(validVote)).toBe(true)
    })

    test('Timestampも有効な日付として受け入れる', () => {
      const validVote = {
        groupId: 'group-1',
        score: 5,
        deviceId: 'device-123',
        createdAt: Timestamp.now(),
      }
      expect(isVote(validVote)).toBe(true)
    })

    test('必須フィールドが欠けている場合、isVoteがfalseを返す', () => {
      const invalidVotes = [
        { score: 3, deviceId: 'device-123', createdAt: new Date() }, // groupId欠如
        { groupId: 'group-1', deviceId: 'device-123', createdAt: new Date() }, // score欠如
        { groupId: 'group-1', score: 3, createdAt: new Date() }, // deviceId欠如
        { groupId: 'group-1', score: 3, deviceId: 'device-123' }, // createdAt欠如
      ]

      invalidVotes.forEach(invalidVote => {
        expect(isVote(invalidVote)).toBe(false)
      })
    })

    test('スコアが数値でない場合、isVoteがfalseを返す', () => {
      const invalidVote = {
        groupId: 'group-1',
        score: '3', // 文字列
        deviceId: 'device-123',
        createdAt: new Date(),
      }
      expect(isVote(invalidVote)).toBe(false)
    })

    test('スコアが1-5の範囲外の場合、isVoteがfalseを返す', () => {
      const invalidScores = [0, 6, -1, 10, 0.5, 3.5]
      
      invalidScores.forEach(score => {
        const vote = {
          groupId: 'group-1',
          score,
          deviceId: 'device-123',
          createdAt: new Date(),
        }
        expect(isVote(vote)).toBe(false)
      })
    })
  })

  describe('Group型', () => {
    test('必須フィールドが存在する場合、isGroupがtrueを返す', () => {
      const validGroup = {
        id: 'group-1',
        name: '団体A',
      }
      expect(isGroup(validGroup)).toBe(true)
    })

    test('オプションフィールドも含む場合、isGroupがtrueを返す', () => {
      const validGroup = {
        id: 'group-1',
        name: '団体A',
        order: 1,
        createdAt: new Date(),
      }
      expect(isGroup(validGroup)).toBe(true)
    })

    test('必須フィールドが欠けている場合、isGroupがfalseを返す', () => {
      const invalidGroups = [
        { name: '団体A' }, // id欠如
        { id: 'group-1' }, // name欠如
        {}, // 両方欠如
      ]

      invalidGroups.forEach(invalidGroup => {
        expect(isGroup(invalidGroup)).toBe(false)
      })
    })

    test('nameが空文字の場合、isGroupがfalseを返す', () => {
      const invalidGroup = {
        id: 'group-1',
        name: '',
      }
      expect(isGroup(invalidGroup)).toBe(false)
    })
  })

  describe('Result型', () => {
    test('必須フィールドが全て存在する場合、isResultがtrueを返す', () => {
      const validResult = {
        groupId: 'group-1',
        groupName: '団体A',
        totalScore: 42,
        voteCount: 10,
        averageScore: 4.2,
        rank: 1,
        updatedAt: new Date(),
      }
      expect(isResult(validResult)).toBe(true)
    })

    test('totalScoreが0の場合もisResultがtrueを返す', () => {
      const validResult = {
        groupId: 'group-1',
        groupName: '団体A',
        totalScore: 0,
        voteCount: 0,
        averageScore: 0,
        rank: 5,
        updatedAt: new Date(),
      }
      expect(isResult(validResult)).toBe(true)
    })

    test('必須フィールドが欠けている場合、isResultがfalseを返す', () => {
      const invalidResult = {
        groupId: 'group-1',
        groupName: '団体A',
        totalScore: 42,
        // voteCount欠如
        averageScore: 4.2,
        rank: 1,
        updatedAt: new Date(),
      }
      expect(isResult(invalidResult)).toBe(false)
    })

    test('rankが0以下の場合、isResultがfalseを返す', () => {
      const invalidResult = {
        groupId: 'group-1',
        groupName: '団体A',
        totalScore: 42,
        voteCount: 10,
        averageScore: 4.2,
        rank: 0,
        updatedAt: new Date(),
      }
      expect(isResult(invalidResult)).toBe(false)
    })
  })

  describe('Config型', () => {
    test('必須フィールドが存在する場合、isConfigがtrueを返す', () => {
      const validConfig = {
        votingEnabled: true,
        resultsVisible: true,
        updateInterval: 60,
      }
      expect(isConfig(validConfig)).toBe(true)
    })

    test('全フィールドが存在する場合、isConfigがtrueを返す', () => {
      const validConfig = {
        id: 'settings',
        currentGroup: '団体A',
        votingEnabled: false,
        resultsVisible: true,
        updateInterval: 30,
        updatedAt: new Date(),
      }
      expect(isConfig(validConfig)).toBe(true)
    })

    test('必須フィールドが欠けている場合、isConfigがfalseを返す', () => {
      const invalidConfigs = [
        { resultsVisible: true, updateInterval: 60 }, // votingEnabled欠如
        { votingEnabled: true, updateInterval: 60 }, // resultsVisible欠如
        { votingEnabled: true, resultsVisible: true }, // updateInterval欠如
      ]

      invalidConfigs.forEach(invalidConfig => {
        expect(isConfig(invalidConfig)).toBe(false)
      })
    })

    test('updateIntervalが0以下の場合、isConfigがfalseを返す', () => {
      const invalidConfig = {
        votingEnabled: true,
        resultsVisible: true,
        updateInterval: 0,
      }
      expect(isConfig(invalidConfig)).toBe(false)
    })
  })

  describe('型ガード関数の境界値テスト', () => {
    test('null/undefinedの場合、全ての型ガードがfalseを返す', () => {
      expect(isVote(null)).toBe(false)
      expect(isVote(undefined)).toBe(false)
      expect(isGroup(null)).toBe(false)
      expect(isGroup(undefined)).toBe(false)
      expect(isResult(null)).toBe(false)
      expect(isResult(undefined)).toBe(false)
      expect(isConfig(null)).toBe(false)
      expect(isConfig(undefined)).toBe(false)
    })

    test('空オブジェクトの場合、全ての型ガードがfalseを返す', () => {
      expect(isVote({})).toBe(false)
      expect(isGroup({})).toBe(false)
      expect(isResult({})).toBe(false)
      expect(isConfig({})).toBe(false)
    })

    test('配列の場合、全ての型ガードがfalseを返す', () => {
      expect(isVote([])).toBe(false)
      expect(isGroup([])).toBe(false)
      expect(isResult([])).toBe(false)
      expect(isConfig([])).toBe(false)
    })
  })
})