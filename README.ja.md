# LaboMachineTable - 実験室装置予約システム

LaboMachineTableは、実験室装置の予約プロセスを管理し効率化するために設計されたWebアプリケーションです。このシステムにより、ユーザーは装置の利用状況を確認し、予約を行い、装置とユーザーデータを管理できます。

## 機能

- 新規ユーザーの自動登録機能を備えたユーザー認証
- 装置管理（装置の追加、編集、削除）
- ユーザー管理（ユーザーの追加、編集、削除）
- 装置の視覚的なレイアウト表示
- カレンダーベースの予約システム
- 時間枠選択（30分間隔）
- 予約の重複防止機能

## 技術スタック

- **フロントエンド**：JavaScript、React
- **バックエンド**：Node.js、Express
- **データベース**：SQLite

## 前提条件

- Node.js（v14.x以上）
- npm（v6.x以上）

## インストール

1. リポジトリをクローンする：
   ```bash
   git clone <repository-url>
   cd LaboMachineTable
   ```

2. 依存関係をインストールする：
   ```bash
   # ルートの依存関係をインストール
   npm install

   # クライアントの依存関係をインストール
   cd client
   npm install

   # サーバーの依存関係をインストール
   cd ../server
   npm install
   ```

3. データベースをセットアップする：
   ```bash
   cd ../server
   npm run db:setup
   ```

## 開発

開発サーバーを起動する：

```bash
# 開発モードでクライアントとサーバーの両方を起動
npm run dev
```

- フロントエンドは次のURLで利用可能：http://localhost:3000
- バックエンドAPIは次のURLで利用可能：http://localhost:5001

## プロジェクト構造

```
LaboMachineTable/
├── client/                 # フロントエンドReactアプリケーション
├── server/                 # バックエンドNode.js/Expressアプリケーション
├── database/               # データベースファイルとマイグレーション
├── .gitignore              # Gitの無視ファイル
├── package.json            # スクリプト用のルートpackage.json
├── README.md               # プロジェクトドキュメント（英語）
└── README.ja.md            # プロジェクトドキュメント（日本語）
```

## ライセンス

[MIT](LICENSE)
