import { render, screen } from '@testing-library/react'
import { ResultsTable } from '@/components/ResultsTable'
import { Result } from '@/types'

describe('ResultsTable', () => {
  const mockResults: Result[] = [
    {
      groupId: 'group1',
      groupName: '団体A',
      totalScore: 45,
      voteCount: 10,
      averageScore: 4.5,
      rank: 1,
      updatedAt: new Date('2025-01-15T10:00:00'),
    },
    {
      groupId: 'group2',
      groupName: '団体B',
      totalScore: 35,
      voteCount: 8,
      averageScore: 4.38,
      rank: 2,
      updatedAt: new Date('2025-01-15T10:00:00'),
    },
    {
      groupId: 'group3',
      groupName: '団体C',
      totalScore: 30,
      voteCount: 7,
      averageScore: 4.29,
      rank: 3,
      updatedAt: new Date('2025-01-15T10:00:00'),
    },
  ]

  test('ランキング表示', () => {
    render(<ResultsTable results={mockResults} isUpdating={false} />)

    // ヘッダーの確認
    expect(screen.getByText('順位')).toBeInTheDocument()
    expect(screen.getByText('団体名')).toBeInTheDocument()
    expect(screen.getByText('平均点')).toBeInTheDocument()
    expect(screen.getByText('投票数')).toBeInTheDocument()
    expect(screen.getByText('合計点')).toBeInTheDocument()

    // データの確認
    expect(screen.getByText(/🁑 1/)).toBeInTheDocument() // 1位には王冠付き
    expect(screen.getByText('団体A')).toBeInTheDocument()
    expect(screen.getByText('4.50')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('45')).toBeInTheDocument()

    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('団体B')).toBeInTheDocument()
    expect(screen.getByText('4.38')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('35')).toBeInTheDocument()
  })

  test('空データ時の表示', () => {
    render(<ResultsTable results={[]} isUpdating={false} />)

    expect(screen.getByText('データがありません')).toBeInTheDocument()
  })

  test('更新中表示', () => {
    render(<ResultsTable results={mockResults} isUpdating={true} />)

    expect(screen.getByText('集計中...')).toBeInTheDocument()
  })

  test('1位には王冠アイコンが表示される', () => {
    render(<ResultsTable results={mockResults} isUpdating={false} />)

    const firstRankRow = screen.getByText(/🁑 1/).closest('tr')
    expect(firstRankRow).toHaveTextContent('🁑')
  })

  test('同率順位の表示', () => {
    const tiedResults: Result[] = [
      { ...mockResults[0], rank: 1 },
      { ...mockResults[1], rank: 1 },
      { ...mockResults[2], rank: 3 },
    ]

    render(<ResultsTable results={tiedResults} isUpdating={false} />)

    const rank1Elements = screen.getAllByText(/🁑 1/)
    expect(rank1Elements).toHaveLength(2)
  })
})