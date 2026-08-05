import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postApiSelect } from "@/modules/posts/server/post-selects";
import { assertOwnerOrAdmin, requireUser } from "@/server/auth/guards";
import { NotFoundError } from "@/server/http/errors";
import { routeErrorResponse } from "@/server/http/response";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const post = await prisma.post.findUnique({
      where: { id },
      select: { ...postApiSelect, authorId: true },
    });

    if (!post) throw new NotFoundError("文章不存在");
    assertOwnerOrAdmin(user, post.authorId);
    Reflect.deleteProperty(post, "authorId");
    return NextResponse.json(post);
  } catch (error) {
    return routeErrorResponse(error);
  }
}
