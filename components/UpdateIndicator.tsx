'use client'

import { useEffect, useState } from 'react'

interface UpdateIndicatorProps {
  lastUpdated: Date | null
  isUpdating: boolean
  updateInterval: number // ミリ秒
}

export function UpdateIndicator({ lastUpdated, isUpdating, updateInterval }: UpdateIndicatorProps) {
  const [nextUpdateIn, setNextUpdateIn] = useState<number>(0)

  useEffect(() => {
    if (!lastUpdated) return

    const calculateTimeToNextUpdate = () => {
      const now = Date.now()
      const lastUpdateTime = lastUpdated.getTime()
      const timeSinceLastUpdate = now - lastUpdateTime
      const timeToNext = Math.max(0, updateInterval - timeSinceLastUpdate)
      setNextUpdateIn(Math.ceil(timeToNext / 1000)) // 秒単位に変換
    }

    calculateTimeToNextUpdate()
    const interval = setInterval(calculateTimeToNextUpdate, 1000)

    return () => clearInterval(interval)
  }, [lastUpdated, updateInterval])

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return 'まもなく'
    if (seconds < 60) return `${seconds}秒後`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}分${remainingSeconds}秒後`
  }

  return (
    <div className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg">
      <div className="flex items-center space-x-4">
        {lastUpdated && (
          <div className="text-sm text-gray-600">
            最終更新: {lastUpdated.toLocaleTimeString('ja-JP')}
          </div>
        )}
        {!isUpdating && (
          <div className="text-sm text-gray-600">
            次回更新: {formatTime(nextUpdateIn)}
          </div>
        )}
      </div>
      {isUpdating && (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-blue-600">更新中...</span>
        </div>
      )}
    </div>
  )
}