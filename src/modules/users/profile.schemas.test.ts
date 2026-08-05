import { describe, expect, it } from "vitest";
import { changePasswordFormSchema, profileFormSchema } from "./profile.schemas";

describe("profile schemas", () => {
  it("converts empty optional fields to null", () => {
    const result = profileFormSchema.parse({
      displayName: "",
      bio: "",
      website: "",
      github: "",
      bilibili: "",
      title: "",
      grade: "",
      contactEmail: "",
      qq: "",
      wechat: "",
    });

    expect(result.displayName).toBeNull();
    expect(result.website).toBeNull();
    expect(result.grade).toBeNull();
    expect(result.contactEmail).toBeNull();
  });

  it("accepts an optional grade in the configured range", () => {
    expect(profileFormSchema.parse({ grade: "2010" }).grade).toBe(2010);
    expect(profileFormSchema.parse({ grade: "3000" }).grade).toBe(3000);
    expect(() => profileFormSchema.parse({ grade: "2009" })).toThrow();
  });

  it("keeps website text flexible for later safe link rendering", () => {
    expect(profileFormSchema.parse({ website: "我的主页 / portfolio" }).website).toBe(
      "我的主页 / portfolio"
    );
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
