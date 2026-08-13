insert into public.signals
  (source, symbol, market, timeframe, action, entry_price, stop_loss, take_profit, confidence, strategy, occurred_at)
values
  ('demo', 'EURUSD', 'forex', 'H1', 'buy', 1.16520, 1.16100, 1.17350, 82, 'trend-follow', now() - interval '12 minutes'),
  ('demo', 'BTCUSD', 'crypto', 'H4', 'sell', 118450, 121000, 112800, 74, 'momentum', now() - interval '48 minutes'),
  ('demo', 'XAUUSD', 'commodity', 'M30', 'buy', 3398.20, 3376.00, 3440.00, 68, 'breakout', now() - interval '2 hours')
on conflict do nothing;
