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

またはDockerを使用する場合：

- Docker
- Docker Compose

## インストール

### 通常のインストール

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

### Dockerを使用したインストール

1. リポジトリをクローンする：
   ```bash
   git clone <repository-url>
   cd LaboMachineTable
   ```

2. データベース用のディレクトリを作成する：
   ```bash
   mkdir -p ./data
   ```

3. Docker Composeで起動する：
   ```bash
   docker-compose up -d
   ```

アプリケーションは http://localhost:5001 でアクセスできます。

#### Dockerでのデータベース永続化

データベースファイルは `./data` ディレクトリにマウントされており、コンテナを削除してもデータは保持されます。この設計により、アプリケーションのバージョンアップ時にもデータを失うことなく更新できます。

#### バージョンアップ方法

新しいバージョンのイメージに更新する場合：

```bash
# 新しいイメージをビルド
docker-compose build --no-cache

# コンテナを再起動
docker-compose up -d
```

Docker Hubなどのレジストリからイメージを取得する場合：

```bash
# 新しいイメージをプル
docker pull <your-registry>/labomachine:latest

# コンテナを再起動
docker-compose up -d
```

#### Docker環境の設定

環境変数は `.env` ファイルで設定できます。`.env.example` をコピーして使用してください：

```bash
cp .env.example .env
```

主要な環境変数：
- `JWT_SECRET`: JWT認証用の秘密鍵（本番環境では必ず変更してください）
- `DATABASE_DIR`: データベースファイルの保存先ディレクトリ（デフォルト: `./data`）
- `PORT`: アプリケーションのポート番号（デフォルト: 5001）

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
