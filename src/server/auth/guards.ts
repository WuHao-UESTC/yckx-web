import "server-only";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, UnauthorizedError } from "@/server/http/errors";

export type AuthenticatedUser = {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  role: "ADMIN" | "MEMBER";
};

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      role: true,
    },
  });
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new ForbiddenError("仅管理员可执行此操作");
  return user;
}

export function assertOwnerOrAdmin(user: AuthenticatedUser, ownerId: string): void {
  if (user.id !== ownerId && user.role !== "ADMIN") {
    throw new ForbiddenError();
  }
}
