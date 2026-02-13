import React from "react";

/**
 * Collapsible panel used for assistant response/directions/status.
 */
// PUBLIC_INTERFACE
export default function CollapsiblePanel({
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
}) {
  return (
    <section className="panel" aria-label={title}>
      <button
        type="button"
        className="panel__header"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="panel__titleWrap">
          <span className="panel__title">{title}</span>
          {subtitle ? <span className="panel__subtitle">{subtitle}</span> : null}
        </span>

        <span className="panel__chev" aria-hidden="true">
          {isOpen ? "−" : "+"}
        </span>
      </button>

      {isOpen ? <div className="panel__body">{children}</div> : null}
    </section>
  );
}
