import { VoteHistoryManager } from '@/utils/voteHistory'

describe('VoteHistoryManager', () => {
  beforeEach(() => {
    // localStorage のクリア
    localStorage.clear()
    jest.clearAllMocks()
    // キャッシュをクリア
    VoteHistoryManager.clearCache()
  })

  describe('hasVoted', () => {
    test('未投票の団体に対してfalseを返す', () => {
      expect(VoteHistoryManager.hasVoted('group-1')).toBe(false)
    })

    test('投票済みの団体に対してtrueを返す', () => {
      // 投票を記録
      VoteHistoryManager.recordVote('group-1')
      
      // 投票済みチェック
      expect(VoteHistoryManager.hasVoted('group-1')).toBe(true)
    })

    test('異なる団体への投票は独立している', () => {
      // group-1に投票
      VoteHistoryManager.recordVote('group-1')
      
      // group-1は投票済み、group-2は未投票
      expect(VoteHistoryManager.hasVoted('group-1')).toBe(true)
      expect(VoteHistoryManager.hasVoted('group-2')).toBe(false)
      
      // group-2に投票
      VoteHistoryManager.recordVote('group-2')
      
      // 両方とも投票済み
      expect(VoteHistoryManager.hasVoted('group-1')).toBe(true)
      expect(VoteHistoryManager.hasVoted('group-2')).toBe(true)
    })

    test('空のgroupIdに対してfalseを返す', () => {
      expect(VoteHistoryManager.hasVoted('')).toBe(false)
    })
  })

  describe('recordVote', () => {
    test('投票を記録できる', () => {
      const beforeTime = Date.now()
      
      VoteHistoryManager.recordVote('group-1')
      
      const afterTime = Date.now()
      
      // localStorageに保存されていることを確認
      expect(localStorage.setItem).toHaveBeenCalled()
      
      // 履歴を取得して確認
      const history = VoteHistoryManager.getHistory()
      expect(history).toHaveLength(1)
      expect(history[0].groupId).toBe('group-1')
      expect(history[0].votedAt).toBeGreaterThanOrEqual(beforeTime)
      expect(history[0].votedAt).toBeLessThanOrEqual(afterTime)
    })

    test('複数の投票を記録できる', () => {
      VoteHistoryManager.recordVote('group-1')
      VoteHistoryManager.recordVote('group-2')
      VoteHistoryManager.recordVote('group-3')
      
      const history = VoteHistoryManager.getHistory()
      expect(history).toHaveLength(3)
      expect(history.map(h => h.groupId)).toEqual(['group-1', 'group-2', 'group-3'])
    })

    test('同じ団体への重複投票を防ぐ', () => {
      VoteHistoryManager.recordVote('group-1')
      
      // 2回目の投票試行
      expect(() => {
        VoteHistoryManager.recordVote('group-1')
      }).toThrow('この団体には既に投票済みです')
      
      // 履歴は1件のまま
      const history = VoteHistoryManager.getHistory()
      expect(history).toHaveLength(1)
    })

    test('空のgroupIdで例外を投げる', () => {
      expect(() => {
        VoteHistoryManager.recordVote('')
      }).toThrow('団体IDが指定されていません')
    })
  })

  describe('getHistory', () => {
    test('空の履歴を取得できる', () => {
      const history = VoteHistoryManager.getHistory()
      expect(history).toEqual([])
    })

    test('投票履歴を時系列順で取得できる', () => {
      // 時間をずらして投票
      const now = Date.now()
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(now)
        .mockReturnValueOnce(now + 1000)
        .mockReturnValueOnce(now + 2000)
      
      VoteHistoryManager.recordVote('group-1')
      VoteHistoryManager.recordVote('group-2')
      VoteHistoryManager.recordVote('group-3')
      
      const history = VoteHistoryManager.getHistory()
      
      // 古い順（投票順）に並んでいることを確認
      expect(history[0].votedAt).toBe(now)
      expect(history[1].votedAt).toBe(now + 1000)
      expect(history[2].votedAt).toBe(now + 2000)
    })

    test('localStorageから履歴を復元できる', () => {
      const savedHistory = [
        { groupId: 'group-1', votedAt: 1000 },
        { groupId: 'group-2', votedAt: 2000 },
      ]
      
      ;(localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify(savedHistory)
      )
      
      const history = VoteHistoryManager.getHistory()
      expect(history).toEqual(savedHistory)
    })

    test('不正なJSON形式の履歴がある場合は空配列を返す', () => {
      ;(localStorage.getItem as jest.Mock).mockReturnValue('invalid json')
      
      const history = VoteHistoryManager.getHistory()
      expect(history).toEqual([])
    })
  })

  describe('clearHistory', () => {
    test('投票履歴をクリアできる', () => {
      // 投票を記録
      VoteHistoryManager.recordVote('group-1')
      VoteHistoryManager.recordVote('group-2')
      
      // 履歴があることを確認
      expect(VoteHistoryManager.getHistory()).toHaveLength(2)
      
      // クリア
      VoteHistoryManager.clearHistory()
      
      // 履歴が空になったことを確認
      expect(VoteHistoryManager.getHistory()).toEqual([])
      expect(localStorage.removeItem).toHaveBeenCalledWith('form-live-vote-history')
    })

    test('クリア後は再度投票できる', () => {
      // 投票を記録
      VoteHistoryManager.recordVote('group-1')
      
      // 投票済みであることを確認
      expect(VoteHistoryManager.hasVoted('group-1')).toBe(true)
      
      // クリア
      VoteHistoryManager.clearHistory()
      
      // 再度投票できることを確認
      expect(VoteHistoryManager.hasVoted('group-1')).toBe(false)
      expect(() => {
        VoteHistoryManager.recordVote('group-1')
      }).not.toThrow()
    })
  })

  describe('エラーハンドリング', () => {
    test('localStorageが使用できない場合でも動作する', () => {
      // localStorageのgetItemでエラーを発生させる
      ;(localStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('localStorage is not available')
      })
      
      expect(() => {
        VoteHistoryManager.getHistory()
      }).not.toThrow()
      
      const history = VoteHistoryManager.getHistory()
      expect(history).toEqual([])
    })

    test('setItemが失敗してもエラーメッセージを返す', () => {
      // localStorageのsetItemでエラーを発生させる
      ;(localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Quota exceeded')
      })
      
      expect(() => {
        VoteHistoryManager.recordVote('group-1')
      }).toThrow('投票の保存に失敗しました')
    })
  })
})