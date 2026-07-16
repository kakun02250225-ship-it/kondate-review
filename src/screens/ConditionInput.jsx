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
  const dayOptions = readOptions(["days", "dayCounts", "planDays"], [
    { label: "1日", value: 1 },
    { label: "3日", value: 3 },
    { label: "1週間", value: 7 },
  ]);
  const nutrientOptions = readOptions(["nutrients", "nutrition"], [
    "たんぱく質",
    "野菜",
    "低脂質",
    "炭水化物",
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
  const exerciseOptions = readOptions(["exercises", "exercise"], [
    "運動なし",
    "筋トレ",
    "有酸素運動",
    "部活動",
    "軽い運動",
  ]);

  const updateField = (field, nextValue) => {
    emitChange?.({ ...conditions, [field]: nextValue });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    createPlan?.(conditions);
  };

  return (
    <section className="screen condition-input-screen">
      <Header
        onBack={onBack}
        subtitle="今日の予定に合わせて、無理のない献立を作ります"
        title="献立の条件"
      />

      <form className="screen-body form-stack" onSubmit={handleSubmit}>
        <div className="info-card info-card--warm">
          <span className="info-card__icon" aria-hidden="true">✨</span>
          <p>入力した条件に合う固定のおすすめ献立を表示します。あとから料理だけ変更できます。</p>
        </div>

        <SelectableChoices
          legend="何日分を作りますか？"
          name="days"
          onChange={(nextValue) => updateField("days", nextValue)}
          options={dayOptions}
          value={conditions.days ?? 1}
        />

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

        <SelectableChoices
          legend="今日の運動内容"
          name="exercise"
          onChange={(nextValue) => updateField("exercise", nextValue)}
          options={exerciseOptions}
          value={conditions.exercise ?? "運動なし"}
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
