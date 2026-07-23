import Header from "../components/Header";
import IngredientList from "../components/IngredientList";
import { recipes, shoppingList, unavailableIngredientScenario } from "../data";

const MEAL_SLOTS = [
  { key: "breakfast", label: "朝ごはん", aliases: ["morning", "朝食", "朝"] },
  { key: "lunch", label: "昼ごはん", aliases: ["昼食", "昼"] },
  { key: "dinner", label: "夜ごはん", aliases: ["supper", "夕食", "夜"] },
];

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

function planSchedule(plan) {
  if (Array.isArray(plan?.schedule)) return plan.schedule;
  if (Array.isArray(plan?.daily)) return plan.daily;
  if (Array.isArray(plan?.days)) return plan.days;
  return [];
}

function mealIdFor(day, slot) {
  const meals = day?.meals ?? day?.mealIds ?? day ?? {};
  const keys = [slot.key, ...slot.aliases];

  for (const key of keys) {
    const meal = meals[key];
    if (typeof meal === "string") return meal;
    if (meal && typeof meal === "object") return meal.recipeId ?? meal.id;
  }

  return undefined;
}

function planMealsFrom(plan) {
  const recipeMap = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const visibleSlots = MEAL_SLOTS.filter((slot) => !plan?.mealSlots || plan.mealSlots.includes(slot.key));

  return planSchedule(plan)
    .map((day, dayIndex) => ({
      id: day.id ?? day.date ?? day.label ?? `day-${dayIndex}`,
      label: day.label ?? day.dateLabel ?? `${dayIndex + 1}日目`,
      meals: visibleSlots
        .map((slot) => {
          const recipe = recipeMap.get(mealIdFor(day, slot));
          return recipe ? { id: `${dayIndex}-${slot.key}-${recipe.id}`, label: slot.label, name: recipe.name } : null;
        })
        .filter(Boolean),
    }))
    .filter((day) => day.meals.length > 0);
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
  const planMeals = planConfirmed ? planMealsFrom(plan) : [];
  const plannedMealCount = planMeals.reduce((sum, day) => sum + day.meals.length, 0);

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
            {planMeals.length > 0 && (
              <section className="shopping-plan-card" aria-label="この買い物リストの対象料理">
                <div className="shopping-plan-summary">
                  <div>
                    <span className="eyebrow">買い物対象</span>
                    <h2>{planLabel}</h2>
                    <p>この献立に必要な材料をまとめています</p>
                  </div>
                  <span className="status-badge badge">{plannedMealCount}食分</span>
                </div>
                <details className="shopping-plan-details">
                  <summary>対象の料理を確認</summary>
                  <div className="shopping-plan-days">
                    {planMeals.map((day) => (
                      <div className="shopping-plan-day" key={day.id}>
                        <strong>{day.label}</strong>
                        <ul className="shopping-plan-meals">
                          {day.meals.map((meal) => (
                            <li className="shopping-plan-meal" key={meal.id}>
                              <span className="shopping-plan-meal__label">{meal.label}</span>
                              <span>{meal.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </details>
              </section>
            )}

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
              showUsedIn
              onUnavailable={(item) => onUnavailableIngredient?.(item.ingredientId)}
              onToggle={toggleItem}
              onToggleItem={toggleItem}
            />

            <div className="shopping-support-card">
              <span className="shopping-support-card__icon" aria-hidden="true">💡</span>
              <div>
                <h2>買えない食材があったら</h2>
                <p>
                  主食・肉魚・野菜など、買えなかった食材の行から個別に選べます。
                  調味料は家にある前提なので対象外にしています。
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

