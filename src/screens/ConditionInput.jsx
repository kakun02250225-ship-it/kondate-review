import Header from "../components/Header";
import { conditionOptions } from "../data";

function readOptions(keys, fallback) {
  for (const key of keys) {
    if (Array.isArray(conditionOptions?.[key]) && conditionOptions[key].length > 0) {
      return conditionOptions[key];
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

function SelectableChoices({ legend, name, options, value, multiple = false, allowClear = false, onChange }) {
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
      {!multiple && allowClear && value !== "" && value !== undefined && (
        <button className="choice-clear" onClick={() => onChange("")} type="button">
          指定を外す
        </button>
      )}
    </fieldset>
  );
}

export default function ConditionInput({
  conditions: conditionsProp,
  value,
  onConditionsChange,
  onChange,
  onCreatePlan,
  onSubmit,
  onBack,
}) {
  const conditions = value ?? conditionsProp ?? {};
  const emitChange = onChange ?? onConditionsChange;
  const createPlan = onCreatePlan ?? onSubmit;
  const duration = conditions.duration ?? "3days";
  const nutrientOptions = readOptions(["nutrients", "nutrition"], [
    "たんぱく質",
    "野菜",
    "低脂質",
    "バランス",
  ]);
  const timeOptions = readOptions(["cookingTimes", "cookTimes", "times"], [
    { label: "15分以内", value: 15 },
    { label: "30分以内", value: 30 },
    { label: "45分以内", value: 45 },
  ]);
  const constraintOptions = readOptions(["constraints", "todayConditions"], [
    "時間を短くしたい",
    "洗い物を減らしたい",
    "簡単な料理にしたい",
    "冷蔵庫の食材を使いたい",
  ]);
  const moodOptions = readOptions(["moods", "conditions"], [
    "疲れている",
    "食欲がない",
    "しっかり食べたい",
    "さっぱり食べたい",
  ]);
  const cuisineOptions = readOptions(["cuisines", "flavours"], [
    "和風",
    "中華風",
    "韓国風",
    "アジア風",
    "インド風",
    "洋風",
  ]);
  const selectedPriorityLabels = [
    conditions.cookTime && `${conditions.cookTime}分以内`,
    conditions.budget && `予算${Number(conditions.budget).toLocaleString()}円以内`,
    ...(conditions.constraints ?? []),
    ...(conditions.moods ?? []),
    ...(conditions.nutrients ?? []).map((value) => `${value}を重視`),
    ...(conditions.cuisines ?? []).map((value) => `${value}の気分`),
  ].filter(Boolean);

  const updateField = (field, nextValue) => {
    const next = { ...conditions, [field]: nextValue };
    if (field === "duration") {
      next.days = nextValue === "1day" ? 1 : nextValue === "7days" ? 7 : 3;
      if (nextValue === "meal") next.mealType ??= "dinner";
    }
    emitChange?.(next);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    createPlan?.(conditions);
  };

  return (
    <section className="screen condition-input-screen">
      <Header
        onBack={onBack}
        subtitle="作る範囲だけ選べば進めます。こだわり条件はすべて任意です"
        title="どのくらい献立を作る？"
      />

      <form className="screen-body form-stack" onSubmit={handleSubmit}>
        <div className="info-card info-card--warm condition-intro-card">
          <span className="info-card__icon" aria-hidden="true">✨</span>
          <div>
            <strong>空欄のままでも作成できます</strong>
            <p>入力がある場合は、安全→時間→予算→負担・体調→栄養→味の順に優先して候補を並べます。</p>
          </div>
        </div>

        <SelectableChoices
          legend="作る範囲（ここだけ必須）"
          name="duration"
          onChange={(nextValue) => updateField("duration", nextValue)}
          options={[
            { label: "1食", value: "meal" },
            { label: "1日", value: "1day" },
            { label: "3日", value: "3days" },
            { label: "1週間", value: "7days" },
          ]}
          value={duration}
        />

        {duration === "meal" && (
          <SelectableChoices
            legend="どの食事を作りますか？"
            name="meal-type"
            onChange={(nextValue) => updateField("mealType", nextValue)}
            options={[
              { label: "朝ごはん", value: "breakfast" },
              { label: "昼ごはん", value: "lunch" },
              { label: "夜ごはん", value: "dinner" },
            ]}
            value={conditions.mealType ?? "dinner"}
          />
        )}

        <div className="form-section-heading">
          <span className="eyebrow">ここからは任意</span>
          <h2>今日の希望があれば追加</h2>
          <p>触らなかった項目は、献立を限定しません。</p>
        </div>

        <SelectableChoices
          allowClear
          legend="調理できる時間（任意）"
          name="cook-time"
          onChange={(nextValue) => updateField("cookTime", nextValue)}
          options={timeOptions}
          value={conditions.cookTime ?? ""}
        />

        <label className="form-field">
          <span className="form-label">今回の食費予算（任意）</span>
          <span className="input-with-unit">
            <input
              inputMode="numeric"
              min="0"
              onChange={(event) => updateField("budget", event.target.value)}
              placeholder="例：3000"
              type="number"
              value={conditions.budget ?? ""}
            />
            <span>円</span>
          </span>
        </label>

        <SelectableChoices
          legend="負担を減らしたいこと（任意）"
          multiple
          name="constraints"
          onChange={(nextValue) => updateField("constraints", nextValue)}
          options={constraintOptions}
          value={conditions.constraints ?? []}
        />

        <SelectableChoices
          legend="今日の体調・気分（任意）"
          multiple
          name="moods"
          onChange={(nextValue) => updateField("moods", nextValue)}
          options={moodOptions}
          value={conditions.moods ?? []}
        />

        <SelectableChoices
          legend="重視したい栄養（任意）"
          multiple
          name="nutrients"
          onChange={(nextValue) => updateField("nutrients", nextValue)}
          options={nutrientOptions}
          value={conditions.nutrients ?? []}
        />

        <SelectableChoices
          legend="味の系統（任意）"
          multiple
          name="cuisines"
          onChange={(nextValue) => updateField("cuisines", nextValue)}
          options={cuisineOptions}
          value={conditions.cuisines ?? []}
        />

        {selectedPriorityLabels.length > 0 && (
          <section className="priority-preview" aria-label="提案に反映する優先順">
            <div>
              <span className="eyebrow">提案に反映する順</span>
              <h2>選んだ条件の優先度</h2>
            </div>
            <ol>
              {selectedPriorityLabels.map((label, index) => (
                <li key={`${label}-${index}`}>
                  <span>{index + 1}</span>
                  <strong>{label}</strong>
                </li>
              ))}
            </ol>
          </section>
        )}

        <div className="form-actions sticky-actions">
          <button className="button button--primary button--large" type="submit">
            献立を作ってカレンダーを見る
          </button>
        </div>
      </form>
    </section>
  );
}
