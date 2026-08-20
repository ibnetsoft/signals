import { requireAdmin } from "@/lib/admin-server";

const boardTypes = ["general", "notice", "qna", "forex", "crypto", "review", "private"];
const roles = ["new", "member", "trusted", "moderator", "admin", "owner"];

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const name = String(body?.name ?? "").trim();
  const slug = String(body?.slug ?? "").trim();
  const description = String(body?.description ?? "").trim();
  const boardType = String(body?.boardType ?? "general");
  const readRole = String(body?.readRole ?? "new");
  const writeRole = String(body?.writeRole ?? "member");
  const commentRole = String(body?.commentRole ?? "new");
  if (name.length < 2 || name.length > 50 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !boardTypes.includes(boardType) || !roles.includes(readRole) || !roles.includes(writeRole) || !roles.includes(commentRole)) return Response.json({ error: "게시판 기본 정보와 권한 설정을 확인해 주세요." }, { status: 400 });

  const row = { name, slug, description, board_type: boardType, read_role: readRole, write_role: writeRole, comment_role: commentRole, allow_comments: body?.allowComments !== false, allow_attachments: body?.allowAttachments === true, require_approval: body?.requireApproval === true, created_by: auth.user.id };
  const { data, error } = await auth.admin.from("boards").insert(row).select().single();
  if (error) return Response.json({ error: error.code === "23505" ? "이미 사용 중인 게시판 주소입니다." : error.message }, { status: 400 });
  await auth.admin.from("admin_audit_logs").insert({ admin_id: auth.user.id, action: "board.created", target_type: "board", target_id: data.id, after_data: data, reason: "게시판 생성" });
  return Response.json({ board: data }, { status: 201 });
}
