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
  const visibleGroups = groups ?? shoppingGroups ?? groupsFrom(shoppingList, planId);
  const allItems = visibleGroups.flatMap((group) => group.items ?? []);
  const checkedCount = allItems.filter((item) => checkedItems[itemId(item)]).length;
  const toggleItem = onToggleItem ?? onToggle;
  const unavailableId =
    unavailableIngredientId ??
    unavailableIngredientScenario?.ingredientId ??
    unavailableIngredientScenario?.originalIngredientId ??
    "chicken-breast";

  return (
    <section className="screen shopping-list-screen">
      <Header
        onBack={onBack}
        subtitle="売り場ごとにまとめました。買った食材にチェックを入れましょう"
        title="買い物リスト"
      />

      <div className="screen-body">
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

        {visibleGroups.length === 0 && (
          <div className="empty-state">
            <span aria-hidden="true">🛒</span>
            <h2>買い物リストはまだありません</h2>
            <p>献立を決めると必要な食材がここに表示されます。</p>
          </div>
        )}

        <div className="shopping-support-card">
          <span className="shopping-support-card__icon" aria-hidden="true">💡</span>
          <div>
            <h2>食材が高い・売り切れだったら</h2>
            <p>条件に近い代替食材か、その食材を使わない献立を提案できます。</p>
            <button
              className="button button--outline button--full"
              onClick={() => onUnavailableIngredient?.(unavailableId)}
              type="button"
            >
              購入できなかった食材がある
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
            レシートを読み取る
          </button>
          <button
            className="button button--secondary button--large"
            onClick={onViewRecipes}
            type="button"
          >
            レシピを確認する
          </button>
        </div>
      </div>
    </section>
  );
}
