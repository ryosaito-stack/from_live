import { ValidationUtils } from '@/utils/validation'

describe('ValidationUtils', () => {
  describe('isValidScore', () => {
    test('1〜5の整数値を有効と判定する', () => {
      expect(ValidationUtils.isValidScore(1)).toBe(true)
      expect(ValidationUtils.isValidScore(2)).toBe(true)
      expect(ValidationUtils.isValidScore(3)).toBe(true)
      expect(ValidationUtils.isValidScore(4)).toBe(true)
      expect(ValidationUtils.isValidScore(5)).toBe(true)
    })

    test('0以下の値を無効と判定する', () => {
      expect(ValidationUtils.isValidScore(0)).toBe(false)
      expect(ValidationUtils.isValidScore(-1)).toBe(false)
      expect(ValidationUtils.isValidScore(-100)).toBe(false)
    })

    test('6以上の値を無効と判定する', () => {
      expect(ValidationUtils.isValidScore(6)).toBe(false)
      expect(ValidationUtils.isValidScore(10)).toBe(false)
      expect(ValidationUtils.isValidScore(100)).toBe(false)
    })

    test('小数値を無効と判定する', () => {
      expect(ValidationUtils.isValidScore(1.5)).toBe(false)
      expect(ValidationUtils.isValidScore(2.1)).toBe(false)
      expect(ValidationUtils.isValidScore(3.9)).toBe(false)
      expect(ValidationUtils.isValidScore(4.99)).toBe(false)
    })

    test('NaN、Infinity、null、undefinedを無効と判定する', () => {
      expect(ValidationUtils.isValidScore(NaN)).toBe(false)
      expect(ValidationUtils.isValidScore(Infinity)).toBe(false)
      expect(ValidationUtils.isValidScore(-Infinity)).toBe(false)
      expect(ValidationUtils.isValidScore(null as any)).toBe(false)
      expect(ValidationUtils.isValidScore(undefined as any)).toBe(false)
    })

    test('文字列の数値を無効と判定する', () => {
      expect(ValidationUtils.isValidScore('3' as any)).toBe(false)
      expect(ValidationUtils.isValidScore('5' as any)).toBe(false)
    })
  })

  describe('isValidGroupName', () => {
    test('通常の団体名を有効と判定する', () => {
      expect(ValidationUtils.isValidGroupName('団体A')).toBe(true)
      expect(ValidationUtils.isValidGroupName('テストグループ123')).toBe(true)
      expect(ValidationUtils.isValidGroupName('Group Name')).toBe(true)
      expect(ValidationUtils.isValidGroupName('あ')).toBe(true) // 1文字
    })

    test('50文字の団体名を有効と判定する', () => {
      const maxLengthName = 'あ'.repeat(50)
      expect(ValidationUtils.isValidGroupName(maxLengthName)).toBe(true)
    })

    test('空文字を無効と判定する', () => {
      expect(ValidationUtils.isValidGroupName('')).toBe(false)
    })

    test('51文字以上の団体名を無効と判定する', () => {
      const tooLongName = 'あ'.repeat(51)
      expect(ValidationUtils.isValidGroupName(tooLongName)).toBe(false)
    })

    test('スペースのみの文字列を無効と判定する', () => {
      expect(ValidationUtils.isValidGroupName(' ')).toBe(false)
      expect(ValidationUtils.isValidGroupName('   ')).toBe(false)
      expect(ValidationUtils.isValidGroupName('\t')).toBe(false)
      expect(ValidationUtils.isValidGroupName('\n')).toBe(false)
    })

    test('前後の空白を除去してから判定する', () => {
      expect(ValidationUtils.isValidGroupName('  団体A  ')).toBe(true)
      expect(ValidationUtils.isValidGroupName('  ')).toBe(false)
    })

    test('null、undefinedを無効と判定する', () => {
      expect(ValidationUtils.isValidGroupName(null as any)).toBe(false)
      expect(ValidationUtils.isValidGroupName(undefined as any)).toBe(false)
    })

    test('特殊文字を含む団体名も有効と判定する', () => {
      expect(ValidationUtils.isValidGroupName('団体★')).toBe(true)
      expect(ValidationUtils.isValidGroupName('Group-A')).toBe(true)
      expect(ValidationUtils.isValidGroupName('グループ（1）')).toBe(true)
    })
  })

  describe('sanitizeString', () => {
    test('通常の文字列はそのまま返す', () => {
      expect(ValidationUtils.sanitizeString('Hello World')).toBe('Hello World')
      expect(ValidationUtils.sanitizeString('こんにちは')).toBe('こんにちは')
      expect(ValidationUtils.sanitizeString('123')).toBe('123')
    })

    test('HTMLタグをエスケープする', () => {
      expect(ValidationUtils.sanitizeString('<script>alert("XSS")</script>'))
        .toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;')
      
      expect(ValidationUtils.sanitizeString('<div>Hello</div>'))
        .toBe('&lt;div&gt;Hello&lt;&#x2F;div&gt;')
      
      expect(ValidationUtils.sanitizeString('<img src="x" onerror="alert(1)">'))
        .toBe('&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;')
    })

    test('特殊文字をエスケープする', () => {
      expect(ValidationUtils.sanitizeString('&')).toBe('&amp;')
      expect(ValidationUtils.sanitizeString('<')).toBe('&lt;')
      expect(ValidationUtils.sanitizeString('>')).toBe('&gt;')
      expect(ValidationUtils.sanitizeString('"')).toBe('&quot;')
      expect(ValidationUtils.sanitizeString("'")).toBe('&#x27;')
      expect(ValidationUtils.sanitizeString('/')).toBe('&#x2F;')
    })

    test('複数の特殊文字を含む文字列を正しくエスケープする', () => {
      expect(ValidationUtils.sanitizeString('Tom & Jerry <friends>'))
        .toBe('Tom &amp; Jerry &lt;friends&gt;')
      
      expect(ValidationUtils.sanitizeString('"Hello" & \'World\''))
        .toBe('&quot;Hello&quot; &amp; &#x27;World&#x27;')
    })

    test('空文字を空文字のまま返す', () => {
      expect(ValidationUtils.sanitizeString('')).toBe('')
    })

    test('null、undefinedを空文字として返す', () => {
      expect(ValidationUtils.sanitizeString(null as any)).toBe('')
      expect(ValidationUtils.sanitizeString(undefined as any)).toBe('')
    })

    test('数値を文字列に変換してから処理する', () => {
      expect(ValidationUtils.sanitizeString(123 as any)).toBe('123')
      expect(ValidationUtils.sanitizeString(0 as any)).toBe('0')
    })
  })

  describe('isValidDeviceId', () => {
    test('有効な端末ID形式を正しく判定する', () => {
      expect(ValidationUtils.isValidDeviceId('device-123e4567-e89b-12d3-a456-426614174000')).toBe(true)
      expect(ValidationUtils.isValidDeviceId('device-550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    })

    test('無効な端末ID形式を正しく判定する', () => {
      expect(ValidationUtils.isValidDeviceId('invalid-uuid')).toBe(false)
      expect(ValidationUtils.isValidDeviceId('123e4567-e89b-12d3-a456-426614174000')).toBe(false)
      expect(ValidationUtils.isValidDeviceId('')).toBe(false)
      expect(ValidationUtils.isValidDeviceId('device-')).toBe(false)
    })
  })

  describe('validateVoteInput', () => {
    test('有効な投票入力を検証する', () => {
      const result = ValidationUtils.validateVoteInput({
        groupId: 'group-1',
        score: 3,
        deviceId: 'device-123e4567-e89b-12d3-a456-426614174000'
      })
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    test('無効なスコアでエラーを返す', () => {
      const result = ValidationUtils.validateVoteInput({
        groupId: 'group-1',
        score: 10,
        deviceId: 'device-123e4567-e89b-12d3-a456-426614174000'
      })
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('点数は1〜5の範囲で入力してください')
    })

    test('空のgroupIdでエラーを返す', () => {
      const result = ValidationUtils.validateVoteInput({
        groupId: '',
        score: 3,
        deviceId: 'device-123e4567-e89b-12d3-a456-426614174000'
      })
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('団体を選択してください')
    })

    test('無効なdeviceIdでエラーを返す', () => {
      const result = ValidationUtils.validateVoteInput({
        groupId: 'group-1',
        score: 3,
        deviceId: 'invalid-device-id'
      })
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('端末IDが不正です')
    })

    test('複数のエラーを同時に検出する', () => {
      const result = ValidationUtils.validateVoteInput({
        groupId: '',
        score: 0,
        deviceId: ''
      })
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(3)
      expect(result.errors).toContain('団体を選択してください')
      expect(result.errors).toContain('点数は1〜5の範囲で入力してください')
      expect(result.errors).toContain('端末IDが不正です')
    })
  })
})