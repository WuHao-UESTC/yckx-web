import { describe, expect, it } from "vitest";
import { registerSchema } from "./auth.schemas";

describe("registerSchema", () => {
  it("normalizes email and accepts a valid registration", () => {
    const result = registerSchema.parse({
      email: " Student@Example.COM ",
      username: "student_01",
      password: "strong-password",
      inviteCode: "invite-code",
    });

    expect(result.email).toBe("student@example.com");
  });

  it("rejects weak passwords and invalid usernames", () => {
    expect(() =>
      registerSchema.parse({
        email: "student@example.com",
        username: "中文名",
        password: "short",
        inviteCode: "invite-code",
      })
    ).toThrow();
  });
});
