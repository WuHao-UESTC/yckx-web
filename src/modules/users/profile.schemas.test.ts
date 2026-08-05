import { describe, expect, it } from "vitest";
import { changePasswordFormSchema, profileFormSchema } from "./profile.schemas";

describe("profile schemas", () => {
  it("converts empty optional fields to null", () => {
    const result = profileFormSchema.parse({
      displayName: "",
      bio: "",
      avatar: "",
      website: "",
      github: "",
      bilibili: "",
      title: "",
    });

    expect(result.displayName).toBeNull();
    expect(result.website).toBeNull();
  });

  it("requires matching passwords", () => {
    expect(() =>
      changePasswordFormSchema.parse({
        oldPassword: "old-password",
        newPassword: "new-password",
        confirmPassword: "different-password",
      })
    ).toThrow();
  });
});
