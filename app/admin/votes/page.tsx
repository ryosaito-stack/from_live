'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Timestamp } from 'firebase/firestore'
import { AdminService } from '@/services/adminService'
import { Vote } from '@/types'

export default function VotesManagement() {
  const [votes, setVotes] = useState<Vote[]>([])
  const [filteredVotes, setFilteredVotes] = useState<Vote[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [groups, setGroups] = useState<{id: string, name: string}[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [votesData, groupsData] = await Promise.all([
        AdminService.getAllVotes(),
        AdminService.getAllGroups()
      ])
      setVotes(votesData)
      setGroups(groupsData.map(g => ({ id: g.id, name: g.name })))
    } catch (error) {
      console.error('データの取得に失敗しました:', error)
      alert('データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = useCallback(() => {
    let filtered = [...votes]

    // 団体フィルタ
    if (selectedGroup) {
      filtered = filtered.filter(vote => vote.groupId === selectedGroup)
    }

    // 日付フィルタ
    if (startDate) {
      const start = new Date(startDate)
      filtered = filtered.filter(vote => {
        const voteDate = vote.createdAt instanceof Date 
          ? vote.createdAt 
          : vote.createdAt.toDate()
        return voteDate >= start
      })
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      filtered = filtered.filter(vote => {
        const voteDate = vote.createdAt instanceof Date 
          ? vote.createdAt 
          : vote.createdAt.toDate()
        return voteDate <= end
      })
    }

    setFilteredVotes(filtered)
  }, [votes, selectedGroup, startDate, endDate])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const handleDeleteVote = async (vote: Vote) => {
    if (!vote.id) {
      alert('投票IDが見つかりません')
      return
    }

    if (!confirm(`投票を削除しますか？\n団体: ${vote.groupName}\n点数: ${vote.score}`)) {
      return
    }

    try {
      await AdminService.deleteVote(vote.id)
      await loadData()
      alert('投票を削除しました')
    } catch (error) {
      console.error('投票の削除に失敗しました:', error)
      alert('投票の削除に失敗しました')
    }
  }

  const handleExportCSV = async () => {
    try {
      const csv = await AdminService.exportVotesToCSV()
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `votes_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('CSVエクスポートに失敗しました:', error)
      alert('CSVエクスポートに失敗しました')
    }
  }

  const clearFilters = () => {
    setSelectedGroup('')
    setStartDate('')
    setEndDate('')
  }

  const formatDate = (date: Date | Timestamp) => {
    const d = date instanceof Date ? date : date.toDate()
    return d.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
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
            <h1 className="text-2xl font-bold text-gray-900">投票履歴管理</h1>
            <Link href="/admin" className="text-blue-600 hover:text-blue-800 font-medium">
              ダッシュボードへ戻る
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* フィルター */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">フィルター</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  団体
                </label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">全ての団体</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開始日
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  終了日
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={clearFilters}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  クリア
                </button>
                <button
                  onClick={handleExportCSV}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  CSV出力
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 投票履歴一覧 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              投票履歴 ({filteredVotes.length}件 / 全{votes.length}件)
            </h2>
          </div>
          <div className="overflow-hidden">
            {filteredVotes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {votes.length === 0 ? '投票データがありません' : 'フィルター条件に合う投票がありません'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        投票日時
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        団体名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        点数
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        端末ID
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredVotes.map((vote) => (
                      <tr key={vote.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(vote.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {vote.groupName}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {vote.groupId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {vote.score}点
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {vote.deviceId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteVote(vote)}
                            className="text-red-600 hover:text-red-900"
                          >
                            削除
                          </button>
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