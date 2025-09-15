'use client'

import { Result } from '@/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface ResultsChartProps {
  results: Result[]
  chartType: 'bar' | 'pie'
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function ResultsChart({ results, chartType }: ResultsChartProps) {
  if (results.length === 0) {
    return null
  }

  // データをグラフ用に整形
  const chartData = results.map((result) => ({
    name: result.groupName,
    平均点: result.averageScore,
    投票数: result.voteCount,
    合計点: result.totalScore,
  }))

  if (chartType === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="平均点" fill="#8884d8" />
          <Bar dataKey="投票数" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  // 円グラフ
  const pieData = results.map((result, index) => ({
    name: result.groupName,
    value: result.averageScore,
    color: COLORS[index % COLORS.length],
  }))

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(entry) => `${entry.name}: ${Number(entry.value ?? 0).toFixed(2)}`}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}