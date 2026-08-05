"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MailCheck, UserPlus } from "lucide-react";
import { AuthShell } from "@/components/interior/auth-shell";

type AccountType = "MEMBER" | "GUEST";

export default function RegisterPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>("GUEST");
  const [form, setForm] = useState({
    email: "",
    username: "",
    displayName: "",
    password: "",
    confirmPassword: "",
    inviteCode: "",
    code: "",
  });
  const [challengeId, setChallengeId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("两次密码不一致");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/register/request-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        username: form.username,
        displayName: form.displayName || undefined,
        password: form.password,
        accountType,
        inviteCode: accountType === "MEMBER" ? form.inviteCode : undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "验证码发送失败");
      return;
    }
    setChallengeId(data.challengeId);
  }

  async function confirmRegistration(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId, code: form.code }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "注册失败");
      return;
    }
    router.push("/login?registered=1");
  }

  return (
    <AuthShell
      title="注册"
      description="选择账号类型，完成邮箱验证后即可使用对应功能。"
      footer={
        <p>
          已有账号？ <Link href="/login">返回登录</Link>
        </p>
      }
    >
      {!challengeId ? (
        <form onSubmit={requestCode} className="auth-form">
          {error && <p className="auth-form__error">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              className={`btn-secondary flex-1 ${accountType === "GUEST" ? "ring-2 ring-[#5a8a6a]" : ""}`}
              onClick={() => setAccountType("GUEST")}
            >
              游客注册
            </button>
            <button
              type="button"
              className={`btn-secondary flex-1 ${accountType === "MEMBER" ? "ring-2 ring-[#8b5e3c]" : ""}`}
              onClick={() => setAccountType("MEMBER")}
            >
              科协人员注册
            </button>
          </div>
          {accountType === "MEMBER" && (
            <label>
              <span>邀请码 *</span>
              <input
                type="text"
                value={form.inviteCode}
                onChange={(e) => updateField("inviteCode", e.target.value)}
                className="input-field w-full"
                required
                placeholder="请输入管理员提供的邀请码"
              />
            </label>
          )}
          <label>
            <span>邮箱 *</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="input-field w-full"
              required
              autoFocus
            />
          </label>
          <label>
            <span>用户名 *</span>
            <input
              type="text"
              value={form.username}
              onChange={(e) => updateField("username", e.target.value)}
              className="input-field w-full"
              required
              pattern="[a-zA-Z0-9_-]{3,20}"
            />
          </label>
          <label>
            <span>昵称</span>
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => updateField("displayName", e.target.value)}
              className="input-field w-full"
              maxLength={40}
            />
          </label>
          <label>
            <span>密码 *</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              className="input-field w-full"
              required
              minLength={8}
            />
          </label>
          <label>
            <span>确认密码 *</span>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => updateField("confirmPassword", e.target.value)}
              className="input-field w-full"
              required
            />
          </label>
          <button type="submit" disabled={loading} className="btn-primary auth-form__submit">
            <MailCheck size={16} aria-hidden="true" />
            {loading ? "发送中..." : "发送邮箱验证码"}
          </button>
        </form>
      ) : (
        <form onSubmit={confirmRegistration} className="auth-form">
          {error && <p className="auth-form__error">{error}</p>}
          <p className="text-sm text-[#6b6b6b]">
            验证码已发送到 {form.email}，请输入邮件中的 6 位验证码。
          </p>
          <label>
            <span>邮箱验证码 *</span>
            <input
              type="text"
              inputMode="numeric"
              value={form.code}
              onChange={(e) => updateField("code", e.target.value)}
              className="input-field w-full"
              required
              pattern="[0-9]{6}"
              autoFocus
            />
          </label>
          <button type="submit" disabled={loading} className="btn-primary auth-form__submit">
            <UserPlus size={16} aria-hidden="true" />
            {loading ? "注册中..." : "完成注册"}
          </button>
          <button
            type="button"
            className="text-sm text-[#6b6b6b]"
            onClick={() => setChallengeId("")}
          >
            返回修改注册信息
          </button>
        </form>
      )}
    </AuthShell>
  );
}
