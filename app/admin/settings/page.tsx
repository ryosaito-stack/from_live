'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AdminService, Config } from '@/services/adminService'

export default function SettingsManagement() {
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updateInterval, setUpdateInterval] = useState<number>(60)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const configData = await AdminService.getConfig()
      setConfig(configData)
      setUpdateInterval(configData.updateInterval)
    } catch (error) {
      console.error('設定の取得に失敗しました:', error)
      alert('設定の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleVoting = async () => {
    if (!config) return

    try {
      setSaving(true)
      await AdminService.toggleVoting(!config.votingEnabled)
      setConfig(prev => prev ? { ...prev, votingEnabled: !prev.votingEnabled } : null)
      alert('投票設定を更新しました')
    } catch (error) {
      console.error('投票設定の更新に失敗しました:', error)
      alert('投票設定の更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateInterval = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (updateInterval < 10) {
      alert('更新間隔は10秒以上で設定してください')
      return
    }

    try {
      setSaving(true)
      await AdminService.updateConfig({ updateInterval })
      setConfig(prev => prev ? { ...prev, updateInterval } : null)
      alert('更新間隔を更新しました')
    } catch (error) {
      console.error('更新間隔の更新に失敗しました:', error)
      alert('更新間隔の更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleResetAllVotes = async () => {
    const confirmed = confirm(
      '全ての投票データを削除します。\n' +
      'この操作は取り消せません。\n\n' +
      '本当に削除しますか？'
    )

    if (!confirmed) return

    const doubleConfirmed = confirm(
      '最終確認：\n' +
      '全ての投票データが完全に削除されます。\n' +
      'この操作は絶対に取り消せません。\n\n' +
      '削除を実行しますか？'
    )

    if (!doubleConfirmed) return

    try {
      setSaving(true)
      await AdminService.resetAllVotes()
      alert('全ての投票データを削除しました')
    } catch (error) {
      console.error('投票データの削除に失敗しました:', error)
      alert('投票データの削除に失敗しました')
    } finally {
      setSaving(false)
    }
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
            <h1 className="text-2xl font-bold text-gray-900">システム設定</h1>
            <Link href="/admin" className="text-blue-600 hover:text-blue-800 font-medium">
              ダッシュボードへ戻る
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 投票設定 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">投票設定</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium text-gray-900">投票受付</h3>
                <p className="text-sm text-gray-600">
                  投票機能の有効/無効を切り替えます
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  config?.votingEnabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {config?.votingEnabled ? '有効' : '無効'}
                </span>
                <button
                  onClick={handleToggleVoting}
                  disabled={saving}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    config?.votingEnabled
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  } disabled:opacity-50`}
                >
                  {saving ? '更新中...' : (config?.votingEnabled ? '無効にする' : '有効にする')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 表示設定 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">表示設定</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleUpdateInterval}>
              <div className="mb-4">
                <label className="block text-base font-medium text-gray-900 mb-2">
                  結果更新間隔
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={updateInterval}
                    onChange={(e) => setUpdateInterval(Number(e.target.value))}
                    className="w-32 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">秒</span>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    {saving ? '更新中...' : '更新'}
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  結果画面の自動更新間隔を設定します（最小10秒）
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* 現在の設定 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">現在の設定</h2>
          </div>
          <div className="p-6">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">投票受付状態</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {config?.votingEnabled ? '有効' : '無効'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">結果表示状態</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {config?.resultsVisible ? '表示' : '非表示'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">更新間隔</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {config?.updateInterval}秒
                </dd>
              </div>
              {config?.currentGroup && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">対象団体</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {config.currentGroup}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* 危険操作 */}
        <div className="bg-white rounded-lg shadow border-l-4 border-red-400">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-red-900">危険操作</h2>
          </div>
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    全投票データの削除
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      システム内の全ての投票データを完全に削除します。
                      この操作は取り消すことができません。
                    </p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={handleResetAllVotes}
                      disabled={saving}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                    >
                      {saving ? '削除中...' : '全投票データを削除'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}