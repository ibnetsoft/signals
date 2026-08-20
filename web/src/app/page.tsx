import SignalChart from "./signal-chart";

export default function Home() {
  return (
    <main className="app-frame">
      <header className="app-header">
        <a className="app-brand" href="#"><span>N</span><b>NP SIGNALS</b></a>
        <nav><a className="active" href="#chart">차트</a><a href="#signals">시그널</a><a href="#watchlist">관심종목</a></nav>
        <div className="header-actions"><span className="system-live"><i /> SYSTEM LIVE</span><a className="header-login" href="/admin">로그인</a><a className="membership" href="/signup">멤버십 시작</a></div>
      </header>
      <div className="notice-bar"><span>LIVE MARKET SIGNALS</span><p>MetaTrader 기반 외환 · 코인 실시간 매매 신호</p><small>마지막 동기화 2초 전</small></div>
      <SignalChart />
      <nav className="mobile-nav"><a className="active" href="#chart">▥<span>차트</span></a><a href="#signals">↗<span>시그널</span></a><a href="#watchlist">☆<span>관심종목</span></a></nav>
    </main>
  );
}
