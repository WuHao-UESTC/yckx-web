"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, MailCheck } from "lucide-react";
import { AuthShell } from "@/components/interior/auth-shell";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/password/request-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "验证码发送失败");
      return;
    }
    if (!data.challengeId) {
      setError("如果邮箱已注册，验证码已发送，请查收邮件。");
      return;
    }
    setChallengeId(data.challengeId);
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId, code, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "密码修改失败");
      return;
    }
    router.push("/login?reset=1");
  }

  return (
    <AuthShell
      title="找回密码"
      description="通过注册邮箱验证码设置新密码。"
      footer={
        <p>
          <Link href="/login">返回登录</Link>
        </p>
      }
    >
      {!challengeId ? (
        <form onSubmit={requestCode} className="auth-form">
          {error && <p className="auth-form__error">{error}</p>}
          <label>
            <span>注册邮箱</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field w-full"
              required
              autoFocus
            />
          </label>
          <button type="submit" disabled={loading} className="btn-primary auth-form__submit">
            <MailCheck size={16} aria-hidden="true" />
            {loading ? "发送中..." : "发送验证码"}
          </button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="auth-form">
          {error && <p className="auth-form__error">{error}</p>}
          <p className="text-sm text-[#6b6b6b]">如果邮箱已注册，验证码已经发送，请查收邮件。</p>
          <label>
            <span>验证码</span>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="input-field w-full"
              required
              pattern="[0-9]{6}"
              autoFocus
            />
          </label>
          <label>
            <span>新密码</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field w-full"
              required
              minLength={8}
            />
          </label>
          <button type="submit" disabled={loading} className="btn-primary auth-form__submit">
            <KeyRound size={16} aria-hidden="true" />
            {loading ? "修改中..." : "修改密码"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
