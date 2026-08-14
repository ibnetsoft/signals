import type { CandlestickData, UTCTimestamp } from "lightweight-charts";

export type Market = "forex" | "crypto";
export type SignalDirection = "buy" | "sell";

export type ChartSignal = {
  id: string;
  symbol: string;
  direction: SignalDirection;
  time: UTCTimestamp;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  strategy: string;
  status: "active" | "target" | "stopped";
};

export const instruments = [
  { symbol: "EURUSD", label: "EUR / USD", market: "forex" as const, price: 1.1652, change: 0.18 },
  { symbol: "GBPUSD", label: "GBP / USD", market: "forex" as const, price: 1.3538, change: -0.12 },
  { symbol: "USDJPY", label: "USD / JPY", market: "forex" as const, price: 147.28, change: 0.34 },
  { symbol: "BTCUSD", label: "BTC / USD", market: "crypto" as const, price: 118450, change: -1.42 },
  { symbol: "ETHUSD", label: "ETH / USD", market: "crypto" as const, price: 4620, change: 0.64 },
];

const bases: Record<string, number> = { EURUSD: 1.1652, GBPUSD: 1.3538, USDJPY: 147.28, BTCUSD: 118450, ETHUSD: 4620 };

export function makeCandles(symbol: string, timeframe: string): CandlestickData<UTCTimestamp>[] {
  const seconds = { M15: 900, H1: 3600, H4: 14400 }[timeframe] ?? 3600;
  const base = bases[symbol] ?? 1;
  const scale = base > 1000 ? base * 0.003 : base * 0.0015;
  const end = Math.floor(Date.now() / seconds) * seconds;
  let close = base - scale * 4;
  return Array.from({ length: 120 }, (_, index) => {
    const wave = Math.sin(index * 0.37) * scale + Math.cos(index * 0.13) * scale * 0.55;
    const drift = (index - 60) * scale * 0.018;
    const open = close;
    close = base + wave + drift;
    const high = Math.max(open, close) + scale * (0.25 + (index % 5) * 0.08);
    const low = Math.min(open, close) - scale * (0.2 + (index % 4) * 0.07);
    return { time: (end - (119 - index) * seconds) as UTCTimestamp, open, high, low, close };
  });
}

export function makeSignals(symbol: string, timeframe: string, candles: CandlestickData<UTCTimestamp>[]): ChartSignal[] {
  const picks = [28, 54, 82, 105];
  return picks.map((index, order) => {
    const candle = candles[index];
    const direction: SignalDirection = order % 2 === 0 ? "buy" : "sell";
    const distance = Math.abs(candle.high - candle.low) * 2.2;
    return {
      id: `${symbol}-${timeframe}-${order}`,
      symbol,
      direction,
      time: candle.time,
      entry: candle.close,
      stopLoss: direction === "buy" ? candle.close - distance : candle.close + distance,
      takeProfit: direction === "buy" ? candle.close + distance * 1.7 : candle.close - distance * 1.7,
      confidence: [78, 71, 86, 82][order],
      strategy: ["Trend Pulse", "Momentum Shift", "Breakout Pro", "Trend Pulse"][order],
      status: order === 3 ? "active" : order === 2 ? "target" : "stopped",
    };
  });
}
