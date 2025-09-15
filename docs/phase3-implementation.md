# Phase 3: 結果表示・集計機能 - 詳細実装ステップ

## 📌 Phase 3 の目標
- 投票結果のリアルタイム集計・表示機能の実装
- 1分ごとの自動更新機能
- ランキング表示とグラフ表示
- Firestoreの初期データ投入

## 🎯 実装方針
- **TDD (Test-Driven Development)** を継続
- **リアルタイム更新のパフォーマンスを重視**
- **キャッシュ機構を導入してFirestoreの読み取りを最適化**

## 📋 実装ステップ

### Step 1: 結果データサービスの実装（2時間）

#### 1.1 ResultServiceの実装
**テスト作成 (TDD First)**
`__tests__/services/resultService.test.ts`
- [ ] 団体ごとの集計結果取得テスト
- [ ] ランキング計算テスト
- [ ] 結果のキャッシュ保存テスト
- [ ] 結果の更新テスト

**実装**
`services/resultService.ts`
```typescript
export class ResultService {
  // 全団体の集計結果を取得
  static async getAllResults(): Promise<Result[]>
  
  // 団体別の集計結果を取得
  static async getResultByGroup(groupId: string): Promise<Result | null>
  
  // 集計結果を更新（管理者用）
  static async updateResult(groupId: string, data: Partial<Result>): Promise<void>
  
  // ランキングを計算
  static calculateRanking(results: Result[]): Result[]
  
  // 結果をキャッシュに保存
  static async cacheResults(results: Result[]): Promise<void>
}
```

#### 1.2 AggregationServiceの実装
**テスト作成 (TDD First)**
`__tests__/services/aggregationService.test.ts`
- [ ] 投票データの集計テスト
- [ ] 平均点計算テスト
- [ ] 投票数カウントテスト
- [ ] バッチ集計処理テスト

**実装**
`services/aggregationService.ts`
```typescript
export class AggregationService {
  // 全団体の投票を集計
  static async aggregateAllVotes(): Promise<AggregationResult[]>
  
  // 特定団体の投票を集計
  static async aggregateGroupVotes(groupId: string): Promise<AggregationResult>
  
  // 平均点を計算
  static calculateAverageScore(votes: Vote[]): number
  
  // 投票数をカウント
  static countVotes(votes: Vote[]): number
  
  // バッチ集計処理
  static async batchAggregate(): Promise<void>
}
```

### Step 2: 結果表示用React Hooksの実装（1.5時間）

#### 2.1 カスタムフックの作成
**テスト作成 (TDD First)**
`__tests__/hooks/useResults.test.tsx`
- [ ] 結果データの取得テスト
- [ ] 自動更新テスト
- [ ] エラーハンドリングテスト
- [ ] 更新間隔の設定テスト

**実装**
`hooks/useResults.ts`
```typescript
export function useResults(updateInterval = 60000) {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // 結果の取得
  // 自動更新の設定
  // 手動更新
  
  return { results, loading, error, lastUpdated, isUpdating, refetch }
}
```

`hooks/useAggregation.ts`
```typescript
export function useAggregation() {
  const [aggregating, setAggregating] = useState(false)
  const [aggregationResult, setAggregationResult] = useState<AggregationResult | null>(null)
  
  const triggerAggregation = async () => {
    // 集計処理をトリガー
  }
  
  return { aggregating, aggregationResult, triggerAggregation }
}
```

### Step 3: 結果表示コンポーネント（2.5時間）

#### 3.1 ResultsTableコンポーネント
**テスト作成 (TDD First)**
`__tests__/components/ResultsTable.test.tsx`
- [ ] ランキング表示テスト
- [ ] ソート機能テスト
- [ ] 更新中表示テスト
- [ ] 空データ時の表示テスト

**実装**
`components/ResultsTable.tsx`
```typescript
export function ResultsTable() {
  // ランキング表示
  // ソート機能
  // 更新インジケーター
}
```

#### 3.2 ResultsChartコンポーネント
`components/ResultsChart.tsx`
- [ ] 棒グラフ表示
- [ ] 円グラフ表示
- [ ] アニメーション

#### 3.3 UpdateIndicatorコンポーネント
`components/UpdateIndicator.tsx`
- [ ] 次回更新までのカウントダウン
- [ ] 更新中表示
- [ ] 最終更新時刻表示

### Step 4: 結果ページの実装（1.5時間）

#### 4.1 結果ページ
**実装**
`app/results/page.tsx`
- [ ] レイアウト構成
- [ ] 結果テーブルの配置
- [ ] グラフの配置
- [ ] 更新インジケーターの配置
- [ ] エラーハンドリング

#### 4.2 リアルタイム更新機能
- [ ] 1分ごとの自動更新
- [ ] 手動更新ボタン
- [ ] 更新中の「集計中...」表示
- [ ] WebSocketまたはpollingの実装

### Step 5: Firestore初期データ投入（1時間）

#### 5.1 初期データスクリプトの更新
`scripts/initFirestore.ts`
- [ ] 団体データの投入
- [ ] サンプル投票データの投入
- [ ] 初期集計結果の作成
- [ ] 設定データの投入

#### 5.2 データ検証
- [ ] Firestoreコンソールでデータ確認
- [ ] アプリからのデータ取得テスト

### Step 6: パフォーマンス最適化（1時間）

#### 6.1 Firestoreクエリ最適化
- [ ] インデックスの設定
- [ ] クエリの最適化
- [ ] バッチ読み取りの実装

#### 6.2 フロントエンド最適化
- [ ] React.memoの使用
- [ ] useMemo/useCallbackの適切な使用
- [ ] 不要な再レンダリングの防止

## 🧪 テスト戦略

### 単体テスト
- サービス層の全メソッド
- カスタムフックの動作
- 集計ロジック

### 統合テスト
- Firestoreとの連携
- リアルタイム更新の動作
- エンドツーエンドの結果表示フロー

### パフォーマンステスト
- 大量データでの表示速度
- 更新频度の負荷テスト

## 📁 ディレクトリ構造

```
form-live/
├── services/
│   ├── resultService.ts
│   ├── aggregationService.ts
│   └── cacheService.ts
├── hooks/
│   ├── useResults.ts
│   ├── useAggregation.ts
│   └── useAutoUpdate.ts
├── components/
│   ├── ResultsTable.tsx
│   ├── ResultsChart.tsx
│   ├── UpdateIndicator.tsx
│   └── RankingCard.tsx
├── app/
│   └── results/
│       └── page.tsx
├── scripts/
│   └── initFirestore.ts
└── __tests__/
    ├── services/
    ├── hooks/
    └── components/
```

## ⏱️ タイムライン

### Day 1（6時間）
- **午前（3時間）**
  - Step 1: 結果データサービス（2時間）
  - Step 2: React Hooksの前半（1時間）
- **午後（3時間）**
  - Step 2: React Hooksの後半（0.5時間）
  - Step 3: 結果表示コンポーネント（2.5時間）

### Day 2（3.5時間）
- **午前（2時間）**
  - Step 4: 結果ページの実装（1.5時間）
  - Step 5: Firestore初期データの前半（0.5時間）
- **午後（1.5時間）**
  - Step 5: Firestore初期データの後半（0.5時間）
  - Step 6: パフォーマンス最適化（1時間）

**合計: 約9.5時間（1.5日）**

## ✅ 完了条件

### 機能要件
- [ ] 投票結果がリアルタイムで表示される
- [ ] 1分ごとに自動更新される
- [ ] ランキングが正しく表示される
- [ ] 更新中は「集計中...」が表示される
- [ ] グラフ表示が機能する

### 非機能要件
- [ ] 更新処理が1秒以内に完了
- [ ] 100団体までのスケーラビリティ
- [ ] モバイルでの快適な閲覧
- [ ] アクセシビリティ基準の準拠

### テスト要件
- [ ] カバレッジ80%以上
- [ ] E2Eテストで主要フローが通る
- [ ] パフォーマンステストの合格

## 🚀 次のアクション

1. **チャートライブラリのインストール**
```bash
npm install recharts
```

2. **テストファイルの作成から開始**
```bash
mkdir -p __tests__/services
touch __tests__/services/resultService.test.ts
touch __tests__/services/aggregationService.test.ts
```

3. **Firestoreのインデックス設定**
- Firebase Consoleで複合インデックスを設定
- `votes` コレクション: groupId + createdAt
- `results` コレクション: rank + updatedAt

## 📝 注意事項

1. **リアルタイム更新**
   - FirestoreのonSnapshotを使用するか、pollingを使用するか検討
   - コストとパフォーマンスのバランスを考慮

2. **キャッシュ戦略**
   - resultsコレクションをキャッシュとして使用
   - 直接votesコレクションを参照しない

3. **集計処理**
   - Cloud Functionsでの実装も検討（Phase 4で実装予定）
   - 現時点ではクライアントサイドでの集計を実装

4. **パフォーマンス**
   - 大量の投票データでも快適に動作するよう最適化
   - ページネーションの実装も検討

## 🎯 Phase 4 への展望

- 管理者機能の実装
- Firebase Authenticationの導入
- Cloud Functionsでのサーバーサイド集計
- Security Rulesの適切な設定
- ダッシュボード機能
