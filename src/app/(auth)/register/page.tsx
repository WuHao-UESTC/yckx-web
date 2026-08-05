"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { AuthShell } from "@/components/interior/auth-shell";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    inviteCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("两次密码不一致");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        username: form.username,
        password: form.password,
        inviteCode: form.inviteCode,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "注册失败");
    } else {
      router.push("/login?registered=1");
    }
  }

  return (
    <AuthShell
      title="注册"
      description="邀请码用于确认同行者身份，注册后可维护自己的记录。"
      footer={
        <p>
          已有账号？ <Link href="/login">返回登录</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <p className="auth-form__error">{error}</p>}

        <label>
          <span>邀请码 *</span>
          <input
            type="text"
            value={form.inviteCode}
            onChange={(e) => updateField("inviteCode", e.target.value)}
            className="input-field w-full"
            required
            autoFocus
            placeholder="请输入管理员提供的邀请码"
          />
        </label>

        <label>
          <span>邮箱</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            className="input-field w-full"
            required
          />
        </label>

        <label>
          <span>用户名</span>
          <input
            type="text"
            value={form.username}
            onChange={(e) => updateField("username", e.target.value)}
            className="input-field w-full"
            required
            pattern="[a-zA-Z0-9_-]{3,20}"
            placeholder="3-20位字母、数字、下划线或短横线"
          />
        </label>

        <label>
          <span>密码</span>
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
          <span>确认密码</span>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => updateField("confirmPassword", e.target.value)}
            className="input-field w-full"
            required
          />
        </label>

        <button type="submit" disabled={loading} className="btn-primary auth-form__submit">
          <UserPlus size={16} aria-hidden="true" />
          {loading ? "注册中..." : "注册"}
        </button>
      </form>
    </AuthShell>
  );
}
