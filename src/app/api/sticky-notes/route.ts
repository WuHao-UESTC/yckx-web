import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createStickyNoteSchema } from "@/modules/routine/sticky-note.schemas";
import { requireUser } from "@/server/auth/guards";
import { routeErrorResponse } from "@/server/http/response";
import { parseJson } from "@/server/http/validation";

const COLORS = ["yellow", "pink", "blue", "green", "purple", "orange"];

// POST: 发布便签（登录用户）
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const input = await parseJson(req, createStickyNoteSchema);
    const note = await prisma.stickyNote.create({
      data: {
        content: input.content,
        isAnonymous: input.isAnonymous,
        authorId: user.id,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      },
      include: { author: { select: { displayName: true, username: true } } },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
