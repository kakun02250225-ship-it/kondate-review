import Header from "../components/Header";
import { ingredients, substitutions } from "../data";

function ingredientById(id) {
  return ingredients.find((ingredient) => ingredient.id === id);
}

function substitutionFor(source, originalId) {
  if (Array.isArray(source)) {
    return source.find(
      (entry) =>
        entry.originalId === originalId ||
        entry.originalIngredientId === originalId ||
        entry.ingredientId === originalId,
    );
  }

  if (!source || typeof source !== "object") return undefined;
  return (
    source[originalId] ??
    Object.values(source).find(
      (entry) =>
        entry?.originalId === originalId || entry?.originalIngredientId === originalId,
    )
  );
}

function candidateId(candidate) {
  if (typeof candidate === "string") return candidate;
  return candidate?.ingredientId ?? candidate?.id;
}

function displayDelta(value, suffix = "") {
  if (value === undefined || value === null || value === "") return "変化なし";
  if (typeof value === "number") return `${value > 0 ? "+" : ""}${value}${suffix}`;
  return value;
}

export default function SubstituteSuggestion({
  originalIngredientId,
  ingredientId,
  candidates,
  selectedSubstituteId,
  selectedId,
  onSelectSubstitute,
  onSelect,
  onConfirmSubstitute,
  onConfirm,
  onBack,
}) {
  const originalId = originalIngredientId ?? ingredientId ?? "chicken-breast";
  const entry = substitutionFor(substitutions, originalId) ?? {};
  const originalIngredient = ingredientById(originalId) ?? entry.original ?? {};
  const fallbackCandidates = (originalIngredient.alternatives ?? []).map((id, index) => ({
    ingredientId: id,
    recommended: index === 0,
    note: "食材DBに登録されている代替候補です。元の料理に近い使い方で置き換えます。",
  }));
  const candidateList =
    candidates ?? entry.candidates ?? entry.alternatives ?? entry.substitutes ?? fallbackCandidates;
  const effectiveSelectedId = selectedSubstituteId || selectedId || candidateId(candidateList[0]);
  const selectSubstitute = onSelectSubstitute ?? onSelect;
  const confirmSubstitute = onConfirmSubstitute ?? onConfirm;

  return (
    <section className="screen substitute-suggestion-screen">
      <Header
        onBack={onBack}
        subtitle="選んだ食材だけを置き換えます。他の商品はそのままです"
        title="代替食材の提案"
      />

      <div className="screen-body">
        <div className="substitution-summary">
          <span className="substitution-summary__item">
            <small>買えなかった食材</small>
            <strong>{originalIngredient.name ?? entry.originalName ?? "鶏むね肉"}</strong>
          </span>
          <span className="substitution-summary__arrow" aria-hidden="true">→</span>
          <span className="substitution-summary__item substitution-summary__item--accent">
            <small>代替候補</small>
            <strong>{candidateList.length}件</strong>
          </span>
        </div>

        <div className="assistant-message">
          <span className="assistant-message__avatar" aria-hidden="true">✨</span>
          <div>
            <strong>この画面では、買えなかった食材の代わりだけを選びます</strong>
            <p>候補を1つ選んで確定すると、買い物リストとレシピ内の該当食材だけが変更されます。選ばなかった商品や他の献立は変更されません。</p>
          </div>
        </div>

        <div className="substitute-list" role="radiogroup" aria-label="代替食材候補">
          {candidateList.map((candidate) => {
            const id = candidateId(candidate);
            const ingredient = ingredientById(id) ?? (typeof candidate === "object" ? candidate : {});
            const details = typeof candidate === "object" ? candidate : {};
            const isSelected = effectiveSelectedId === id;

            return (
              <label className={`substitute-card${isSelected ? " is-selected" : ""}`} key={id}>
                <input
                  checked={isSelected}
                  name="substitute-ingredient"
                  onChange={() => selectSubstitute?.(id, candidate)}
                  type="radio"
                  value={id}
                />
                <span className="substitute-card__radio" aria-hidden="true" />
                <span className="substitute-card__content">
                  <span className="substitute-card__heading">
                    <strong>{ingredient.name}</strong>
                    {details.recommended && <span className="badge badge--accent">おすすめ</span>}
                  </span>
                  <span className="comparison-grid">
                    <span>
                      <small>価格</small>
                      <strong>{displayDelta(details.priceDelta ?? details.priceDifference, "円")}</strong>
                    </span>
                    <span>
                      <small>カロリー</small>
                      <strong>{displayDelta(details.kcalImpact ?? details.kcalEffect ?? details.calorieEffect)}</strong>
                    </span>
                    <span>
                      <small>たんぱく質</small>
                      <strong>{displayDelta(details.proteinImpact ?? details.proteinEffect)}</strong>
                    </span>
                    <span>
                      <small>調理時間</small>
                      <strong>{displayDelta(details.cookingTimeImpact ?? details.timeDelta ?? details.cookingTimeEffect, "分")}</strong>
                    </span>
                  </span>
                  <span className="substitute-card__note">
                    {details.note ?? "元のレシピに近い手順で調理できます。"}
                  </span>
                  {details.keptConditions?.length > 0 && (
                    <span className="substitute-card__kept">
                      <small>維持しやすい条件</small>
                      <span>
                        {details.keptConditions.map((label) => (
                          <i key={label}>{label}</i>
                        ))}
                      </span>
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>

        {candidateList.length === 0 && (
          <div className="empty-state">
            <span aria-hidden="true">🛒</span>
            <h2>代替候補がありません</h2>
            <p>戻って「献立を再作成」を選んでください。</p>
          </div>
        )}

        <div className="sticky-actions">
          <button
            className="button button--primary button--large"
            disabled={!effectiveSelectedId}
            onClick={() => confirmSubstitute?.(effectiveSelectedId)}
            type="button"
          >
            選んだ食材に変更
          </button>
          <p className="action-help">変更されるのは、買えなかった食材とそれを使うレシピだけです。</p>
        </div>
      </div>
    </section>
  );
}
