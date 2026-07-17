import { formatCookingTime, recipes } from '../data';
import Header from '../components/Header';
import IngredientList from '../components/IngredientList';

function stepLabel(step) {
  return typeof step === 'string' ? step : step?.description ?? step?.text ?? step?.name ?? '';
}

export default function Cooking({
  recipe = recipes?.[0],
  servings = 1,
  timerLabel,
  tasteNote,
  onComplete,
  onBack,
}) {
  const steps = (recipe?.steps ?? []).map(stepLabel).filter(Boolean);

  if (!recipe) return null;

  return (
    <section className="screen cooking-screen" aria-labelledby="cooking-title">
      <Header
        title="調理中"
        subtitle={recipe.name}
        onBack={onBack}
      />

      <div className="screen-body screen-content">
        <div className="cooking-timer" aria-label="調理時間の目安">
          <span className="cooking-timer__icon" aria-hidden="true">⏱</span>
          <div>
            <p>調理時間の目安</p>
            <strong>{timerLabel ?? `約${formatCookingTime(recipe.cookingTime ?? 30)}`}</strong>
          </div>
        </div>

        {tasteNote?.trim() && (
          <div className="info-card taste-note-card">
            <p className="eyebrow">今回の味メモ</p>
            <p>{tasteNote}</p>
          </div>
        )}

        <section className="info-card cooking-ingredients" aria-labelledby="cooking-ingredients-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">最初に確認</p>
              <h2 id="cooking-ingredients-title">使う材料（{servings}人分）</h2>
            </div>
          </div>
          <IngredientList ingredients={recipe.ingredients ?? []} inlineAmounts servings={servings} />
        </section>

        <section className="cooking-all-steps" aria-labelledby="cooking-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">上から順にスクロール</p>
              <h2 id="cooking-title">調理手順</h2>
            </div>
            <span className="status-badge badge">全{steps.length}工程</span>
          </div>

          <ol className="recipe-steps cooking-step-list">
            {steps.map((step, index) => (
              <li className="cooking-step-card" key={`${step}-${index}`}>
                <span className="recipe-steps__number step-number" aria-hidden="true">{index + 1}</span>
                <div>
                  <small>手順 {index + 1}</small>
                  <p>{step}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="sticky-actions">
          <button
            className="button button--primary button--large button--full primary-button full-width"
            type="button"
            onClick={() => onComplete?.(recipe)}
          >
            調理を完了してレシピ一覧へ
          </button>
          <p className="action-help">途中の手順は上下にスクロールしていつでも見返せます。</p>
        </div>
      </div>
    </section>
  );
}
