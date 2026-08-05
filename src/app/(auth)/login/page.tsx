"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { LogIn } from "lucide-react";
import { AuthShell } from "@/components/interior/auth-shell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("邮箱或密码错误");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <AuthShell
      title="登录"
      description="验证身份后继续进入同行工作台。"
      footer={
        <p>
          还没有账号？ <Link href="/register">注册账号</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <p className="auth-form__error">{error}</p>}

        <label>
          <span>邮箱</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field w-full"
            required
            autoFocus
          />
        </label>

        <p className="text-sm text-right">
          <Link href="/forgot-password">忘记密码？</Link>
        </p>

        <label>
          <span>密码</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field w-full"
            required
          />
        </label>

        <button type="submit" disabled={loading} className="btn-primary auth-form__submit">
          <LogIn size={16} aria-hidden="true" />
          {loading ? "登录中..." : "登录"}
        </button>
      </form>
    </AuthShell>
  );
}
