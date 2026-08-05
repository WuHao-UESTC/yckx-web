import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cookieName = `yckx_view_${slug}`;

  if (req.cookies.has(cookieName)) {
    return NextResponse.json({ counted: false });
  }

  const result = await prisma.post.updateMany({
    where: { slug, status: "PUBLISHED" },
    data: { viewCount: { increment: 1 } },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }

  const response = NextResponse.json({ counted: true });
  response.cookies.set(cookieName, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60,
    path: "/",
  });
  return response;
}
