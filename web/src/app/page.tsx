import { createClient } from "@supabase/supabase-js";

type Signal = {
  id: string;
  symbol: string;
  market: string;
  timeframe: string;
  action: "buy" | "sell" | "hold" | "close";
  entry_price: number;
  stop_loss: number | null;
  take_profit: number | null;
  confidence: number | null;
  strategy: string;
  status: "active" | "closed" | "cancelled";
  occurred_at: string;
};

const demoSignals: Signal[] = [
  { id: "demo-1", symbol: "EURUSD", market: "forex", timeframe: "H1", action: "buy", entry_price: 1.1652, stop_loss: 1.161, take_profit: 1.1735, confidence: 82, strategy: "Trend follow", status: "active", occurred_at: new Date(Date.now() - 12 * 60000).toISOString() },
  { id: "demo-2", symbol: "BTCUSD", market: "crypto", timeframe: "H4", action: "sell", entry_price: 118450, stop_loss: 121000, take_profit: 112800, confidence: 74, strategy: "Momentum", status: "active", occurred_at: new Date(Date.now() - 48 * 60000).toISOString() },
  { id: "demo-3", symbol: "XAUUSD", market: "commodity", timeframe: "M30", action: "buy", entry_price: 3398.2, stop_loss: 3376, take_profit: 3440, confidence: 68, strategy: "Breakout", status: "active", occurred_at: new Date(Date.now() - 120 * 60000).toISOString() },
];

async function getSignals(): Promise<{ signals: Signal[]; live: boolean }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { signals: demoSignals, live: false };
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await client.from("signals").select("id,symbol,market,timeframe,action,entry_price,stop_loss,take_profit,confidence,strategy,status,occurred_at").order("occurred_at", { ascending: false }).limit(20);
  if (error) {
    console.error("Failed to load signals", error.message);
    return { signals: demoSignals, live: false };
  }
  return { signals: (data as Signal[]) ?? [], live: true };
}

function formatPrice(value: number | null) {
  if (value === null) return "—";
  return value >= 1000 ? value.toLocaleString("en-US", { maximumFractionDigits: 2 }) : value.toFixed(5);
}

function relativeTime(date: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
  if (minutes < 60) return `${minutes}분 전`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}시간 전`;
  return `${Math.floor(minutes / 1440)}일 전`;
}

export const revalidate = 30;

export default async function Home() {
  const { signals, live } = await getSignals();
  const active = signals.filter((signal) => signal.status === "active").length;
  const average = signals.length ? Math.round(signals.reduce((sum, signal) => sum + (signal.confidence ?? 0), 0) / signals.length) : 0;

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-mark">N</span><span>NP SIGNALS</span></a>
        <nav><a href="#signals">실시간 신호</a><a href="#process">이용 방법</a><a href="#risk">리스크 안내</a></nav>
        <span className={`connection ${live ? "live" : "demo"}`}><i />{live ? "LIVE" : "DEMO"}</span>
      </header>

      <section className="hero">
        <div className="eyebrow"><span /> FOREX · CRYPTO · COMMODITY</div>
        <h1>시장을 읽는 신호,<br /><em>판단은 더 빠르게.</em></h1>
        <p>MetaTrader 전략에서 감지한 매수·매도 신호를<br className="desktop" /> 실시간으로 확인하세요.</p>
        <a className="primary" href="#signals">최신 신호 보기 <span>→</span></a>
        <div className="market-line"><span>EUR/USD <b className="up">+0.18%</b></span><span>BTC/USD <b className="down">-1.42%</b></span><span>XAU/USD <b className="up">+0.64%</b></span></div>
      </section>

      <section className="dashboard" id="signals">
        <div className="section-heading">
          <div><span className="kicker">SIGNAL FEED</span><h2>최신 매매 신호</h2></div>
          <div className="stats"><div><strong>{active}</strong><span>활성 신호</span></div><div><strong>{average}%</strong><span>평균 신뢰도</span></div><div><strong>30s</strong><span>갱신 주기</span></div></div>
        </div>
        <div className="signal-grid">
          {signals.map((signal) => (
            <article className="signal-card" key={signal.id}>
              <div className="card-head"><div><span className="market">{signal.market}</span><h3>{signal.symbol}</h3></div><span className={`action ${signal.action}`}>{signal.action.toUpperCase()}</span></div>
              <div className="price"><small>진입가</small><strong>{formatPrice(signal.entry_price)}</strong></div>
              <div className="levels"><div><span>손절가</span><b>{formatPrice(signal.stop_loss)}</b></div><div><span>목표가</span><b>{formatPrice(signal.take_profit)}</b></div></div>
              <div className="confidence"><div><span>신뢰도</span><b>{signal.confidence ?? 0}%</b></div><div className="bar"><i style={{ width: `${signal.confidence ?? 0}%` }} /></div></div>
              <footer><span>{signal.timeframe} · {signal.strategy}</span><time>{relativeTime(signal.occurred_at)}</time></footer>
            </article>
          ))}
          {!signals.length && <div className="empty">아직 등록된 신호가 없습니다.</div>}
        </div>
      </section>

      <section className="process" id="process">
        <span className="kicker">HOW IT WORKS</span><h2>신호가 도착하는 과정</h2>
        <div className="steps"><div><b>01</b><h3>전략 감지</h3><p>MetaTrader 전략이 시장 조건을 실시간 분석합니다.</p></div><div><b>02</b><h3>안전한 전송</h3><p>로컬 에이전트가 검증된 신호만 암호화된 API로 전달합니다.</p></div><div><b>03</b><h3>즉시 확인</h3><p>웹 대시보드에서 최신 신호와 가격 수준을 확인합니다.</p></div></div>
      </section>

      <section className="risk" id="risk"><strong>!</strong><p><b>투자 유의사항</b><br />본 서비스의 신호는 투자 참고 정보이며 수익을 보장하지 않습니다. 모든 투자 판단과 책임은 사용자에게 있습니다.</p></section>
      <footer className="site-footer"><span>© 2026 NP Signals</span><span>Data powered by MetaTrader & Supabase</span></footer>
    </main>
  );
}
