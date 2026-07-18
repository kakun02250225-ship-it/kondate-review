import { useState } from 'react';
import { feedbackOptions } from '../data';
import Header from '../components/Header';

function normaliseOption(option, index) {
  if (typeof option === 'string') return { id: option, label: option };
  return {
    id: option?.id ?? option?.value ?? `feedback-${index}`,
    label: option?.label ?? option?.text ?? option?.name ?? '',
  };
}

export default function Feedback({
  recipe,
  options = feedbackOptions,
  selectedFeedback,
  freeText,
  isSubmitted,
  onToggle,
  onFreeTextChange,
  onSubmit,
  onBack,
}) {
  const [localSelected, setLocalSelected] = useState([]);
  const [localFreeText, setLocalFreeText] = useState('');
  const [localSubmitted, setLocalSubmitted] = useState(false);
  const selected = selectedFeedback ?? localSelected;
  const note = freeText ?? localFreeText;
  const submitted = isSubmitted ?? localSubmitted;
  const normalisedOptions = options.map(normaliseOption).filter((option) => option.label);

  const toggleOption = (option) => {
    const nextSelected = selected.includes(option.id)
      ? selected.filter((id) => id !== option.id)
      : [...selected, option.id];

    if (selectedFeedback === undefined) setLocalSelected(nextSelected);
    if (isSubmitted === undefined) setLocalSubmitted(false);
    onToggle?.(option.id, nextSelected, option);
  };

  const changeFreeText = (event) => {
    const next = event.target.value;
    if (freeText === undefined) setLocalFreeText(next);
    if (isSubmitted === undefined) setLocalSubmitted(false);
    onFreeTextChange?.(next);
  };

  const submitFeedback = (event) => {
    event.preventDefault();
    if (isSubmitted === undefined) setLocalSubmitted(true);
    onSubmit?.({ selectedFeedback: selected, freeText: note });
  };

  return (
    <section className="screen feedback-screen" aria-labelledby="feedback-title">
      <Header
        title="料理ごとのフィードバック"
        subtitle="この料理だけについて答えます"
        onBack={onBack}
      />

      <form className="screen-body screen-content" onSubmit={submitFeedback}>
        <div className="feedback-intro">
          {recipe?.image ? (
            <img className="feedback-intro__image" src={recipe.image} alt="" />
          ) : (
            <span className="feedback-intro__icon" aria-hidden="true">🍽️</span>
          )}
          <div>
            <p className="eyebrow">回答する料理</p>
            <h1 id="feedback-title">{recipe?.name ?? "今日の料理"}はいかがでしたか？</h1>
            <p>当てはまるものをすべて選べます。</p>
          </div>
        </div>

        <fieldset className="feedback-options feedback-list">
          <legend className="sr-only">料理の感想</legend>
          {normalisedOptions.map((option) => {
            const checked = selected.includes(option.id);
            return (
              <label
                className={`feedback-option${checked ? ' feedback-option--selected selected' : ''}`}
                key={option.id}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleOption(option)}
                />
                <span className="feedback-option__check" aria-hidden="true">
                  {checked ? '✓' : ''}
                </span>
                <span>{option.label}</span>
              </label>
            );
          })}
        </fieldset>

        <div className="info-card">
          <label className="field-label" htmlFor="feedback-note">
            ほかに気づいたこと（任意）
          </label>
          <textarea
            id="feedback-note"
            className="text-area"
            rows="4"
            value={note}
            onChange={changeFreeText}
            placeholder="例：味は好みだったけれど、もう少し短時間で作りたい"
          />
        </div>

        {submitted && (
          <div className="info-card notice-card notice-card--success" role="status">
            <span className="notice-card__icon" aria-hidden="true">✓</span>
            <div>
              <p className="notice-card__title">次回以降の提案に反映しました</p>
              <p className="notice-card__text">ご協力ありがとうございました。</p>
            </div>
          </div>
        )}

        <div className="sticky-actions">
          <button className="button button--primary button--large button--full primary-button full-width" type="submit">
            この料理の感想を送る
          </button>
          <p className="action-help">送信後はレシピ一覧へ戻ります。ほかの料理は別々に回答できます。</p>
        </div>
      </form>
    </section>
  );
}
