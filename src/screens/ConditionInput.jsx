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

function parseDateInput(value) {
  const match = String(value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(value, days) {
  const date = parseDateInput(value);
  if (!date) return "";
  date.setDate(date.getDate() + days);
  return dateInputValue(date);
}

function daysBetween(startValue, endValue) {
  const start = parseDateInput(startValue);
  const end = parseDateInput(endValue);
  if (!start || !end) return 0;
  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
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
  const selectedMealSlots = conditions.mealSlots ?? ["breakfast", "lunch", "dinner"];
  const selectedDayCount = daysBetween(conditions.startDate, conditions.endDate);
  const maxEndDate = conditions.startDate ? addDays(conditions.startDate, 6) : "";
  const hasValidRange = selectedDayCount >= 1 && selectedDayCount <= 7;
  const canCreate = hasValidRange && selectedMealSlots.length > 0;
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
    { label: "1時間以内", value: 60 },
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
    conditions.cookTime && (Number(conditions.cookTime) === 60 ? "1時間以内" : `${conditions.cookTime}分以内`),
    conditions.budget && `予算${Number(conditions.budget).toLocaleString()}円以内`,
    ...(conditions.constraints ?? []),
    ...(conditions.moods ?? []),
    ...(conditions.nutrients ?? []).map((value) => `${value}を重視`),
    ...(conditions.cuisines ?? []).map((value) => `${value}の気分`),
  ].filter(Boolean);

  const updateField = (field, nextValue) => {
    const next = { ...conditions, [field]: nextValue };
    if (field === "startDate") {
      const nextMaxEnd = nextValue ? addDays(nextValue, 6) : "";
      if (!nextValue || (next.endDate && (next.endDate < nextValue || next.endDate > nextMaxEnd))) {
        next.endDate = "";
      }
    }
    if (field === "startDate" || field === "endDate") {
      next.days = daysBetween(next.startDate, next.endDate);
      next.duration = "custom";
    }
    emitChange?.(next);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canCreate) return;
    createPlan?.(conditions);
  };

  return (
    <section className="screen condition-input-screen">
      <Header
        onBack={onBack}
        subtitle="先に日付を決めて、その期間に作る食事を選びます"
        title="いつ・どの食事を作る？"
      />

      <form className="screen-body form-stack" onSubmit={handleSubmit}>
        <fieldset className="form-field date-range-field">
          <legend className="form-label">献立を作る日付（1〜7日）</legend>
          <div className="date-range-inputs">
            <label>
              <span>開始日</span>
              <input
                aria-label="献立の開始日"
                onChange={(event) => updateField("startDate", event.target.value)}
                required
                type="date"
                value={conditions.startDate ?? ""}
              />
            </label>
            <span className="date-range-separator" aria-hidden="true">〜</span>
            <label>
              <span>終了日</span>
              <input
                aria-label="献立の終了日"
                disabled={!conditions.startDate}
                max={maxEndDate}
                min={conditions.startDate ?? ""}
                onChange={(event) => updateField("endDate", event.target.value)}
                required
                type="date"
                value={conditions.endDate ?? ""}
              />
            </label>
          </div>
          <p className={`date-range-help${hasValidRange ? " is-valid" : ""}`}>
            {hasValidRange
              ? `${selectedDayCount}日分の献立を作ります`
              : conditions.startDate
                ? "終了日を選んでください（開始日を含めて7日まで）"
                : "まず開始日を選んでください"}
          </p>
        </fieldset>

        <SelectableChoices
          legend="1日に作る食事（1〜3食）"
          multiple
          name="meal-slots"
          onChange={(nextValue) => updateField("mealSlots", nextValue)}
          options={[
            { label: "朝ごはん", value: "breakfast" },
            { label: "昼ごはん", value: "lunch" },
            { label: "夜ごはん", value: "dinner" },
          ]}
          value={selectedMealSlots}
        />
        <p className={`meal-count-preview${selectedMealSlots.length ? " is-valid" : " is-error"}`}>
          {selectedMealSlots.length
            ? `1日${selectedMealSlots.length}食 × ${selectedDayCount || "−"}日（合計${selectedDayCount ? selectedMealSlots.length * selectedDayCount : "−"}食）`
            : "朝・昼・夜のうち、少なくとも1食を選んでください"}
        </p>

        <div className="info-card info-card--warm condition-intro-card">
          <span className="info-card__icon" aria-hidden="true">✨</span>
          <div>
            <strong>ここから下は、入力しなくても作成できます</strong>
            <p>希望がある場合だけ選んでください。安全→時間→予算→負担・体調→栄養→味の順に優先して候補を並べます。</p>
          </div>
        </div>

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
          <button className="button button--primary button--large" disabled={!canCreate} type="submit">
            献立を作ってカレンダーを見る
          </button>
        </div>
      </form>
    </section>
  );
}

