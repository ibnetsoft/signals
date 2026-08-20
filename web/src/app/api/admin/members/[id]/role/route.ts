import { requireAdmin } from "@/lib/admin-server";

const roles = ["new", "member", "trusted", "moderator", "admin", "owner"] as const;

export async function PATCH(request: Request, context: RouteContext<"/api/admin/members/[id]/role">) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as { role?: string; reason?: string; expiresAt?: string | null } | null;
  if (!body || !roles.includes(body.role as typeof roles[number]) || !body.reason?.trim() || body.reason.trim().length > 500) return Response.json({ error: "등급과 변경 사유를 확인해 주세요." }, { status: 400 });
  const nextRole = body.role as typeof roles[number];
  if (id === auth.user.id) return Response.json({ error: "자신의 등급은 변경할 수 없습니다." }, { status: 400 });
  if (auth.role !== "owner" && ["admin", "owner"].includes(nextRole)) return Response.json({ error: "관리자 이상 승격은 최고 관리자만 가능합니다." }, { status: 403 });

  const { data: before, error: readError } = await auth.admin.from("profiles").select("id,community_role,nickname,email").eq("id", id).single();
  if (readError || !before) return Response.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
  if (before.community_role === "owner" && auth.role !== "owner") return Response.json({ error: "최고 관리자 등급은 변경할 수 없습니다." }, { status: 403 });

  const { data: updated, error: updateError } = await auth.admin.from("profiles").update({ community_role: nextRole, updated_at: new Date().toISOString() }).eq("id", id).select("id,community_role").single();
  if (updateError) return Response.json({ error: updateError.message }, { status: 500 });
  const logRows = [
    auth.admin.from("role_change_logs").insert({ user_id: id, previous_role: before.community_role, new_role: nextRole, reason: body.reason.trim(), changed_by: auth.user.id, expires_at: body.expiresAt || null }),
    auth.admin.from("admin_audit_logs").insert({ admin_id: auth.user.id, action: "member.role_changed", target_type: "profile", target_id: id, before_data: { community_role: before.community_role }, after_data: { community_role: nextRole }, reason: body.reason.trim() }),
  ];
  const results = await Promise.all(logRows);
  const logError = results.find((result) => result.error)?.error;
  if (logError) return Response.json({ error: `등급은 변경됐지만 로그 기록에 실패했습니다: ${logError.message}` }, { status: 500 });
  return Response.json({ profile: updated });
}
