/**
 * 将标题文本转换为合法的 HTML id。
 * 处理中英文混合场景：中文保留，空格/特殊符号替换为连字符。
 */
export function slugify(text: string): string {
  return text
    .trim()
    .replace(/[#*`~\[\]()（）「」『』【】《》"']/g, "") // 移除 markdown / 标点符号
    .replace(/[^\w一-鿿㐀-䶿-]+/g, "-") // 非文字字符 → 连字符
    .replace(/^-+|-+$/g, "") // 去除首尾连字符
    .toLowerCase()
    || "untitled";
}
