import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { VoteForm } from '@/components/VoteForm'
import { useGroups } from '@/hooks/useGroups'
import { useVote } from '@/hooks/useVote'

// モック
jest.mock('@/hooks/useGroups')
jest.mock('@/hooks/useVote')

describe('VoteForm', () => {
  const mockGroups = [
    { id: 'group1', name: '団体A', order: 1, createdAt: new Date() },
    { id: 'group2', name: '団体B', order: 2, createdAt: new Date() },
    { id: 'group3', name: '団体C', order: 3, createdAt: new Date() },
  ]

  const mockSubmitVote = jest.fn()
  const mockHasVoted = jest.fn()
  const mockClearError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // デフォルトのモック設定
    ;(useGroups as jest.Mock).mockReturnValue({
      groups: mockGroups,
      loading: false,
      error: null,
      refetch: jest.fn(),
    })
    
    ;(useVote as jest.Mock).mockReturnValue({
      submitVote: mockSubmitVote,
      voting: false,
      voteResult: null,
      error: null,
      hasVoted: mockHasVoted,
      clearError: mockClearError,
    })
  })

  describe('初期表示', () => {
    test('フォームの要素が正しく表示される', () => {
      render(<VoteForm />)

      expect(screen.getByLabelText('団体を選択')).toBeInTheDocument()
      expect(screen.getByText('評価')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '投票する' })).toBeInTheDocument()
    })

    test('団体リストが表示される', () => {
      render(<VoteForm />)

      const select = screen.getByLabelText('団体を選択')
      fireEvent.click(select)

      expect(screen.getByText('団体A')).toBeInTheDocument()
      expect(screen.getByText('団体B')).toBeInTheDocument()
      expect(screen.getByText('団体C')).toBeInTheDocument()
    })

    test('スコア選択が表示される', () => {
      render(<VoteForm />)

      // 1-5の星評価が表示される
      const scoreButtons = screen.getAllByRole('button', { name: /星/ })
      expect(scoreButtons).toHaveLength(5)
    })
  })

  describe('ローディング状態', () => {
    test('団体リスト読み込み中の表示', () => {
      ;(useGroups as jest.Mock).mockReturnValue({
        groups: [],
        loading: true,
        error: null,
        refetch: jest.fn(),
      })

      render(<VoteForm />)

      expect(screen.getByText('団体リストを読み込み中...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '投票する' })).toBeDisabled()
    })

    test('投票処理中の表示', () => {
      ;(useVote as jest.Mock).mockReturnValue({
        submitVote: mockSubmitVote,
        voting: true,
        voteResult: null,
        error: null,
        hasVoted: mockHasVoted,
        clearError: mockClearError,
      })

      render(<VoteForm />)

      expect(screen.getByText('投票中...')).toBeInTheDocument()
      // ボタンは投票中...というテキストを含む
      const button = screen.getByRole('button', { name: '投票中...' })
      expect(button).toBeDisabled()
    })
  })

  describe('バリデーション', () => {
    test('団体未選択時に投票が送信されない', async () => {
      render(<VoteForm />)

      const submitButton = screen.getByRole('button', { name: '投票する' })
      fireEvent.click(submitButton)

      // ボタンは無効なので実際にはクリックイベントが発生しない
      expect(mockSubmitVote).not.toHaveBeenCalled()
    })

    test('スコア未選択時に投票が送信されない', async () => {
      render(<VoteForm />)

      // 団体を選択
      const select = screen.getByLabelText('団体を選択')
      fireEvent.change(select, { target: { value: 'group1' } })

      // この時点でもスコアが選択されていないのでボタンは無効
      const submitButton = screen.getByRole('button', { name: '投票する' })
      expect(submitButton).toBeDisabled()
      
      fireEvent.click(submitButton)
      expect(mockSubmitVote).not.toHaveBeenCalled()
    })
  })

  describe('投票処理', () => {
    test('正常に投票できる', async () => {
      mockSubmitVote.mockResolvedValue(undefined)
      
      render(<VoteForm />)

      // 団体を選択
      const select = screen.getByLabelText('団体を選択')
      fireEvent.change(select, { target: { value: 'group1' } })

      // スコアを選択（3つ星）
      const starButtons = screen.getAllByRole('button', { name: /星/ })
      fireEvent.click(starButtons[2])

      // 投票ボタンをクリック
      const submitButton = screen.getByRole('button', { name: '投票する' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSubmitVote).toHaveBeenCalledWith({
          groupId: 'group1',
          score: 3,
        })
      })
    })

    test('投票成功時に成功メッセージを表示', async () => {
      ;(useVote as jest.Mock).mockReturnValue({
        submitVote: mockSubmitVote,
        voting: false,
        voteResult: { success: true, voteId: 'vote-123' },
        error: null,
        hasVoted: mockHasVoted,
        clearError: mockClearError,
      })

      render(<VoteForm />)

      expect(screen.getByText('投票が完了しました！')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '投票する' })).toBeDisabled()
    })

    test('投票エラー時にエラーメッセージを表示', async () => {
      const mockError = new Error('この団体には既に投票済みです')
      ;(useVote as jest.Mock).mockReturnValue({
        submitVote: mockSubmitVote,
        voting: false,
        voteResult: null,
        error: mockError,
        hasVoted: mockHasVoted,
        clearError: mockClearError,
      })

      render(<VoteForm />)

      expect(screen.getByText('この団体には既に投票済みです')).toBeInTheDocument()
    })
  })

  describe('投票済みチェック', () => {
    test('投票済みの団体は選択できない', () => {
      mockHasVoted.mockImplementation((groupId) => groupId === 'group1')
      
      render(<VoteForm />)

      const select = screen.getByLabelText('団体を選択')
      fireEvent.click(select)

      // 団体Aには「投票済み」が表示される
      expect(screen.getByText('団体A（投票済み）')).toBeInTheDocument()
    })

    test('全団体に投票済みの場合メッセージを表示', () => {
      mockHasVoted.mockReturnValue(true)
      
      render(<VoteForm />)

      expect(screen.getByText('すべての団体に投票済みです')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '投票する' })).toBeDisabled()
    })
  })

  describe('エラーハンドリング', () => {
    test('団体リスト取得エラー時の表示', () => {
      const mockError = new Error('ネットワークエラー')
      ;(useGroups as jest.Mock).mockReturnValue({
        groups: [],
        loading: false,
        error: mockError,
        refetch: jest.fn(),
      })

      render(<VoteForm />)

      expect(screen.getByText('団体リストの取得に失敗しました')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '再読み込み' })).toBeInTheDocument()
    })

    test('エラーをクリアできる', () => {
      const mockError = new Error('エラー')
      ;(useVote as jest.Mock).mockReturnValue({
        submitVote: mockSubmitVote,
        voting: false,
        voteResult: null,
        error: mockError,
        hasVoted: mockHasVoted,
        clearError: mockClearError,
      })

      render(<VoteForm />)

      const clearButton = screen.getByRole('button', { name: '×' })
      fireEvent.click(clearButton)

      expect(mockClearError).toHaveBeenCalled()
    })
  })
})
