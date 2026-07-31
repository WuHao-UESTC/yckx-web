import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <h1 className="text-6xl font-bold text-[#c4a882] mb-4">404</h1>
      <p className="text-[#6b6b6b] mb-6 font-[family-name:var(--font-sans)]">
        页面不存在或已被移除。
      </p>
      <Link href="/" className="btn-primary">
        返回首页
      </Link>
    </div>
  );
}
