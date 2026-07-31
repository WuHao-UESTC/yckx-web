"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <h1 className="text-4xl font-bold text-[#c4a882] mb-4">出了点问题</h1>
      <p className="text-[#6b6b6b] mb-6 font-[family-name:var(--font-sans)]">
        页面加载失败，请稍后重试。
      </p>
      <button onClick={reset} className="btn-primary">
        重试
      </button>
    </div>
  );
}
