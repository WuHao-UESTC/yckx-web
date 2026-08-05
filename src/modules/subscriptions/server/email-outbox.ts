import "server-only";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/server/email/mailer";

export async function processEmailOutbox(limit = 20) {
  const jobs = await prisma.emailOutbox.findMany({
    where: { status: "PENDING", nextAttemptAt: { lte: new Date() } },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true },
  });
  let sent = 0;
  let failed = 0;

  for (const job of jobs) {
    const claimed = await prisma.emailOutbox.updateMany({
      where: { id: job.id, status: "PENDING" },
      data: { status: "PROCESSING", attempts: { increment: 1 } },
    });
    if (claimed.count === 0) continue;

    const record = await prisma.emailOutbox.findUnique({ where: { id: job.id } });
    if (!record) continue;
    try {
      await sendEmail({ to: record.recipient, subject: record.subject, html: record.html });
      await prisma.emailOutbox.update({
        where: { id: record.id },
        data: { status: "SENT", sentAt: new Date() },
      });
      sent += 1;
    } catch (error) {
      const attempts = record.attempts;
      await prisma.emailOutbox.update({
        where: { id: record.id },
        data: {
          status: attempts >= 5 ? "FAILED" : "PENDING",
          lastError: error instanceof Error ? error.message.slice(0, 500) : "邮件发送失败",
          nextAttemptAt: new Date(Date.now() + Math.min(60 * 60 * 1000, 2 ** attempts * 60 * 1000)),
        },
      });
      failed += 1;
    }
  }
  return { sent, failed };
}
