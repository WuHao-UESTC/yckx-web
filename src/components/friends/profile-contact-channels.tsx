"use client";

import { useState } from "react";
import {
  Check,
  Code2,
  Copy,
  Globe2,
  Mail,
  MessageCircle,
  PlaySquare,
  type LucideIcon,
} from "lucide-react";

type ContactChannelsProps = {
  website: string | null;
  websiteHref: string | null;
  github: string | null;
  bilibili: string | null;
  contactEmail: string | null;
  qq: string | null;
  wechat: string | null;
};

function mask(value: string) {
  if (value.length <= 4) return "••••";
  return `${value.slice(0, 2)}••••${value.slice(-2)}`;
}

function ContactButton({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    setRevealed(true);
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      className="friend-profile__contact friend-profile__contact--private"
      onClick={() => void copyValue()}
      title="点击显示并复制"
    >
      <Icon size={16} aria-hidden="true" />
      <span>
        <small>{label}</small>
        <strong>{revealed ? value : mask(value)}</strong>
      </span>
      {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
    </button>
  );
}

export function ProfileContactChannels({
  website,
  websiteHref,
  github,
  bilibili,
  contactEmail,
  qq,
  wechat,
}: ContactChannelsProps) {
  const hasChannels = Boolean(website || github || bilibili || contactEmail || qq || wechat);

  return (
    <section className="friend-profile__contacts" aria-labelledby="friend-contact-title">
      <div className="friend-profile__contacts-heading">
        <span id="friend-contact-title">通信频道</span>
        <small>CONTACT CHANNELS</small>
      </div>

      {!hasChannels ? (
        <p className="friend-profile__contacts-empty">尚未设置公开通信频道。</p>
      ) : (
        <div className="friend-profile__contact-grid">
          {contactEmail && <ContactButton label="公开邮箱" value={contactEmail} icon={Mail} />}
          {qq && <ContactButton label="QQ" value={qq} icon={MessageCircle} />}
          {wechat && <ContactButton label="微信" value={wechat} icon={MessageCircle} />}
          {website &&
            (websiteHref ? (
              <a
                className="friend-profile__contact"
                href={websiteHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Globe2 size={16} aria-hidden="true" />
                <span>
                  <small>个人网站</small>
                  <strong>{website}</strong>
                </span>
              </a>
            ) : (
              <span className="friend-profile__contact friend-profile__contact--text">
                <Globe2 size={16} aria-hidden="true" />
                <span>
                  <small>个人网站</small>
                  <strong>{website}</strong>
                </span>
              </span>
            ))}
          {github && (
            <a
              className="friend-profile__contact"
              href={`https://github.com/${encodeURIComponent(github)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Code2 size={16} aria-hidden="true" />
              <span>
                <small>GitHub</small>
                <strong>{github}</strong>
              </span>
            </a>
          )}
          {bilibili && (
            <a
              className="friend-profile__contact"
              href={`https://space.bilibili.com/${encodeURIComponent(bilibili)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <PlaySquare size={16} aria-hidden="true" />
              <span>
                <small>B 站 UID</small>
                <strong>{bilibili}</strong>
              </span>
            </a>
          )}
        </div>
      )}
    </section>
  );
}
