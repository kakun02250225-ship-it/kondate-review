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

function SelectableChoices({ legend, name, options, value, multiple = false, onChange }) {
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
        subtitle="先に作りたい範囲を決めると、その範囲だけの買い物リストを作ります"
        title="献立の条件"
      />

      <form className="screen-body form-stack" onSubmit={handleSubmit}>
        <div className="info-card info-card--warm">
          <span className="info-card__icon" aria-hidden="true">✨</span>
          <p>買い物リストは、ここで作成して決定した献立に必要な食材だけを表示します。</p>
        </div>

        <SelectableChoices
          legend="何回分の献立を作りますか？"
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

        <label className="form-field">
          <span className="form-label">今回の食費予算</span>
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
          legend="重視したい栄養"
          multiple
          name="nutrients"
          onChange={(nextValue) => updateField("nutrients", nextValue)}
          options={nutrientOptions}
          value={conditions.nutrients ?? []}
        />

        <SelectableChoices
          legend="調理できる時間"
          name="cook-time"
          onChange={(nextValue) => updateField("cookTime", nextValue)}
          options={timeOptions}
          value={conditions.cookTime ?? 30}
        />

        <SelectableChoices
          legend="今日の調理条件"
          multiple
          name="constraints"
          onChange={(nextValue) => updateField("constraints", nextValue)}
          options={constraintOptions}
          value={conditions.constraints ?? []}
        />

        <div className="form-actions sticky-actions">
          <button className="button button--primary button--large" type="submit">
            この条件で献立を作成
          </button>
        </div>
      </form>
    </section>
  );
}
