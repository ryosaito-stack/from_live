# Phase 2: 投票機能（コア機能） - 詳細実装ステップ

## 📌 Phase 2 の目標
- Firestoreと連携した投票システムの実装
- 重複投票防止機能の実装
- 投票フォームUIの構築
- エラーハンドリングとユーザーフィードバック

## 🎯 実装方針
- **TDD (Test-Driven Development)** を継続
- **小さな単位で段階的に実装**
- **Firestoreエミュレータを使用したローカルテスト**

## 📋 実装ステップ

### Step 1: Firestoreサービス層の実装（2時間）

#### 1.1 Firestore接続設定
- [ ] Firebaseエミュレータのセットアップ
  - firebase.json の設定
  - エミュレータ起動スクリプト
- [ ] テスト用のFirebase初期化
  - テスト環境でのエミュレータ接続
  - モックデータの準備

#### 1.2 団体データサービス
**テスト作成 (TDD First)**
`__tests__/services/groupService.test.ts`
- [ ] 全団体リストの取得テスト
- [ ] 団体IDによる単一団体の取得テスト
- [ ] 団体の追加テスト（管理者用）
- [ ] エラーハンドリングテスト

**実装**
`services/groupService.ts`
```typescript
export class GroupService {
  // 全団体を取得
  static async getAllGroups(): Promise<Group[]>
  
  // 団体IDで取得
  static async getGroupById(id: string): Promise<Group | null>
  
  // 団体を追加（管理者用）
  static async addGroup(name: string): Promise<string>
  
  // 団体を更新（管理者用）
  static async updateGroup(id: string, data: Partial<Group>): Promise<void>
  
  // 団体を削除（管理者用）
  static async deleteGroup(id: string): Promise<void>
}
```

### Step 2: 投票サービス層の実装（3時間）

#### 2.1 投票データサービス
**テスト作成 (TDD First)**
`__tests__/services/voteService.test.ts`
- [ ] 投票の重複チェックテスト
- [ ] 新規投票の保存テスト
- [ ] 投票履歴の取得テスト
- [ ] トランザクション処理のテスト
- [ ] 同時実行制御のテスト

**実装**
`services/voteService.ts`
```typescript
export class VoteService {
  // 投票済みかチェック
  static async hasVoted(deviceId: string, groupId: string): Promise<boolean>
  
  // 投票を保存
  static async submitVote(vote: VoteInput): Promise<string>
  
  // 端末の投票履歴を取得
  static async getVoteHistory(deviceId: string): Promise<Vote[]>
  
  // 団体の全投票を取得（集計用）
  static async getVotesByGroup(groupId: string): Promise<Vote[]>
  
  // 投票の検証と保存（トランザクション）
  static async validateAndSaveVote(vote: VoteInput): Promise<VoteResult>
}
```

#### 2.2 投票の重複防止ロジック
**実装内容**
- Firestore複合インデックスを使用した重複チェック
- deviceId + groupId の組み合わせでユニーク制約
- ローカルストレージとの二重チェック
- 楽観的UIアップデート

### Step 3: React Hooksの実装（2時間）

#### 3.1 カスタムフックの作成
**テスト作成 (TDD First)**
`__tests__/hooks/useGroups.test.tsx`
- [ ] 団体リストの取得と状態管理
- [ ] ローディング状態のテスト
- [ ] エラー状態のテスト
- [ ] リトライロジックのテスト

**実装**
`hooks/useGroups.ts`
```typescript
export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  // 団体リストの取得
  // エラーハンドリング
  // リトライロジック
  
  return { groups, loading, error, refetch }
}
```

`hooks/useVote.ts`
```typescript
export function useVote() {
  const [voting, setVoting] = useState(false)
  const [voteResult, setVoteResult] = useState<VoteResult | null>(null)
  const [error, setError] = useState<Error | null>(null)
  
  const submitVote = async (voteData: VoteInput) => {
    // 投票処理
    // 楽観的UI更新
    // エラーハンドリング
  }
  
  return { submitVote, voting, voteResult, error }
}
```

### Step 4: 投票フォームコンポーネント（3時間）

#### 4.1 VoteFormコンポーネント
**テスト作成 (TDD First)**
`__tests__/components/VoteForm.test.tsx`
- [ ] フォームの初期表示テスト
- [ ] 団体選択のテスト
- [ ] スコア選択のテスト
- [ ] バリデーションエラーの表示テスト
- [ ] 送信処理のテスト
- [ ] 成功/エラーフィードバックのテスト

**実装**
`components/VoteForm.tsx`
```typescript
export function VoteForm() {
  // フォーム状態管理
  // バリデーション
  // 送信処理
  // フィードバック表示
}
```

#### 4.2 UIコンポーネント群
`components/ui/`
- [ ] SelectGroup - 団体選択ドロップダウン
- [ ] ScoreSelector - 点数選択（1-5の星評価）
- [ ] SubmitButton - 送信ボタン（ローディング状態付き）
- [ ] FeedbackMessage - 成功/エラーメッセージ
- [ ] VoteConfirmDialog - 投票確認ダイアログ

### Step 5: ページ実装（1.5時間）

#### 5.1 投票ページ
**実装**
`app/vote/page.tsx`
- [ ] レイアウト構成
- [ ] 投票フォームの配置
- [ ] 投票済み表示
- [ ] エラーバウンダリー

#### 5.2 ホームページの更新
`app/page.tsx`
- [ ] 投票ページへのナビゲーション
- [ ] 投票状態の表示

### Step 6: エラーハンドリングとUX（1.5時間）

#### 6.1 エラーハンドリング
- [ ] ネットワークエラー対応
- [ ] Firestore権限エラー対応
- [ ] タイムアウト処理
- [ ] リトライメカニズム

#### 6.2 UX改善
- [ ] ローディングスケルトン
- [ ] 楽観的UI更新
- [ ] アニメーション
- [ ] アクセシビリティ対応

## 🧪 テスト戦略

### 単体テスト
- サービス層の全メソッド
- カスタムフックの動作
- ユーティリティ関数

### 統合テスト
- Firestoreエミュレータを使用した実際のデータ操作
- コンポーネントとサービスの連携
- エンドツーエンドの投票フロー

### E2Eテスト（オプション）
- Cypressを使用した実際の投票フロー
- 複数デバイスからの同時投票

## 📁 ディレクトリ構造

```
form-live/
├── services/          # Firestoreサービス層
│   ├── groupService.ts
│   ├── voteService.ts
│   └── configService.ts
├── hooks/            # カスタムフック
│   ├── useGroups.ts
│   ├── useVote.ts
│   └── useDeviceId.ts
├── components/       # UIコンポーネント
│   ├── VoteForm.tsx
│   ├── GroupList.tsx
│   └── ui/
│       ├── SelectGroup.tsx
│       ├── ScoreSelector.tsx
│       └── FeedbackMessage.tsx
├── app/
│   ├── vote/
│   │   └── page.tsx
│   └── api/          # APIルート（必要に応じて）
│       └── votes/
└── __tests__/
    ├── services/
    ├── hooks/
    └── components/
```

## ⏱️ タイムライン

### Day 1（8時間）
- **午前（4時間）**
  - Step 1: Firestoreサービス層（2時間）
  - Step 2: 投票サービス層の前半（2時間）
- **午後（4時間）**
  - Step 2: 投票サービス層の後半（1時間）
  - Step 3: React Hooks（2時間）
  - Step 4: 投票フォームコンポーネントの前半（1時間）

### Day 2（4時間）
- **午前（2時間）**
  - Step 4: 投票フォームコンポーネントの後半（2時間）
- **午後（2時間）**
  - Step 5: ページ実装（1.5時間）
  - Step 6: エラーハンドリングとUXの前半（0.5時間）

### Day 3（2時間）
- Step 6: エラーハンドリングとUXの後半（1時間）
- 統合テストとバグ修正（1時間）

**合計: 約14時間（1.5-2日）**

## ✅ 完了条件

### 機能要件
- [ ] 団体リストから選択して投票できる
- [ ] 1-5点のスコアを付けられる
- [ ] 同一端末から同一団体への重複投票を防げる
- [ ] 投票結果がFirestoreに保存される
- [ ] 適切なフィードバックが表示される

### 非機能要件
- [ ] レスポンシブデザイン（モバイル最適化）
- [ ] 3秒以内の投票処理
- [ ] オフライン時の適切なエラー表示
- [ ] アクセシビリティ基準の準拠

### テスト要件
- [ ] カバレッジ80%以上
- [ ] E2Eテストで主要フローが通る
- [ ] Firestoreエミュレータでの動作確認

## 🚀 次のアクション

1. **Firebaseエミュレータのセットアップ**
```bash
npm install --save-dev @firebase/rules-unit-testing
npx firebase init emulators
```

2. **必要なパッケージのインストール**
```bash
npm install react-hook-form
npm install @radix-ui/react-select
npm install @radix-ui/react-dialog
```

3. **テストファイルの作成から開始**
```bash
mkdir -p __tests__/services
touch __tests__/services/groupService.test.ts
```

## 📝 注意事項

1. **Firestore Security Rules**
   - 開発中はテストモードで進める
   - 本番デプロイ前に適切なルールを設定

2. **エミュレータの使用**
   - 開発・テスト時は必ずエミュレータを使用
   - 本番Firestoreへの誤接続を防ぐ

3. **端末ID管理**
   - Phase 1で実装済みのDeviceIdManagerを活用
   - localStorageとFirestoreの整合性を保つ

4. **パフォーマンス**
   - 団体リストのキャッシュ
   - 投票処理の楽観的更新
   - 不要な再レンダリングの防止