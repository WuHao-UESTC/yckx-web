import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertOwnerOrAdmin, requireUser } from "@/server/auth/guards";
import { NotFoundError } from "@/server/http/errors";
import { routeErrorResponse } from "@/server/http/response";

// DELETE: 删除便签（作者或管理员）
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const note = await prisma.stickyNote.findUnique({
      where: { id },
      select: { authorId: true },
    });
    if (!note) throw new NotFoundError("便签不存在");

    assertOwnerOrAdmin(user, note.authorId);
    await prisma.stickyNote.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
