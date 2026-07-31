"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <div className="flex items-center justify-center py-12 px-5">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6 text-center">注册</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded font-[family-name:var(--font-sans)]">
              {error}
            </p>
          )}

          <div>
            <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">
              邀请码 *
            </label>
            <input
              type="text"
              value={form.inviteCode}
              onChange={(e) => updateField("inviteCode", e.target.value)}
              className="input-field w-full"
              required
              autoFocus
              placeholder="请输入管理员提供的邀请码"
            />
          </div>

          <div>
            <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">
              邮箱
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="input-field w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">
              用户名
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => updateField("username", e.target.value)}
              className="input-field w-full"
              required
              pattern="[a-zA-Z0-9_-]{3,20}"
              placeholder="3-20位字母、数字、下划线或短横线"
            />
          </div>

          <div>
            <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">
              密码
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              className="input-field w-full"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">
              确认密码
            </label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => updateField("confirmPassword", e.target.value)}
              className="input-field w-full"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full text-center">
            {loading ? "注册中..." : "注册"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#6b6b6b] font-[family-name:var(--font-sans)]">
          已有账号？{" "}
          <Link href="/login" className="text-[#8b5e3c] hover:text-[#5a3a22]">
            登录
          </Link>
        </p>
      </div>
    </div>
  );
}
