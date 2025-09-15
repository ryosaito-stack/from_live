import { DeviceIdManager } from '@/utils/deviceId'
import { v4 as uuidv4 } from 'uuid'

// UUIDライブラリのモック
jest.mock('uuid', () => ({
  v4: jest.fn(),
}))

describe('DeviceIdManager', () => {
  const mockUuid = uuidv4 as jest.MockedFunction<typeof uuidv4>
  
  beforeEach(() => {
    // localStorage のクリア
    localStorage.clear()
    jest.clearAllMocks()
    
    // DeviceIdManagerのキャッシュをクリア
    DeviceIdManager.resetDeviceId()
    
    // デフォルトのUUID値を設定
    mockUuid.mockReturnValue('test-uuid-1234-5678-90ab-cdef')
  })

  describe('getDeviceId', () => {
    test('新規端末IDを生成できる', () => {
      const deviceId = DeviceIdManager.getDeviceId()
      
      expect(deviceId).toBe('device-test-uuid-1234-5678-90ab-cdef')
      expect(mockUuid).toHaveBeenCalledTimes(1)
    })

    test('生成した端末IDをlocalStorageに保存する', () => {
      const deviceId = DeviceIdManager.getDeviceId()
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'form-live-device-id',
        'device-test-uuid-1234-5678-90ab-cdef'
      )
    })

    test('既存の端末IDがある場合は再利用する', () => {
      // 最初の呼び出し
      const deviceId1 = DeviceIdManager.getDeviceId()
      
      // 2回目の呼び出し
      const deviceId2 = DeviceIdManager.getDeviceId()
      
      expect(deviceId1).toBe(deviceId2)
      expect(mockUuid).toHaveBeenCalledTimes(1) // 1回しか生成されない
    })

    test('localStorageから既存の端末IDを取得できる', () => {
      // 事前に端末IDを保存
      const existingId = 'device-550e8400-e29b-41d4-a716-446655440000'
      ;(localStorage.getItem as jest.Mock).mockReturnValueOnce(existingId)
      
      const deviceId = DeviceIdManager.getDeviceId()
      
      expect(deviceId).toBe(existingId)
      expect(mockUuid).not.toHaveBeenCalled() // 新規生成されない
    })

    test('不正な端末IDが保存されていた場合は新規生成する', () => {
      // 不正な形式のIDを設定
      ;(localStorage.getItem as jest.Mock).mockReturnValue('invalid-id-format')
      
      const deviceId = DeviceIdManager.getDeviceId()
      
      expect(deviceId).toBe('device-test-uuid-1234-5678-90ab-cdef')
      expect(mockUuid).toHaveBeenCalledTimes(1)
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'form-live-device-id',
        'device-test-uuid-1234-5678-90ab-cdef'
      )
    })
  })

  describe('isValidDeviceId', () => {
    test('有効な端末ID形式を正しく判定する', () => {
      const validIds = [
        'device-123e4567-e89b-12d3-a456-426614174000',
        'device-550e8400-e29b-41d4-a716-446655440000',
        'device-6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      ]
      
      validIds.forEach(id => {
        expect(DeviceIdManager.isValidDeviceId(id)).toBe(true)
      })
    })

    test('無効な端末ID形式を正しく判定する', () => {
      const invalidIds = [
        'invalid-uuid',
        '123e4567-e89b-12d3-a456-426614174000', // prefixなし
        'device-invalid',
        'device-123',
        '',
        'device-',
        'device-123e4567-e89b-12d3-a456', // 不完全なUUID
      ]
      
      invalidIds.forEach(id => {
        expect(DeviceIdManager.isValidDeviceId(id)).toBe(false)
      })
    })

    test('null/undefinedを正しく判定する', () => {
      expect(DeviceIdManager.isValidDeviceId(null as any)).toBe(false)
      expect(DeviceIdManager.isValidDeviceId(undefined as any)).toBe(false)
    })
  })

  describe('resetDeviceId', () => {
    test('端末IDをリセットできる', () => {
      // 最初にIDを生成
      const originalId = DeviceIdManager.getDeviceId()
      
      // 新しいUUID値を設定
      mockUuid.mockReturnValue('new-uuid-9876-5432-10ab-cdef')
      
      // リセット
      DeviceIdManager.resetDeviceId()
      
      // localStorageがクリアされていることを確認
      expect(localStorage.removeItem).toHaveBeenCalledWith('form-live-device-id')
      
      // 新しいIDが生成されることを確認
      const newId = DeviceIdManager.getDeviceId()
      expect(newId).not.toBe(originalId)
      expect(newId).toBe('device-new-uuid-9876-5432-10ab-cdef')
    })
  })

  describe('エラーハンドリング', () => {
    test('localStorageが使用できない場合でもエラーにならない', () => {
      // localStorageのgetItemでエラーを発生させる
      ;(localStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error('localStorage is not available')
      })
      
      expect(() => {
        DeviceIdManager.getDeviceId()
      }).not.toThrow()
      
      const deviceId = DeviceIdManager.getDeviceId()
      expect(deviceId).toBeTruthy()
      expect(deviceId.startsWith('device-')).toBe(true)
    })

    test('setItemが失敗してもエラーにならない', () => {
      // localStorageのsetItemでエラーを発生させる
      ;(localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Quota exceeded')
      })
      
      expect(() => {
        DeviceIdManager.getDeviceId()
      }).not.toThrow()
      
      const deviceId = DeviceIdManager.getDeviceId()
      expect(deviceId).toBeTruthy()
    })
  })
})