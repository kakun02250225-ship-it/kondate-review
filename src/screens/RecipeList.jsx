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
  onSelectRecipe,
  onBack,
}) {
  const recipeMap = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const days = planDays(plan);

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
          <div className="recipe-list-days">
            {days.map((day, dayIndex) => (
              <section className="recipe-list-day" key={day.id ?? day.date ?? dayIndex}>
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">DAY {dayIndex + 1}</span>
                    <h2>{day.label ?? day.dateLabel ?? `${dayIndex + 1}日目`}</h2>
                  </div>
                </div>

                <div className="recipe-direct-list">
                  {Object.entries(day.meals ?? {}).map(([mealType, recipeId]) => {
                    const recipe = recipeMap.get(recipeId);
                    if (!recipe) return null;
                    const isSelected = selectedRecipeId === recipe.id;

                    return (
                      <button
                        className={`recipe-direct-card${isSelected ? " is-selected" : ""}`}
                        key={`${mealType}-${recipeId}`}
                        onClick={() => onSelectRecipe?.(recipe, { dayIndex, mealType })}
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
                    );
                  })}
                </div>
              </section>
            ))}
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
