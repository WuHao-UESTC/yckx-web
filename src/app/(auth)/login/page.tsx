"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

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
    <div className="flex items-center justify-center py-20 px-5">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6 text-center">登录</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded font-[family-name:var(--font-sans)]">
              {error}
            </p>
          )}

          <div>
            <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field w-full"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field w-full"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full text-center">
            {loading ? "登录中..." : "登录"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#6b6b6b] font-[family-name:var(--font-sans)]">
          还没有账号？{" "}
          <Link href="/register" className="text-[#8b5e3c] hover:text-[#5a3a22]">
            注册
          </Link>
        </p>
      </div>
    </div>
  );
}
