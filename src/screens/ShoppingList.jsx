import Header from "../components/Header";
import IngredientList from "../components/IngredientList";
import { shoppingList, unavailableIngredientScenario } from "../data";

function groupsFrom(source, planId) {
  if (Array.isArray(source)) {
    if (source.every((group) => Array.isArray(group?.items))) return source;
    return [];
  }

  if (!source || typeof source !== "object") return [];
  if (Array.isArray(source.groups)) return source.groups;
  if (planId && Array.isArray(source[planId]?.groups)) return source[planId].groups;

  const candidate = Object.values(source).find((value) => Array.isArray(value?.groups));
  return candidate?.groups ?? [];
}

function itemId(item) {
  return item.id ?? item.shoppingItemId ?? item.ingredientId;
}

export default function ShoppingList({
  groups,
  shoppingGroups,
  plan,
  planConfirmed = false,
  planId,
  unavailableIngredientId,
  checkedItems = {},
  onToggleItem,
  onToggle,
  onUnavailableIngredient,
  onReceiptScan,
  onViewRecipes,
  onBack,
}) {
  const visibleGroups = planConfirmed ? (groups ?? shoppingGroups ?? groupsFrom(shoppingList, planId)) : [];
  const allItems = visibleGroups.flatMap((group) => group.items ?? []);
  const checkedCount = allItems.filter((item) => checkedItems[itemId(item)]).length;
  const toggleItem = onToggleItem ?? onToggle;
  const unavailableId =
    unavailableIngredientId ??
    unavailableIngredientScenario?.ingredientId ??
    unavailableIngredientScenario?.originalIngredientId ??
    "chicken-breast";
  const planLabel = plan?.label ?? plan?.title ?? "決定した献立";

  return (
    <section className="screen shopping-list-screen">
      <Header
        onBack={onBack}
        subtitle="決定した献立に必要な食材だけをまとめます"
        title="買い物リスト"
      />

      <div className="screen-body">
        {!planConfirmed || visibleGroups.length === 0 ? (
          <div className="empty-state">
            <span aria-hidden="true">🛒</span>
            <h2>まだ買い物リストはありません</h2>
            <p>
              先にホームで献立を作成して、「この献立に決定」を押すと、
              その献立ぶんの買い物リストが表示されます。
            </p>
            <button className="button button--primary button--large" type="button" onClick={onBack}>
              献立を確認する
            </button>
          </div>
        ) : (
          <>
            <div className="info-card info-card--warm">
              <span className="info-card__icon" aria-hidden="true">🍳</span>
              <div>
                <p className="eyebrow">対象の献立</p>
                <h2>{planLabel}</h2>
                <p>この献立に必要な食材だけを表示しています。</p>
              </div>
            </div>

            <div className="shopping-progress">
              <div className="shopping-progress__copy">
                <span>購入済み</span>
                <strong>{checkedCount} / {allItems.length}品</strong>
              </div>
              <progress
                aria-label={`${allItems.length}品中${checkedCount}品を購入済み`}
                className="progress-bar"
                max={allItems.length || 1}
                value={checkedCount}
              >
                {checkedCount} / {allItems.length}
              </progress>
            </div>

            <IngredientList
              checked={checkedItems}
              checkedItems={checkedItems}
              groups={visibleGroups}
              onToggle={toggleItem}
              onToggleItem={toggleItem}
            />

            <div className="shopping-support-card">
              <span className="shopping-support-card__icon" aria-hidden="true">💡</span>
              <div>
                <h2>買えない食材があったら</h2>
                <p>
                  似た食材への置き換え、またはその食材を使わない献立への組み直しを試せます。
                </p>
                <button
                  className="button button--outline button--full"
                  onClick={() => onUnavailableIngredient?.(unavailableId)}
                  type="button"
                >
                  買えなかった食材がある
                </button>
              </div>
            </div>

            <div className="shopping-actions sticky-actions">
              <button
                className="button button--primary button--large"
                onClick={onReceiptScan}
                type="button"
              >
                <span aria-hidden="true">▣</span>
                レシートを読み取って購入済みにする
              </button>
              <button
                className="button button--secondary button--large"
                onClick={onViewRecipes}
                type="button"
              >
                レシピを確認する
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
