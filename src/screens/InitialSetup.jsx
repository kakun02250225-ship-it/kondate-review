import Header from "../components/Header";
import { setupOptions } from "../data";

function optionList(keys, fallback) {
  for (const key of keys) {
    if (Array.isArray(setupOptions?.[key]) && setupOptions[key].length > 0) {
      return setupOptions[key];
    }
  }
  return fallback;
}

function optionValue(option) {
  return typeof option === "object" ? option.value ?? option.id ?? option.label : option;
}

function optionLabel(option) {
  return typeof option === "object" ? option.label ?? option.name ?? option.value : option;
}

function textValue(value) {
  return Array.isArray(value) ? value.join("、") : value ?? "";
}

function listValue(value) {
  return value
    .split(/[、,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function ChoiceGroup({ legend, name, options, value, multiple = false, onChange }) {
  const selectedValues = multiple ? (Array.isArray(value) ? value : []) : [];

  return (
    <fieldset className="form-field choice-field">
      <legend className="form-label">{legend}</legend>
      <div className="choice-grid">
        {options.map((option) => {
          const itemValue = optionValue(option);
          const checked = multiple ? selectedValues.includes(itemValue) : value === itemValue;

          return (
            <label className={`choice-chip${checked ? " is-selected" : ""}`} key={itemValue}>
              <input
                checked={checked}
                name={name}
                onChange={() => {
                  if (!multiple) {
                    onChange(itemValue);
                    return;
                  }

                  onChange(
                    checked
                      ? selectedValues.filter((selected) => selected !== itemValue)
                      : [...selectedValues, itemValue],
                  );
                }}
                type={multiple ? "checkbox" : "radio"}
                value={itemValue}
              />
              <span>{optionLabel(option)}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function InitialSetup({
  profile: profileProp,
  value,
  onProfileChange,
  onChange,
  onComplete,
  onSubmit,
  onSkip,
}) {
  const profile = value ?? profileProp ?? {};
  const emitChange = onChange ?? onProfileChange;
  const complete = onComplete ?? onSubmit;
  const genders = optionList(["genders", "gender"], ["女性", "男性", "その他", "回答しない"]);
  const goals = optionList(["goals", "mealGoals", "purposes"], [
    "健康",
    "節約",
    "筋トレ",
    "時短",
    "ダイエット",
  ]);

  const updateField = (field, nextValue) => {
    emitChange?.({ ...profile, [field]: nextValue });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    complete?.(profile);
  };

  return (
    <section className="screen initial-setup-screen">
      <Header
        subtitle="あとから設定画面でいつでも変更できます"
        title="あなたに合う献立を準備します"
      />

      <form className="screen-body form-stack" onSubmit={handleSubmit}>
        <div className="step-indicator" aria-label="初期設定 1/2">
          <span className="step-indicator__label">初期設定</span>
          <span className="step-indicator__count">1 / 2</span>
        </div>

        <p className="screen-lead">
          答えられる項目だけで大丈夫です。入力内容をもとに、無理なく続けられる献立を提案します。
        </p>

        <label className="form-field">
          <span className="form-label">名前</span>
          <input
            autoComplete="nickname"
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="user"
            type="text"
            value={profile.name ?? ""}
          />
        </label>

        <label className="form-field">
          <span className="form-label">年齢</span>
          <span className="input-with-unit">
            <input
              inputMode="numeric"
              min="0"
              onChange={(event) => updateField("age", event.target.value)}
              placeholder="例：19"
              type="number"
              value={profile.age ?? ""}
            />
            <span>歳</span>
          </span>
        </label>

        <ChoiceGroup
          legend="性別（任意）"
          name="gender"
          onChange={(nextValue) => updateField("gender", nextValue)}
          options={genders}
          value={profile.gender ?? ""}
        />

        <label className="form-field">
          <span className="form-label">アレルギー食材（任意）</span>
          <input
            onChange={(event) => updateField("allergies", listValue(event.target.value))}
            placeholder="例：卵、乳製品"
            type="text"
            value={textValue(profile.allergies)}
          />
          <span className="form-help">複数ある場合は「、」で区切ってください</span>
        </label>

        <label className="form-field">
          <span className="form-label">苦手な食材（任意）</span>
          <input
            onChange={(event) => updateField("dislikes", listValue(event.target.value))}
            placeholder="例：きのこ、辛いもの"
            type="text"
            value={textValue(profile.dislikes)}
          />
        </label>

        <ChoiceGroup
          legend="食事で大切にしたいこと"
          multiple
          name="goals"
          onChange={(nextValue) => updateField("goals", nextValue)}
          options={goals}
          value={profile.goals ?? []}
        />

        <label className="form-field">
          <span className="form-label">冷蔵庫にある食材（任意）</span>
          <textarea
            onChange={(event) => updateField("fridge", listValue(event.target.value))}
            placeholder="例：卵、豆腐、キャベツ"
            rows="2"
            value={textValue(profile.fridge)}
          />
          <span className="form-help">手持ちの食材を優先した提案に使います</span>
        </label>

        <label className="form-field">
          <span className="form-label">1か月の食費予算</span>
          <span className="input-with-unit">
            <input
              inputMode="numeric"
              min="0"
              onChange={(event) => updateField("monthlyBudget", event.target.value)}
              placeholder="例：25000"
              type="number"
              value={profile.monthlyBudget ?? ""}
            />
            <span>円</span>
          </span>
        </label>

        <div className="form-actions sticky-actions">
          <button className="button button--primary button--large" type="submit">
            初期設定を完了
          </button>
          <button
            className="button button--text"
            onClick={() => (onSkip ?? complete)?.(profile)}
            type="button"
          >
            任意項目をスキップして進む
          </button>
        </div>
      </form>
    </section>
  );
}
