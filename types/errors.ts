/**
 * エラーコードの定義
 */
export enum ErrorCode {
  DUPLICATE_VOTE = 'DUPLICATE_VOTE',
  INVALID_SCORE = 'INVALID_SCORE',
  GROUP_NOT_FOUND = 'GROUP_NOT_FOUND',
  VOTING_DISABLED = 'VOTING_DISABLED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DEVICE_ID_ERROR = 'DEVICE_ID_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

/**
 * アプリケーションエラーの型定義
 */
export interface AppError {
  code: ErrorCode
  message: string
  details?: unknown
}

/**
 * エラーファクトリー関数
 */
export const createError = (
  code: ErrorCode,
  message: string,
  details?: unknown
): AppError => ({
  code,
  message,
  details,
})

/**
 * エラーメッセージの定義
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.DUPLICATE_VOTE]: 'この団体には既に投票済みです',
  [ErrorCode.INVALID_SCORE]: '点数は1〜5の範囲で入力してください',
  [ErrorCode.GROUP_NOT_FOUND]: '団体が見つかりません',
  [ErrorCode.VOTING_DISABLED]: '現在投票は受け付けていません',
  [ErrorCode.NETWORK_ERROR]: 'ネットワークエラーが発生しました',
  [ErrorCode.DEVICE_ID_ERROR]: '端末IDの取得に失敗しました',
  [ErrorCode.VALIDATION_ERROR]: '入力値が不正です',
}