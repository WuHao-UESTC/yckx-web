"use client";

import { useState } from "react";
import {
  ArrowUpRight,
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
  index,
  label,
  value,
  icon: Icon,
}: {
  index: string;
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
      <span className="friend-profile__contact-index" aria-hidden="true">
        {index}
      </span>
      <span className="friend-profile__contact-icon">
        <Icon size={16} aria-hidden="true" />
      </span>
      <span className="friend-profile__contact-copy">
        <small>{label}</small>
        <strong>{revealed ? value : mask(value)}</strong>
      </span>
      <span className="friend-profile__contact-action" aria-label={copied ? "已复制" : "复制"}>
        {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
      </span>
    </button>
  );
}

function LinkedContact({
  index,
  label,
  value,
  href,
  icon: Icon,
}: {
  index: string;
  label: string;
  value: string;
  href: string;
  icon: LucideIcon;
}) {
  return (
    <a className="friend-profile__contact" href={href} target="_blank" rel="noopener noreferrer">
      <span className="friend-profile__contact-index" aria-hidden="true">
        {index}
      </span>
      <span className="friend-profile__contact-icon">
        <Icon size={16} aria-hidden="true" />
      </span>
      <span className="friend-profile__contact-copy">
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
      <span className="friend-profile__contact-action" aria-hidden="true">
        <ArrowUpRight size={15} />
      </span>
    </a>
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
  const channels = [website, github, bilibili, contactEmail, qq, wechat].filter(Boolean);
  const hasChannels = channels.length > 0;

  return (
    <section className="friend-profile__contacts" aria-labelledby="friend-contact-title">
      <div className="friend-profile__contacts-heading">
        <div>
          <span id="friend-contact-title">通信频道</span>
          <small>CONTACT CHANNELS / OPEN NETWORK</small>
        </div>
        {hasChannels && <strong>{String(channels.length).padStart(2, "0")}</strong>}
      </div>

      {!hasChannels ? (
        <p className="friend-profile__contacts-empty">尚未设置公开通信频道。</p>
      ) : (
        <div className="friend-profile__contact-grid">
          {contactEmail && (
            <ContactButton index="01" label="公开邮箱" value={contactEmail} icon={Mail} />
          )}
          {qq && <ContactButton index="02" label="QQ" value={qq} icon={MessageCircle} />}
          {wechat && <ContactButton index="03" label="微信" value={wechat} icon={MessageCircle} />}
          {website &&
            (websiteHref ? (
              <LinkedContact
                index="04"
                label="个人网站"
                value={website}
                href={websiteHref}
                icon={Globe2}
              />
            ) : (
              <span className="friend-profile__contact friend-profile__contact--text">
                <span className="friend-profile__contact-index" aria-hidden="true">
                  04
                </span>
                <span className="friend-profile__contact-icon">
                  <Globe2 size={16} aria-hidden="true" />
                </span>
                <span className="friend-profile__contact-copy">
                  <small>个人网站</small>
                  <strong>{website}</strong>
                </span>
                <span className="friend-profile__contact-action" aria-hidden="true">
                  <Globe2 size={15} />
                </span>
              </span>
            ))}
          {github && (
            <LinkedContact
              index="05"
              label="GitHub"
              value={github}
              href={`https://github.com/${encodeURIComponent(github)}`}
              icon={Code2}
            />
          )}
          {bilibili && (
            <LinkedContact
              index="06"
              label="B 站 UID"
              value={bilibili}
              href={`https://space.bilibili.com/${encodeURIComponent(bilibili)}`}
              icon={PlaySquare}
            />
          )}
        </div>
      )}
    </section>
  );
}
