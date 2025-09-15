import { useState, useEffect } from 'react'
import { DeviceIdManager } from '@/utils/deviceId'

/**
 * useDeviceIdフックの返り値
 */
export interface UseDeviceIdReturn {
  deviceId: string
  isNewDevice: boolean
}

/**
 * 端末IDを管理するカスタムフック
 */
export function useDeviceId(): UseDeviceIdReturn {
  const [deviceId, setDeviceId] = useState<string>('')
  const [isNewDevice, setIsNewDevice] = useState<boolean>(false)

  useEffect(() => {
    // 端末IDを取得
    const id = DeviceIdManager.getDeviceId()
    setDeviceId(id)
    
    // 新規端末かどうかをチェック
    // localStorageにIDが保存されていなければ新規
    const savedId = localStorage.getItem('deviceId')
    if (!savedId || savedId !== id) {
      setIsNewDevice(true)
      // 新規の場合は保存
      localStorage.setItem('deviceId', id)
    }
  }, [])

  return {
    deviceId,
    isNewDevice,
  }
}
