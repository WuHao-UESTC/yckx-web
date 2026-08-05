"use client";

import { useState } from "react";

type Option = { id: string; label: string; targetType: "CATEGORY" | "COLUMN"; type: string };
type Current = {
  targetKey: string;
  category: { name: string } | null;
  column: { title: string } | null;
};

export function SubscriptionManager({
  options,
  initial,
}: {
  options: Option[];
  initial: Current[];
}) {
  const [subscriptions, setSubscriptions] = useState(initial);
  const [message, setMessage] = useState("");
  async function add(
    targetType: "SITE" | "CATEGORY" | "COLUMN",
    targetId?: string,
    siteKey?: string
  ) {
    const response = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, siteKey }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "订阅失败");
      return;
    }
    setSubscriptions((current) => [...current, data]);
    setMessage("订阅已保存");
  }
  async function remove(targetKey: string) {
    const [targetType, targetId] = targetKey.split(":");
    const response = await fetch(
      `/api/subscriptions?targetType=${targetType}&${targetType === "SITE" ? `siteKey=${targetId}` : `targetId=${targetId}`}`,
      { method: "DELETE" }
    );
    if (response.ok)
      setSubscriptions((current) => current.filter((item) => item.targetKey !== targetKey));
  }
  const has = (key: string) => subscriptions.some((item) => item.targetKey === key);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-2">整站板块</h2>
        <div className="flex flex-wrap gap-2">
          {["ALL", "KNOWLEDGE", "COMPETITION", "NEWS"].map((key) => (
            <button
              key={key}
              type="button"
              disabled={has(`SITE:${key}`)}
              onClick={() =>
                void add("SITE", undefined, key as "ALL" | "KNOWLEDGE" | "COMPETITION" | "NEWS")
              }
              className="btn-secondary"
            >
              {has(`SITE:${key}`) ? "已订阅 " : "订阅 "}
              {key === "ALL"
                ? "全部更新"
                : key === "KNOWLEDGE"
                  ? "知识库"
                  : key === "COMPETITION"
                    ? "竞赛"
                    : "新闻"}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold mb-2">分类与专栏</h2>
        <div className="space-y-2">
          {options.map((option) => (
            <div
              key={`${option.targetType}:${option.id}`}
              className="flex items-center justify-between border-b border-[#eee6db] py-2"
            >
              <span>{option.label}</span>
              <button
                type="button"
                disabled={has(`${option.targetType}:${option.id}`)}
                onClick={() => void add(option.targetType, option.id)}
                className="btn-secondary text-sm"
              >
                {has(`${option.targetType}:${option.id}`) ? "已订阅" : "订阅"}
              </button>
            </div>
          ))}
        </div>
      </div>
      {subscriptions.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-2">当前订阅</h2>
          {subscriptions.map((item) => (
            <div key={item.targetKey} className="flex items-center justify-between py-2">
              <span>
                {item.targetKey.startsWith("SITE:")
                  ? `整站 ${item.targetKey.slice(5)}`
                  : (item.category?.name ?? item.column?.title ?? item.targetKey)}
              </span>
              <button
                type="button"
                className="text-sm text-red-700"
                onClick={() => void remove(item.targetKey)}
              >
                取消订阅
              </button>
            </div>
          ))}
        </div>
      )}
      {message && <p className="text-sm text-[#5a8a6a]">{message}</p>}
    </div>
  );
}
