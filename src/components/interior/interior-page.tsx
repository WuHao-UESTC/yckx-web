import type { ReactNode } from "react";

export type InteriorTheme =
  "surface" | "knowledge" | "competition" | "archive" | "routine" | "workspace" | "admin";

export function InteriorPage({
  theme,
  depth,
  section,
  title,
  description,
  actions,
  children,
  contentWidth = "wide",
  className,
  showHeader = true,
}: {
  theme: InteriorTheme;
  depth: string;
  section: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  contentWidth?: "wide" | "reading" | "full";
  className?: string;
  showHeader?: boolean;
}) {
  return (
    <div
      className={["interior-page", className].filter(Boolean).join(" ")}
      data-interior-theme={theme}
    >
      <div className="interior-page__ambient" aria-hidden="true" />
      <div className={`interior-page__shell interior-page__shell--${contentWidth}`}>
        {showHeader && (
          <header className="interior-page__header">
            <div className="interior-page__coordinate">
              <span>{depth}</span>
              <i aria-hidden="true" />
              <strong>{section}</strong>
            </div>
            <div className="interior-page__heading">
              <h1>{title}</h1>
              {description && <p>{description}</p>}
            </div>
            {actions && <div className="interior-page__actions">{actions}</div>}
            <div className="interior-page__mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </header>
        )}
        <div className="interior-page__content">{children}</div>
      </div>
    </div>
  );
}

export function InteriorSectionHeading({
  title,
  meta,
  action,
}: {
  title: string;
  meta?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="interior-section-heading">
      <div>
        <h2>{title}</h2>
        {meta && <p>{meta}</p>}
      </div>
      {action && <div className="interior-section-heading__action">{action}</div>}
    </div>
  );
}

export function InteriorEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="interior-empty">
      <span aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
