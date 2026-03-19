"use client";

import { FormEvent, startTransition, useEffect, useEffectEvent, useState } from "react";

type SessionUser = {
  id: string;
  email: string;
  name: string | null;
};

type EventOption = {
  id: string;
  displayLabel: string;
  divisionName: string;
  categoryName: string;
  eventDate: string;
  weekdayLabel: string;
};

type EventSummary = {
  id: string;
  name: string;
  location: string;
  ticketUrl: string;
  ticketOptions: EventOption[];
};

type WatcherItem = {
  id: string;
  lastKnownStatus: "unknown" | "sold_out" | "available" | "error";
  lastCheckedAt: string | null;
  lastNotifiedAt: string | null;
  ticketOption: {
    eventName: string;
    displayLabel: string;
  };
};

type TimelineItem = {
  time: string;
  title: string;
  body: string;
};

const defaultTimeline: TimelineItem[] = [
  {
    time: "준비됨",
    title: "Email MVP 준비 완료",
    body: "회원 로그인, 관심 티켓 등록, 모니터링 실행 테스트까지 이 화면에서 확인할 수 있습니다.",
  },
];

function formatKoreanDate(value: string | null) {
  if (!value) {
    return "아직 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusMeta(status: WatcherItem["lastKnownStatus"]) {
  switch (status) {
    case "available":
      return { label: "구매 가능 감지", tone: "available" };
    case "sold_out":
      return { label: "매진 감시 중", tone: "soldout" };
    case "error":
      return { label: "확인 실패", tone: "soldout" };
    default:
      return { label: "첫 체크 대기", tone: "pending" };
  }
}

export default function Home() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("member@ticketwatch.kr");
  const [password, setPassword] = useState("password123");
  const [name, setName] = useState("Demo Member");
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [watchers, setWatchers] = useState<WatcherItem[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [timeline, setTimeline] = useState<TimelineItem[]>(defaultTimeline);
  const [feedback, setFeedback] = useState("로그인 후 관심 티켓을 저장해 보세요.");
  const [busy, setBusy] = useState(false);

  const loadEvents = useEffectEvent(async () => {
    const response = await fetch("/api/events", { cache: "no-store" });
    const data = await response.json();
    const nextEvents = data.items as EventSummary[];
    setEvents(nextEvents);
    setSelectedOptionId((current) => current || nextEvents[0]?.ticketOptions[0]?.id || "");
  });

  async function loadWatchers(userId: string) {
    const response = await fetch(`/api/watchers?userId=${userId}`, { cache: "no-store" });
    const data = await response.json();
    setWatchers(data.items as WatcherItem[]);
  }

  const loadSession = useEffectEvent(async () => {
    const response = await fetch("/api/auth/me", { cache: "no-store" });

    if (!response.ok) {
      setSessionUser(null);
      setWatchers([]);
      return;
    }

    const data = await response.json();
    setSessionUser(data.user);
    await loadWatchers(data.user.id);
  });

  useEffect(() => {
    startTransition(() => {
      void loadEvents();
      void loadSession();
    });
  }, []);

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload =
      mode === "login"
        ? { email, password }
        : {
            email,
            password,
            name,
          };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      setFeedback(data.error ?? "요청에 실패했습니다.");
      setBusy(false);
      return;
    }

    setSessionUser(data.user);
    await loadWatchers(data.user.id);
    setTimeline((current) => [
      {
        time: "방금",
        title: mode === "login" ? "로그인 성공" : "회원가입 완료",
        body: `${data.user.email} 계정으로 대시보드를 불러왔습니다.`,
      },
      ...current,
    ]);
    setFeedback(mode === "login" ? "로그인되었습니다." : "회원가입 후 바로 로그인되었습니다.");
    setBusy(false);
  }

  async function handleAddWatcher() {
    if (!sessionUser || !selectedOptionId) {
      setFeedback("로그인 후 티켓 옵션을 선택해 주세요.");
      return;
    }

    setBusy(true);
    const response = await fetch("/api/watchers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: sessionUser.id,
        ticketOptionId: selectedOptionId,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setFeedback(data.error ?? "관심 티켓 저장에 실패했습니다.");
      setBusy(false);
      return;
    }

    await loadWatchers(sessionUser.id);

    const pickedOption = events
      .flatMap((item) => item.ticketOptions)
      .find((option) => option.id === selectedOptionId);

    setTimeline((current) => [
      {
        time: "방금",
        title: "관심 티켓 저장",
        body: `${pickedOption?.displayLabel ?? "선택한 옵션"} 조건을 모니터링 목록에 추가했습니다.`,
      },
      ...current,
    ]);
    setFeedback("관심 티켓이 저장되었습니다.");
    setBusy(false);
  }

  async function handleMonitorRun() {
    setBusy(true);
    const response = await fetch("/api/jobs/run-monitor", { method: "POST" });
    const data = await response.json();

    setTimeline((current) => [
      {
        time: "방금",
        title: "모니터링 실행",
        body: `${data.checkedOptionsCount}개 옵션을 확인했고 ${data.notificationsQueued}건의 알림 큐를 계산했습니다.`,
      },
      ...current,
    ]);
    setFeedback("모니터링 테스트를 실행했습니다.");

    if (sessionUser) {
      await loadWatchers(sessionUser.id);
    }

    setBusy(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setSessionUser(null);
    setWatchers([]);
    setFeedback("로그아웃되었습니다.");
  }

  const ticketOptions = events.flatMap((item) => item.ticketOptions);

  return (
    <main className="app-shell">
      <section className="topbar">
        <div className="brand">
          <div className="brand-mark">HW</div>
          <div>
            <p className="eyebrow">Email-first MVP</p>
            <h1>HYROX Ticket Watch</h1>
            <p className="subtle">
              회원이 원하는 HYROX 티켓 조건을 저장하고, 구매 가능 상태를 이메일로 받는 모니터링 서비스
            </p>
          </div>
        </div>
        <div className="topbar-pills">
          <span className="pill">09:00 / 12:00 / 15:00 / 18:00 / 21:00 KST</span>
          <span className="pill">{sessionUser ? sessionUser.email : "Guest mode"}</span>
        </div>
      </section>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Sold-out ticket monitoring</p>
          <h2>매진된 HYROX 티켓을 대신 지켜보다가, 풀리는 순간 회원에게 이메일을 보냅니다.</h2>
          <p className="hero-body">
            지금 버전은 mock 데이터와 쿠키 세션으로 실제 흐름을 바로 테스트할 수 있게 만든 MVP입니다.
            다음 단계에서 Postgres, Playwright, Resend를 연결하면 운영형 서비스로 확장할 수 있습니다.
          </p>
          <div className="hero-actions">
            <button className="button button-primary" onClick={handleMonitorRun} type="button" disabled={busy}>
              모니터링 실행 테스트
            </button>
            {sessionUser ? (
              <button className="button button-secondary" onClick={handleLogout} type="button">
                로그아웃
              </button>
            ) : null}
          </div>
          <p className="hero-note">{feedback}</p>
        </div>
        <div className="hero-metrics">
          <article className="metric-card">
            <strong>5회</strong>
            <span>하루 자동 체크 횟수</span>
          </article>
          <article className="metric-card">
            <strong>{watchers.length || 0}</strong>
            <span>현재 등록된 관심 티켓</span>
          </article>
          <article className="metric-card">
            <strong>{events[0]?.ticketOptions.length || 0}</strong>
            <span>데모 이벤트 옵션 수</span>
          </article>
        </div>
      </section>

      <section className="content-grid">
        <article className="card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Account</p>
              <h3>{sessionUser ? "회원 상태" : "로그인 / 회원가입"}</h3>
            </div>
            <span className="chip">{sessionUser ? "쿠키 세션 활성" : "Demo auth"}</span>
          </div>

          {sessionUser ? (
            <div className="auth-summary">
              <div className="watcher-card">
                <h4>{sessionUser.name ?? "회원"}</h4>
                <p>{sessionUser.email}</p>
                <div className="meta-row">
                  <span className="meta-pill">로그인 완료</span>
                  <span className="meta-pill">Email 알림 사용</span>
                </div>
              </div>
            </div>
          ) : (
            <form className="form-stack" onSubmit={handleAuthSubmit}>
              <div className="toggle-row">
                <button
                  className={`toggle-pill ${mode === "login" ? "toggle-pill-active" : ""}`}
                  onClick={() => setMode("login")}
                  type="button"
                >
                  로그인
                </button>
                <button
                  className={`toggle-pill ${mode === "register" ? "toggle-pill-active" : ""}`}
                  onClick={() => setMode("register")}
                  type="button"
                >
                  회원가입
                </button>
              </div>
              <label className="field">
                이메일
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
              </label>
              {mode === "register" ? (
                <label className="field">
                  이름
                  <input value={name} onChange={(event) => setName(event.target.value)} type="text" />
                </label>
              ) : null}
              <label className="field">
                비밀번호
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                />
              </label>
              <button className="button button-primary button-block" disabled={busy} type="submit">
                {mode === "login" ? "로그인" : "회원가입"}
              </button>
            </form>
          )}
        </article>

        <article className="card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Ticket setup</p>
              <h3>관심 티켓 등록</h3>
            </div>
            <span className="chip">Mock API</span>
          </div>
          <div className="form-stack">
            <label className="field">
              이벤트 옵션
              <select value={selectedOptionId} onChange={(event) => setSelectedOptionId(event.target.value)}>
                {ticketOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.displayLabel}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="button button-primary button-block"
              disabled={!sessionUser || !selectedOptionId || busy}
              onClick={handleAddWatcher}
              type="button"
            >
              관심 티켓 저장
            </button>
            <p className="subtle">
              실제 운영 버전에서는 회원별 이메일, 우선순위, 이벤트별 여러 옵션 저장까지 확장할 수 있습니다.
            </p>
          </div>
        </article>
      </section>

      <section className="content-grid" id="dashboard">
        <article className="card card-large">
          <div className="section-head">
            <div>
              <p className="eyebrow">Member dashboard</p>
              <h3>내 모니터링 목록</h3>
            </div>
            <span className="chip chip-dark">{sessionUser ? "실제 API 연동 중" : "로그인 필요"}</span>
          </div>
          <div className="watcher-stack">
            {watchers.length ? (
              watchers.map((watcher) => {
                const meta = statusMeta(watcher.lastKnownStatus);

                return (
                  <article className="watcher-card" key={watcher.id}>
                    <div className="watcher-top">
                      <div>
                        <h4>{watcher.ticketOption.eventName}</h4>
                        <p>{watcher.ticketOption.displayLabel}</p>
                      </div>
                      <span className={`status status-${meta.tone}`}>{meta.label}</span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-pill">마지막 확인 {formatKoreanDate(watcher.lastCheckedAt)}</span>
                      <span className="meta-pill">마지막 알림 {formatKoreanDate(watcher.lastNotifiedAt)}</span>
                    </div>
                  </article>
                );
              })
            ) : (
              <article className="watcher-card">
                <h4>아직 등록된 티켓이 없습니다.</h4>
                <p>로그인 후 원하는 HYROX 티켓 옵션을 저장하면 이 영역에 나타납니다.</p>
              </article>
            )}
          </div>
        </article>

        <article className="card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Activity</p>
              <h3>알림 이력</h3>
            </div>
            <span className="chip">Run monitor demo</span>
          </div>
          <div className="timeline">
            {timeline.map((item) => (
              <div className="timeline-item" key={`${item.time}-${item.title}`}>
                <strong>{item.time}</strong>
                <div>
                  <h4>{item.title}</h4>
                  <p>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="content-grid">
        <article className="card card-large">
          <div className="section-head">
            <div>
              <p className="eyebrow">API inventory</p>
              <h3>현재 연결된 엔드포인트</h3>
            </div>
            <span className="chip">Next Route Handlers</span>
          </div>
          <div className="api-stack">
            <div className="api-item">
              <strong>POST /api/auth/register</strong>
              <p>회원 가입 후 쿠키 세션을 발급합니다.</p>
            </div>
            <div className="api-item">
              <strong>POST /api/auth/login</strong>
              <p>로그인 후 `hyrox_ticket_watch_session` 쿠키를 설정합니다.</p>
            </div>
            <div className="api-item">
              <strong>GET /api/auth/me</strong>
              <p>현재 로그인된 회원 정보를 반환합니다.</p>
            </div>
            <div className="api-item">
              <strong>GET/POST /api/watchers</strong>
              <p>관심 티켓 목록 조회와 신규 등록을 처리합니다.</p>
            </div>
          </div>
        </article>

        <article className="card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Event source</p>
              <h3>데모 이벤트</h3>
            </div>
          </div>
          <div className="api-stack">
            {events.map((event) => (
              <div className="api-item" key={event.id}>
                <strong>{event.name}</strong>
                <p>{event.location}</p>
                <p>{event.ticketOptions.length}개 티켓 옵션 준비됨</p>
                <a className="inline-link" href={event.ticketUrl} rel="noreferrer" target="_blank">
                  공식 티켓 페이지 열기
                </a>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
