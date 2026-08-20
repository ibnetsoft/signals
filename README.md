# NP Signals

MetaTrader에서 생성한 FX·코인 매매 신호를 Supabase에 저장하고 Next.js에서 차트와 커뮤니티로 제공하는 프로젝트입니다.

## 구성

- `web/`: Next.js 16 신호 대시보드, 회원가입, 커뮤니티 관리자 화면
- `agent/`: 로컬 PC에서 실행하는 Flask 신호 수신기
- `supabase/`: 데이터베이스 마이그레이션, RLS, 로컬 개발 설정

데이터 흐름은 `MetaTrader/Python → Flask agent → Supabase → Next.js/Vercel`입니다.

## 로컬 실행

### 1. Supabase

```powershell
pnpm dlx supabase@2.113.0 start --exclude logflare,vector,realtime,storage-api,imgproxy,studio,postgres-meta,edge-runtime,supavisor
pnpm dlx supabase@2.113.0 db reset --local
pnpm dlx supabase@2.113.0 status
```

상태 출력의 `API_URL`, `PUBLISHABLE_KEY`, `SERVICE_ROLE_KEY`를 각 환경 파일에 설정합니다. `SERVICE_ROLE_KEY`는 절대 `NEXT_PUBLIC_` 변수에 넣지 않습니다.

### 2. Flask agent

```powershell
cd agent
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python app.py
```

### 3. Next.js

```powershell
cd web
Copy-Item .env.example .env.local
pnpm install
pnpm dev
```

- 신호 화면: `http://localhost:3000`
- 회원가입: `http://localhost:3000/signup`
- 커뮤니티 관리자: `http://localhost:3000/admin`
- Flask 상태: `http://127.0.0.1:5050/health`

## 최초 관리자 등록

먼저 `/signup`에서 운영자 계정을 만든 뒤 Supabase SQL Editor에서 아래 쿼리를 한 번 실행합니다.

```sql
insert into public.admin_users (user_id, role)
select id, 'owner'::public.community_role
from auth.users
where email = 'OWNER_EMAIL';

update public.profiles
set community_role = 'owner'::public.community_role
where email = 'OWNER_EMAIL';
```

`OWNER_EMAIL`을 실제 운영자 이메일로 바꿔야 합니다. 이후 관리자는 `/admin`에서 회원 등급 변경과 게시판 생성을 할 수 있습니다.

## 보안 원칙

- Supabase `service_role` 키는 Flask와 Next.js 서버에서만 사용합니다.
- 브라우저에는 publishable key만 제공합니다.
- 관리자 API는 로그인 토큰을 검증한 뒤 `admin_users` 권한을 다시 확인합니다.
- 회원, 관리자, 게시판, 변경 이력 테이블에는 RLS를 적용합니다.
- 투자 정보는 참고용이며 투자 판단과 책임은 사용자에게 있습니다.
