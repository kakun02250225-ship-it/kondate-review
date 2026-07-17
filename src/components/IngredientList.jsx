"use client";

const checkedValue = (checkedIds, item) => {
  if (checkedIds instanceof Set) return checkedIds.has(item.id);
  if (Array.isArray(checkedIds)) return checkedIds.includes(item.id);
  if (checkedIds && typeof checkedIds === "object") return Boolean(checkedIds[item.id]);
  return Boolean(item.checked);
};

const normalizeGroups = (groups, items) => {
  if (groups?.length) return groups;
  if (!items?.length) return [];

  return Object.values(items.reduce((result, item) => {
    const category = item.category ?? "その他";
    result[category] ??= { id: category, category, items: [] };
    result[category].items.push(item);
    return result;
  }, {}));
};

const scaleAmount = (amount, servings) => {
  if (!amount || servings === 1 || typeof amount !== "string") return amount;
  const match = amount.match(/^(\d+(?:\.\d+)?)(.*)$/);
  if (!match) return amount;
  return `${Number(match[1]) * servings}${match[2]}`;
};

export function IngredientList({
  groups,
  items,
  ingredients,
  checkedIds,
  checked,
  checkedItems,
  onToggle,
  onToggleItem,
  onUnavailable,
  servings = 1,
  showCheckboxes,
  showUsedIn = false,
  emptyMessage = "食材はありません",
  className = "",
}) {
  const normalizedGroups = normalizeGroups(groups, items ?? ingredients);
  const effectiveCheckedIds = checkedIds ?? checkedItems ?? checked;
  const toggleItem = onToggleItem ?? onToggle;
  const shouldShowCheckboxes = showCheckboxes ?? Boolean(groups || effectiveCheckedIds || toggleItem);
  const classes = ["ingredient-list", className].filter(Boolean).join(" ");

  if (!normalizedGroups.length) {
    return <p className="ingredient-list__empty">{emptyMessage}</p>;
  }

  return (
    <div className={`${classes} ingredient-groups shopping-groups`}>
      {normalizedGroups.map((group) => (
        <section className="ingredient-list__group ingredient-group shopping-group" key={group.id ?? group.category}>
          <h3 className="ingredient-list__heading ingredient-group__title shopping-group__title">
            {group.icon ? <span aria-hidden="true">{group.icon}</span> : null}
            {group.category ?? group.label}
          </h3>
          <ul className="ingredient-list__items">
            {(group.items ?? []).map((item) => {
              const isChecked = checkedValue(effectiveCheckedIds, item);
              const rawAmount = typeof item.amount === "string" ? scaleAmount(item.amount, servings) : item.amount;
              const amount = rawAmount != null ? `${rawAmount}${item.unit ?? ""}` : item.quantity;
              return (
                <li className={["ingredient-list__item", "ingredient-item", "shopping-item", "check-row", isChecked ? "is-checked checked" : ""].filter(Boolean).join(" ")} key={item.id ?? item.ingredientId ?? item.name}>
                  {shouldShowCheckboxes ? (
                    <input
                      type="checkbox"
                      checked={isChecked}
                      aria-label={`${item.name}を購入済みにする`}
                      onChange={(event) => toggleItem?.(item.id ?? item.ingredientId, event.target.checked, item)}
                    />
                  ) : null}
                  <span className="ingredient-list__name-wrap ingredient-item__content item-copy">
                    <strong className="ingredient-name item-name">{item.name}</strong>
                    {showUsedIn && item.usedIn?.length ? (
                      <small className="used-in">{item.usedIn.join("・")}</small>
                    ) : null}
                  </span>
                  {amount ? <span className="ingredient-list__amount ingredient-amount item-meta">{amount}</span> : null}
                  {onUnavailable && item.canBeUnavailable !== false ? (
                    <button type="button" className="ingredient-list__unavailable" onClick={() => onUnavailable(item)}>
                      買えなかった
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default IngredientList;
