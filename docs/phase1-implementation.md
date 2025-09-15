# Phase 1: 基礎構築 - 詳細実装手順

## 📌 Phase 1 の目標
- TypeScript型定義によるデータモデルの確立
- 端末ID管理システムの実装
- 日付処理ユーティリティの実装
- テスト環境の構築と基本的なテストカバレッジ

## 🔧 Step 0: テスト環境セットアップ（30分）

### 0.1 テストライブラリのインストール
```bash
npm install --save-dev jest @types/jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

### 0.2 Jest設定ファイルの作成
- `jest.config.js` の作成
- `jest.setup.js` の作成
- `tsconfig.json` のテスト用設定追加

### 0.3 package.jsonにテストスクリプト追加
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## 📝 Step 1: TypeScript型定義（1時間）

### 1.1 型定義ファイルの作成

#### テスト作成 (TDD First)
`__tests__/types/index.test.ts`
- [ ] Vote型の必須フィールド検証テスト
- [ ] Group型の必須フィールド検証テスト
- [ ] Result型の必須フィールド検証テスト
- [ ] Config型の必須フィールド検証テスト
- [ ] 型ガード関数のテスト

#### 実装
`types/index.ts`
```typescript
// Firestore のタイムスタンプ型
import { Timestamp } from 'firebase/firestore';

// 投票データ
export interface Vote {
  id?: string;
  groupId: string;
  groupName?: string;  // 表示用
  score: number;       // 1-5点
  deviceId: string;
  createdAt: Date | Timestamp;
}

// 団体データ
export interface Group {
  id: string;
  name: string;
  order?: number;      // 表示順
  createdAt?: Date | Timestamp;
}

// 集計結果
export interface Result {
  id?: string;
  groupId: string;
  groupName: string;
  totalScore: number;
  voteCount: number;   // 投票数
  averageScore: number; // 平均点
  rank: number;
  updatedAt: Date | Timestamp;
}

// システム設定
export interface Config {
  id?: string;
  currentGroup?: string;
  votingEnabled: boolean;
  resultsVisible: boolean;
  updateInterval: number; // 秒単位
  updatedAt?: Date | Timestamp;
}

// 型ガード関数
export const isVote = (obj: any): obj is Vote => {
  return obj && 
    typeof obj.groupId === 'string' &&
    typeof obj.score === 'number' &&
    typeof obj.deviceId === 'string';
};
```

### 1.2 エラー型の定義

#### テスト作成
`__tests__/types/errors.test.ts`
- [ ] エラー型の構造検証
- [ ] エラーコードの一意性検証

#### 実装
`types/errors.ts`
```typescript
export enum ErrorCode {
  DUPLICATE_VOTE = 'DUPLICATE_VOTE',
  INVALID_SCORE = 'INVALID_SCORE',
  GROUP_NOT_FOUND = 'GROUP_NOT_FOUND',
  VOTING_DISABLED = 'VOTING_DISABLED',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: any;
}
```

## 🔑 Step 2: 端末ID管理システム（1.5時間）

### 2.1 端末ID管理ユーティリティ

#### テスト作成 (TDD First)
`__tests__/utils/deviceId.test.ts`
```typescript
describe('DeviceIdManager', () => {
  beforeEach(() => {
    // localStorage のモック
    localStorage.clear();
  });

  test('新規端末IDを生成できる', () => {
    // UUID形式の検証
  });

  test('既存の端末IDを取得できる', () => {
    // 保存済みIDの取得
  });

  test('端末IDの永続化ができる', () => {
    // localStorageへの保存確認
  });

  test('不正な端末IDを拒否する', () => {
    // バリデーション
  });
});
```

#### 実装
`utils/deviceId.ts`
```typescript
import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = 'form-live-device-id';
const DEVICE_ID_PREFIX = 'device-';

export class DeviceIdManager {
  /**
   * 端末IDを取得（存在しない場合は新規生成）
   */
  static getDeviceId(): string {
    // 実装
  }

  /**
   * 新規端末IDを生成
   */
  private static generateDeviceId(): string {
    // 実装
  }

  /**
   * 端末IDのバリデーション
   */
  static isValidDeviceId(deviceId: string): boolean {
    // 実装
  }

  /**
   * 端末IDをリセット（テスト用）
   */
  static resetDeviceId(): void {
    // 実装
  }
}
```

### 2.2 投票履歴管理

#### テスト作成
`__tests__/utils/voteHistory.test.ts`
- [ ] 投票履歴の保存テスト
- [ ] 重複投票チェックテスト
- [ ] 履歴のクリアテスト

#### 実装
`utils/voteHistory.ts`
```typescript
interface VoteRecord {
  groupId: string;
  votedAt: number; // timestamp
}

export class VoteHistoryManager {
  private static readonly HISTORY_KEY = 'form-live-vote-history';

  /**
   * 投票済みかチェック
   */
  static hasVoted(groupId: string): boolean {
    // 実装
  }

  /**
   * 投票を記録
   */
  static recordVote(groupId: string): void {
    // 実装
  }

  /**
   * 投票履歴を取得
   */
  static getHistory(): VoteRecord[] {
    // 実装
  }

  /**
   * 履歴をクリア
   */
  static clearHistory(): void {
    // 実装
  }
}
```

## 📅 Step 3: 日付処理ユーティリティ（1時間）

### 3.1 日付フォーマット関数

#### テスト作成
`__tests__/utils/dateUtils.test.ts`
```typescript
describe('DateUtils', () => {
  test('Timestampを日付文字列に変換できる', () => {
    // Firestore Timestamp → "2025/09/15 10:30"
  });

  test('相対時間表示ができる', () => {
    // "1分前", "5分前", "1時間前"
  });

  test('集計更新時刻を表示できる', () => {
    // "最終更新: 10:30"
  });

  test('タイムゾーン対応', () => {
    // JST表示の確認
  });
});
```

#### 実装
`utils/dateUtils.ts`
```typescript
import { Timestamp } from 'firebase/firestore';

export class DateUtils {
  /**
   * Firestore TimestampをDateに変換
   */
  static toDate(timestamp: Timestamp | Date): Date {
    // 実装
  }

  /**
   * 日時フォーマット（YYYY/MM/DD HH:mm）
   */
  static formatDateTime(date: Date | Timestamp): string {
    // 実装
  }

  /**
   * 相対時間表示（例: "5分前"）
   */
  static getRelativeTime(date: Date | Timestamp): string {
    // 実装
  }

  /**
   * 更新時刻表示（例: "最終更新: 10:30"）
   */
  static formatUpdateTime(date: Date | Timestamp): string {
    // 実装
  }

  /**
   * 次の更新時刻までの秒数
   */
  static getSecondsUntilNextUpdate(intervalMinutes: number = 1): number {
    // 実装
  }
}
```

### 3.2 バリデーションユーティリティ

#### テスト作成
`__tests__/utils/validation.test.ts`
- [ ] スコア範囲チェック（1-5）
- [ ] 団体名の長さチェック
- [ ] 特殊文字のサニタイズ

#### 実装
`utils/validation.ts`
```typescript
export class ValidationUtils {
  /**
   * スコアの妥当性チェック
   */
  static isValidScore(score: number): boolean {
    return score >= 1 && score <= 5 && Number.isInteger(score);
  }

  /**
   * 団体名のバリデーション
   */
  static isValidGroupName(name: string): boolean {
    return name.length > 0 && name.length <= 50;
  }

  /**
   * XSS対策用サニタイズ
   */
  static sanitizeString(input: string): string {
    // 実装
  }
}
```

## 📊 Step 4: 共通定数とヘルパー（30分）

### 4.1 定数定義

#### ファイル作成
`constants/index.ts`
```typescript
// スコア関連
export const MIN_SCORE = 1;
export const MAX_SCORE = 5;

// 更新間隔（秒）
export const DEFAULT_UPDATE_INTERVAL = 60;

// localStorage キー
export const STORAGE_KEYS = {
  DEVICE_ID: 'form-live-device-id',
  VOTE_HISTORY: 'form-live-vote-history',
  LAST_UPDATE: 'form-live-last-update',
} as const;

// エラーメッセージ
export const ERROR_MESSAGES = {
  DUPLICATE_VOTE: 'この団体には既に投票済みです',
  INVALID_SCORE: '点数は1〜5の範囲で入力してください',
  GROUP_NOT_FOUND: '団体が見つかりません',
  VOTING_DISABLED: '現在投票は受け付けていません',
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
} as const;
```

## ✅ Phase 1 完了条件

### テストカバレッジ
- [ ] 全ユーティリティ関数のテスト作成
- [ ] カバレッジ 90% 以上
- [ ] エッジケースのテスト

### コード品質
- [ ] TypeScript の strict モードでエラーなし
- [ ] ESLint エラーなし
- [ ] 適切なエラーハンドリング

### ドキュメント
- [ ] 各関数の JSDoc コメント
- [ ] 使用例の記載

## 🚀 実装順序

1. **Step 0**: テスト環境セットアップ（30分）
2. **Step 1.1**: Vote, Group, Result, Config 型定義（30分）
3. **Step 2.1**: DeviceIdManager のテストと実装（45分）
4. **Step 2.2**: VoteHistoryManager のテストと実装（45分）
5. **Step 3.1**: DateUtils のテストと実装（30分）
6. **Step 3.2**: ValidationUtils のテストと実装（30分）
7. **Step 4**: 定数定義（15分）
8. 統合テストとリファクタリング（30分）

**合計所要時間**: 約4時間

## 📝 実装時の注意事項

1. **TDD厳守**: 必ずテストを先に書く
2. **小さなコミット**: 機能ごとにコミット
3. **型安全性**: any型の使用を避ける
4. **エラーハンドリング**: 想定外の入力に対応
5. **パフォーマンス**: localStorage アクセスの最小化

## 次のアクション
```bash
# 1. テストライブラリのインストール
npm install --save-dev jest @types/jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom

# 2. UUID ライブラリのインストール
npm install uuid
npm install --save-dev @types/uuid

# 3. テスト実行
npm test
```