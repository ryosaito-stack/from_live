'use client'

import { useState } from 'react'
import { useResults } from '@/hooks/useResults'
import { ResultsTable } from '@/components/ResultsTable'
import { ResultsChart } from '@/components/ResultsChart'
import { UpdateIndicator } from '@/components/UpdateIndicator'

export default function ResultsPage() {
  const { results, loading, error, lastUpdated, isUpdating, refetch } = useResults(60000) // 1分ごとに更新
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar')

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg text-gray-600">読み込み中...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">エラー!</strong>
          <span className="block sm:inline"> {error.message}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">投票結果</h1>
        <UpdateIndicator
          lastUpdated={lastUpdated}
          isUpdating={isUpdating}
          updateInterval={60000}
        />
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={() => setChartType('bar')}
            className={`px-4 py-2 rounded-lg ${
              chartType === 'bar'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            棒グラフ
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`px-4 py-2 rounded-lg ${
              chartType === 'pie'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            円グラフ
          </button>
        </div>
        <button
          onClick={refetch}
          disabled={isUpdating}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          手動更新
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">ランキング</h2>
          <ResultsTable results={results} isUpdating={isUpdating} />
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">グラフ表示</h2>
          <ResultsChart results={results} chartType={chartType} />
        </div>
      </div>

      {results.length > 0 && (
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                結果は1分ごとに自動更新されます。手動更新ボタンで即座に最新データを取得することもできます。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}