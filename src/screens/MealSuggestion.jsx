import Header from "../components/Header";
import MealCard from "../components/MealCard";
import { formatCookingTime, recipes } from "../data";

const MEAL_SLOTS = [
  { key: "breakfast", label: "朝ごはん", icon: "☀️", aliases: ["morning", "朝食", "朝"] },
  { key: "lunch", label: "昼ごはん", icon: "🍙", aliases: ["昼食", "昼"] },
  { key: "dinner", label: "夜ごはん", icon: "🌙", aliases: ["supper", "夕食", "夜"] },
];

function planSchedule(plan) {
  if (Array.isArray(plan?.schedule)) return plan.schedule;
  if (Array.isArray(plan?.daily)) return plan.daily;
  if (Array.isArray(plan?.days)) return plan.days;
  return [];
}

function mealIdFor(day, slot) {
  const meals = day?.meals ?? day?.mealIds ?? day ?? {};
  const keys = [slot.key, ...slot.aliases];

  for (const key of keys) {
    const meal = meals[key];
    if (typeof meal === "string") return meal;
    if (meal && typeof meal === "object") return meal.recipeId ?? meal.id;
  }

  return undefined;
}

function formatSummary(plan, schedule, recipeMap, slots) {
  const selectedRecipes = schedule.flatMap((day) =>
    slots.map((slot) => recipeMap.get(mealIdFor(day, slot))).filter(Boolean),
  );
  const totalPrice = selectedRecipes.reduce((sum, recipe) => sum + Number(recipe.price ?? 0), 0);
  const totalProtein = selectedRecipes.reduce((sum, recipe) => sum + Number(recipe.protein ?? 0), 0);

  return {
    price: plan?.summary?.price ?? plan?.totalPrice ?? totalPrice,
    protein: selectedRecipes.length
      ? `${Math.round(totalProtein / Math.max(schedule.length, 1))}g/日`
      : "-",
  };
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function calendarDaysFor(schedule, count = 7) {
  const today = new Date();
  const length = schedule.length || count;
  return Array.from({ length }, (_, index) => {
    const sourceDate = schedule[index]?.date;
    const match = String(sourceDate ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const date = match
      ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
      : new Date(today);
    if (!match) date.setDate(today.getDate() + index);
    return {
      index,
      month: date.getMonth() + 1,
      date: date.getDate(),
      weekday: WEEKDAYS[date.getDay()],
      isToday: date.toDateString() === today.toDateString(),
      hasPlan: Boolean(schedule[index]),
    };
  });
}

export default function MealSuggestion({
  plan,
  activePlan,
  planConfirmed = false,
  cookingCompleted = false,
  onChangeMeal,
  onConfirmPlan,
  onConfirm,
  onCreatePlan,
  onEditConditions,
  onViewRecipes,
  onSelectRecipe,
  onFeedback,
  onBack,
}) {
  const selectedPlan = plan ?? activePlan;
  const schedule = planSchedule(selectedPlan);
  const recipeMap = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const visibleSlots = MEAL_SLOTS.filter((slot) => !selectedPlan?.mealSlots || selectedPlan.mealSlots.includes(slot.key));
  const summary = formatSummary(selectedPlan, schedule, recipeMap, visibleSlots);
  const confirmPlan = onConfirmPlan ?? onConfirm;
  const calendarDays = calendarDaysFor(schedule);
  const requestedCookTime = Number(selectedPlan?.requestedCookTime ?? 0);
  const exactTimeRecipes = requestedCookTime >= 45
    ? [...new Map(
      schedule
        .flatMap((day) => visibleSlots.map((slot) => recipeMap.get(mealIdFor(day, slot))))
        .filter((recipe) => Number(recipe?.cookingTime ?? 0) === requestedCookTime)
        .map((recipe) => [recipe.id, recipe]),
    ).values()]
    : [];

  return (
    <section className="screen meal-suggestion-screen">
      <Header
        onBack={onBack}
        subtitle={selectedPlan
          ? "日付から献立を確認し、そのまま買い物リストへ進めます"
          : "献立・買い物・欠品対応をひとつの流れで管理します"}
        title={selectedPlan ? "献立カレンダー" : "ホーム"}
      />

      <div className="screen-body">
        {!selectedPlan || schedule.length === 0 ? (
          <div className="home-empty-state">
            <section className="home-welcome-card">
              <span className="eyebrow">今日から無理なく自炊</span>
              <h2>作る日を決めると、買い物まで迷わず進めます</h2>
              <p>細かい条件は入力しなくても大丈夫です。献立を決めたあと、必要な食材と使う料理を自動でまとめます。</p>
              <button className="button button--primary button--large" onClick={onCreatePlan} type="button">
                献立を作ってカレンダーに入れる
              </button>
            </section>

            <section className="calendar-overview calendar-overview--empty" aria-label="今週のカレンダー">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">今週</span>
                  <h2>献立カレンダー</h2>
                </div>
              </div>
              <div className="calendar-strip">
                {calendarDays.map((day) => (
                  <span className={`calendar-day${day.isToday ? " is-today" : ""}`} key={`${day.weekday}-${day.index}`}>
                    <small>{day.weekday}</small>
                    <strong>{day.date}</strong>
                    <i aria-hidden="true" />
                  </span>
                ))}
              </div>
              <p className="calendar-empty-copy">献立を作ると、日付ごとの朝・昼・夜がここに表示されます。</p>
            </section>

            <section className="home-flow" aria-label="アプリでできること">
              <div><span>1</span><strong>献立を決める</strong><small>体調や片付けの負担は任意で追加</small></div>
              <div><span>2</span><strong>料理別に買う</strong><small>どの料理に使う食材か表示</small></div>
              <div><span>3</span><strong>買えなくても調整</strong><small>代替か献立の再提案を選択</small></div>
            </section>
          </div>
        ) : (
          <>
            <div className="recommendation-hero">
              <div>
                <span className="eyebrow">作成した献立</span>
                <h2>{selectedPlan.title ?? selectedPlan.label ?? "献立"}</h2>
              </div>
              <span className="recommendation-hero__badge">{selectedPlan.label ?? `${schedule.length}日分`}</span>
              <p>{selectedPlan.reason ?? "予算・調理時間・栄養バランスを見ながら、固定データで提案しています。"}</p>
              <dl className="summary-row">
                <div>
                  <dt>食費目安</dt>
                  <dd>約¥{Number(summary.price || 0).toLocaleString()}</dd>
                </div>
                <div>
                  <dt>たんぱく質</dt>
                  <dd>{summary.protein}</dd>
                </div>
              </dl>
              <button className="recommendation-hero__edit" onClick={onEditConditions} type="button">
                作る範囲・希望を変更
              </button>
              <button className="recommendation-hero__recipes" onClick={onViewRecipes} type="button">
                レシピ一覧から選ぶ ›
              </button>
            </div>

            <section className="priority-summary" aria-label="献立で優先した条件">
              <div>
                <span className="eyebrow">この順で候補を評価</span>
                <h2>献立に反映した優先度</h2>
              </div>
              <ol>
                {(selectedPlan.appliedPriorities ?? ["時短・価格・栄養を総合評価"]).map((priority, index) => (
                  <li key={`${priority}-${index}`}>
                    <span>{index + 1}</span>
                    {priority}
                  </li>
                ))}
              </ol>
            </section>

            {requestedCookTime >= 45 && (
              <section className="time-match-summary" aria-label="時間条件に一致した料理">
                <div className="time-match-summary__heading">
                  <span aria-hidden="true">⏱</span>
                  <div>
                    <span className="eyebrow">時間条件に一致</span>
                    <h2>{formatCookingTime(requestedCookTime)}の料理を上位表示</h2>
                  </div>
                </div>
                {exactTimeRecipes.length ? (
                  <ul>
                    {exactTimeRecipes.map((recipe) => (
                      <li key={recipe.id}>{recipe.name}</li>
                    ))}
                  </ul>
                ) : (
                  <p>アレルギーなどの条件に合う料理がないため、短い時間の候補を表示しています。</p>
                )}
                {visibleSlots.some((slot) => slot.key === "breakfast") && (
                  <small>朝食は食べやすさを優先し、短時間の料理にしています。</small>
                )}
              </section>
            )}

            <section className="calendar-overview" aria-label="献立の日付一覧">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">カレンダー</span>
                  <h2>日付を押すと献立へ移動</h2>
                </div>
              </div>
              <div className="calendar-strip">
                {calendarDays.map((day) => (
                  <button
                    className={`calendar-day${day.isToday ? " is-today" : ""}${day.hasPlan ? " has-plan" : ""}`}
                    key={`${day.weekday}-${day.index}`}
                    onClick={() => document.getElementById(`meal-day-${day.index}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    type="button"
                  >
                    <small>{day.month}/{day.weekday}</small>
                    <strong>{day.date}</strong>
                    <i aria-hidden="true" />
                  </button>
                ))}
              </div>
            </section>

            {selectedPlan.allergyNote && (
              <div className="info-card">
                <span className="info-card__icon" aria-hidden="true">!</span>
                <p>{selectedPlan.allergyNote}</p>
              </div>
            )}

            {selectedPlan.timeNote && (
              <div className="info-card">
                <span className="info-card__icon" aria-hidden="true">⏱</span>
                <p>{selectedPlan.timeNote}</p>
              </div>
            )}

            {selectedPlan.cuisineNote && (
              <div className="info-card">
                <span className="info-card__icon" aria-hidden="true">🌏</span>
                <p>{selectedPlan.cuisineNote}</p>
              </div>
            )}

            <div className="meal-plan-days">
              {schedule.map((day, dayIndex) => (
                <section className="meal-day" id={`meal-day-${dayIndex}`} key={day.id ?? day.date ?? day.label ?? dayIndex}>
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">DAY {dayIndex + 1}</span>
                      <h2>{day.label ?? day.dateLabel ?? `${dayIndex + 1}日目`}</h2>
                    </div>
                    {day.note && <span className="section-heading__note">{day.note}</span>}
                  </div>

                  <div className="meal-card-list">
                    {visibleSlots.map((slot) => {
                      const recipeId = mealIdFor(day, slot);
                      const recipe = recipeMap.get(recipeId);

                      return recipe ? (
                        <MealCard
                          icon={slot.icon}
                          key={slot.key}
                          label={slot.label}
                          meal={recipe}
                          mealLabel={slot.label}
                          timeMatchLabel={requestedCookTime >= 45 && Number(recipe.cookingTime) === requestedCookTime
                            ? `${formatCookingTime(requestedCookTime)}条件に一致`
                            : ""}
                          onSelect={() => onSelectRecipe?.(recipe, { dayIndex, mealType: slot.key })}
                          onChange={() =>
                            onChangeMeal?.({
                              dayIndex,
                              day,
                              mealType: slot.key,
                              recipeId,
                              recipe,
                            })
                          }
                          recipe={recipe}
                        />
                      ) : (
                        <div className="empty-card" key={slot.key}>
                          <span>{slot.icon} {slot.label}</span>
                          <p>料理がまだ選ばれていません</p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            {cookingCompleted && (
              <section className="post-cooking-card" aria-labelledby="post-cooking-title">
                <span className="post-cooking-card__icon" aria-hidden="true">✓</span>
                <div>
                  <p className="eyebrow">調理完了</p>
                  <h2 id="post-cooking-title">ほかのレシピもここから確認できます</h2>
                  <p>上の料理を押すと次のレシピを開けます。献立全体の感想は、好きなタイミングで送れます。</p>
                  <button className="button button--secondary button--full" onClick={onFeedback} type="button">
                    献立全体をフィードバック
                  </button>
                  <small>このレビュー用プロトタイプでは、1食につき1品として表示しています。</small>
                </div>
              </section>
            )}

            <div className="sticky-actions">
              <button
                className="button button--primary button--large"
                onClick={() => confirmPlan?.(selectedPlan)}
                type="button"
              >
                {planConfirmed ? "買い物リストを見る" : "この献立に決定"}
              </button>
              <p className="action-help">
                {planConfirmed
                  ? "選んだ期間・食事に必要な食材を確認できます。"
                  : "決定すると、この献立に必要な食材だけを買い物リストで確認できます。"}
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
