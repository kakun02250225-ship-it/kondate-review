import Header from "../components/Header";
import MealCard from "../components/MealCard";
import { mealPlans, recipes } from "../data";

const MEAL_SLOTS = [
  { key: "breakfast", label: "朝食", icon: "🌅", aliases: ["morning", "朝食", "朝"] },
  { key: "lunch", label: "昼食", icon: "☀️", aliases: ["昼食", "昼"] },
  { key: "dinner", label: "夕食", icon: "🌙", aliases: ["supper", "夕食", "夜"] },
];

function firstPlan(plans) {
  if (Array.isArray(plans)) return plans[0];
  if (!plans || typeof plans !== "object") return undefined;
  return plans.threeDay ?? plans.oneDay ?? Object.values(plans)[0];
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

function formatSummary(plan, schedule, recipeMap) {
  const selectedRecipes = schedule.flatMap((day) =>
    MEAL_SLOTS.map((slot) => recipeMap.get(mealIdFor(day, slot))).filter(Boolean),
  );
  const totalPrice = selectedRecipes.reduce((sum, recipe) => sum + Number(recipe.price ?? 0), 0);
  const totalProtein = selectedRecipes.reduce((sum, recipe) => sum + Number(recipe.protein ?? 0), 0);

  return {
    price: plan?.summary?.price ?? plan?.totalPrice ?? totalPrice,
    protein: plan?.summary?.protein ?? `${Math.round(totalProtein / Math.max(schedule.length, 1))}g/日`,
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
  const selectedPlan = plan ?? activePlan ?? firstPlan(mealPlans);
  const schedule = planSchedule(selectedPlan);
  const recipeMap = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const summary = formatSummary(selectedPlan, schedule, recipeMap);
  const confirmPlan = onConfirmPlan ?? onConfirm;

  return (
    <section className="screen meal-suggestion-screen">
      <Header
        onBack={onBack}
        subtitle="予算・栄養・調理時間をまとめて考えました"
        title="おすすめ献立"
      />

      <div className="screen-body">
        <div className="recommendation-hero">
          <div>
            <span className="eyebrow">あなたへのおすすめ</span>
            <h2>{selectedPlan?.title ?? `${schedule.length || 1}日分の献立`}</h2>
          </div>
          <span className="recommendation-hero__badge">{schedule.length || 1}日分</span>
          <p>{selectedPlan?.reason ?? "高たんぱくと時短を両立し、洗い物も少なくなる組み合わせです。"}</p>
          <dl className="summary-row">
            <div>
              <dt>食費目安</dt>
              <dd>約{Number(summary.price || 0).toLocaleString()}円</dd>
            </div>
            <div>
              <dt>たんぱく質</dt>
              <dd>{summary.protein}</dd>
            </div>
          </dl>
        </div>

        {schedule.length > 0 ? (
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
                  {MEAL_SLOTS.map((slot) => {
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
                        <p>料理を選んでください</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span aria-hidden="true">🍽️</span>
            <h2>献立を準備しています</h2>
            <p>条件入力に戻って、日数を選んでください。</p>
          </div>
        )}

        <div className="sticky-actions">
          <button
            className="button button--primary button--large"
            disabled={schedule.length === 0}
            onClick={() => confirmPlan?.(selectedPlan)}
            type="button"
          >
            この献立に決定
          </button>
          <p className="action-help">決定後に、必要な食材を買い物リストで確認できます</p>
        </div>
      </div>
    </section>
  );
}
