# テストガイド / Testing Guide

このドキュメントでは、LaboMachineTableプロジェクトのテストスイートについて説明します。

## テストの概要 / Test Overview

プロジェクトには以下のテストが含まれています：

### クライアント側テスト (Client-side Tests)
- **ユニットテスト**: コンポーネントと関数のテスト
- **統合テスト**: アプリケーション全体のフローテスト
- **使用技術**: Jest, React Testing Library

### サーバー側テスト (Server-side Tests)
- **ユニットテスト**: ルート、ミドルウェア、ユーティリティ関数のテスト
- **統合テスト**: API エンドポイントのフローテスト
- **使用技術**: Jest, Supertest

## テストの実行方法 / Running Tests

### 全てのテストを実行 (Run All Tests)
```bash
npm test
```

### クライアント側テストのみ実行 (Client Tests Only)
```bash
npm run test:client
```

### サーバー側テストのみ実行 (Server Tests Only)
```bash
npm run test:server
```

### カバレッジレポート付きでテスト実行 (With Coverage Report)
```bash
npm run test:coverage
```

### 個別にテスト実行 (Individual Test Execution)

#### クライアント側
```bash
cd client
npm test                    # インタラクティブモード
npm run test:coverage       # カバレッジ付き
npm run test:ci            # CI用（一回のみ実行）
```

#### サーバー側
```bash
cd server
npm test                    # 全テスト実行
npm run test:watch          # ウォッチモード
npm run test:coverage       # カバレッジ付き
npm run test:ci            # CI用
```

## テストファイルの構成 / Test File Structure

### クライアント側 (Client-side)
```
client/src/
├── components/__tests__/
│   ├── Navigation.test.js
│   └── ReservationWindow.test.js
├── contexts/__tests__/
│   └── AuthContext.test.js
├── pages/__tests__/
│   └── LoginPage.test.js
├── utils/__tests__/
│   └── translate.test.js
└── __tests__/
    └── App.integration.test.js
```

### サーバー側 (Server-side)
```
server/
├── __tests__/
│   ├── integration/
│   │   └── api.integration.test.js
│   ├── middleware/
│   │   └── auth.test.js
│   ├── routes/
│   │   ├── auth.test.js
│   │   └── equipment.test.js
│   ├── utils/
│   │   └── auth.test.js
│   └── setup.js
└── jest.config.js
```

## テストカバレッジ / Test Coverage

テストカバレッジの目標：
- **総合カバレッジ**: 70%以上
- **重要な機能**: 90%以上
- **認証機能**: 95%以上

### カバレッジレポートの確認 (Viewing Coverage Reports)

カバレッジレポートは以下の場所に生成されます：
- クライアント: `client/coverage/`
- サーバー: `server/coverage/`

HTMLレポートを確認するには：
```bash
# クライアント側
open client/coverage/lcov-report/index.html

# サーバー側
open server/coverage/lcov-report/index.html
```

## テストの詳細 / Test Details

### 1. コンポーネントテスト (Component Tests)

#### Navigation.test.js
- ナビゲーションメニューの表示/非表示
- ログアウト機能
- ユーザー情報の表示

#### ReservationWindow.test.js
- 予約ウィンドウの表示
- 時間枠の選択
- API呼び出しのテスト

#### LoginPage.test.js
- ログインフォームの入力
- バリデーション
- エラーハンドリング

### 2. 認証テスト (Authentication Tests)

#### AuthContext.test.js
- ログイン/ログアウト機能
- トークンの管理
- ローカルストレージの処理

#### auth.test.js (middleware)
- JWTトークンの検証
- 認証エラーの処理
- セキュリティチェック

### 3. API テスト (API Tests)

#### auth.test.js (routes)
- ログインAPI
- ユーザー登録API
- トークン生成

#### equipment.test.js
- 装置の CRUD 操作
- 権限チェック
- エラーハンドリング

### 4. 統合テスト (Integration Tests)

#### App.integration.test.js
- アプリケーション全体のフロー
- ルーティング
- 認証フロー

#### api.integration.test.js
- API エンドポイント間の連携
- データベース操作
- エラー処理

## モック (Mocking)

### クライアント側
- **axios**: API呼び出しのモック
- **translate**: 翻訳関数のモック
- **AuthContext**: 認証コンテキストのモック

### サーバー側
- **database functions**: データベース操作のモック
- **bcrypt**: パスワードハッシュのモック
- **jsonwebtoken**: JWT生成のモック

## CI/CD での実行 / Running in CI/CD

GitHub Actions や他のCI/CDシステムでテストを実行する場合：

```bash
# 全テストをCI環境で実行
npm run test:coverage

# または個別に実行
npm run test:server
npm run test:client
```

## トラブルシューティング / Troubleshooting

### よくある問題 (Common Issues)

1. **テストがタイムアウトする**
   ```bash
   # タイムアウト時間を増やす
   jest --testTimeout=10000
   ```

2. **モックが正しく動作しない**
   - `jest.clearAllMocks()` を beforeEach で呼び出す
   - モックの設定を確認する

3. **カバレッジが低い**
   - テストされていないファイルを確認
   - エッジケースのテストを追加

### デバッグ (Debugging)

テストのデバッグ：
```bash
# Verbose モードで実行
npm test -- --verbose

# 特定のテストファイルのみ実行
npm test -- auth.test.js

# ウォッチモードで実行
npm run test:watch
```

## 新しいテストの追加 / Adding New Tests

新しいテストを追加する際の指針：

1. **ファイル命名**: `*.test.js` または `*.spec.js`
2. **配置場所**: テスト対象と同じディレクトリの `__tests__` フォルダ
3. **テスト内容**: 
   - 正常ケース
   - エラーケース
   - エッジケース
   - バリデーション

### テストケースの例 (Test Case Example)

```javascript
describe('Component/Function Name', () => {
  beforeEach(() => {
    // セットアップ
  });

  test('should handle normal case', () => {
    // 正常ケースのテスト
  });

  test('should handle error case', () => {
    // エラーケースのテスト
  });

  test('should validate input', () => {
    // バリデーションのテスト
  });
});
```

## パフォーマンステスト / Performance Testing

大規模なデータセットや高負荷でのテストについては、別途パフォーマンステストスイートの実装を検討してください。

---

テストに関する質問や問題がある場合は、プロジェクトのイシュートラッカーまたはドキュメントを確認してください。