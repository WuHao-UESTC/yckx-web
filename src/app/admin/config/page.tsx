import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const CONFIG_KEYS = [
  { key: "site_subtitle", label: "首页副标题", placeholder: "技术博客 · 竞赛知识库 · 工作日志 · 团队日常" },
  { key: "site_motto", label: "科协标语", placeholder: "自由 · 创新 · 博学 · 精进" },
  { key: "site_description", label: "科协简介（Hero区域）", placeholder: "一群热爱技术的年轻人…" },
  { key: "about_text", label: "关于我们（页脚或独立页）", placeholder: "英才科协成立于…" },
];

export default async function SiteConfigPage() {
  const configs = await prisma.siteConfig.findMany();
  const configMap = new Map(configs.map((c) => [c.key, c.value]));

  async function saveConfig(formData: FormData) {
    "use server";
    for (const { key } of CONFIG_KEYS) {
      const value = formData.get(key) as string;
      if (value !== null) {
        await prisma.siteConfig.upsert({
          where: { key },
          update: { value: value || "" },
          create: { key, value: value || "" },
        });
      }
    }
    revalidatePath("/admin/config");
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-6">站点配置</h1>

      <form action={saveConfig} className="space-y-5">
        {CONFIG_KEYS.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-sm text-[#6b6b6b] mb-1 font-[family-name:var(--font-sans)]">{label}</label>
            {key === "site_description" || key === "about_text" ? (
              <textarea
                name={key}
                defaultValue={String(configMap.get(key) ?? "")}
                rows={4}
                className="input-field w-full font-[family-name:var(--font-sans)]"
                placeholder={placeholder}
              />
            ) : (
              <input
                name={key}
                defaultValue={String(configMap.get(key) ?? "")}
                className="input-field w-full"
                placeholder={placeholder}
              />
            )}
          </div>
        ))}

        <button type="submit" className="btn-primary">保存配置</button>
      </form>

      <p className="mt-6 text-xs text-[#6b6b6b] font-[family-name:var(--font-sans)]">
        配置保存在数据库 <code>site_configs</code> 表中，修改后立即生效。
      </p>
    </div>
  );
}
