## HYROX Ticket Watch

HYROX sold-out ticket monitoring service for members.

현재 포함된 범위:

- Next.js App Router 기반 웹앱
- 회원용 대시보드 첫 화면
- `GET /api/events`
- `GET /api/watchers`
- `POST /api/watchers`
- `POST /api/auth/register`
- Prisma 스키마 초안
- 이메일 알림 MVP를 위한 데이터 구조

## Getting Started

프로젝트 루트에서 로컬 Node 런타임을 먼저 활성화합니다.

```bash
source ../use-local-node.sh
```

그 다음 앱 폴더에서 실행합니다.

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 열면 됩니다.

## Environment

`.env.example`을 참고해 `.env`를 만듭니다.

```bash
cp .env.example .env
```

## Database

Prisma 스키마는 `prisma/schema.prisma` 에 있습니다.

DB 연결 후 사용할 명령:

```bash
npm run db:generate
npm run db:push
```

현재 API는 DB 미연결 상태에서도 화면 개발이 가능하도록 mock 모드로 응답합니다.

## Next Steps

- Prisma 실제 연결
- 로그인 세션 구현
- 관심 티켓 CRUD UI 연결
- Playwright 수집기 추가
- Resend 이메일 발송 연결
