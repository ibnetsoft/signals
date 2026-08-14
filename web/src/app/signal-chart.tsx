"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  LineStyle,
  createChart,
  createSeriesMarkers,
  type IPriceLine,
  type UTCTimestamp,
} from "lightweight-charts";
import { instruments, makeCandles, makeSignals, type Market } from "./demo-data";

const timeframes = ["M15", "H1", "H4"];

function formatPrice(value: number) {
  return value >= 1000 ? value.toLocaleString("en-US", { maximumFractionDigits: 2 }) : value.toFixed(value >= 100 ? 3 : 5);
}

function formatTime(time: UTCTimestamp) {
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(time * 1000));
}

export default function SignalChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const [market, setMarket] = useState<Market>("forex");
  const [symbol, setSymbol] = useState("EURUSD");
  const [timeframe, setTimeframe] = useState("H1");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const candles = useMemo(() => makeCandles(symbol, timeframe), [symbol, timeframe]);
  const signals = useMemo(() => makeSignals(symbol, timeframe, candles), [symbol, timeframe, candles]);
  const selected = signals.find((signal) => signal.id === selectedId) ?? signals.at(-1)!;
  const visibleInstruments = instruments.filter((item) => item.market === market);
  const current = instruments.find((item) => item.symbol === symbol) ?? instruments[0];

  function changeMarket(nextMarket: Market) {
    const first = instruments.find((item) => item.market === nextMarket);
    setMarket(nextMarket);
    if (first) setSymbol(first.symbol);
    setSelectedId(null);
  }

  function changeSymbol(nextSymbol: string) {
    setSymbol(nextSymbol);
    setSelectedId(null);
  }

  function changeTimeframe(nextTimeframe: string) {
    setTimeframe(nextTimeframe);
    setSelectedId(null);
  }

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = createChart(chartRef.current, {
      autoSize: true,
      height: 560,
      layout: { background: { type: ColorType.Solid, color: "#0d1318" }, textColor: "#82909a", fontFamily: "Inter, Arial, sans-serif", attributionLogo: true },
      grid: { vertLines: { color: "#1c252c" }, horzLines: { color: "#1c252c" } },
      rightPriceScale: { borderColor: "#2a343c", scaleMargins: { top: 0.12, bottom: 0.12 } },
      timeScale: { borderColor: "#2a343c", timeVisible: true, secondsVisible: false, rightOffset: 8, barSpacing: 9 },
      crosshair: { vertLine: { color: "#65747f", labelBackgroundColor: "#27343d" }, horzLine: { color: "#65747f", labelBackgroundColor: "#27343d" } },
    });
    const series = chart.addSeries(CandlestickSeries, { upColor: "#40c98d", downColor: "#ef6969", borderVisible: false, wickUpColor: "#40c98d", wickDownColor: "#ef6969", priceFormat: { type: "price", precision: current.price >= 1000 ? 2 : current.price >= 100 ? 3 : 5, minMove: current.price >= 1000 ? 0.01 : current.price >= 100 ? 0.001 : 0.00001 } });
    series.setData(candles);
    createSeriesMarkers(series, signals.map((signal) => ({ id: signal.id, time: signal.time, position: signal.direction === "buy" ? "belowBar" as const : "aboveBar" as const, color: signal.direction === "buy" ? "#b8ef52" : "#ff6f6f", shape: signal.direction === "buy" ? "arrowUp" as const : "arrowDown" as const, text: signal.direction.toUpperCase(), size: 1.5 })));

    const lines: IPriceLine[] = [];
    if (selected) {
      lines.push(series.createPriceLine({ price: selected.entry, color: "#e7edf0", lineWidth: 1, lineStyle: LineStyle.Solid, axisLabelVisible: true, title: "ENTRY" }));
      lines.push(series.createPriceLine({ price: selected.stopLoss, color: "#ef6969", lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: "SL" }));
      lines.push(series.createPriceLine({ price: selected.takeProfit, color: "#b8ef52", lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: "TP" }));
    }
    chart.subscribeClick((param) => {
      if (param.hoveredObjectId) setSelectedId(String(param.hoveredObjectId));
    });
    chart.timeScale().fitContent();
    return () => {
      lines.forEach((line) => series.removePriceLine(line));
      chart.remove();
    };
  }, [candles, current.price, selected, signals]);

  return (
    <div className="terminal-shell">
      <aside className="watchlist">
        <div className="watchlist-head"><span>MARKETS</span><button aria-label="종목 검색">⌕</button></div>
        <div className="market-tabs">
          <button className={market === "forex" ? "active" : ""} onClick={() => changeMarket("forex")}>외환</button>
          <button className={market === "crypto" ? "active" : ""} onClick={() => changeMarket("crypto")}>코인</button>
        </div>
        <div className="instrument-list">
          {visibleInstruments.map((item) => (
            <button key={item.symbol} className={symbol === item.symbol ? "selected" : ""} onClick={() => changeSymbol(item.symbol)}>
              <span className="symbol-icon">{item.symbol.slice(0, 1)}</span>
              <span className="instrument-name"><b>{item.label}</b><small>{item.market === "forex" ? "FX" : "24H"}</small></span>
              <span className="instrument-price"><b>{formatPrice(item.price)}</b><small className={item.change >= 0 ? "positive" : "negative"}>{item.change >= 0 ? "+" : ""}{item.change}%</small></span>
            </button>
          ))}
        </div>
        <div className="watch-status"><i /> MetaTrader 연결됨<span>2초 전</span></div>
      </aside>

      <section className="chart-workspace">
        <div className="chart-toolbar">
          <div className="instrument-title"><span className="symbol-icon large">{symbol.slice(0, 1)}</span><div><h1>{current.label}</h1><p>{market === "forex" ? "FOREX · MetaTrader" : "CRYPTO · MetaTrader"}</p></div></div>
          <div className="quote"><strong>{formatPrice(current.price)}</strong><span className={current.change >= 0 ? "positive" : "negative"}>{current.change >= 0 ? "+" : ""}{current.change}%</span></div>
          <div className="timeframes">{timeframes.map((item) => <button key={item} className={timeframe === item ? "active" : ""} onClick={() => changeTimeframe(item)}>{item}</button>)}</div>
          <button className="expand" aria-label="차트 전체 화면">⌗</button>
        </div>
        <div className="chart-meta"><span><i className="live-dot" /> 실시간</span><span>O {formatPrice(candles.at(-1)!.open)}</span><span>H {formatPrice(candles.at(-1)!.high)}</span><span>L {formatPrice(candles.at(-1)!.low)}</span><span>C {formatPrice(candles.at(-1)!.close)}</span></div>
        <div className="chart-container" ref={chartRef} aria-label={`${current.label} ${timeframe} 캔들 차트`} />
        <div className="chart-legend"><span><i className="buy-dot" /> BUY 신호</span><span><i className="sell-dot" /> SELL 신호</span><span>차트 제공: <a href="https://www.tradingview.com/" target="_blank" rel="noreferrer">TradingView</a></span></div>
      </section>

      <aside className="signal-panel">
        <div className="panel-head"><div><span>SELECTED SIGNAL</span><b className={`direction ${selected.direction}`}>{selected.direction.toUpperCase()}</b></div><h2>{selected.symbol} <small>{timeframe}</small></h2><p>{formatTime(selected.time)} · {selected.strategy}</p></div>
        <div className="signal-score"><span>신호 신뢰도</span><strong>{selected.confidence}<small>%</small></strong><div><i style={{ width: `${selected.confidence}%` }} /></div></div>
        <div className="trade-levels">
          <div><span>진입가</span><b>{formatPrice(selected.entry)}</b></div>
          <div className="stop"><span>손절가 · SL</span><b>{formatPrice(selected.stopLoss)}</b></div>
          <div className="target"><span>목표가 · TP</span><b>{formatPrice(selected.takeProfit)}</b></div>
        </div>
        <div className="risk-reward"><span>Risk / Reward</span><b>1 : 1.7</b></div>
        <div className="recent-head"><span>최근 신호</span><small>{signals.length}개</small></div>
        <div className="recent-signals">
          {[...signals].reverse().map((signal) => (
            <button key={signal.id} className={selected.id === signal.id ? "selected" : ""} onClick={() => setSelectedId(signal.id)}>
              <i className={signal.direction}>{signal.direction === "buy" ? "↑" : "↓"}</i><span><b>{signal.direction.toUpperCase()}</b><small>{formatTime(signal.time)}</small></span><strong>{formatPrice(signal.entry)}</strong>
            </button>
          ))}
        </div>
        <div className="signal-note">신호는 투자 참고 정보이며 수익을 보장하지 않습니다.</div>
      </aside>
    </div>
  );
}
