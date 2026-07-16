"use client";

export function PhoneFrame({
  children,
  header = null,
  footer = null,
  className = "",
  contentClassName = "",
  ariaLabel = "献立サポートアプリ",
  showStatusBar = false,
  statusTime = "9:41",
  screenId,
  style,
}) {
  const frameClassName = ["phone-frame", className].filter(Boolean).join(" ");
  const contentClasses = ["phone-frame__content", "phone-content", contentClassName].filter(Boolean).join(" ");

  return (
    <section className={frameClassName} aria-label={ariaLabel} data-screen={screenId} style={style}>
      {showStatusBar && (
        <div className="phone-frame__status" aria-hidden="true">
          <span>{statusTime}</span>
          <span className="phone-frame__status-icons">● ◔ ▰</span>
        </div>
      )}
      {header && <div className="phone-frame__header">{header}</div>}
      <div className={contentClasses}>{children}</div>
      {footer && <div className="phone-frame__footer">{footer}</div>}
    </section>
  );
}

export default PhoneFrame;
