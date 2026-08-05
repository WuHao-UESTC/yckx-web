import { NextRequest, NextResponse } from "next/server";
import { processEmailOutbox } from "@/modules/subscriptions/server/email-outbox";

export async function POST(request: NextRequest) {
  const expected = process.env.EMAIL_WORKER_SECRET;
  const provided = request.headers.get("x-email-worker-secret");
  if (!expected || !provided || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await processEmailOutbox());
}
