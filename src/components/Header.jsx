"use client";

export function Header({
  title,
  subtitle,
  eyebrow,
  onBack,
  backLabel = "戻る",
  action,
  actionLabel,
  onAction,
  className = "",
  titleId,
  sticky = false,
}) {
  const classes = ["app-header", sticky ? "app-header--sticky" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={`${classes} header`}>
      {onBack ? (
        <button type="button" className="app-header__back header__back back-button" onClick={onBack} aria-label={backLabel}>
          <span aria-hidden="true">‹</span>
        </button>
      ) : <span aria-hidden="true" />}
      <div className="app-header__titles header__copy header-copy">
        {eyebrow ? <p className="app-header__eyebrow eyebrow">{eyebrow}</p> : null}
        <h1 className="app-header__title header__title" id={titleId}>{title}</h1>
        {subtitle ? <p className="app-header__subtitle header__subtitle">{subtitle}</p> : null}
      </div>
      <div className="app-header__side app-header__side--end">
        {action ?? (actionLabel ? (
          <button type="button" className="app-header__action header-action" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null)}
      </div>
    </header>
  );
}

export default Header;
