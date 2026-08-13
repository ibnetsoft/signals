# NP Signals

MetaTrader에서 생성한 FX·암호화폐·원자재 매매 신호를 Supabase에 저장하고 Next.js 웹에서 제공하는 프로젝트입니다.

## 구조

- `web/`: Next.js 16 신호 대시보드 (Vercel 배포 대상)
- `agent/`: 로컬 PC에서 실행하는 Flask 신호 수신기
- `supabase/`: 데이터베이스 마이그레이션, RLS, 로컬 개발 설정

## 데이터 흐름

`MetaTrader/Python → Flask agent → Supabase REST API → Next.js/Vercel`

## 로컬 실행

### 1. Supabase

```powershell
pnpm dlx supabase@2.113.0 start --exclude logflare,vector,realtime,storage-api,imgproxy,studio,postgres-meta,edge-runtime,supavisor
pnpm dlx supabase@2.113.0 status
```

상태 출력의 `API_URL`, `PUBLISHABLE_KEY`, `SERVICE_ROLE_KEY`를 각 `.env` 파일에 설정합니다. 서버 전용 키는 절대 `NEXT_PUBLIC_` 변수에 넣지 않습니다.

### 2. Flask agent

```powershell
cd agent
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python app.py
```

### 3. 웹

```powershell
cd web
Copy-Item .env.example .env.local
pnpm dev
```

웹 주소는 `http://localhost:3000`, Flask 상태 확인은 `http://127.0.0.1:5050/health`입니다.

## 운영 원칙

- Supabase `service_role`/secret 키는 Flask 서버에만 둡니다.
- 브라우저에는 Supabase publishable 키만 사용합니다.
- `signals`는 공개 읽기만 허용하며 쓰기는 서버 역할만 허용합니다.
- 실제 투자 판단과 책임은 사용자에게 있습니다.
