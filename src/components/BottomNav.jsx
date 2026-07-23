"use client";

import { bottomNavItems } from "../data";

function NavIcon({ id, fallback }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (id === "home") {
    return <svg {...common}><path d="m3 11 9-8 9 8" /><path d="M5 10v11h14V10" /><path d="M9 21v-7h6v7" /></svg>;
  }
  if (id === "create") {
    return <svg {...common}><path d="M12 4v16M4 12h16" /></svg>;
  }
  if (id === "shopping") {
    return <svg {...common}><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20 8H6" /><circle cx="10" cy="20" r="1" /><circle cx="17" cy="20" r="1" /></svg>;
  }
  if (id === "recipes") {
    return <svg {...common}><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v18H7.5A2.5 2.5 0 0 0 5 22Z" /><path d="M5 4.5V22" /><path d="M9 7h7M9 11h7M9 15h5" /></svg>;
  }
  if (id === "settings") {
    return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></svg>;
  }
  return <span>{fallback}</span>;
}

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
            <span className="bottom-nav__icon" aria-hidden="true"><NavIcon id={item.id} fallback={item.icon} /></span>
            <span className="bottom-nav__label">{item.label}</span>
            {item.badge ? <span className="bottom-nav__badge">{item.badge}</span> : null}
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNav;

