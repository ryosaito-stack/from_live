/**
 * スコア関連の定数
 */
export const SCORE = {
  MIN: 1,
  MAX: 5,
} as const

/**
 * 更新間隔（秒）
 */
export const UPDATE_INTERVAL = {
  DEFAULT: 60,
  FAST: 5,
  SLOW: 300,
} as const

/**
 * localStorage のキー
 */
export const STORAGE_KEYS = {
  DEVICE_ID: 'form-live-device-id',
  VOTE_HISTORY: 'form-live-vote-history',
  LAST_UPDATE: 'form-live-last-update',
  THEME: 'form-live-theme',
} as const

/**
 * エラーメッセージ
 */
export const ERROR_MESSAGES = {
  DUPLICATE_VOTE: 'この団体には既に投票済みです',
  INVALID_SCORE: '点数は1〜5の範囲で入力してください',
  GROUP_NOT_FOUND: '団体が見つかりません',
  VOTING_DISABLED: '現在投票は受け付けていません',
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  DEVICE_ID_ERROR: '端末IDの取得に失敗しました',
  VALIDATION_ERROR: '入力値が不正です',
  SAVE_ERROR: '保存に失敗しました',
  LOAD_ERROR: 'データの読み込みに失敗しました',
  PERMISSION_DENIED: '権限がありません',
} as const

/**
 * 成功メッセージ
 */
export const SUCCESS_MESSAGES = {
  VOTE_COMPLETED: '投票が完了しました',
  SAVE_COMPLETED: '保存しました',
  DELETE_COMPLETED: '削除しました',
  UPDATE_COMPLETED: '更新しました',
} as const

/**
 * Firebase コレクション名
 */
export const COLLECTIONS = {
  VOTES: 'votes',
  GROUPS: 'groups',
  RESULTS: 'results',
  CONFIG: 'config',
  USERS: 'users',
} as const

/**
 * Firebase ドキュメントID
 */
export const DOCUMENT_IDS = {
  SETTINGS: 'settings',
} as const

/**
 * ルートパス
 */
export const ROUTES = {
  HOME: '/',
  VOTE: '/vote',
  RESULTS: '/results',
  ADMIN: '/admin',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_GROUPS: '/admin/groups',
  ADMIN_VOTES: '/admin/votes',
  ADMIN_SETTINGS: '/admin/settings',
} as const

/**
 * 表示関連の定数
 */
export const DISPLAY = {
  MAX_GROUP_NAME_LENGTH: 50,
  RESULTS_PER_PAGE: 20,
  VOTES_PER_PAGE: 50,
  ANIMATION_DURATION: 300,
} as const

/**
 * タイムゾーン
 */
export const TIMEZONE = {
  JST: 'Asia/Tokyo',
  UTC: 'UTC',
} as const

/**
 * 日付フォーマット
 */
export const DATE_FORMAT = {
  DATE: 'YYYY/MM/DD',
  TIME: 'HH:mm',
  DATETIME: 'YYYY/MM/DD HH:mm',
  DATETIME_WITH_SEC: 'YYYY/MM/DD HH:mm:ss',
} as const

/**
 * 投票状態
 */
export const VOTE_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  ERROR: 'error',
} as const

/**
 * ユーザーロール
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
} as const

/**
 * API エンドポイント（将来のAPI実装用）
 */
export const API_ENDPOINTS = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  VOTES: '/api/votes',
  GROUPS: '/api/groups',
  RESULTS: '/api/results',
  AUTH: '/api/auth',
} as const

/**
 * デバイス判定用の画面幅
 */
export const BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 768,
  DESKTOP: 1024,
  WIDE: 1280,
} as const

/**
 * デフォルト値
 */
export const DEFAULTS = {
  SCORE: 3,
  UPDATE_INTERVAL_MINUTES: 1,
  VOTING_ENABLED: true,
  RESULTS_VISIBLE: true,
} as const