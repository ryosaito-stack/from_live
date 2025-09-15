'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AdminService } from '@/services/adminService'
import { AggregationService } from '@/services/aggregationService'

interface Stats {
  totalVotes: number
  totalGroups: number
  votingEnabled: boolean
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [aggregating, setAggregating] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      
      const [allVotes, allGroups, config] = await Promise.all([
        AdminService.getAllVotes(),
        AdminService.getAllGroups(),
        AdminService.getConfig(),
      ])

      setStats({
        totalVotes: allVotes.length,
        totalGroups: allGroups.length,
        votingEnabled: config.votingEnabled,
      })
    } catch (error) {
      console.error('統計情報の取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRunAggregation = async () => {
    if (aggregating) return

    setAggregating(true)
    try {
      console.log('Starting manual aggregation...')
      await AggregationService.batchAggregate()
      alert('集計処理が完了しました！結果画面で確認できます。')
      await loadStats() // 統計情報を再読み込み
    } catch (error) {
      console.error('Aggregation failed:', error)
      alert('集計処理に失敗しました。コンソールを確認してください。')
    } finally {
      setAggregating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">管理者ダッシュボード</h1>
            <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
              投票画面へ戻る
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">総投票数</h3>
            <p className="text-3xl font-bold text-blue-600">{stats?.totalVotes || 0}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">団体数</h3>
            <p className="text-3xl font-bold text-green-600">{stats?.totalGroups || 0}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">投票状態</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              stats?.votingEnabled 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {stats?.votingEnabled ? '有効' : '無効'}
            </span>
          </div>
        </div>

        {/* 集計処理セクション */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">集計処理</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-2">
                  既存の投票データから集計結果を作成します
                </p>
                <p className="text-sm text-gray-500">
                  実行後、結果画面でランキングが表示されます
                </p>
              </div>
              <button
                onClick={handleRunAggregation}
                disabled={aggregating}
                className={`px-6 py-3 rounded-lg font-medium ${
                  aggregating
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white transition-colors`}
              >
                {aggregating ? '処理中...' : '集計実行'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/admin/groups" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">団体管理</h3>
            <p className="text-gray-600">団体の追加・編集・削除</p>
          </Link>

          <Link href="/admin/votes" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">投票履歴</h3>
            <p className="text-gray-600">投票データの確認・管理</p>
          </Link>

          <Link href="/admin/settings" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">システム設定</h3>
            <p className="text-gray-600">投票・表示設定の管理</p>
          </Link>

          <Link href="/results" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">結果表示</h3>
            <p className="text-gray-600">リアルタイム集計結果</p>
          </Link>
        </div>
      </main>
    </div>
  )
}