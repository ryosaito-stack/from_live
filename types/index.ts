import { Timestamp } from 'firebase/firestore'

/**
 * 投票データの型定義
 */
export interface Vote {
  id?: string
  groupId: string
  groupName?: string
  score: number
  deviceId: string
  createdAt: Date | Timestamp
}

/**
 * 団体データの型定義
 */
export interface Group {
  id: string
  name: string
  order?: number
  createdAt?: Date | Timestamp
}

/**
 * 集計結果の型定義
 */
export interface Result {
  id?: string
  groupId: string
  groupName: string
  totalScore: number
  voteCount: number
  averageScore: number
  rank: number
  updatedAt: Date | Timestamp
}

/**
 * システム設定の型定義
 */
export interface Config {
  id?: string
  currentGroup?: string
  votingEnabled: boolean
  resultsVisible: boolean
  updateInterval: number
  updatedAt?: Date | Timestamp
}

/**
 * Vote型の型ガード関数
 */
export const isVote = (obj: unknown): obj is Vote => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return false
  }

  const vote = obj as Record<string, unknown>

  // 必須フィールドの存在チェック
  if (
    typeof vote.groupId !== 'string' ||
    typeof vote.score !== 'number' ||
    typeof vote.deviceId !== 'string' ||
    !vote.createdAt
  ) {
    return false
  }

  // スコアの範囲チェック（1-5の整数）
  if (
    !Number.isInteger(vote.score) ||
    vote.score < 1 ||
    vote.score > 5
  ) {
    return false
  }

  // createdAtの型チェック
  const isValidDate =
    vote.createdAt instanceof Date ||
    (vote.createdAt &&
      typeof vote.createdAt === 'object' &&
      'toDate' in vote.createdAt) // Timestamp型のチェック

  return isValidDate
}

/**
 * Group型の型ガード関数
 */
export const isGroup = (obj: unknown): obj is Group => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return false
  }

  const group = obj as Record<string, unknown>

  // 必須フィールドの存在チェック
  if (typeof group.id !== 'string' || typeof group.name !== 'string') {
    return false
  }

  // nameが空文字でないことをチェック
  if (group.name === '') {
    return false
  }

  return true
}

/**
 * Result型の型ガード関数
 */
export const isResult = (obj: unknown): obj is Result => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return false
  }

  const result = obj as Record<string, unknown>

  // 必須フィールドの存在チェック
  if (
    typeof result.groupId !== 'string' ||
    typeof result.groupName !== 'string' ||
    typeof result.totalScore !== 'number' ||
    typeof result.voteCount !== 'number' ||
    typeof result.averageScore !== 'number' ||
    typeof result.rank !== 'number' ||
    !result.updatedAt
  ) {
    return false
  }

  // rankが1以上であることをチェック
  if (result.rank <= 0) {
    return false
  }

  // updatedAtの型チェック
  const isValidDate =
    result.updatedAt instanceof Date ||
    (result.updatedAt &&
      typeof result.updatedAt === 'object' &&
      'toDate' in result.updatedAt) // Timestamp型のチェック

  return isValidDate
}

/**
 * Config型の型ガード関数
 */
export const isConfig = (obj: unknown): obj is Config => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return false
  }

  const config = obj as Record<string, unknown>

  // 必須フィールドの存在チェック
  if (
    typeof config.votingEnabled !== 'boolean' ||
    typeof config.resultsVisible !== 'boolean' ||
    typeof config.updateInterval !== 'number'
  ) {
    return false
  }

  // updateIntervalが1以上であることをチェック
  if (config.updateInterval <= 0) {
    return false
  }

  return true
}