# HYROX Monitor Backend Blueprint

## 개요

이 문서는 `hyrox-monitor-app.html` 프로토타입을 실제 웹 서비스로 전환하기 위한 백엔드 기준서다.

대상 MVP:

- 이메일 회원가입 / 로그인
- 관심 티켓 조건 저장
- 스케줄 기반 모니터링
- `sold_out -> available` 변화 감지
- 이메일 알림 발송

## 권장 런타임

- `Next.js`
- `TypeScript`
- `PostgreSQL`
- `Prisma`
- `Playwright`
- `Resend`

## 데이터베이스 스키마 초안

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text,
  email_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  event_url text not null,
  ticket_url text not null,
  location text,
  start_date date,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ticket_options (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  event_date date not null,
  weekday_label text not null,
  division_code text not null,
  division_name text not null,
  category_code text not null,
  category_name text not null,
  display_label text not null,
  source_selector jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, event_date, division_code, category_code)
);

create table ticket_watchers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  ticket_option_id uuid not null references ticket_options(id) on delete cascade,
  is_active boolean not null default true,
  last_known_status text not null default 'unknown',
  last_checked_at timestamptz,
  last_notified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, ticket_option_id)
);

create table monitor_runs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  status text not null default 'running',
  checked_options_count integer not null default 0,
  available_count integer not null default 0,
  sold_out_count integer not null default 0,
  error_count integer not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error_message text
);

create table ticket_status_logs (
  id uuid primary key default gen_random_uuid(),
  ticket_option_id uuid not null references ticket_options(id) on delete cascade,
  monitor_run_id uuid not null references monitor_runs(id) on delete cascade,
  status text not null,
  raw_text text,
  source_payload jsonb,
  captured_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  ticket_watcher_id uuid not null references ticket_watchers(id) on delete cascade,
  channel text not null default 'email',
  status text not null default 'queued',
  recipient text not null,
  subject text not null,
  payload jsonb,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);
```

## 상태 enum 제안

```ts
type TicketStatus = "unknown" | "sold_out" | "available" | "error";
type MonitorRunStatus = "running" | "success" | "partial_failure" | "failed";
type NotificationStatus = "queued" | "sent" | "failed";
```

## API 계약 초안

### 인증

#### POST /api/auth/register

요청:

```json
{
  "email": "member@ticketwatch.kr",
  "password": "password123",
  "name": "회원"
}
```

응답:

```json
{
  "user": {
    "id": "uuid",
    "email": "member@ticketwatch.kr",
    "name": "회원"
  }
}
```

#### POST /api/auth/login

요청:

```json
{
  "email": "member@ticketwatch.kr",
  "password": "password123"
}
```

응답:

```json
{
  "user": {
    "id": "uuid",
    "email": "member@ticketwatch.kr"
  },
  "session": {
    "expiresAt": "2026-03-20T00:00:00.000Z"
  }
}
```

### 회원용 모니터링

#### GET /api/watchers

응답:

```json
{
  "items": [
    {
      "id": "uuid",
      "eventName": "HYROX Incheon",
      "eventDate": "2026-05-16",
      "weekdayLabel": "토",
      "divisionName": "Men Singles",
      "categoryName": "Open",
      "lastKnownStatus": "sold_out",
      "lastCheckedAt": "2026-03-19T00:00:00.000Z",
      "lastNotifiedAt": null
    }
  ]
}
```

#### POST /api/watchers

요청:

```json
{
  "ticketOptionId": "uuid"
}
```

응답:

```json
{
  "id": "uuid",
  "lastKnownStatus": "unknown",
  "lastCheckedAt": null
}
```

#### DELETE /api/watchers/:id

동작:

- soft delete 대신 `is_active = false` 권장

### 이벤트 / 옵션

#### GET /api/events

응답:

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "HYROX Incheon",
      "ticketOptions": [
        {
          "id": "uuid",
          "eventDate": "2026-05-16",
          "divisionName": "Men Singles",
          "categoryName": "Open",
          "displayLabel": "2026-05-16 (토) / Men Singles / Open"
        }
      ]
    }
  ]
}
```

### 내부 작업용 엔드포인트

#### POST /api/jobs/run-monitor

보호:

- cron 전용 secret 필요

흐름:

1. 활성 이벤트 조회
2. 각 이벤트별 티켓 옵션 수집
3. 상태 로그 저장
4. watcher 상태 업데이트
5. 알림 대상 계산
6. 이메일 발송

응답:

```json
{
  "runId": "uuid",
  "status": "success",
  "checkedOptionsCount": 12,
  "notificationsQueued": 2
}
```

## 모니터링 서비스 인터페이스

```ts
type ScrapedOption = {
  eventDate: string;
  divisionCode: string;
  categoryCode: string;
  availabilityText: string;
  normalizedStatus: "sold_out" | "available" | "error";
  purchaseUrl?: string;
};

type MonitorResult = {
  eventSlug: string;
  capturedAt: string;
  options: ScrapedOption[];
};
```

## 상태 비교 로직

```ts
function shouldNotify(previousStatus: TicketStatus, nextStatus: TicketStatus) {
  return previousStatus === "sold_out" && nextStatus === "available";
}
```

초기 전략:

- `unknown -> available` 는 즉시 발송하지 않는다.
- 첫 수집에서는 기준 상태를 쌓는다.
- 이후 변화부터 알림을 보낸다.

## 이메일 템플릿 필드

```ts
type TicketAvailableEmail = {
  memberEmail: string;
  eventName: string;
  eventDate: string;
  weekdayLabel: string;
  divisionName: string;
  categoryName: string;
  purchaseUrl: string;
  detectedAtKst: string;
};
```

## cron 스케줄 예시

한국시간 고정:

- `09:00`
- `12:00`
- `15:00`
- `18:00`
- `21:00`

서버가 UTC 기준이면 아래처럼 변환해서 설정한다.

- KST 09:00 = UTC 00:00
- KST 12:00 = UTC 03:00
- KST 15:00 = UTC 06:00
- KST 18:00 = UTC 09:00
- KST 21:00 = UTC 12:00

## 구현 우선순위

1. 인증과 세션
2. 이벤트 및 티켓 옵션 시드 데이터
3. watcher CRUD
4. Playwright 수집기
5. 상태 변화 감지
6. 이메일 발송
7. 관리자 로그 화면

## 런타임 준비 후 첫 작업 목록

런타임이 준비되면 아래 순서로 바로 착수한다.

1. `npx create-next-app`
2. `Prisma`와 `PostgreSQL` 연결
3. 인증 기본 플로우 구현
4. watcher 화면 구현
5. mock 데이터 대신 실DB 연결
6. cron 엔드포인트와 수집기 연결
