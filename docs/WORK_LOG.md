# NP Signals 작업 내역

작성일: 2026-08-14
브랜치: `agent/initial-signal-platform`

## 1. 프로젝트 방향

NP Signals는 외환·코인 매매 신호를 차트 위 화살표로 제공하고, 사용자들이 분석과 신호 후기를 공유할 수 있는 커뮤니티 서비스입니다.

현재 구성은 다음과 같습니다.

```text
MetaTrader/Python
  → 로컬 Flask agent
  → Supabase Database/Auth
  → Next.js
  → Vercel
```

MetaTrader와 Python 신호 생성기는 로컬 PC에서 계속 실행하고, 웹 서비스와 데이터베이스는 Vercel·Supabase 조합으로 운영하는 구조입니다.

## 2. 신호 프론트엔드

- 외환·코인 시장을 전환할 수 있는 신호 대시보드를 구성했습니다.
- 캔들 차트에 매수·매도 신호를 화살표와 라벨로 표시합니다.
- 종목 목록, 현재가, 변동률, 신호 방향, 진입가·손절가·목표가를 표시합니다.
- `lightweight-charts` 기반 차트를 적용했습니다.
- 아직 실제 Supabase 시세가 없는 상태에서도 화면을 검증할 수 있도록 데모 데이터를 분리했습니다.
- 회원가입과 관리자 화면으로 이동하는 링크를 연결했습니다.

주요 파일:

- `web/src/app/page.tsx`
- `web/src/app/signal-chart.tsx`
- `web/src/app/demo-data.ts`
- `web/src/app/globals.css`

## 3. 회원가입

- Supabase Auth 이메일·비밀번호 회원가입을 연결했습니다.
- 회원가입 시 닉네임을 메타데이터로 전달합니다.
- 비밀번호 확인, 필수 약관 동의, 오류 및 완료 상태를 처리합니다.
- 신규 Auth 사용자가 생성되면 `profiles` 레코드를 자동으로 생성하는 데이터베이스 트리거를 추가했습니다.

경로와 주요 파일:

- 화면: `/signup`
- `web/src/app/signup/page.tsx`
- `web/src/app/signup/signup-form.tsx`
- `web/src/lib/supabase-browser.ts`

## 4. 커뮤니티 관리자

- 운영 현황, 최근 가입 회원, 최근 운영 기록을 보여주는 대시보드를 구성했습니다.
- 회원 검색과 등급 변경 기능을 구현했습니다.
- 게시판 이름, 주소, 유형, 설명, 읽기·쓰기 권한을 지정하는 게시판 생성 기능을 구현했습니다.
- 회원 등급 변경과 게시판 생성 내역을 감사 로그로 남깁니다.
- Supabase 연결 전에도 UI를 확인할 수 있는 프리뷰 모드를 제공합니다.
- 관리자 로그인 후 실제 로컬 Supabase 데이터를 불러오는 라이브 모드를 제공합니다.

경로와 주요 파일:

- 화면: `/admin`
- `web/src/app/admin/page.tsx`
- `web/src/app/admin/admin-dashboard.tsx`
- `web/src/app/api/admin/overview/route.ts`
- `web/src/app/api/admin/boards/route.ts`
- `web/src/app/api/admin/members/[id]/role/route.ts`
- `web/src/lib/admin-server.ts`
- `web/src/app/community.css`

## 5. Supabase 데이터베이스

다음 테이블을 추가했습니다.

- `profiles`: 회원 프로필, 상태, 커뮤니티 등급, 구독 등급, 활동 수치
- `admin_users`: 관리자 권한 목록
- `boards`: 게시판과 접근 권한 설정
- `role_change_logs`: 회원 등급 변경 이력
- `admin_audit_logs`: 관리자 작업 감사 로그

보안 구성:

- 모든 신규 테이블에 RLS를 적용했습니다.
- 회원은 자신의 프로필만 제한적으로 수정할 수 있습니다.
- 활성 게시판만 공개 조회할 수 있습니다.
- 관리자 API는 브라우저 로그인 토큰을 검증하고 `admin_users` 권한을 다시 확인합니다.
- `service_role` 키는 Next.js 서버 코드에서만 사용합니다.
- 공개·인증 사용자에 대한 권한을 명시적으로 설정했습니다.

마이그레이션:

- `supabase/migrations/20260813223440_community_admin.sql`

## 6. 환경 변수

웹 애플리케이션에서 사용하는 값은 다음과 같습니다.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY`는 서버 전용입니다. 저장소에는 실제 값이 포함된 `.env.local`을 커밋하지 않으며, Vercel에서도 공개 환경 변수로 등록하지 않습니다.

## 7. 검증 결과

- `pnpm lint` 통과
- `pnpm build` 통과
- Next.js 정적·동적 경로 빌드 확인
- Supabase 로컬 마이그레이션 및 데이터베이스 초기화 확인
- Supabase Database Advisor 오류 없음
- 비로그인 관리자 API 요청 `401 Unauthorized` 확인
- 실제 로컬 관리자 로그인 확인
- 회원 등급 변경 API 및 이력 저장 확인
- 게시판 생성 API 및 감사 로그 저장 확인
- 관리자·회원가입 화면 브라우저 점검 완료
- `.env.local` Git 제외 확인

## 8. 로컬 실행 경로

- 신호 화면: `http://localhost:3000`
- 회원가입: `http://localhost:3000/signup`
- 관리자: `http://localhost:3000/admin`
- Flask 상태: `http://127.0.0.1:5050/health`

## 9. 다음 우선순위

1. MetaTrader/Python에서 실제 캔들과 신호를 Flask agent로 전달
2. Flask agent의 Supabase 저장 로직과 중복 신호 방지 검증
3. 신호·캔들 Realtime 또는 주기 조회 연결
4. 게시글·댓글·신호 후기 데이터베이스 및 화면 구현
5. 이메일 인증, 비밀번호 재설정, 일반 회원 로그인 화면 구현
6. Vercel 및 Supabase 원격 프로젝트 환경 변수 설정과 배포

## 10. 운영 전 확인 사항

- Supabase 원격 프로젝트에서 마이그레이션을 적용해야 합니다.
- 최초 운영자 계정은 회원가입 후 `admin_users`와 `profiles.community_role`에 `owner` 권한을 등록해야 합니다.
- Vercel에는 publishable key와 서버 전용 service-role key를 서로 구분해 설정해야 합니다.
- 신호 제공 페이지에 투자 책임 고지와 운영 정책을 노출해야 합니다.
