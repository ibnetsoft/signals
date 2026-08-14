import { requireAdmin } from "@/lib/admin-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;
  const [profiles, boards, logs] = await Promise.all([
    auth.admin.from("profiles").select("id,email,nickname,status,community_role,subscription_tier,post_count,comment_count,joined_at,last_seen_at").order("joined_at", { ascending: false }).limit(100),
    auth.admin.from("boards").select("id,name,slug,description,board_type,status,read_role,write_role,comment_role,allow_comments,allow_attachments,require_approval,sort_order,created_at").order("sort_order").order("created_at"),
    auth.admin.from("admin_audit_logs").select("id,action,target_type,target_id,reason,created_at").order("created_at", { ascending: false }).limit(10),
  ]);
  const error = profiles.error ?? boards.error ?? logs.error;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ profiles: profiles.data, boards: boards.data, logs: logs.data, adminRole: auth.role });
}
