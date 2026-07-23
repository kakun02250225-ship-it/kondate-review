import { useEffect, useState } from "react";
import Header from "../components/Header";
import { formatCookingTime, recipes } from "../data";

const mealLabels = {
  breakfast: "朝ごはん",
  lunch: "昼ごはん",
  dinner: "夜ごはん",
};

function planDays(plan) {
  if (Array.isArray(plan?.days)) return plan.days;
  if (Array.isArray(plan?.schedule)) return plan.schedule;
  if (Array.isArray(plan?.daily)) return plan.daily;
  return [];
}

export default function RecipeList({
  plan,
  selectedRecipeId,
  completedRecipeIds = [],
  feedbackByRecipe = {},
  onSelectRecipe,
  onFeedbackRecipe,
  onBack,
}) {
  const recipeMap = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const days = planDays(plan);
  const planRecipeIds = [...new Set(days.flatMap((day) => Object.values(day.meals ?? {})))];
  const completedCount = planRecipeIds.filter((id) => completedRecipeIds.includes(id)).length;
  const feedbackCount = planRecipeIds.filter((id) => Boolean(feedbackByRecipe[id])).length;
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const selectedDay = days[Math.min(selectedDayIndex, Math.max(0, days.length - 1))];

  useEffect(() => {
    if (selectedDayIndex >= days.length) setSelectedDayIndex(0);
  }, [days.length, selectedDayIndex]);

  return (
    <section className="screen recipe-list-screen">
      <Header
        onBack={onBack}
        subtitle="順番に関係なく、作りたい料理を選べます"
        title="献立のレシピ一覧"
      />

      <div className="screen-body screen-content">
        <div className="info-card info-card--warm recipe-list-intro">
          <span className="info-card__icon" aria-hidden="true">▤</span>
          <div>
            <strong>見たいレシピを直接押してください</strong>
            <p>日付や朝・昼・夜の順番どおりに開く必要はありません。</p>
          </div>
        </div>

        {days.length ? (
          <div className="recipe-list-progress" aria-label="調理とフィードバックの進み具合">
            <span><strong>{completedCount}</strong> / {planRecipeIds.length}<small>調理済み</small></span>
            <span><strong>{feedbackCount}</strong> / {planRecipeIds.length}<small>感想送信済み</small></span>
          </div>
        ) : null}

        {days.length ? (
          <div className="recipe-list-days">
            <section className="recipe-date-picker" aria-label="レシピを表示する日付">
              <span className="eyebrow">カレンダー</span>
              <h2>日付を押すと献立へ移動</h2>
              <div className="recipe-date-tabs" role="tablist" aria-label="献立の日付">
                {days.map((day, dayIndex) => (
                  <button
                    aria-selected={selectedDayIndex === dayIndex}
                    className={`recipe-date-tab${selectedDayIndex === dayIndex ? " is-selected" : ""}`}
                    key={day.id ?? day.date ?? dayIndex}
                    onClick={() => setSelectedDayIndex(dayIndex)}
                    role="tab"
                    type="button"
                  >
                    <small>{day.weekday ?? `DAY ${dayIndex + 1}`}</small>
                    <strong>{day.shortLabel ?? day.label ?? day.dateLabel ?? `${dayIndex + 1}日目`}</strong>
                  </button>
                ))}
              </div>
            </section>

            {selectedDay && (
              <section className="recipe-list-day" key={selectedDay.id ?? selectedDay.date ?? selectedDayIndex}>
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">DAY {selectedDayIndex + 1}</span>
                    <h2>{selectedDay.label ?? selectedDay.dateLabel ?? `${selectedDayIndex + 1}日目`}</h2>
                  </div>
                </div>

                <div className="recipe-direct-list">
                  {Object.entries(selectedDay.meals ?? {}).map(([mealType, recipeId]) => {
                    const recipe = recipeMap.get(recipeId);
                    if (!recipe) return null;
                    const isSelected = selectedRecipeId === recipe.id;
                    const isCompleted = completedRecipeIds.includes(recipe.id);
                    const hasFeedback = Boolean(feedbackByRecipe[recipe.id]);

                    return (
                      <article
                        className={`recipe-direct-card${isSelected ? " is-selected" : ""}`}
                        key={`${mealType}-${recipeId}`}
                      >
                        <button
                          className="recipe-direct-card__open"
                          onClick={() => onSelectRecipe?.(recipe, { dayIndex: selectedDayIndex, mealType })}
                          type="button"
                        >
                          <img src={recipe.image} alt="" loading="lazy" />
                          <span className="recipe-direct-card__body">
                            <small>{mealLabels[mealType] ?? mealType}</small>
                            <strong>{recipe.name}</strong>
                            <span>⏱ {formatCookingTime(recipe.cookingTime)}・約{recipe.price}円</span>
                          </span>
                          <span className="recipe-direct-card__action">
                            {isSelected ? "選択中" : "見る"} ›
                          </span>
                        </button>
                        <footer className="recipe-direct-card__footer">
                          <span className={`recipe-status${isCompleted ? " is-complete" : ""}`}>
                            {isCompleted ? "✓ 調理済み" : "未調理"}
                          </span>
                          {isCompleted || hasFeedback ? (
                            <button
                              className="recipe-feedback-button"
                              onClick={() => onFeedbackRecipe?.(recipe)}
                              type="button"
                            >
                              {hasFeedback ? "感想を編集" : "感想を書く"}
                            </button>
                          ) : (
                            <small>調理後に感想を送れます</small>
                          )}
                        </footer>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="empty-card">
            <strong>献立がまだありません</strong>
            <p>ホームから献立を作成すると、ここでレシピを選べます。</p>
          </div>
        )}
      </div>
    </section>
  );
}

