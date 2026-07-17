"use client";

import { formatCookingTime } from "../data";

const formatYen = (value) => typeof value === "number" ? `${value.toLocaleString("ja-JP")}円` : value;

export function RecipeCard({
  recipe,
  onSelect,
  onAction,
  onChange,
  actionLabel,
  showReason = true,
  showNutrition = true,
  compact = false,
  selected = false,
  className = "",
  imageLoading = "lazy",
}) {
  if (!recipe) return null;

  const actionHandler = onAction ?? onChange;
  const classes = [
    "recipe-card",
    compact ? "recipe-card--compact" : "",
    selected ? "is-selected" : "",
    onSelect ? "is-interactive" : "",
    className,
  ].filter(Boolean).join(" ");

  const activate = () => onSelect?.(recipe);
  const handleKeyDown = (event) => {
    if (!onSelect || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    activate();
  };

  return (
    <article
      className={classes}
      aria-label={recipe.name}
      aria-pressed={onSelect ? selected : undefined}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={activate}
      onKeyDown={handleKeyDown}
    >
      <div className="recipe-card__media recipe-card__image-wrap recipe-image-wrap">
        <img className="recipe-card__image recipe-image" src={recipe.image} alt={recipe.imageAlt ?? recipe.name} loading={imageLoading} />
        {recipe.cookingTime != null ? (
          <span className="recipe-card__time">⏱ {formatCookingTime(recipe.cookingTime)}</span>
        ) : null}
      </div>
      <div className="recipe-card__body">
        <div className="recipe-card__heading">
          <h3>{recipe.name}</h3>
          {recipe.price != null ? <strong>{formatYen(recipe.price)}</strong> : null}
        </div>
        {showNutrition ? (
          <div className="recipe-card__nutrition recipe-meta nutrition-row" aria-label="栄養情報">
            {recipe.kcal != null ? <span>{recipe.kcal} kcal</span> : null}
            {recipe.protein != null ? <span>たんぱく質 {recipe.protein}g</span> : null}
          </div>
        ) : null}
        {recipe.tags?.length ? (
          <ul className="recipe-card__tags" aria-label="特徴">
            {recipe.tags.map((tag) => <li className="recipe-tag" key={tag}>{tag}</li>)}
          </ul>
        ) : null}
        {showReason && recipe.reason ? <p className="recipe-card__reason recipe-reason">{recipe.reason}</p> : null}
        {actionLabel && actionHandler ? (
          <button
            type="button"
            className="recipe-card__action"
            onClick={(event) => {
              event.stopPropagation();
              actionHandler(recipe);
            }}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default RecipeCard;
