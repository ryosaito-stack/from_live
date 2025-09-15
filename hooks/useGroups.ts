import { useState, useEffect, useCallback } from 'react'
import { Group } from '@/types'
import { GroupService } from '@/services/groupService'

/**
 * useGroupsフックの返り値
 */
export interface UseGroupsReturn {
  groups: Group[]
  loading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * 団体リストを取得し管理するカスタムフック
 */
export function useGroups(): UseGroupsReturn {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await GroupService.getAllGroups()
      setGroups(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('団体リストの取得に失敗しました')
      setError(error)
      console.error('Error fetching groups:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const refetch = useCallback(() => {
    fetchGroups()
  }, [fetchGroups])

  return {
    groups,
    loading,
    error,
    refetch,
  }
}
