import Header from "../components/Header";
import { ingredients, unavailableIngredientScenario } from "../data";

function findIngredient(id) {
  return ingredients.find((ingredient) => ingredient.id === id);
}

function usageLabel(usage) {
  if (typeof usage === "string") return usage;
  if (!usage) return "献立で使用予定";
  const day = usage.dayLabel ?? usage.day ?? "";
  const meal = usage.mealLabel ?? usage.meal ?? "";
  const recipe = usage.recipeName ?? usage.name ?? "";
  return [day && `${day}日目`, meal, recipe].filter(Boolean).join("・");
}

export default function UnavailableIngredient({
  ingredientId,
  scenario,
  usages,
  onSuggestSubstitute,
  onChooseSubstitution,
  onRecreatePlan,
  onBack,
}) {
  const selectedScenario = scenario ?? unavailableIngredientScenario ?? {};
  const selectedIngredientId =
    ingredientId ?? selectedScenario.ingredientId ?? selectedScenario.originalIngredientId;
  const ingredient = findIngredient(selectedIngredientId) ?? selectedScenario.ingredient ?? {};
  const affectedMeals =
    usages ?? selectedScenario.usages ?? selectedScenario.usedIn ?? selectedScenario.affectedMeals ?? [];
  const suggestSubstitute = onSuggestSubstitute ?? onChooseSubstitution;

  return (
    <section className="screen unavailable-ingredient-screen">
      <Header
        onBack={onBack}
        subtitle="予定どおり買えなくても、献立をあきらめなくて大丈夫です"
        title="購入できなかった食材"
      />

      <div className="screen-body">
        <div className="unavailable-hero">
          <span className="unavailable-hero__icon" aria-hidden="true">🛒</span>
          <span className="eyebrow">買えなかった食材</span>
          <h2>{ingredient.name ?? selectedScenario.ingredientName ?? "鶏むね肉"}</h2>
          <p>{selectedScenario.reason ?? "売り切れ、または予算より高かった場合を想定しています。"}</p>
        </div>

        <section className="affected-meals-card">
          <h2>この食材を使う予定の献立</h2>
          {affectedMeals.length > 0 ? (
            <ul className="affected-meals-list">
              {affectedMeals.map((usage, index) => (
                <li key={usage.id ?? `${usageLabel(usage)}-${index}`}>
                  <span aria-hidden="true">🍽️</span>
                  <span>{usageLabel(usage)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>1日目・夕食「鶏むね肉のポン酢炒め」</p>
          )}
        </section>

        <div className="assistant-message">
          <span className="assistant-message__avatar" aria-hidden="true">🥕</span>
          <div>
            <strong>条件をなるべく保ったまま調整できます</strong>
            <p>
              {selectedScenario.message ??
                "価格・たんぱく質・調理時間を比べて代わりの食材を選ぶか、この食材を使わない献立に変更しましょう。"}
            </p>
          </div>
        </div>

        <div className="decision-list">
          <button
            className="decision-card"
            onClick={() => suggestSubstitute?.(selectedIngredientId)}
            type="button"
          >
            <span className="decision-card__icon" aria-hidden="true">⇄</span>
            <span className="decision-card__copy">
              <strong>代替食材を提案</strong>
              <small>献立はそのまま。似た栄養の食材に置き換えます</small>
            </span>
            <span aria-hidden="true">›</span>
          </button>

          <button
            className="decision-card"
            onClick={() => onRecreatePlan?.(selectedIngredientId)}
            type="button"
          >
            <span className="decision-card__icon" aria-hidden="true">↻</span>
            <span className="decision-card__copy">
              <strong>献立を再作成</strong>
              <small>この食材を除外して、新しい料理を提案します</small>
            </span>
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>
    </section>
  );
}
