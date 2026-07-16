import { mealPlans, recipes } from '../data';
import Header from '../components/Header';
import RecipeCard from '../components/RecipeCard';

const mealTypeLabels = {
  breakfast: '朝食',
  lunch: '昼食',
  dinner: '夕食',
  朝食: '朝食',
  昼食: '昼食',
  夕食: '夕食',
};

function resolveRecipe(value, recipesData) {
  const candidate = value?.recipe ?? value;

  if (candidate && typeof candidate === 'object' && candidate.name) {
    return candidate;
  }

  const recipeId = candidate?.recipeId ?? candidate?.id ?? candidate;
  return recipesData.find((recipe) => recipe.id === recipeId);
}

function normaliseMeals(source, recipesData) {
  if (!source) return [];

  const meals = Array.isArray(source)
    ? source
    : Object.entries(source).map(([mealType, recipe]) => ({ mealType, recipe }));

  return meals
    .map((meal, index) => {
      const recipe = resolveRecipe(meal, recipesData);
      if (!recipe) return null;

      const rawMealType = meal?.mealType ?? meal?.type ?? recipe.mealType;
      return {
        id: `${rawMealType ?? 'meal'}-${recipe.id ?? index}`,
        mealType: mealTypeLabels[rawMealType] ?? rawMealType ?? ['朝食', '昼食', '夕食'][index],
        recipe,
      };
    })
    .filter(Boolean);
}

function mealsFromPlan(plan, recipesData) {
  const selectedPlan = Array.isArray(plan) ? plan[0] : plan;
  const selectedDay = selectedPlan?.days?.[0] ?? selectedPlan?.schedule?.[0] ?? selectedPlan;
  const source = selectedDay?.meals ?? selectedDay?.mealPlan ?? selectedDay;
  const resolved = normaliseMeals(source, recipesData);

  if (resolved.length > 0) return resolved.slice(0, 3);

  return [recipesData[4], recipesData[5], recipesData[3]]
    .filter(Boolean)
    .map((recipe, index) => ({
      id: `fallback-${recipe.id ?? index}`,
      mealType: ['朝食', '昼食', '夕食'][index],
      recipe,
    }));
}

export default function ReMealSuggestion({
  mealPlan = mealPlans?.reSuggested ?? mealPlans?.oneDay,
  suggestedMeals,
  recipesData = recipes,
  removedIngredient = '鶏むね肉',
  priorities,
  maxCookTime,
  onConfirm,
  onBack,
}) {
  const meals = normaliseMeals(suggestedMeals, recipesData);
  const displayedMeals = meals.length > 0 ? meals : mealsFromPlan(mealPlan, recipesData);
  const totalPrice = displayedMeals.reduce(
    (sum, item) => sum + (Number(item.recipe.price) || 0),
    0,
  );
  const maintainedPriorities = (priorities ?? mealPlan?.appliedPriorities ?? [])
    .filter((priority) => !maxCookTime || priority !== `${maxCookTime}分以内`);

  return (
    <section className="screen remeal-suggestion-screen">
      <Header
        title="献立を作り直しました"
        subtitle="買えなかった食材を使わない献立です"
        onBack={onBack}
      />

      <div className="screen-body screen-content">
        <div className="info-card success-banner notice-card notice-card--success" role="status">
          <span className="notice-card__icon" aria-hidden="true">✓</span>
          <div>
            <p className="notice-card__title">{removedIngredient}を献立から外しました</p>
            <p className="notice-card__text">予算・栄養バランス・調理時間はなるべく維持しています。</p>
          </div>
        </div>

        <div className="summary-chips" aria-label="新しい献立の条件">
          <span className="choice-chip">予算目安 ¥{totalPrice.toLocaleString('ja-JP')}</span>
          {maxCookTime ? <span className="choice-chip">{maxCookTime}分以内を維持</span> : null}
          {maintainedPriorities.slice(0, 4).map((priority) => (
            <span className="choice-chip" key={priority}>{priority}</span>
          ))}
        </div>

        <div className="meal-list meal-plan" aria-label="作り直した献立">
          {displayedMeals.map(({ id, mealType, recipe }) => (
            <article className="meal-list__item" key={id}>
              <div className="meal-list__heading">
                <span className="meal-type-label">{mealType}</span>
                <span className="meal-change-label">新しい提案</span>
              </div>
              <RecipeCard recipe={recipe} compact />
            </article>
          ))}
        </div>

        <div className="sticky-actions">
          <button
            className="button button--primary button--large button--full primary-button full-width"
            type="button"
            onClick={() => onConfirm?.(displayedMeals)}
          >
            この献立に変更
          </button>
          <p className="action-help">確定すると買い物リストも自動で更新されます</p>
        </div>
      </div>
    </section>
  );
}
