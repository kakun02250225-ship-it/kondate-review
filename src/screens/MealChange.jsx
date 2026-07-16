import Header from "../components/Header";
import RecipeCard from "../components/RecipeCard";
import { recipes } from "../data";

function resolveRecipe(recipeOrId) {
  if (!recipeOrId) return undefined;
  if (typeof recipeOrId === "object") return recipeOrId;
  return recipes.find((recipe) => recipe.id === recipeOrId);
}

function supportsMealType(recipe, mealType) {
  if (!mealType || !recipe?.mealType) return true;
  const types = Array.isArray(recipe.mealType) ? recipe.mealType : [recipe.mealType];
  return types.includes(mealType);
}

function usesExcludedIngredient(recipe, excludedIngredientIds = []) {
  if (!Array.isArray(excludedIngredientIds) || excludedIngredientIds.length === 0) return false;
  return (recipe?.ingredients ?? []).some((item) => excludedIngredientIds.includes(item.ingredientId));
}

export default function MealChange({
  currentRecipe,
  currentRecipeId,
  editingSlot,
  candidates,
  candidateRecipeIds,
  excludedIngredientIds = [],
  selectedRecipeId,
  onSelectRecipe,
  onSelect,
  onBack,
}) {
  const selectedCurrentRecipe = resolveRecipe(currentRecipe ?? currentRecipeId ?? editingSlot?.recipeId);
  const suppliedCandidates =
    candidates ?? candidateRecipeIds?.map(resolveRecipe).filter(Boolean) ?? [];
  const availableCandidates = (
    suppliedCandidates.length > 0
      ? suppliedCandidates
      : recipes.filter(
          (recipe) =>
            recipe.id !== selectedCurrentRecipe?.id
            && supportsMealType(recipe, editingSlot?.mealType)
            && !usesExcludedIngredient(recipe, excludedIngredientIds),
        )
  ).filter((recipe) => !usesExcludedIngredient(recipe, excludedIngredientIds)).slice(0, 5);
  const selectRecipe = onSelectRecipe ?? onSelect;

  return (
    <section className="screen meal-change-screen">
      <Header
        onBack={onBack}
        subtitle="予算や調理時間を大きく変えない候補です"
        title="料理を変更"
      />

      <div className="screen-body">
        {selectedCurrentRecipe && (
          <section className="current-selection">
            <div className="section-heading">
              <div>
                <span className="eyebrow">現在の料理</span>
                <h2>{selectedCurrentRecipe.name}</h2>
              </div>
            </div>
            <RecipeCard compact recipe={selectedCurrentRecipe} />
          </section>
        )}

        <section className="candidate-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">代わりの候補</span>
              <h2>気分に合う料理を選んでください</h2>
            </div>
          </div>

          <div className="recipe-choice-list">
            {availableCandidates.map((candidate) => {
              const isSelected = selectedRecipeId === candidate.id;

              return (
                <article
                  className={`recipe-choice${isSelected ? " is-selected" : ""}`}
                  key={candidate.id}
                >
                  <RecipeCard compact recipe={candidate} selected={isSelected} />
                  <div className="tag-list" aria-label="料理の特徴">
                    {(candidate.tags ?? []).slice(0, 4).map((tag) => (
                      <span className="tag" key={tag}>{tag}</span>
                    ))}
                  </div>
                  <p className="recipe-choice__reason">{candidate.reason}</p>
                  <button
                    className="button button--secondary button--full"
                    onClick={() => selectRecipe?.(candidate.id, candidate)}
                    type="button"
                  >
                    この料理に変更
                  </button>
                </article>
              );
            })}
          </div>

          {availableCandidates.length === 0 && (
            <div className="empty-state">
              <span aria-hidden="true">🍳</span>
              <h2>候補がありません</h2>
              <p>ひとつ前の画面に戻って、別の料理を選んでください。</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
