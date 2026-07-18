"use client";

import { formatCookingTime } from "../data";

export function MealCard({
  mealLabel,
  label,
  recipe: recipeProp,
  meal,
  onChange,
  onSelect,
  changeLabel = "変更",
  showNutrition = true,
  className = "",
  selected = false,
  timeMatchLabel = "",
}) {
  const recipe = recipeProp ?? meal;
  if (!recipe) return null;

  const classes = ["meal-card", selected ? "is-selected" : "", className]
    .filter(Boolean)
    .join(" ");

  const activate = () => onSelect?.(recipe);

  return (
    <article
      className={classes}
      aria-label={`${mealLabel ?? label ?? "食事"}：${recipe.name}`}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={activate}
      onKeyDown={(event) => {
        if (!onSelect || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        activate();
      }}
    >
      <div className="meal-card__image meal-thumb">
        <img src={recipe.image} alt="" loading="lazy" />
      </div>
      <div className="meal-card__content meal-info">
        <div className="meal-card__label-row">
          <span className="meal-card__label meal-label">{mealLabel ?? label}</span>
          {timeMatchLabel ? <span className="meal-card__time-match">{timeMatchLabel}</span> : null}
        </div>
        <h3 className="meal-card__name meal-name">{recipe.name}</h3>
        <span className="meal-card__meta meta-row">
          <span>⏱ {formatCookingTime(recipe.cookingTime)}</span>
          <span>約{recipe.price}円</span>
        </span>
        {showNutrition ? (
          <span className="meal-card__nutrition item-meta">{recipe.kcal} kcal・P {recipe.protein}g</span>
        ) : null}
        {onSelect ? <span className="meal-card__view">レシピを見る ›</span> : null}
      </div>
      {onChange ? (
        <button type="button" className="meal-card__change change-button" onClick={(event) => { event.stopPropagation(); onChange(recipe); }}>
          {changeLabel}
        </button>
      ) : null}
    </article>
  );
}

export default MealCard;
