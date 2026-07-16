import { useState } from 'react';
import { recipes } from '../data';
import Header from '../components/Header';
import IngredientList from '../components/IngredientList';

function stepLabel(step) {
  return typeof step === 'string' ? step : step?.description ?? step?.text ?? step?.name ?? '';
}

function isImageSource(value) {
  return typeof value === 'string' && /^(https?:|data:|\/)/.test(value);
}

export default function RecipeConfirm({
  recipe = recipes?.[0],
  dateLabel = '7月17日（木）',
  mealType = '夕食',
  servings,
  tasteNote,
  onServingsChange,
  onTasteNoteChange,
  onStart,
  onBack,
}) {
  const [localServings, setLocalServings] = useState(2);
  const [localTasteNote, setLocalTasteNote] = useState('');
  const displayedServings = servings ?? localServings;
  const displayedTasteNote = tasteNote ?? localTasteNote;
  const steps = (recipe?.steps ?? []).map(stepLabel).filter(Boolean);

  const changeServings = (nextValue) => {
    const next = Math.min(6, Math.max(1, nextValue));
    if (servings === undefined) setLocalServings(next);
    onServingsChange?.(next);
  };

  const changeTasteNote = (event) => {
    const next = event.target.value;
    if (tasteNote === undefined) setLocalTasteNote(next);
    onTasteNoteChange?.(next);
  };

  if (!recipe) return null;

  return (
    <section className="screen recipe-confirm-screen" aria-labelledby="recipe-confirm-title">
      <Header
        title="レシピを確認"
        subtitle="材料と手順を確認してから調理を始めましょう"
        onBack={onBack}
      />

      <div className="screen-body screen-content">
        <div className="date-meal-label">
          <span>{dateLabel}</span>
          <span>{mealType}</span>
        </div>

        <article className="recipe-hero">
          {isImageSource(recipe.image) ? (
            <img className="recipe-hero__image" src={recipe.image} alt="" />
          ) : (
            <div className="recipe-hero__placeholder" aria-hidden="true">
              {recipe.image || '🍳'}
            </div>
          )}
          <div className="recipe-hero__body">
            <p className="eyebrow">今日のおすすめ</p>
            <h1 id="recipe-confirm-title">{recipe.name}</h1>
            <div className="recipe-meta" aria-label="レシピ情報">
              <span>⏱ {recipe.cookingTime ?? 30}分</span>
              <span>¥{Number(recipe.price ?? 0).toLocaleString('ja-JP')}</span>
              <span>{recipe.kcal ?? '—'} kcal</span>
            </div>
            {recipe.reason && <p className="recipe-reason">{recipe.reason}</p>}
          </div>
        </article>

        <section className="info-card" aria-labelledby="servings-title">
          <div className="section-heading section-heading--inline">
            <div>
              <p className="eyebrow">作る量</p>
              <h2 id="servings-title">何人分作りますか？</h2>
            </div>
            <div className="stepper" aria-label="作る人数">
              <button
                type="button"
                aria-label="1人分減らす"
                onClick={() => changeServings(displayedServings - 1)}
                disabled={displayedServings <= 1}
              >
                −
              </button>
              <strong>{displayedServings}人分</strong>
              <button
                type="button"
                aria-label="1人分増やす"
                onClick={() => changeServings(displayedServings + 1)}
                disabled={displayedServings >= 6}
              >
                ＋
              </button>
            </div>
          </div>
          <p className="helper-text">多めに作れば、明日の朝食やお弁当にも使えます。</p>
        </section>

        <section className="info-card" aria-labelledby="ingredients-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">材料</p>
              <h2 id="ingredients-title">{displayedServings}人分の材料</h2>
            </div>
          </div>
          <IngredientList ingredients={recipe.ingredients ?? []} servings={displayedServings} />
        </section>

        <section className="info-card" aria-labelledby="steps-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">手順</p>
              <h2 id="steps-title">調理の流れ</h2>
            </div>
            <span className="status-badge badge">全{steps.length}工程</span>
          </div>
          <ol className="recipe-steps step-list">
            {steps.map((step, index) => (
              <li className="recipe-step" key={`${step}-${index}`}>
                <span className="recipe-steps__number step-number">{index + 1}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="info-card" aria-labelledby="taste-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">お好み</p>
              <h2 id="taste-title">味の希望はありますか？</h2>
            </div>
          </div>
          <label className="field-label" htmlFor="taste-note">
            希望があれば入力してください（任意）
          </label>
          <textarea
            id="taste-note"
            className="text-area"
            rows="3"
            value={displayedTasteNote}
            onChange={changeTasteNote}
            placeholder="例：少し薄味にしたい、辛さを控えめにしたい"
          />
        </section>

        <div className="sticky-actions">
          <button
            className="button button--primary button--large button--full primary-button full-width"
            type="button"
            onClick={() => onStart?.({ recipe, servings: displayedServings, tasteNote: displayedTasteNote })}
          >
            調理を開始
          </button>
          <p className="action-help">調理中は1工程ずつ大きく表示します</p>
        </div>
      </div>
    </section>
  );
}
