import { DateUtils } from '@/utils/dateUtils'
import { Timestamp } from 'firebase/firestore'

describe('DateUtils', () => {
  // 固定の日時を使用してテスト
  const fixedDate = new Date('2025-09-15T10:30:00.000Z')
  const fixedTimestamp = Timestamp.fromDate(fixedDate)
  
  beforeEach(() => {
    // 現在時刻を固定
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-09-15T10:35:00.000Z'))
  })
  
  afterEach(() => {
    jest.useRealTimers()
  })

  describe('toDate', () => {
    test('DateオブジェクトをそのままDateとして返す', () => {
      const result = DateUtils.toDate(fixedDate)
      expect(result).toEqual(fixedDate)
      expect(result).toBeInstanceOf(Date)
    })

    test('FirestoreのTimestampをDateに変換できる', () => {
      const result = DateUtils.toDate(fixedTimestamp)
      expect(result).toEqual(fixedDate)
      expect(result).toBeInstanceOf(Date)
    })

    test('nullの場合はnullを返す', () => {
      const result = DateUtils.toDate(null as any)
      expect(result).toBeNull()
    })
  })

  describe('formatDateTime', () => {
    test('日時を「YYYY/MM/DD HH:mm」形式でフォーマットできる', () => {
      const date = new Date('2025-09-15T10:30:00.000Z')
      // JSTで表示される想定（UTC+9）
      const result = DateUtils.formatDateTime(date)
      expect(result).toBe('2025/09/15 19:30')
    })

    test('Timestampも同様にフォーマットできる', () => {
      const result = DateUtils.formatDateTime(fixedTimestamp)
      expect(result).toBe('2025/09/15 19:30')
    })

    test('一桁の月日時分も正しくゼロパディングされる', () => {
      const date = new Date('2025-01-05T01:05:00.000Z')
      const result = DateUtils.formatDateTime(date)
      expect(result).toBe('2025/01/05 10:05')
    })

    test('nullの場合は空文字を返す', () => {
      const result = DateUtils.formatDateTime(null as any)
      expect(result).toBe('')
    })
  })

  describe('getRelativeTime', () => {
    test('1分未満の場合「たった今」と表示', () => {
      const recentDate = new Date('2025-09-15T10:34:30.000Z')
      const result = DateUtils.getRelativeTime(recentDate)
      expect(result).toBe('たった今')
    })

    test('1分前の場合「1分前」と表示', () => {
      const oneMinuteAgo = new Date('2025-09-15T10:34:00.000Z')
      const result = DateUtils.getRelativeTime(oneMinuteAgo)
      expect(result).toBe('1分前')
    })

    test('5分前の場合「5分前」と表示', () => {
      const fiveMinutesAgo = new Date('2025-09-15T10:30:00.000Z')
      const result = DateUtils.getRelativeTime(fiveMinutesAgo)
      expect(result).toBe('5分前')
    })

    test('1時間前の場合「1時間前」と表示', () => {
      const oneHourAgo = new Date('2025-09-15T09:35:00.000Z')
      const result = DateUtils.getRelativeTime(oneHourAgo)
      expect(result).toBe('1時間前')
    })

    test('2時間前の場合「2時間前」と表示', () => {
      const twoHoursAgo = new Date('2025-09-15T08:35:00.000Z')
      const result = DateUtils.getRelativeTime(twoHoursAgo)
      expect(result).toBe('2時間前')
    })

    test('1日前の場合「1日前」と表示', () => {
      const oneDayAgo = new Date('2025-09-14T10:35:00.000Z')
      const result = DateUtils.getRelativeTime(oneDayAgo)
      expect(result).toBe('1日前')
    })

    test('7日以上前の場合は日付を表示', () => {
      const longAgo = new Date('2025-09-01T10:35:00.000Z')
      const result = DateUtils.getRelativeTime(longAgo)
      expect(result).toBe('2025/09/01')
    })

    test('未来の日時の場合「たった今」と表示', () => {
      const futureDate = new Date('2025-09-15T10:40:00.000Z')
      const result = DateUtils.getRelativeTime(futureDate)
      expect(result).toBe('たった今')
    })
  })

  describe('formatUpdateTime', () => {
    test('更新時刻を「最終更新: HH:mm」形式で表示', () => {
      const date = new Date('2025-09-15T10:30:00.000Z')
      const result = DateUtils.formatUpdateTime(date)
      expect(result).toBe('最終更新: 19:30')
    })

    test('Timestampも同様にフォーマットできる', () => {
      const result = DateUtils.formatUpdateTime(fixedTimestamp)
      expect(result).toBe('最終更新: 19:30')
    })

    test('nullの場合は「最終更新: --:--」を返す', () => {
      const result = DateUtils.formatUpdateTime(null as any)
      expect(result).toBe('最終更新: --:--')
    })
  })

  describe('getSecondsUntilNextUpdate', () => {
    test('1分間隔の場合、次の分までの秒数を返す', () => {
      // 現在時刻: 10:35:00
      const result = DateUtils.getSecondsUntilNextUpdate(1)
      expect(result).toBeLessThanOrEqual(60) // 次の10:36:00まで最大60秒
      expect(result).toBeGreaterThan(0)
    })

    test('現在時刻が10:35:30の場合、30秒を返す', () => {
      jest.setSystemTime(new Date('2025-09-15T10:35:30.000Z'))
      const result = DateUtils.getSecondsUntilNextUpdate(1)
      expect(result).toBe(30) // 次の10:36:00まで30秒
    })

    test('5分間隔の場合、次の5分刻みまでの秒数を返す', () => {
      // 現在時刻: 10:35:00 → 次は10:40:00
      const result = DateUtils.getSecondsUntilNextUpdate(5)
      expect(result).toBeLessThanOrEqual(300) // 最大5分 = 300秒
      expect(result).toBeGreaterThan(0)
    })

    test('現在時刻が10:33:00の場合、2分を返す', () => {
      jest.setSystemTime(new Date('2025-09-15T10:33:00.000Z'))
      const result = DateUtils.getSecondsUntilNextUpdate(5)
      expect(result).toBe(120) // 次の10:35:00まで2分
    })

    test('30秒間隔の場合も正しく計算される', () => {
      jest.setSystemTime(new Date('2025-09-15T10:35:15.000Z'))
      const result = DateUtils.getSecondsUntilNextUpdate(0.5)
      expect(result).toBe(15) // 次の10:35:30まで15秒
    })

    test('間隔が0以下の場合は60秒を返す', () => {
      const result1 = DateUtils.getSecondsUntilNextUpdate(0)
      expect(result1).toBe(60)
      
      const result2 = DateUtils.getSecondsUntilNextUpdate(-1)
      expect(result2).toBe(60)
    })
  })

  describe('formatDate', () => {
    test('日付を「YYYY/MM/DD」形式でフォーマットできる', () => {
      const date = new Date('2025-09-15T10:30:00.000Z')
      const result = DateUtils.formatDate(date)
      expect(result).toBe('2025/09/15')
    })

    test('Timestampも同様にフォーマットできる', () => {
      const result = DateUtils.formatDate(fixedTimestamp)
      expect(result).toBe('2025/09/15')
    })

    test('nullの場合は空文字を返す', () => {
      const result = DateUtils.formatDate(null as any)
      expect(result).toBe('')
    })
  })

  describe('formatTime', () => {
    test('時刻を「HH:mm」形式でフォーマットできる', () => {
      const date = new Date('2025-09-15T10:30:00.000Z')
      const result = DateUtils.formatTime(date)
      expect(result).toBe('19:30')
    })

    test('Timestampも同様にフォーマットできる', () => {
      const result = DateUtils.formatTime(fixedTimestamp)
      expect(result).toBe('19:30')
    })

    test('秒を含める場合「HH:mm:ss」形式でフォーマットできる', () => {
      const date = new Date('2025-09-15T10:30:45.000Z')
      const result = DateUtils.formatTime(date, true)
      expect(result).toBe('19:30:45')
    })

    test('nullの場合は空文字を返す', () => {
      const result = DateUtils.formatTime(null as any)
      expect(result).toBe('')
    })
  })
})