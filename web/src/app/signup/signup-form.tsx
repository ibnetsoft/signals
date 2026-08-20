"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function SignupForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const nickname = String(form.get("nickname") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const passwordConfirm = String(form.get("passwordConfirm") ?? "");
    if (nickname.length < 2 || nickname.length > 30) return setError("닉네임은 2~30자로 입력해 주세요.");
    if (password.length < 8) return setError("비밀번호는 8자 이상이어야 합니다.");
    if (password !== passwordConfirm) return setError("비밀번호가 일치하지 않습니다.");
    if (!form.get("terms") || !form.get("privacy")) return setError("필수 약관에 동의해 주세요.");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return setError("Supabase 환경 변수가 설정되지 않았습니다.");
    setLoading(true); setError(""); setMessage("");
    const { data, error: signupError } = await supabase.auth.signUp({ email, password, options: { data: { nickname }, emailRedirectTo: `${window.location.origin}/signup?confirmed=1` } });
    setLoading(false);
    if (signupError) return setError(signupError.message);
    setMessage(data.session ? "가입이 완료되었습니다." : "인증 메일을 보냈습니다. 메일의 링크를 확인해 주세요.");
    event.currentTarget.reset();
  }

  return (
    <div className="signup-page">
      <div className="signup-copy"><Link href="/" className="signup-brand"><span>N</span>NP SIGNALS</Link><p className="signup-kicker">JOIN THE COMMUNITY</p><h1>시장에 대한 생각을<br />함께 나누세요.</h1><p>외환과 코인 트레이더가 분석, 전략, 신호 후기를 공유하는 커뮤니티입니다.</p><ul><li>실시간 시장 분석 공유</li><li>등급별 전문 게시판</li><li>검증된 신호 후기와 토론</li></ul></div>
      <section className="signup-card"><div><p className="signup-step">MEMBER SIGN UP</p><h2>회원가입</h2><p>이미 계정이 있나요? <Link href="/admin">관리자 로그인</Link></p></div>
        <form onSubmit={submit}>
          <label>이메일<input name="email" type="email" placeholder="name@example.com" autoComplete="email" required /></label>
          <label>닉네임<input name="nickname" type="text" placeholder="커뮤니티에서 사용할 이름" minLength={2} maxLength={30} required /></label>
          <div className="signup-passwords"><label>비밀번호<input name="password" type="password" placeholder="8자 이상" autoComplete="new-password" minLength={8} required /></label><label>비밀번호 확인<input name="passwordConfirm" type="password" placeholder="한 번 더 입력" autoComplete="new-password" minLength={8} required /></label></div>
          <div className="signup-checks"><label><input name="terms" type="checkbox" /> <span><b>[필수]</b> 이용약관에 동의합니다.</span></label><label><input name="privacy" type="checkbox" /> <span><b>[필수]</b> 개인정보처리방침에 동의합니다.</span></label><label><input name="marketing" type="checkbox" /> <span>[선택] 마케팅 정보 수신에 동의합니다.</span></label></div>
          {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-success" role="status">{message}</p>}
          <button className="signup-submit" disabled={loading}>{loading ? "가입 처리 중…" : "가입하고 시작하기"}</button>
        </form><p className="signup-risk">투자 정보는 참고용이며 모든 투자 판단과 책임은 사용자에게 있습니다.</p>
      </section>
    </div>
  );
}
