import "server-only";

import { randomBytes } from "node:crypto";

export function generateInviteCode(): string {
  return randomBytes(18).toString("base64url");
}
