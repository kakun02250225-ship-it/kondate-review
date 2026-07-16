import { useState } from 'react';
import { recipes } from '../data';
import Header from '../components/Header';
import IngredientList from '../components/IngredientList';

function stepLabel(step) {
  return typeof step === 'string' ? step : step?.description ?? step?.text ?? step?.name ?? '';
}

export default function Cooking({
  recipe = recipes?.[0],
  currentStep,
  timerLabel,
  onNext,
  onComplete,
  onBack,
}) {
  const [localStep, setLocalStep] = useState(0);
  const steps = (recipe?.steps ?? []).map(stepLabel).filter(Boolean);
  const activeStep = Math.min(Math.max(currentStep ?? localStep, 0), Math.max(steps.length - 1, 0));
  const hasNext = activeStep < steps.length - 1;
  const progress = steps.length > 0 ? ((activeStep + 1) / steps.length) * 100 : 0;

  const handleNext = () => {
    if (!hasNext) {
      onComplete?.(recipe);
      return;
    }

    const next = activeStep + 1;
    if (currentStep === undefined) setLocalStep(next);
    onNext?.(next, recipe);
  };

  if (!recipe) return null;

  return (
    <section className="screen cooking-screen" aria-labelledby="cooking-title">
      <Header
        title="調理中"
        subtitle={recipe.name}
        onBack={onBack}
      />

      <div className="screen-body screen-content">
        <div className="cooking-progress-copy">
          <div className="cooking-progress__labels">
            <span>手順 {activeStep + 1} / {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="cooking-progress" aria-label={`全${steps.length}工程中${activeStep + 1}工程目`}>
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="cooking-timer" aria-label="調理時間の目安">
          <span className="cooking-timer__icon" aria-hidden="true">⏱</span>
          <div>
            <p>調理時間の目安</p>
            <strong>{timerLabel ?? `約${recipe.cookingTime ?? 30}分`}</strong>
          </div>
        </div>

        <article className="current-step-card">
          <p className="eyebrow">いまの手順</p>
          <div className="current-step-card__number step-number" aria-hidden="true">{activeStep + 1}</div>
          <h2 id="cooking-title">{steps[activeStep] || '材料を準備しましょう'}</h2>
          {hasNext && (
            <div className="next-step-preview">
              <span>次の手順</span>
              <p>{steps[activeStep + 1]}</p>
            </div>
          )}
        </article>

        <details className="info-card ingredient-drawer">
          <summary>
            <span>
              <span className="eyebrow">確認用</span>
              <strong>材料一覧を見る</strong>
            </span>
            <span aria-hidden="true">⌄</span>
          </summary>
          <IngredientList ingredients={recipe.ingredients ?? []} />
        </details>

        <div className="sticky-actions">
          <button className="button button--primary button--large button--full primary-button full-width" type="button" onClick={handleNext}>
            {hasNext ? '次の手順へ' : '調理を完了'}
          </button>
          {hasNext && (
            <button
              className="button button--text text-button"
              type="button"
              onClick={() => onComplete?.(recipe)}
            >
              すべて完了にする
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
