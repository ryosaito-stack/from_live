# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Conversation Guidelines

- 常に日本語で会話する

## Development Philosophy

### Test-Driven Development (TDD)

- 原則としてテスト駆動開発（TDD）で進める
- 期待される入出力に基づき、まずテストを作成する
- 実装コードは書かず、テストのみを用意する
- テストを実行し、失敗を確認する
- テストが正しいことを確認できた段階でコミットする
- その後、テストをパスさせる実装を進める
- 実装中はテストを変更せず、コードを修正し続ける
- すべてのテストが通過するまで繰り返す

## Project Overview

This is a real-time voting and tallying system built with Next.js 15 and Firebase Firestore. The application allows anonymous voting through mobile browsers with device-based vote limiting and displays real-time aggregated results.

## Development Commands

```bash
# Start development server on port 3002
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Architecture

### Core Technologies
- **Frontend**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript with strict mode enabled
- **Database**: Firebase Firestore (planned)
- **Authentication**: Firebase Authentication for admin access (planned)

### Project Structure
- `/app` - Next.js App Router pages and layouts
- `/public` - Static assets
- `@/*` import alias maps to the project root

### Key System Components (Planned)

1. **Voting System**
   - Anonymous voting via mobile browsers
   - Device-based voting limitation (1 vote per device per group)
   - Device ID stored in localStorage as UUID

2. **Data Collections in Firestore**
   - `votes` - Voting history (groupId, score, deviceId, createdAt)
   - `groups` - Group/organization list
   - `results` - Aggregated results cache (updated every minute)
   - `config` - System configuration

3. **Real-time Updates**
   - Results aggregated every minute via Cloud Functions or Firestore triggers
   - User interface polls `results` collection every minute
   - Shows "Tallying..." message during updates

4. **Admin Panel**
   - Manages groups/organizations
   - Views voting history
   - Monitors aggregated results
   - Protected by Firebase Authentication

## Important Notes

- Development server runs on port **3002** (not the default 3000)
- Node.js version requirement: ^18.18.0 || ^19.8.0 || >= 20.0.0
- The project includes a detailed requirements document in Japanese: `要件定義書.md`