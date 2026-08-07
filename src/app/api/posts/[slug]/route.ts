import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { updatePostSchema } from "@/modules/posts/posts.schemas";
import { deletePost, updatePost } from "@/modules/posts/server/post-service";
import { postApiSelect } from "@/modules/posts/server/post-selects";
import { assertOwnerOrAdmin, requireUser } from "@/server/auth/guards";
import { NotFoundError } from "@/server/http/errors";
import { routeErrorResponse } from "@/server/http/response";
import { parseJson } from "@/server/http/validation";

// GET /api/posts/[slug] — 文章详情
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const post = await prisma.post.findUnique({
      where: { slug },
      select: { ...postApiSelect, authorId: true },
    });

    if (!post) throw new NotFoundError("文章不存在");

    if (post.status !== "PUBLISHED") {
      const user = await requireUser();
      assertOwnerOrAdmin(user, post.authorId);
    }

    Reflect.deleteProperty(post, "authorId");
    return NextResponse.json(post);
  } catch (error) {
    return routeErrorResponse(error);
  }
}

// PATCH /api/posts/[slug] — 更新文章
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const user = await requireUser();
    const { slug } = await params;
    const input = await parseJson(req, updatePostSchema);
    const updated = await updatePost(slug, input, user);
    revalidateTag("posts", "max");
    revalidateTag(`post:${slug}`, "max");
    revalidateTag(`friend:${updated.author.username}`, "max");
    revalidateTag("friends", "max");
    return NextResponse.json(updated);
  } catch (error) {
    return routeErrorResponse(error);
  }
}

// DELETE /api/posts/[slug] — 删除文章
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const user = await requireUser();
    const { slug } = await params;
    const deleted = await deletePost(slug, user);
    revalidateTag("posts", "max");
    revalidateTag(`post:${slug}`, "max");
    if (deleted) revalidateTag(`friend:${deleted.username}`, "max");
    revalidateTag("friends", "max");
    return NextResponse.json({ success: true });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
