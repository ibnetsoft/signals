import { createClient } from "@supabase/supabase-js";

export type AdminRole = "moderator" | "admin" | "owner";

export async function requireAdmin(request: Request, allowed: AdminRole[] = ["admin", "owner"]) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!url || !publishableKey || !serviceKey) return { error: Response.json({ error: "서버 환경 변수가 설정되지 않았습니다." }, { status: 503 }) };
  if (!token) return { error: Response.json({ error: "로그인이 필요합니다." }, { status: 401 }) };

  const verifier = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await verifier.auth.getUser(token);
  if (userError || !userData.user) return { error: Response.json({ error: "유효하지 않은 로그인입니다." }, { status: 401 }) };

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: adminUser } = await admin.from("admin_users").select("role").eq("user_id", userData.user.id).maybeSingle();
  if (!adminUser || !allowed.includes(adminUser.role as AdminRole)) return { error: Response.json({ error: "관리자 권한이 없습니다." }, { status: 403 }) };
  return { admin, user: userData.user, role: adminUser.role as AdminRole };
}
