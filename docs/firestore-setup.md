# Firestore データベース設定手順

## 1. Firebaseコンソールでの設定

### Security Rulesの適用
1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. プロジェクト「form-live」を選択
3. 左メニューから「Firestore Database」を選択
4. 「ルール」タブをクリック
5. `firestore.rules`の内容をコピーして貼り付け
6. 「公開」をクリック

### インデックスの作成
1. Firestoreの「インデックス」タブを選択
2. 以下のインデックスを手動で作成：
   - コレクション: `votes`
     - フィールド: `groupId` (昇順), `createdAt` (降順)
     - フィールド: `deviceId` (昇順), `createdAt` (降順)
   - コレクション: `results`
     - フィールド: `rank` (昇順), `updatedAt` (降順)

## 2. 初期データの作成

### groupsコレクション
Firebaseコンソールで以下のドキュメントを作成：

```json
// Document ID: auto-generated
{
  "name": "団体A",
  "createdAt": Timestamp
}

// Document ID: auto-generated
{
  "name": "団体B",
  "createdAt": Timestamp
}

// Document ID: auto-generated
{
  "name": "団体C",
  "createdAt": Timestamp
}
```

### configコレクション
```json
// Document ID: "settings"
{
  "currentGroup": "団体A",
  "votingEnabled": true,
  "updatedAt": Timestamp
}
```

## 3. Firebase CLIでの自動デプロイ（オプション）

Firebase CLIをインストール済みの場合：

```bash
# Firebase CLIのインストール
npm install -g firebase-tools

# ログイン
firebase login

# プロジェクト初期化
firebase init firestore

# Security Rulesのデプロイ
firebase deploy --only firestore:rules

# インデックスのデプロイ
firebase deploy --only firestore:indexes
```

## 4. 動作確認

開発環境で以下を確認：
1. `npm run dev`でアプリケーションを起動
2. ブラウザのコンソールでエラーがないことを確認
3. Firebaseコンソールでデータの読み書きを監視

## セキュリティに関する注意事項

- 本番環境では、より厳格なSecurity Rulesを設定してください
- 管理者権限の付与は、Firebase Admin SDKまたはカスタムクレームで行います
- APIキーは環境変数で管理し、公開リポジトリにコミットしないでください