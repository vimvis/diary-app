export default function Home() {
  const watchers = [
    {
      title: "HYROX Incheon",
      schedule: "2026-05-16 (토) · Men Singles · Open",
      status: "매진 감시 중",
      tone: "soldout",
      checkedAt: "마지막 확인 2026-03-19 09:00 KST",
      notifyAt: "마지막 알림 없음",
    },
    {
      title: "HYROX Incheon",
      schedule: "2026-05-17 (일) · Mixed Doubles · Open",
      status: "구매 가능 감지",
      tone: "available",
      checkedAt: "마지막 확인 2026-03-19 09:00 KST",
      notifyAt: "마지막 알림 2026-03-19 09:01 KST",
    },
    {
      title: "HYROX Incheon",
      schedule: "2026-05-16 (토) · Pro Men · Pro",
      status: "첫 체크 대기",
      tone: "pending",
      checkedAt: "다음 체크 2026-03-19 12:00 KST",
      notifyAt: "기준 상태 수집 예정",
    },
  ];

  const timeline = [
    {
      time: "09:01",
      title: "이메일 발송 완료",
      body: "Mixed Doubles Open 티켓이 구매 가능 상태로 바뀌어 member@ticketwatch.kr 로 알림을 보냈습니다.",
    },
    {
      time: "09:00",
      title: "모니터링 실행",
      body: "HYROX Incheon 티켓 페이지를 수집해 12개 옵션 상태를 새로 저장했습니다.",
    },
    {
      time: "전날 21:00",
      title: "재시도 예약",
      body: "페이지 렌더링 실패를 감지해 다음 실행에서 셀렉터를 재검증하도록 표시했습니다.",
    },
  ];

  const jobs = [
    {
      name: "morning sweep",
      status: "success",
      tone: "available",
      count: "12 options",
      time: "2026-03-19 09:00 KST",
    },
    {
      name: "noon sweep",
      status: "running",
      tone: "pending",
      count: "12 options",
      time: "2026-03-19 12:00 KST",
    },
    {
      name: "evening retry",
      status: "retry queued",
      tone: "soldout",
      count: "0 options",
      time: "2026-03-18 21:00 KST",
    },
  ];

  return (
    <main className="app-shell">
      <section className="topbar">
        <div className="brand">
          <div className="brand-mark">HW</div>
          <div>
            <p className="eyebrow">Email-first MVP</p>
            <h1>HYROX Ticket Watch</h1>
            <p className="subtle">
              회원이 원하는 티켓 조건을 저장해두고, 구매 가능 상태를 이메일로 바로 받는 모니터링 서비스
            </p>
          </div>
        </div>
        <div className="topbar-pills">
          <span className="pill">09:00 / 12:00 / 15:00 / 18:00 / 21:00 KST</span>
          <span className="pill">HYROX Incheon MVP</span>
        </div>
      </section>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Sold-out ticket monitoring</p>
          <h2>매진된 HYROX 티켓을 대신 지켜보다가, 풀리는 순간 회원에게 이메일을 보냅니다.</h2>
          <p className="hero-body">
            운영자는 한 번의 수집으로 여러 회원의 관심 조건을 동시에 처리하고, 회원은 로그인 후 원하는
            티켓만 골라 저장합니다. 카카오 연동 전에도 이메일만으로 충분히 빠른 MVP를 만들 수 있습니다.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#dashboard">
              대시보드 보기
            </a>
            <a className="button button-secondary" href="#architecture">
              구현 구조 보기
            </a>
          </div>
        </div>
        <div className="hero-metrics">
          <article className="metric-card">
            <strong>5회</strong>
            <span>하루 자동 체크 횟수</span>
          </article>
          <article className="metric-card">
            <strong>3시간</strong>
            <span>정시 실행 간격</span>
          </article>
          <article className="metric-card">
            <strong>1회</strong>
            <span>상태 변화당 알림 원칙</span>
          </article>
        </div>
      </section>

      <section className="content-grid" id="dashboard">
        <article className="card card-large">
          <div className="section-head">
            <div>
              <p className="eyebrow">Member dashboard</p>
              <h3>내 모니터링 목록</h3>
            </div>
            <span className="chip chip-dark">실시간 대신 정시 체크</span>
          </div>
          <div className="watcher-stack">
            {watchers.map((watcher) => (
              <article className="watcher-card" key={watcher.schedule}>
                <div className="watcher-top">
                  <div>
                    <h4>{watcher.title}</h4>
                    <p>{watcher.schedule}</p>
                  </div>
                  <span className={`status status-${watcher.tone}`}>{watcher.status}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-pill">{watcher.checkedAt}</span>
                  <span className="meta-pill">{watcher.notifyAt}</span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Notification flow</p>
              <h3>알림 이력</h3>
            </div>
            <span className="chip">Resend 예정</span>
          </div>
          <div className="timeline">
            {timeline.map((item) => (
              <div className="timeline-item" key={item.time + item.title}>
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
              <p className="eyebrow">Operator panel</p>
              <h3>관리자 체크 로그</h3>
            </div>
            <span className="chip">Playwright + cron</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>작업</th>
                  <th>상태</th>
                  <th>체크 수</th>
                  <th>실행 시각</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.name}>
                    <td>{job.name}</td>
                    <td>
                      <span className={`status status-${job.tone}`}>{job.status}</span>
                    </td>
                    <td>{job.count}</td>
                    <td>{job.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card" id="architecture">
          <div className="section-head">
            <div>
              <p className="eyebrow">Implementation</p>
              <h3>백엔드 연결 포인트</h3>
            </div>
          </div>
          <div className="api-stack">
            <div className="api-item">
              <strong>POST /api/auth/register</strong>
              <p>이메일과 비밀번호로 회원을 만들고 세션을 발급합니다.</p>
            </div>
            <div className="api-item">
              <strong>GET /api/watchers</strong>
              <p>회원이 저장한 관심 티켓, 마지막 상태, 마지막 알림 시각을 반환합니다.</p>
            </div>
            <div className="api-item">
              <strong>POST /api/watchers</strong>
              <p>이벤트 날짜, 디비전, 세부 타입을 저장해 새 모니터링 항목을 추가합니다.</p>
            </div>
            <div className="api-item">
              <strong>POST /api/jobs/run-monitor</strong>
              <p>cron이 호출해 수집, 상태 비교, 이메일 발송을 순서대로 수행합니다.</p>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
