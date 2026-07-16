import Header from "../components/Header";
import MealCard from "../components/MealCard";
import { recipes } from "../data";

const MEAL_SLOTS = [
  { key: "breakfast", label: "朝ごはん", icon: "☀️", aliases: ["morning", "朝食", "朝"] },
  { key: "lunch", label: "昼ごはん", icon: "🍙", aliases: ["昼食", "昼"] },
  { key: "dinner", label: "夜ごはん", icon: "🌙", aliases: ["supper", "夕食", "夜"] },
];

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

function formatSummary(plan, schedule, recipeMap, slots) {
  const selectedRecipes = schedule.flatMap((day) =>
    slots.map((slot) => recipeMap.get(mealIdFor(day, slot))).filter(Boolean),
  );
  const totalPrice = selectedRecipes.reduce((sum, recipe) => sum + Number(recipe.price ?? 0), 0);
  const totalProtein = selectedRecipes.reduce((sum, recipe) => sum + Number(recipe.protein ?? 0), 0);

  return {
    price: plan?.summary?.price ?? plan?.totalPrice ?? totalPrice,
    protein: selectedRecipes.length
      ? `${Math.round(totalProtein / Math.max(schedule.length, 1))}g/日`
      : "-",
  };
}

export default function MealSuggestion({
  plan,
  activePlan,
  onChangeMeal,
  onConfirmPlan,
  onConfirm,
  onBack,
}) {
  const selectedPlan = plan ?? activePlan;
  const schedule = planSchedule(selectedPlan);
  const recipeMap = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const visibleSlots = MEAL_SLOTS.filter((slot) => !selectedPlan?.mealSlots || selectedPlan.mealSlots.includes(slot.key));
  const summary = formatSummary(selectedPlan, schedule, recipeMap, visibleSlots);
  const confirmPlan = onConfirmPlan ?? onConfirm;

  return (
    <section className="screen meal-suggestion-screen">
      <Header
        onBack={onBack}
        subtitle="条件に合わせて、買い物までつながる献立を作りました"
        title="おすすめ献立"
      />

      <div className="screen-body">
        {!selectedPlan || schedule.length === 0 ? (
          <div className="empty-state">
            <span aria-hidden="true">🍽️</span>
            <h2>まだ献立がありません</h2>
            <p>先に「献立作成」から、1食・1日・3日・1週間のどれを作るか選んでください。</p>
          </div>
        ) : (
          <>
            <div className="recommendation-hero">
              <div>
                <span className="eyebrow">作成した献立</span>
                <h2>{selectedPlan.title ?? selectedPlan.label ?? "献立"}</h2>
              </div>
              <span className="recommendation-hero__badge">{selectedPlan.label ?? `${schedule.length}日分`}</span>
              <p>{selectedPlan.reason ?? "予算・調理時間・栄養バランスを見ながら、固定データで提案しています。"}</p>
              <dl className="summary-row">
                <div>
                  <dt>食費目安</dt>
                  <dd>約¥{Number(summary.price || 0).toLocaleString()}</dd>
                </div>
                <div>
                  <dt>たんぱく質</dt>
                  <dd>{summary.protein}</dd>
                </div>
              </dl>
            </div>

            {selectedPlan.allergyNote && (
              <div className="info-card">
                <span className="info-card__icon" aria-hidden="true">!</span>
                <p>{selectedPlan.allergyNote}</p>
              </div>
            )}

            <div className="meal-plan-days">
              {schedule.map((day, dayIndex) => (
                <section className="meal-day" key={day.id ?? day.date ?? day.label ?? dayIndex}>
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">DAY {dayIndex + 1}</span>
                      <h2>{day.label ?? day.dateLabel ?? `${dayIndex + 1}日目`}</h2>
                    </div>
                    {day.note && <span className="section-heading__note">{day.note}</span>}
                  </div>

                  <div className="meal-card-list">
                    {visibleSlots.map((slot) => {
                      const recipeId = mealIdFor(day, slot);
                      const recipe = recipeMap.get(recipeId);

                      return recipe ? (
                        <MealCard
                          icon={slot.icon}
                          key={slot.key}
                          label={slot.label}
                          meal={recipe}
                          mealLabel={slot.label}
                          onChange={() =>
                            onChangeMeal?.({
                              dayIndex,
                              day,
                              mealType: slot.key,
                              recipeId,
                              recipe,
                            })
                          }
                          recipe={recipe}
                        />
                      ) : (
                        <div className="empty-card" key={slot.key}>
                          <span>{slot.icon} {slot.label}</span>
                          <p>料理がまだ選ばれていません</p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            <div className="sticky-actions">
              <button
                className="button button--primary button--large"
                onClick={() => confirmPlan?.(selectedPlan)}
                type="button"
              >
                この献立に決定
              </button>
              <p className="action-help">決定すると、この献立に必要な食材だけを買い物リストで確認できます。</p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
