"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PhoneFrame from "./components/PhoneFrame";
import BottomNav from "./components/BottomNav";
import InitialSetup from "./screens/InitialSetup";
import ConditionInput from "./screens/ConditionInput";
import MealSuggestion from "./screens/MealSuggestion";
import MealChange from "./screens/MealChange";
import ShoppingList from "./screens/ShoppingList";
import UnavailableIngredient from "./screens/UnavailableIngredient";
import SubstituteSuggestion from "./screens/SubstituteSuggestion";
import ReMealSuggestion from "./screens/ReMealSuggestion";
import ReceiptScan from "./screens/ReceiptScan";
import RecipeConfirm from "./screens/RecipeConfirm";
import Cooking from "./screens/Cooking";
import Feedback from "./screens/Feedback";
import Settings from "./screens/Settings";
import {
  allergenOptions,
  bottomNavItems,
  feedbackOptions,
  ingredients,
  mealPlans,
  recipes,
  shoppingList,
  unavailableIngredientScenario,
} from "./data";

const initialProfile = {
  name: "user",
  age: "",
  gender: "",
  allergies: [],
  dislikes: [],
  goals: [],
  fridge: [],
  monthlyBudget: "",
};

const initialConditions = {
  duration: "3days",
  days: 3,
  mealType: "dinner",
  budget: "",
  nutrients: [],
  cookTime: "",
  constraints: [],
  moods: [],
  cuisines: [],
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const mealLabels = {
  breakfast: "朝食",
  lunch: "昼食",
  dinner: "夕食",
};

const cleanMealLabels = {
  breakfast: "朝ごはん",
  lunch: "昼ごはん",
  dinner: "夜ごはん",
};

const planRecipes = {
  breakfast: ["recipe-8", "recipe-9"],
  lunch: ["recipe-20", "recipe-19", "recipe-15", "recipe-11", "recipe-5", "recipe-12", "recipe-2", "recipe-6", "recipe-16", "recipe-21", "recipe-22"],
  dinner: ["recipe-17", "recipe-16", "recipe-22", "recipe-14", "recipe-18", "recipe-1", "recipe-13", "recipe-10", "recipe-20", "recipe-21", "recipe-3", "recipe-4"],
};

function listValues(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  return value
    .split(/[、,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normaliseIngredientIds(values) {
  const rawValues = listValues(values);
  return rawValues
    .map((value) => {
      const trimmed = String(value).trim();
      const ingredient = ingredients.find(
        (item) => item.id === trimmed || item.name === trimmed,
      );
      return ingredient?.id ?? trimmed;
    })
    .filter(Boolean);
}

function normaliseAllergyValues(values) {
  return listValues(values)
    .map((value) => {
      const trimmed = String(value).trim();
      const direct = allergenOptions.find(
        (option) => option.value === trimmed || option.label === trimmed,
      );
      if (direct) return direct.value;
      const containing = allergenOptions.find((option) => option.ingredientIds?.includes(trimmed));
      return containing?.value ?? trimmed;
    })
    .filter(Boolean);
}

function blockedIngredientIdsForProfile(profile) {
  const allergyIds = normaliseAllergyValues(profile?.allergies).flatMap((value) => {
    const option = allergenOptions.find((candidate) => candidate.value === value);
    if (option) return option.ingredientIds ?? [];
    return ingredients.some((ingredient) => ingredient.id === value) ? [value] : [];
  });
  const dislikeValues = listValues(profile?.dislikes);
  const dislikeIds = normaliseIngredientIds(dislikeValues);
  if (dislikeValues.some((value) => String(value).includes("魚"))) {
    dislikeIds.push("salmon", "mackerel", "tuna", "fish-sauce");
  }
  if (dislikeValues.some((value) => String(value).includes("辛"))) {
    dislikeIds.push("kimchi");
  }
  return [...new Set([...allergyIds, ...dislikeIds])];
}

function normaliseProfile(value) {
  return {
    ...value,
    name: typeof value?.name === "string" && value.name.trim() ? value.name.trim() : "user",
    allergies: normaliseAllergyValues(value?.allergies),
    dislikes: listValues(value?.dislikes),
    goals: listValues(value?.goals),
    fridge: listValues(value?.fridge),
    tastePreferences: listValues(value?.tastePreferences),
  };
}

function recipeHasIngredients(recipe, ingredientIds) {
  if (!recipe || ingredientIds.length === 0) return false;
  return (recipe.ingredients ?? []).some((item) => ingredientIds.includes(item.ingredientId));
}

function supportsMealType(recipe, mealType) {
  const types = Array.isArray(recipe?.mealType) ? recipe.mealType : [recipe?.mealType];
  return types.includes(mealType);
}

function mealCountFromConditions(conditions = {}) {
  const duration = conditions.duration ?? "3days";
  if (duration === "meal") return 1;
  if (duration === "1day") return 3;
  if (duration === "7days") return 21;
  return 9;
}

function buildPriorities(conditions = {}, profile = {}) {
  const priorities = [];
  if (normaliseAllergyValues(profile.allergies).length) priorities.push("アレルギー除外");
  if (conditions.cookTime) priorities.push(`${conditions.cookTime}分以内`);
  if (conditions.budget) priorities.push(`予算${Number(conditions.budget).toLocaleString()}円以内`);
  (conditions.constraints ?? []).forEach((value) => priorities.push(value));
  (conditions.moods ?? []).forEach((value) => priorities.push(value));
  (conditions.nutrients ?? []).forEach((value) => priorities.push(`${value}を重視`));
  (conditions.cuisines ?? []).forEach((value) => priorities.push(`${value}の気分`));
  if (!priorities.length) priorities.push("時短・価格・栄養・献立の変化を総合評価");
  return priorities;
}

function recipeCuisineMatches(recipe, requested = []) {
  if (!requested.length) return false;
  const haystack = [recipe.cuisine, ...(recipe.tags ?? [])].filter(Boolean).join(" ");
  return requested.some((value) => haystack.includes(value));
}

function countRecipeIngredients(recipe, predicate) {
  return (recipe.ingredients ?? []).filter((item) => {
    const ingredient = ingredients.find((candidate) => candidate.id === item.ingredientId);
    return predicate(ingredient, item);
  }).length;
}

function scoreRecipe(recipe, conditions = {}, preferredIds = []) {
  const maxCookTime = Number(conditions?.cookTime ?? 0);
  const budget = Number(conditions?.budget ?? 0);
  const preferredIndex = preferredIds.indexOf(recipe.id);
  const constraints = conditions.constraints ?? [];
  const nutrients = conditions.nutrients ?? [];
  const moods = conditions.moods ?? [];
  const fridgeIngredientIds = conditions.fridgeIngredientIds ?? [];
  let score = 0;

  if (preferredIndex >= 0) score += Math.max(0, 14 - preferredIndex);
  if (maxCookTime) {
    score += Number(recipe.cookingTime ?? 0) <= maxCookTime ? 70 : -100;
    score += Math.max(-15, maxCookTime - Number(recipe.cookingTime ?? 0));
  }
  if (budget) {
    const perMealBudget = budget / mealCountFromConditions(conditions);
    score += Number(recipe.price ?? 0) <= perMealBudget ? 45 : -45;
    score += Math.max(-18, Math.min(18, (perMealBudget - Number(recipe.price ?? 0)) / 20));
  }
  if (constraints.includes("時間を短くしたい")) score += Math.max(0, 30 - Number(recipe.cookingTime ?? 0));
  if (constraints.includes("洗い物を減らしたい")) score += Math.max(0, 4 - Number(recipe.washingLevel ?? 3)) * 12;
  if (constraints.includes("簡単な料理にしたい")) score += recipe.difficulty === "かんたん" ? 24 : 0;
  if (constraints.includes("冷蔵庫の食材を使いたい")) {
    const reused = (recipe.ingredients ?? []).filter((item) => fridgeIngredientIds.includes(item.ingredientId)).length;
    score += reused * 20;
  }
  if (moods.includes("疲れている")) {
    score += Math.max(0, 25 - Number(recipe.cookingTime ?? 0));
    score += Math.max(0, 3 - Number(recipe.washingLevel ?? 3)) * 10;
  }
  if (moods.includes("食欲がない") || moods.includes("さっぱり食べたい")) {
    score += (recipe.tags ?? []).some((tag) => String(tag).includes("さっぱり") || String(tag).includes("やさしい")) ? 28 : 0;
  }
  if (moods.includes("しっかり食べたい")) score += Number(recipe.kcal ?? 0) >= 550 ? 20 : 0;
  if (nutrients.includes("たんぱく質")) score += Math.min(28, Number(recipe.protein ?? 0));
  if (nutrients.includes("野菜")) {
    score += countRecipeIngredients(recipe, (ingredient) => ingredient?.category === "野菜" || ingredient?.category === "野菜・果物") * 10;
  }
  if (nutrients.includes("低脂質")) score += Math.max(0, 24 - Number(recipe.fat ?? 0));
  if (nutrients.includes("バランス")) {
    const hasProtein = Number(recipe.protein ?? 0) >= 20;
    const hasVegetable = countRecipeIngredients(recipe, (ingredient) => ingredient?.category === "野菜") >= 1;
    const hasStaple = countRecipeIngredients(recipe, (ingredient) => ingredient?.category === "主食") >= 1;
    score += [hasProtein, hasVegetable, hasStaple].filter(Boolean).length * 8;
  }
  if (recipeCuisineMatches(recipe, conditions.cuisines ?? [])) score += 32;
  if (!maxCookTime && !budget && !constraints.length && !nutrients.length && !moods.length) {
    score += Math.max(0, 4 - Number(recipe.washingLevel ?? 3)) * 4;
    score += Math.min(8, Number(recipe.protein ?? 0) / 5);
  }
  return score;
}

function rankedRecipesFor(mealType, blockedIngredientIds, conditions = {}, preferredIds = []) {
  return recipes
    .filter((recipe) => (
      supportsMealType(recipe, mealType)
      && !recipeHasIngredients(recipe, blockedIngredientIds)
    ))
    .sort((a, b) => scoreRecipe(b, conditions, preferredIds) - scoreRecipe(a, conditions, preferredIds));
}

function safeRecipeFor(mealType, blockedIngredientIds, preferredIds = [], conditions = {}) {
  const maxCookTime = Number(conditions?.cookTime ?? 0);
  const fitsTime = (recipe) => !maxCookTime || Number(recipe?.cookingTime ?? 0) <= Number(maxCookTime);
  const ranked = rankedRecipesFor(mealType, blockedIngredientIds, conditions, preferredIds);
  return ranked.find(fitsTime)?.id ?? ranked[0]?.id ?? preferredIds[0] ?? recipes[0]?.id;
}

const substitutionFamilies = [
  ["chicken-breast", "chicken-tender", "ground-chicken", "pork", "tuna", "tofu", "chickpeas"],
  ["salmon", "mackerel", "tuna", "chicken-breast", "chicken-tender"],
  ["tofu", "egg", "natto", "chickpeas", "ground-chicken", "tuna"],
  ["cabbage", "broccoli", "bell-pepper", "bean-sprouts", "onion", "carrot", "tomato"],
  ["rice", "udon", "pasta", "somen", "oats"],
];

const preparationMinuteOffsets = {
  tuna: -8,
  tofu: -4,
  chickpeas: -4,
  "ground-chicken": -3,
  "bean-sprouts": -3,
  "chicken-tender": 0,
  "chicken-breast": 0,
  pork: 0,
  salmon: 0,
  mackerel: 0,
};

function impactLabel(candidateValue, originalValue) {
  if (!Number(originalValue)) return "比較データなし";
  const ratio = Number(candidateValue) / Number(originalValue);
  if (ratio >= 1.2) return "増える";
  if (ratio <= 0.8) return "減る";
  return "ほぼ同じ";
}

function rankSubstituteCandidates(originalId, conditions = {}, blockedIngredientIds = []) {
  const original = ingredients.find((ingredient) => ingredient.id === originalId);
  if (!original) return [];
  const family = substitutionFamilies.find((candidateFamily) => candidateFamily.includes(originalId)) ?? [];
  const candidateIds = [...new Set([...(original.alternatives ?? []), ...family])];

  return candidateIds
    .filter((id) => id !== originalId && !blockedIngredientIds.includes(id))
    .map((id) => {
      const candidate = ingredients.find((ingredient) => ingredient.id === id);
      if (!candidate) return null;
      const directIndex = (original.alternatives ?? []).indexOf(id);
      const priceDelta = Number(candidate.priceEstimate ?? 0) - Number(original.priceEstimate ?? 0);
      const proteinRatio = Number(original.proteinPer100g ?? 0)
        ? Number(candidate.proteinPer100g ?? 0) / Number(original.proteinPer100g)
        : 1;
      const kcalRatio = Number(original.kcalPer100g ?? 0)
        ? Number(candidate.kcalPer100g ?? 0) / Number(original.kcalPer100g)
        : 1;
      const timeDelta = preparationMinuteOffsets[id] ?? 0;
      let score = 0;

      if (directIndex >= 0) score += 70 - directIndex * 8;
      if (candidate.category === original.category) score += 30;
      score += Math.max(0, 30 - Math.abs(1 - proteinRatio) * 35);
      score += Math.max(0, 18 - Math.abs(1 - kcalRatio) * 18);
      if (priceDelta <= 0) score += 18;
      if ((conditions.nutrients ?? []).includes("たんぱく質")) score += Math.min(24, Number(candidate.proteinPer100g ?? 0));
      if ((conditions.nutrients ?? []).includes("低脂質") && kcalRatio <= 1) score += 15;
      if (conditions.budget && priceDelta <= 0) score += 12;
      if (conditions.cookTime && timeDelta <= 0) score += 10;

      const keptConditions = [];
      if (Math.abs(1 - proteinRatio) <= 0.25) keptConditions.push("たんぱく質が近い");
      if (priceDelta <= 0) keptConditions.push("予算を抑えやすい");
      if (timeDelta <= 0) keptConditions.push("調理時間を維持");
      if (candidate.category === original.category) keptConditions.push("同じ売り場で探せる");

      return {
        ingredientId: candidate.id,
        name: candidate.name,
        score,
        priceDelta,
        kcalImpact: impactLabel(candidate.kcalPer100g, original.kcalPer100g),
        proteinImpact: impactLabel(candidate.proteinPer100g, original.proteinPer100g),
        cookingTimeImpact: timeDelta === 0 ? "変化なし" : `${Math.abs(timeDelta)}分ほど短縮`,
        keptConditions,
        note: directIndex >= 0
          ? "料理での使いやすさと、価格・栄養・調理時間の近さをまとめて評価しました。"
          : "同じ役割の食材から、価格・栄養・調理時間が近い候補を追加しました。",
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((candidate, index) => ({ ...candidate, recommended: index === 0 }));
}

function applyPlanRules(plan, blockedIngredientIds, conditions) {
  if (!plan) return plan;
  const nextPlan = clone(plan);
  daysFromPlan(nextPlan).forEach((day, dayIndex) => {
    Object.entries(day?.meals ?? {}).forEach(([mealType, recipeId]) => {
      const recipe = recipes.find((item) => item.id === recipeId);
      const ranked = rankedRecipesFor(mealType, blockedIngredientIds, conditions, planRecipes[mealType]);
      const bestRecipe = ranked[dayIndex % Math.max(ranked.length, 1)] ?? ranked[0];
      const shouldReplace = recipeHasIngredients(recipe, blockedIngredientIds)
        || (conditions?.cookTime && Number(recipe?.cookingTime ?? 0) > Number(conditions.cookTime));
      const betterRecipe = bestRecipe && recipe
        && scoreRecipe(bestRecipe, conditions, planRecipes[mealType]) > scoreRecipe(recipe, conditions, planRecipes[mealType]) + 6;
      if (!shouldReplace && !betterRecipe) return;
      day.meals[mealType] = bestRecipe?.id ?? safeRecipeFor(mealType, blockedIngredientIds, planRecipes[mealType], conditions);
    });
  });
  const allergyNames = conditions?.allergyLabels?.length ? conditions.allergyLabels : blockedIngredientIds
    .map((id) => ingredients.find((ingredient) => ingredient.id === id)?.name)
    .filter(Boolean);
  nextPlan.excludedAllergyIngredientIds = blockedIngredientIds;
  if (allergyNames.length) {
    nextPlan.allergyNote = `アレルギー食材（${allergyNames.join("、")}）を含む料理は外しています。`;
  }
  if (conditions?.cookTime) {
    nextPlan.timeNote = `調理時間は${conditions.cookTime}分以内を優先しています。`;
  }
  nextPlan.appliedPriorities = conditions?.appliedPriorities ?? [];
  if (conditions?.cuisines?.length) {
    nextPlan.cuisineNote = `時間など上位条件を満たす範囲で、${conditions.cuisines.join("・")}の料理を優先しました。`;
  }
  return nextPlan;
}

function daysFromPlan(plan) {
  if (Array.isArray(plan?.days)) return plan.days;
  if (Array.isArray(plan?.schedule)) return plan.schedule;
  if (Array.isArray(plan?.daily)) return plan.daily;
  return [];
}

function firstRecipeId(plan) {
  const firstDay = daysFromPlan(plan)[0];
  const meals = firstDay?.meals ?? firstDay?.mealIds ?? firstDay ?? {};
  return meals.dinner ?? meals.lunch ?? meals.breakfast ?? recipes[0]?.id;
}

function parseIngredientAmount(value) {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d+\/\d+|\d+(?:\.\d+)?)(.*)$/);
  if (!match) return null;
  const number = match[1].includes("/")
    ? match[1].split("/").reduce((left, right) => Number(left) / Number(right))
    : Number(match[1]);
  return Number.isFinite(number) ? { value: number, unit: match[2].trim() } : null;
}

function displayAggregatedNumber(value) {
  return Number.isInteger(value) ? value : Number(value.toFixed(1));
}

function buildPlan(conditions, profile) {
  const duration = conditions?.duration ?? `${conditions?.days ?? 3}days`;
  const mealType = conditions?.mealType ?? "dinner";
  const blockedIngredientIds = blockedIngredientIdsForProfile(profile);
  const effectiveConditions = {
    ...conditions,
    fridgeIngredientIds: normaliseIngredientIds(profile?.fridge),
    allergyLabels: normaliseAllergyValues(profile?.allergies)
      .map((value) => allergenOptions.find((option) => option.value === value)?.label ?? value),
    appliedPriorities: buildPriorities(conditions, profile),
  };

  if (duration === "meal") {
    const recipeId = safeRecipeFor(mealType, blockedIngredientIds, planRecipes[mealType] ?? planRecipes.dinner, effectiveConditions);
    return applyPlanRules({
      id: `plan-one-${mealType}`,
      label: `1食分（${cleanMealLabels[mealType]}）`,
      title: `${cleanMealLabels[mealType]}の献立`,
      duration: 1,
      mealSlots: [mealType],
      reason: "今回選んだ1食だけを作るための献立です。買い物リストもこの料理に必要な食材だけを表示します。",
      days: [
        {
          day: 1,
          label: "今日",
          meals: { [mealType]: recipeId },
        },
      ],
    }, blockedIngredientIds, effectiveConditions);
  }

  if (duration === "1day" || Number(conditions?.days) === 1) {
    return applyPlanRules({
      ...clone(mealPlans.oneDay),
      title: "1日分の献立",
      label: "1日分",
      mealSlots: ["breakfast", "lunch", "dinner"],
    }, blockedIngredientIds, effectiveConditions);
  }

  if (duration === "7days" || Number(conditions?.days) === 7) {
    const baseDays = daysFromPlan(mealPlans.threeDay);
    return applyPlanRules({
      ...clone(mealPlans.threeDay),
      id: "plan-7-days",
      title: "1週間分の献立",
      label: "1週間分",
      duration: 7,
      mealSlots: ["breakfast", "lunch", "dinner"],
      reason: "3日分の献立パターンをもとに、1週間の買い物量を確認するためのレビュー用プランです。",
      days: Array.from({ length: 7 }, (_, index) => {
        const source = baseDays[index % baseDays.length] ?? baseDays[0];
        return {
          ...clone(source),
          day: index + 1,
          label: `${index + 1}日目`,
        };
      }),
    }, blockedIngredientIds, effectiveConditions);
  }

  return applyPlanRules({
    ...clone(mealPlans.threeDay),
    title: "3日分の献立",
    label: "3日分",
    mealSlots: ["breakfast", "lunch", "dinner"],
  }, blockedIngredientIds, effectiveConditions);
}

function navIdForScreen(screen) {
  if (["shoppingList", "unavailableIngredient", "substituteSuggestion", "reMealSuggestion", "receiptScan"].includes(screen)) {
    return "shopping";
  }
  if (["recipeConfirm", "cooking", "feedback"].includes(screen)) return "recipes";
  if (screen === "settings") return "settings";
  if (screen === "conditionInput") return "create";
  return "home";
}

function resolveNavTarget(rawId) {
  const id = String(rawId ?? "").toLowerCase();
  if (id.includes("setting") || id.includes("設定")) return "settings";
  if (id.includes("shop") || id.includes("買")) return "shoppingList";
  if (id.includes("recipe") || id.includes("レシピ")) return "recipeConfirm";
  if (id.includes("create") || id.includes("plan") || id.includes("献立作成")) return "conditionInput";
  return "mealSuggestion";
}

function editableSettingValue(id, profile) {
  if (id === "name") return profile.name ?? "user";
  if (id === "budget") return profile.monthlyBudget ?? "";
  if (id === "fridge") return listValues(profile.fridge).join("、");
  if (id === "allergies") return listValues(profile.allergies)
    .map((value) => allergenOptions.find((option) => option.value === value)?.label ?? value)
    .join("、");
  if (id === "dislikes") return listValues(profile.dislikes).join("、");
  if (id === "taste") return listValues(profile.tastePreferences ?? ["さっぱり", "やや薄味"]).join("、");
  if (id === "goals") return listValues(profile.goals).join("、");
  if (id === "profile") return `${profile.age ?? ""}歳・${profile.gender ?? ""}`;
  return "";
}

const settingLabels = {
  name: "名前",
  profile: "プロフィール",
  budget: "月の食費予算",
  fridge: "冷蔵庫の食材",
  allergies: "アレルギー食材",
  dislikes: "苦手な食材",
  taste: "味の好み",
  goals: "普段優先したいこと",
};

export default function MealMateApp() {
  const [currentScreen, setCurrentScreen] = useState("initialSetup");
  const [profile, setProfile] = useState(initialProfile);
  const [conditions, setConditions] = useState(initialConditions);
  const [activePlan, setActivePlan] = useState(null);
  const [planConfirmed, setPlanConfirmed] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [unavailableIngredientId, setUnavailableIngredientId] = useState(
    unavailableIngredientScenario?.ingredientId ?? "chicken-breast",
  );
  const [selectedSubstituteId, setSelectedSubstituteId] = useState("chicken-tender");
  const [ingredientReplacements, setIngredientReplacements] = useState({});
  const [hasScannedReceipt, setHasScannedReceipt] = useState(false);
  const [inventory, setInventory] = useState(initialProfile.fridge);
  const [selectedRecipeId, setSelectedRecipeId] = useState(() => recipes[0]?.id);
  const [cookingStep, setCookingStep] = useState(0);
  const [servings, setServings] = useState(1);
  const [tasteNote, setTasteNote] = useState("");
  const [confirmedCookingRecipe, setConfirmedCookingRecipe] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState([]);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [personalizationApplied, setPersonalizationApplied] = useState(false);
  const [notice, setNotice] = useState("");
  const [editingSetting, setEditingSetting] = useState(null);
  const [settingDraft, setSettingDraft] = useState("");
  const [settingSelection, setSettingSelection] = useState([]);
  const settingTriggerRef = useRef(null);
  const settingDialogRef = useRef(null);
  const appContentRef = useRef(null);

  const recipeMap = useMemo(
    () => Object.fromEntries(recipes.map((recipe) => [recipe.id, recipe])),
    [],
  );
  const ingredientMap = useMemo(
    () => Object.fromEntries(ingredients.map((ingredient) => [ingredient.id, ingredient])),
    [],
  );
  const settingAllergyOptions = useMemo(
    () => allergenOptions.map((option) => ({ value: option.value, label: option.label })),
    [],
  );

  const selectedRecipe = recipeMap[selectedRecipeId] ?? recipeMap[firstRecipeId(activePlan)] ?? recipes[0];

  const mealChangeCandidates = useMemo(() => {
    if (!editingSlot?.mealType) return [];
    return rankedRecipesFor(
      editingSlot.mealType,
      blockedIngredientIdsForProfile(profile),
      {
        ...conditions,
        fridgeIngredientIds: normaliseIngredientIds(profile.fridge),
      },
      planRecipes[editingSlot.mealType] ?? [],
    )
      .filter((recipe) => recipe.id !== editingSlot.recipeId)
      .slice(0, 6);
  }, [conditions, editingSlot, profile]);

  const cookingRecipe = useMemo(() => ({
    ...selectedRecipe,
    ingredients: (selectedRecipe?.ingredients ?? []).map((item) => {
      const replacementId = ingredientReplacements[item.ingredientId];
      const replacement = replacementId ? ingredientMap[replacementId] : null;
      return replacement
        ? {
            ...item,
            ingredientId: replacement.id,
            name: replacement.name,
            substitutedFrom: item.name,
          }
        : item;
    }),
  }), [ingredientMap, ingredientReplacements, selectedRecipe]);

  const visibleShoppingGroups = useMemo(() => {
    const required = new Map();

    daysFromPlan(activePlan).forEach((day, dayIndex) => {
      Object.entries(day?.meals ?? {}).forEach(([mealType, recipeId]) => {
        const recipe = recipeMap[recipeId];
        (recipe?.ingredients ?? []).forEach((item) => {
          const parsedAmount = parseIngredientAmount(item.amount);
          const current = required.get(item.ingredientId) ?? {
            amountValue: 0,
            amountUnit: parsedAmount?.unit ?? "",
            rawAmounts: [],
            useCount: 0,
            name: item.name,
            usedIn: new Set(),
          };
          current.useCount += 1;
          if (parsedAmount && (!current.amountUnit || current.amountUnit === parsedAmount.unit)) {
            current.amountUnit = parsedAmount.unit;
            current.amountValue += parsedAmount.value;
          } else {
            current.rawAmounts.push(item.amount);
          }
          current.usedIn.add(
            `${day.label ?? `${dayIndex + 1}日目`}・${cleanMealLabels[mealType] ?? mealType}「${recipe.name}」`,
          );
          required.set(item.ingredientId, current);
        });
      });
    });

    const baseItems = new Map(
      shoppingList.flatMap((group) => group.items ?? []).map((item) => [item.ingredientId, item]),
    );
    const groups = shoppingList.map((group) => ({ ...group, items: [] }));

    required.forEach((details, originalId) => {
      const replacementId = ingredientReplacements[originalId] ?? originalId;
      const replacement = ingredientMap[replacementId];
      const original = ingredientMap[originalId];
      const base = baseItems.get(originalId) ?? {};
      const category = replacement?.category ?? original?.category ?? base.category ?? "その他";
      let group = groups.find((candidate) => candidate.category === category);

      if (!group && category === "野菜・果物") {
        group = groups.find((candidate) => candidate.category === "野菜");
      }
      if (!group) {
        group = { id: `category-${category}`, category, icon: "•", items: [] };
        groups.push(group);
      }

      group.items.push({
        ...base,
        id: base.id ?? `shop-${originalId}`,
        ingredientId: replacementId,
        name: replacement?.name ?? details.name ?? original?.name ?? originalId,
        amount: details.rawAmounts.length
          ? (new Set(details.rawAmounts).size === 1
              ? `${details.rawAmounts[0]}${details.useCount > 1 ? `×${details.useCount}` : ""}`
              : `${details.useCount}回分`)
          : displayAggregatedNumber(details.amountValue),
        unit: details.rawAmounts.length ? "" : details.amountUnit,
        usedIn: [...details.usedIn],
        canBeUnavailable: base.canBeUnavailable ?? category !== "調味料",
        substitutedFrom: replacementId !== originalId ? (original?.name ?? details.name) : undefined,
      });
    });

    return groups.filter((group) => group.items.length > 0);
  }, [activePlan, ingredientMap, ingredientReplacements, recipeMap, unavailableIngredientId]);

  const shoppingUnavailableIngredientId = useMemo(
    () => visibleShoppingGroups
      .flatMap((group) => group.items)
      .find((item) => item.canBeUnavailable)?.ingredientId ?? unavailableIngredientId,
    [unavailableIngredientId, visibleShoppingGroups],
  );

  const receiptScannedItems = useMemo(
    () => visibleShoppingGroups
      .filter((group) => group.category !== "調味料")
      .flatMap((group) => (group.items ?? []).map((item) => ({
        id: `receipt-${item.id ?? item.ingredientId}`,
        ingredientId: item.ingredientId,
        name: item.name,
        quantity: [item.amount, item.unit].filter(Boolean).join(""),
        category: group.category,
        confidence: 96,
      }))),
    [visibleShoppingGroups],
  );

  const unavailableShoppingItem = useMemo(
    () => visibleShoppingGroups
      .flatMap((group) => group.items)
      .find((item) => item.ingredientId === unavailableIngredientId),
    [unavailableIngredientId, visibleShoppingGroups],
  );

  const smartSubstituteCandidates = useMemo(
    () => rankSubstituteCandidates(
      unavailableIngredientId,
      conditions,
      blockedIngredientIdsForProfile(profile),
    ),
    [conditions, profile, unavailableIngredientId],
  );

  const reSuggestedPlan = useMemo(() => {
    const next = clone(activePlan);
    if (!next) return null;
    next.id = `plan-without-${unavailableIngredientId}`;
    next.label = `${ingredientMap[unavailableIngredientId]?.name ?? "対象食材"}を使わない献立`;
    next.summary = "予算・栄養・調理時間をなるべく維持して組み直しました。";
    next.excludedIngredientIds = [unavailableIngredientId];
    next.appliedPriorities = buildPriorities(conditions, profile);
    const blockedIds = [...new Set([
      ...blockedIngredientIdsForProfile(profile),
      unavailableIngredientId,
    ])];
    const effectiveConditions = {
      ...conditions,
      fridgeIngredientIds: normaliseIngredientIds(profile.fridge),
    };

    daysFromPlan(next).forEach((day, dayIndex) => {
      Object.entries(day?.meals ?? {}).forEach(([mealType, recipeId]) => {
        const usesUnavailable = (recipeMap[recipeId]?.ingredients ?? [])
          .some((item) => item.ingredientId === unavailableIngredientId);
        if (!usesUnavailable) return;
        const ranked = rankedRecipesFor(
          mealType,
          blockedIds,
          effectiveConditions,
          planRecipes[mealType] ?? [],
        ).filter((recipe) => recipe.id !== recipeId);
        const replacement = ranked[dayIndex % Math.max(ranked.length, 1)] ?? ranked[0];
        if (replacement) day.meals[mealType] = replacement.id;
      });
    });
    return next;
  }, [activePlan, conditions, ingredientMap, profile, recipeMap, unavailableIngredientId]);

  const reSuggestionPreviewMeals = useMemo(() => {
    const currentDays = daysFromPlan(activePlan);
    const suggestedDays = daysFromPlan(reSuggestedPlan);
    return suggestedDays.find((day, index) => (
      JSON.stringify(day.meals) !== JSON.stringify(currentDays[index]?.meals)
    ))?.meals ?? suggestedDays[0]?.meals;
  }, [activePlan, reSuggestedPlan]);

  const personalizationMessage = useMemo(() => {
    const labels = selectedFeedback
      .map((id) => feedbackOptions.find((option) => option.id === id)?.label)
      .filter(Boolean);
    if (labels.length > 0) return `前回の「${labels.slice(0, 2).join("・")}」を反映しています`;
    if (feedbackNote.trim()) return "前回の自由記述フィードバックを反映しています";
    return "前回の好みを次の献立に反映しています";
  }, [feedbackNote, selectedFeedback]);

  const moveTo = (screen, message = "") => {
    setNotice(message);
    setCurrentScreen(screen);
  };

  const createPlan = (nextConditions) => {
    const next = nextConditions ?? conditions;
    setConditions(next);
    const clonedPlan = buildPlan(next, profile);
    setActivePlan(clonedPlan);
    setPlanConfirmed(false);
    setCheckedItems({});
    setIngredientReplacements({});
    setSelectedRecipeId(firstRecipeId(clonedPlan));
    setConfirmedCookingRecipe(null);
    moveTo("mealSuggestion");
  };

  const replaceMeal = (recipeId) => {
    if (!editingSlot) return;
    setActivePlan((previousPlan) => {
      const nextPlan = clone(previousPlan);
      const days = daysFromPlan(nextPlan);
      const day = days[editingSlot.dayIndex];
      if (!day) return previousPlan;
      day.meals = { ...(day.meals ?? {}), [editingSlot.mealType]: recipeId };
      return nextPlan;
    });
    setSelectedRecipeId(recipeId);
    setConfirmedCookingRecipe(null);
    setEditingSlot(null);
    moveTo("mealSuggestion", "夕食メニューを変更しました");
  };

  const toggleShoppingItem = (itemOrId) => {
    const id = typeof itemOrId === "object"
      ? itemOrId.id ?? itemOrId.shoppingItemId ?? itemOrId.ingredientId
      : itemOrId;
    if (!id) return;
    setCheckedItems((previous) => ({ ...previous, [id]: !previous[id] }));
  };

  const confirmSubstitute = (candidateId) => {
    const nextId = candidateId ?? selectedSubstituteId;
    setIngredientReplacements((previous) => ({
      ...previous,
      [unavailableIngredientId]: nextId,
    }));
    moveTo("shoppingList", `${ingredientMap[nextId]?.name ?? "代替食材"}に変更しました`);
  };

  const confirmReplannedMenu = () => {
    const nextPlan = clone(reSuggestedPlan ?? mealPlans.threeDay ?? mealPlans.oneDay);
    setActivePlan(nextPlan);
    setSelectedRecipeId(firstRecipeId(nextPlan));
    setConfirmedCookingRecipe(null);
    setIngredientReplacements((previous) => {
      const next = { ...previous };
      delete next[unavailableIngredientId];
      return next;
    });
    moveTo("shoppingList", "鶏むね肉を使わない献立に組み直しました");
  };

  const registerReceipt = (items) => {
    const scannedItems = items?.length ? items : receiptScannedItems;
    const names = scannedItems
      .map((item) => (typeof item === "string" ? item : item.name ?? item.label))
      .filter(Boolean);
    const purchasedIngredientIds = new Set(
      scannedItems
        .map((item) => (typeof item === "object" ? item.ingredientId : null))
        .filter(Boolean),
    );
    const purchasedNames = new Set(names);
    const purchasedShoppingIds = visibleShoppingGroups
      .flatMap((group) => group.items ?? [])
      .filter((item) => purchasedIngredientIds.has(item.ingredientId) || purchasedNames.has(item.name))
      .map((item) => item.id ?? item.shoppingItemId ?? item.ingredientId)
      .filter(Boolean);

    setCheckedItems((previous) => ({
      ...previous,
      ...Object.fromEntries(purchasedShoppingIds.map((id) => [id, true])),
    }));
    setInventory((previous) => [...new Set([...listValues(previous), ...names])]);
    setProfile((previous) => ({
      ...previous,
      fridge: [...new Set([...listValues(previous.fridge), ...names])],
    }));
    moveTo("shoppingList", `${names.length}品を購入済みにして、冷蔵庫に登録しました`);
  };

  const toggleFeedback = (id, nextSelected) => {
    setSelectedFeedback(nextSelected ?? ((previous) => (
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]
    )));
    setFeedbackSubmitted(false);
  };

  const submitFeedback = () => {
    setFeedbackSubmitted(true);
    setPersonalizationApplied(true);
    setActivePlan(null);
    setPlanConfirmed(false);
    setCheckedItems({});
    setIngredientReplacements({});
    setConfirmedCookingRecipe(null);
    setCookingStep(0);
    moveTo("mealSuggestion", "フィードバックを保存して、ホームに戻りました");
  };

  const closeSetting = () => {
    setEditingSetting(null);
    requestAnimationFrame(() => settingTriggerRef.current?.focus());
  };

  const openSetting = (id) => {
    settingTriggerRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    setEditingSetting(id);
    setSettingDraft(editableSettingValue(id, { ...profile, fridge: inventory }));
    setSettingSelection(id === "allergies" ? normaliseAllergyValues(profile.allergies) : []);
  };

  const saveSetting = () => {
    const values = settingDraft.split(/[、,]/).map((value) => value.trim()).filter(Boolean);
    if (editingSetting === "name") {
      setProfile((previous) => ({ ...previous, name: settingDraft.trim() || "user" }));
    } else if (editingSetting === "budget") {
      setProfile((previous) => ({ ...previous, monthlyBudget: settingDraft.replace(/[^0-9]/g, "") }));
    } else if (editingSetting === "fridge") {
      setInventory(values);
      setProfile((previous) => ({ ...previous, fridge: values }));
    } else if (editingSetting === "allergies") {
      setProfile((previous) => ({ ...previous, allergies: settingSelection }));
    } else if (["dislikes", "goals"].includes(editingSetting)) {
      setProfile((previous) => ({ ...previous, [editingSetting]: values }));
    } else if (editingSetting === "taste") {
      setProfile((previous) => ({ ...previous, tastePreferences: values }));
    } else if (editingSetting === "profile") {
      const age = settingDraft.match(/\d+/)?.[0] ?? profile.age;
      const gender = settingDraft
        .split(/[・、,]/)
        .map((value) => value.trim())
        .find((value) => value && !/\d/.test(value)) ?? profile.gender;
      setProfile((previous) => ({ ...previous, age, gender }));
    }
    closeSetting();
    setNotice("設定を更新しました");
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      appContentRef.current?.scrollTo({ top: 0, behavior: "auto" });
    });
  }, [currentScreen]);

  useEffect(() => {
    if (!editingSetting) return undefined;
    const dialog = settingDialogRef.current;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSetting();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      const focusable = [...dialog.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editingSetting]);

  useEffect(() => {
    const handleFocusIn = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.matches("input, textarea, select")) return;

      window.setTimeout(() => {
        target.scrollIntoView({
          block: "center",
          inline: "nearest",
          behavior: "smooth",
        });
      }, 260);
    };

    document.addEventListener("focusin", handleFocusIn);
    return () => document.removeEventListener("focusin", handleFocusIn);
  }, []);

  const onNavChange = (value) => {
    const id = typeof value === "object" ? value.id ?? value.value ?? value.label : value;
    const target = resolveNavTarget(id);
    if ((target === "shoppingList" || target === "recipeConfirm") && !planConfirmed) {
      moveTo(
        "mealSuggestion",
        activePlan
          ? "買い物リストを見る前に、この献立に決定してください"
          : "献立を決めると、必要な食材と使う料理がここにまとまります",
      );
      return;
    }
    moveTo(target);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "initialSetup":
        return (
          <InitialSetup
            profile={profile}
            onProfileChange={setProfile}
            onComplete={(next) => {
              const normalised = normaliseProfile(next);
              setProfile(normalised);
              setInventory(normalised.fridge);
              moveTo("mealSuggestion");
            }}
            onSkip={() => moveTo("mealSuggestion")}
          />
        );
      case "conditionInput":
        return (
          <ConditionInput
            conditions={conditions}
            onConditionsChange={setConditions}
            onCreatePlan={createPlan}
            onBack={() => moveTo("mealSuggestion")}
          />
        );
      case "mealSuggestion":
        return (
          <MealSuggestion
            plan={activePlan}
            onCreatePlan={() => moveTo("conditionInput")}
            onEditConditions={() => moveTo("conditionInput")}
            onChangeMeal={(slot) => {
              setEditingSlot(slot);
              moveTo("mealChange");
            }}
            onConfirmPlan={() => {
              setPlanConfirmed(true);
              moveTo("shoppingList");
            }}
            onBack={activePlan ? () => moveTo("conditionInput") : undefined}
          />
        );
      case "mealChange":
        return (
          <MealChange
            candidates={mealChangeCandidates}
            currentRecipeId={editingSlot?.recipeId}
            editingSlot={editingSlot}
            excludedIngredientIds={blockedIngredientIdsForProfile(profile)}
            maxCookTime={conditions.cookTime}
            selectedRecipeId={editingSlot?.recipeId}
            onSelectRecipe={replaceMeal}
            onBack={() => moveTo("mealSuggestion")}
          />
        );
      case "shoppingList":
        return (
          <ShoppingList
            groups={visibleShoppingGroups}
            plan={activePlan}
            planConfirmed={planConfirmed}
            unavailableIngredientId={shoppingUnavailableIngredientId}
            checkedItems={checkedItems}
            onToggleItem={toggleShoppingItem}
            onUnavailableIngredient={(id) => {
              const nextId = id ?? shoppingUnavailableIngredientId;
              setUnavailableIngredientId(nextId);
              setSelectedSubstituteId(
                rankSubstituteCandidates(nextId, conditions, blockedIngredientIdsForProfile(profile))[0]?.ingredientId ?? "",
              );
              moveTo("unavailableIngredient");
            }}
            onReceiptScan={() => moveTo("receiptScan")}
            onViewRecipes={() => {
              setSelectedRecipeId(firstRecipeId(activePlan));
              moveTo("recipeConfirm");
            }}
            onBack={() => moveTo("mealSuggestion")}
          />
        );
      case "unavailableIngredient":
        return (
          <UnavailableIngredient
            ingredientId={unavailableIngredientId}
            scenario={{
              ingredientId: unavailableIngredientId,
              usages: unavailableShoppingItem?.usedIn ?? [],
              reason: "売り切れ、または予算より高かった場合を想定しています。",
              message: "条件に近い代替食材を選ぶか、この食材を使わない献立に組み直せます。",
            }}
            onSuggestSubstitute={() => moveTo("substituteSuggestion")}
            onRecreatePlan={() => moveTo("reMealSuggestion")}
            onBack={() => moveTo("shoppingList")}
          />
        );
      case "substituteSuggestion":
        return (
          <SubstituteSuggestion
            candidates={smartSubstituteCandidates}
            originalIngredientId={unavailableIngredientId}
            selectedSubstituteId={selectedSubstituteId}
            onSelectSubstitute={(id) => setSelectedSubstituteId(id)}
            onConfirmSubstitute={confirmSubstitute}
            onBack={() => moveTo("unavailableIngredient")}
          />
        );
      case "reMealSuggestion":
        return (
          <ReMealSuggestion
            mealPlan={reSuggestedPlan}
            suggestedMeals={reSuggestionPreviewMeals}
            removedIngredient={ingredientMap[unavailableIngredientId]?.name ?? "鶏むね肉"}
            priorities={reSuggestedPlan?.appliedPriorities}
            maxCookTime={conditions.cookTime}
            onConfirm={confirmReplannedMenu}
            onBack={() => moveTo("unavailableIngredient")}
          />
        );
      case "receiptScan":
        return (
          <ReceiptScan
            items={receiptScannedItems}
            hasScanned={hasScannedReceipt}
            onScan={() => setHasScannedReceipt(true)}
            onRegister={registerReceipt}
            onBack={() => moveTo("shoppingList")}
          />
        );
      case "recipeConfirm":
        return (
          <RecipeConfirm
            recipe={cookingRecipe}
            servings={servings}
            tasteNote={tasteNote}
            onServingsChange={setServings}
            onTasteNoteChange={setTasteNote}
            onStart={(payload) => {
              setConfirmedCookingRecipe(payload?.recipe ?? cookingRecipe);
              setCookingStep(0);
              moveTo("cooking");
            }}
            onBack={() => moveTo("shoppingList")}
          />
        );
      case "cooking":
        return (
          <Cooking
            recipe={confirmedCookingRecipe ?? cookingRecipe}
            currentStep={cookingStep}
            tasteNote={tasteNote}
            onNext={setCookingStep}
            onComplete={() => moveTo("feedback")}
            onBack={() => moveTo("recipeConfirm")}
          />
        );
      case "feedback":
        return (
          <Feedback
            selectedFeedback={selectedFeedback}
            freeText={feedbackNote}
            isSubmitted={feedbackSubmitted}
            onToggle={toggleFeedback}
            onFreeTextChange={setFeedbackNote}
            onSubmit={submitFeedback}
            onBack={() => moveTo("recipeConfirm")}
          />
        );
      case "settings":
        return (
          <Settings
            profile={profile}
            budget={Number(profile.monthlyBudget) || 0}
            fridgeItems={inventory}
            allergies={listValues(profile.allergies).map((value) => (
              allergenOptions.find((option) => option.value === value)?.label ?? value
            ))}
            dislikes={listValues(profile.dislikes)}
            tastePreferences={listValues(profile.tastePreferences ?? ["さっぱり", "やや薄味"])}
            goals={listValues(profile.goals)}
            onEdit={openSetting}
            onBack={() => moveTo("mealSuggestion")}
          />
        );
      default:
        return null;
    }
  };

  const showNav = !["initialSetup", "recipeConfirm", "cooking", "feedback"].includes(currentScreen);

  return (
    <main className="prototype-page">
      <PhoneFrame>
        <div className="app-content" ref={appContentRef}>
          {notice && (
            <div className="app-toast" role="status">
              <span aria-hidden="true">✓</span>
              <span>{notice}</span>
              <button type="button" onClick={() => setNotice("")} aria-label="通知を閉じる">×</button>
            </div>
          )}
          {personalizationApplied && currentScreen === "mealSuggestion" && (
            <div className="personalization-ribbon">
              <span aria-hidden="true">✨</span>
              {personalizationMessage}
            </div>
          )}
          {renderScreen()}
        </div>
        {showNav && (
          <BottomNav
            items={bottomNavItems}
            activeId={navIdForScreen(currentScreen)}
            activeItem={navIdForScreen(currentScreen)}
            onChange={onNavChange}
            onNavigate={onNavChange}
          />
        )}
        {editingSetting && (
          <div className="setting-sheet-backdrop" role="presentation" onMouseDown={closeSetting}>
            <section
              className="setting-sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby="setting-sheet-title"
              ref={settingDialogRef}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="setting-sheet__handle" aria-hidden="true" />
              <p className="eyebrow">設定を編集</p>
              <h2 id="setting-sheet-title">{settingLabels[editingSetting]}</h2>
              {editingSetting === "allergies" ? (
                <fieldset className="form-field choice-field">
                  <legend className="form-label">該当する食材を選択</legend>
                  <div className="choice-grid">
                    {settingAllergyOptions.map((option) => {
                      const checked = settingSelection.includes(option.value);
                      return (
                        <label className={`choice-chip${checked ? " is-selected" : ""}`} key={option.value}>
                          <input
                            checked={checked}
                            name="setting-allergies"
                            onChange={() => {
                              setSettingSelection((previous) => (
                                checked
                                  ? previous.filter((value) => value !== option.value)
                                  : [...previous, option.value]
                              ));
                            }}
                            type="checkbox"
                            value={option.value}
                          />
                          <span>{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="form-help">選んだ食材を含む料理は、次回の献立候補から外します。</p>
                </fieldset>
              ) : (
                <>
                  <p>カンマまたは「、」で区切って入力できます。</p>
                  <label className="field">
                    <span className="form-label">新しい内容</span>
                    <input
                      autoFocus
                      type={editingSetting === "budget" ? "number" : "text"}
                      value={settingDraft}
                      onChange={(event) => setSettingDraft(event.target.value)}
                    />
                  </label>
                </>
              )}
              <div className="setting-sheet__actions">
                <button className="button button--secondary" type="button" onClick={closeSetting}>
                  キャンセル
                </button>
                <button className="button button--primary" type="button" onClick={saveSetting}>
                  保存する
                </button>
              </div>
            </section>
          </div>
        )}
      </PhoneFrame>
    </main>
  );
}
