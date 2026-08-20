# NP Signals Web

Next.js 16 기반 신호 차트 및 커뮤니티 프론트엔드입니다.

## 환경 변수

`.env.example`을 `.env.local`로 복사하고 로컬 또는 원격 Supabase 값을 입력합니다.

```powershell
Copy-Item .env.example .env.local
```

`SUPABASE_SERVICE_ROLE_KEY`는 서버 전용이며 브라우저 코드나 Vercel의 공개 환경 변수에 노출하면 안 됩니다.

## 실행과 검증

```powershell
pnpm install
pnpm dev
pnpm lint
pnpm build
```

주요 경로는 `/`, `/signup`, `/admin`입니다.
