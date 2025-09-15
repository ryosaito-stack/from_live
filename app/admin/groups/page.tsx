'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AdminService } from '@/services/adminService'
import { Group } from '@/types'

export default function GroupsManagement() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [newGroupName, setNewGroupName] = useState('')
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      setLoading(true)
      const groupsData = await AdminService.getAllGroups()
      setGroups(groupsData)
    } catch (error) {
      console.error('団体データの取得に失敗しました:', error)
      alert('団体データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) return

    try {
      await AdminService.createGroup(newGroupName.trim())
      setNewGroupName('')
      await loadGroups()
      alert('団体を追加しました')
    } catch (error) {
      console.error('団体の追加に失敗しました:', error)
      alert('団体の追加に失敗しました')
    }
  }

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGroup || !editName.trim()) return

    try {
      await AdminService.updateGroup(editingGroup.id, editName.trim())
      setEditingGroup(null)
      setEditName('')
      await loadGroups()
      alert('団体情報を更新しました')
    } catch (error) {
      console.error('団体の更新に失敗しました:', error)
      alert('団体の更新に失敗しました')
    }
  }

  const handleDeleteGroup = async (group: Group) => {
    if (!confirm(`「${group.name}」を削除しますか？この操作は取り消せません。`)) {
      return
    }

    try {
      await AdminService.deleteGroup(group.id)
      await loadGroups()
      alert('団体を削除しました')
    } catch (error) {
      console.error('団体の削除に失敗しました:', error)
      alert('団体の削除に失敗しました（投票データが存在する可能性があります）')
    }
  }

  const startEdit = (group: Group) => {
    setEditingGroup(group)
    setEditName(group.name)
  }

  const cancelEdit = () => {
    setEditingGroup(null)
    setEditName('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">団体管理</h1>
            <Link href="/admin" className="text-blue-600 hover:text-blue-800 font-medium">
              ダッシュボードへ戻る
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 新規追加フォーム */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">新しい団体を追加</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleAddGroup} className="flex gap-4">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="団体名を入力"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
              >
                追加
              </button>
            </form>
          </div>
        </div>

        {/* 団体一覧 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              団体一覧 ({groups.length}件)
            </h2>
          </div>
          <div className="overflow-hidden">
            {groups.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                登録されている団体がありません
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        団体名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {groups.map((group) => (
                      <tr key={group.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingGroup?.id === group.id ? (
                            <form onSubmit={handleEditGroup} className="flex gap-2">
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                              />
                              <button
                                type="submit"
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                              >
                                保存
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm"
                              >
                                キャンセル
                              </button>
                            </form>
                          ) : (
                            <div className="text-sm font-medium text-gray-900">
                              {group.name}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {group.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {editingGroup?.id === group.id ? null : (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => startEdit(group)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                編集
                              </button>
                              <button
                                onClick={() => handleDeleteGroup(group)}
                                className="text-red-600 hover:text-red-900"
                              >
                                削除
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}