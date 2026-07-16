"use client";

import { bottomNavItems } from "../data";

export function BottomNav({
  items = bottomNavItems,
  activeId,
  activeTab,
  onChange,
  onNavigate,
  className = "",
  ariaLabel = "メインナビゲーション",
}) {
  const currentId = activeId ?? activeTab;
  const handleChange = onChange ?? onNavigate;
  const classes = ["bottom-nav", className].filter(Boolean).join(" ");

  return (
    <nav className={classes} aria-label={ariaLabel}>
      {items.map((item) => {
        const isActive = item.id === currentId;
        return (
          <button
            key={item.id}
            type="button"
            className={["bottom-nav__item", isActive ? "is-active" : ""].filter(Boolean).join(" ")}
            aria-current={isActive ? "page" : undefined}
            aria-label={item.ariaLabel ?? item.label}
            disabled={item.disabled}
            onClick={() => handleChange?.(item.id, item)}
          >
            <span className="bottom-nav__icon" aria-hidden="true">{item.icon}</span>
            <span className="bottom-nav__label">{item.label}</span>
            {item.badge ? <span className="bottom-nav__badge">{item.badge}</span> : null}
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNav;
