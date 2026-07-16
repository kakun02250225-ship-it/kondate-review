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
  bottomNavItems,
  feedbackOptions,
  ingredients,
  mealPlans,
  receiptItems,
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
  budget: "3000",
  nutrients: ["たんぱく質", "バランス"],
  cookTime: 30,
  constraints: ["洗い物を減らしたい", "冷蔵庫の食材を使いたい"],
  exercise: "筋トレ",
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
  lunch: ["recipe-5", "recipe-2", "recipe-6"],
  dinner: ["recipe-1", "recipe-3", "recipe-4"],
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

function normaliseProfile(value) {
  return {
    ...value,
    name: typeof value?.name === "string" && value.name.trim() ? value.name.trim() : "user",
    allergies: normaliseIngredientIds(value?.allergies),
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

function safeRecipeFor(mealType, blockedIngredientIds, preferredIds = []) {
  const preferredRecipe = preferredIds
    .map((id) => recipes.find((recipe) => recipe.id === id))
    .find((recipe) => (
      recipe
      && supportsMealType(recipe, mealType)
      && !recipeHasIngredients(recipe, blockedIngredientIds)
    ));
  if (preferredRecipe) return preferredRecipe.id;

  return recipes.find((recipe) => (
    supportsMealType(recipe, mealType)
    && !recipeHasIngredients(recipe, blockedIngredientIds)
  ))?.id ?? preferredIds[0] ?? recipes[0]?.id;
}

function applyAllergyExclusions(plan, blockedIngredientIds) {
  if (!plan || blockedIngredientIds.length === 0) return plan;
  const nextPlan = clone(plan);
  daysFromPlan(nextPlan).forEach((day) => {
    Object.entries(day?.meals ?? {}).forEach(([mealType, recipeId]) => {
      const recipe = recipes.find((item) => item.id === recipeId);
      if (!recipeHasIngredients(recipe, blockedIngredientIds)) return;
      day.meals[mealType] = safeRecipeFor(mealType, blockedIngredientIds, planRecipes[mealType]);
    });
  });
  const allergyNames = blockedIngredientIds
    .map((id) => ingredients.find((ingredient) => ingredient.id === id)?.name)
    .filter(Boolean);
  nextPlan.excludedAllergyIngredientIds = blockedIngredientIds;
  nextPlan.allergyNote = allergyNames.length
    ? `アレルギー食材（${allergyNames.join("、")}）を含む料理は外しています。`
    : "アレルギー食材を含む料理は外しています。";
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

function buildPlan(conditions, profile) {
  const duration = conditions?.duration ?? `${conditions?.days ?? 3}days`;
  const mealType = conditions?.mealType ?? "dinner";
  const blockedIngredientIds = normaliseIngredientIds(profile?.allergies);

  if (duration === "meal") {
    const recipeId = safeRecipeFor(mealType, blockedIngredientIds, planRecipes[mealType] ?? planRecipes.dinner);
    return applyAllergyExclusions({
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
    }, blockedIngredientIds);
  }

  if (duration === "1day" || Number(conditions?.days) === 1) {
    return applyAllergyExclusions({
      ...clone(mealPlans.oneDay),
      title: "1日分の献立",
      label: "1日分",
      mealSlots: ["breakfast", "lunch", "dinner"],
    }, blockedIngredientIds);
  }

  if (duration === "7days" || Number(conditions?.days) === 7) {
    const baseDays = daysFromPlan(mealPlans.threeDay);
    return applyAllergyExclusions({
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
    }, blockedIngredientIds);
  }

  return applyAllergyExclusions({
    ...clone(mealPlans.threeDay),
    title: "3日分の献立",
    label: "3日分",
    mealSlots: ["breakfast", "lunch", "dinner"],
  }, blockedIngredientIds);
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
    .map((value) => ingredients.find((ingredient) => ingredient.id === value)?.name ?? value)
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
  goals: "食事の目的",
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
  const [selectedFeedback, setSelectedFeedback] = useState([]);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [personalizationApplied, setPersonalizationApplied] = useState(false);
  const [notice, setNotice] = useState("");
  const [editingSetting, setEditingSetting] = useState(null);
  const [settingDraft, setSettingDraft] = useState("");
  const settingTriggerRef = useRef(null);
  const settingDialogRef = useRef(null);

  const recipeMap = useMemo(
    () => Object.fromEntries(recipes.map((recipe) => [recipe.id, recipe])),
    [],
  );
  const ingredientMap = useMemo(
    () => Object.fromEntries(ingredients.map((ingredient) => [ingredient.id, ingredient])),
    [],
  );

  const selectedRecipe = recipeMap[selectedRecipeId] ?? recipeMap[firstRecipeId(activePlan)] ?? recipes[0];

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
          const current = required.get(item.ingredientId) ?? {
            amount: item.amount,
            name: item.name,
            usedIn: new Set(),
          };
          current.usedIn.add(`${day.label ?? `${dayIndex + 1}日目`}・${cleanMealLabels[mealType] ?? mealType}`);
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
        amount: base.amount ?? details.amount,
        unit: base.unit ?? "",
        usedIn: [...details.usedIn],
        canBeUnavailable: base.canBeUnavailable ?? ["chicken-breast", "salmon"].includes(originalId),
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

  const unavailableShoppingItem = useMemo(
    () => visibleShoppingGroups
      .flatMap((group) => group.items)
      .find((item) => item.ingredientId === unavailableIngredientId),
    [unavailableIngredientId, visibleShoppingGroups],
  );

  const reSuggestedPlan = useMemo(() => {
    if (unavailableIngredientId === unavailableIngredientScenario?.ingredientId) {
      return mealPlans.reSuggested;
    }

    const next = clone(activePlan);
    next.id = `plan-without-${unavailableIngredientId}`;
    next.label = `${ingredientMap[unavailableIngredientId]?.name ?? "対象食材"}を使わない献立`;
    next.summary = "予算・栄養・調理時間をなるべく維持して組み直しました。";
    next.excludedIngredientIds = [unavailableIngredientId];
    daysFromPlan(next).forEach((day) => {
      Object.entries(day?.meals ?? {}).forEach(([mealType, recipeId]) => {
        const usesUnavailable = (recipeMap[recipeId]?.ingredients ?? [])
          .some((item) => item.ingredientId === unavailableIngredientId);
        if (!usesUnavailable) return;
        const replacement = recipes.find((recipe) => {
          const supportedTypes = Array.isArray(recipe.mealType) ? recipe.mealType : [recipe.mealType];
          return supportedTypes.includes(mealType)
            && !(recipe.ingredients ?? []).some((item) => item.ingredientId === unavailableIngredientId);
        });
        if (replacement) day.meals[mealType] = replacement.id;
      });
    });
    return next;
  }, [activePlan, ingredientMap, recipeMap, unavailableIngredientId]);

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
    setIngredientReplacements((previous) => {
      const next = { ...previous };
      delete next[unavailableIngredientId];
      return next;
    });
    moveTo("shoppingList", "鶏むね肉を使わない献立に組み直しました");
  };

  const registerReceipt = (items = receiptItems) => {
    const names = items
      .map((item) => (typeof item === "string" ? item : item.name ?? item.label))
      .filter(Boolean);
    const purchasedIngredientIds = new Set(
      items
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
    setNotice("次回以降の提案に好みを反映しました");
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
      setProfile((previous) => ({ ...previous, allergies: normaliseIngredientIds(values) }));
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
    if (target === "mealSuggestion" && !activePlan) {
      moveTo("conditionInput", "まず条件を入れて献立を作成してください");
      return;
    }
    if ((target === "shoppingList" || target === "recipeConfirm") && !planConfirmed) {
      moveTo(
        activePlan ? "mealSuggestion" : "conditionInput",
        activePlan ? "買い物リストを見る前に、この献立に決定してください" : "先に献立を作成してください",
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
              moveTo("conditionInput");
            }}
            onSkip={() => moveTo("conditionInput")}
          />
        );
      case "conditionInput":
        return (
          <ConditionInput
            conditions={conditions}
            onConditionsChange={setConditions}
            onCreatePlan={createPlan}
            onBack={() => moveTo(activePlan ? "mealSuggestion" : "conditionInput")}
          />
        );
      case "mealSuggestion":
        return (
          <MealSuggestion
            plan={activePlan}
            onChangeMeal={(slot) => {
              setEditingSlot(slot);
              moveTo("mealChange");
            }}
            onConfirmPlan={() => {
              setPlanConfirmed(true);
              moveTo("shoppingList");
            }}
            onBack={() => moveTo("conditionInput")}
          />
        );
      case "mealChange":
        return (
          <MealChange
            currentRecipeId={editingSlot?.recipeId}
            editingSlot={editingSlot}
            excludedIngredientIds={normaliseIngredientIds(profile.allergies)}
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
              setUnavailableIngredientId(id ?? shoppingUnavailableIngredientId);
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
            scenario={unavailableIngredientId === unavailableIngredientScenario?.ingredientId
              ? undefined
              : {
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
            onConfirm={confirmReplannedMenu}
            onBack={() => moveTo("unavailableIngredient")}
          />
        );
      case "receiptScan":
        return (
          <ReceiptScan
            items={receiptItems}
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
            onStart={() => {
              setCookingStep(0);
              moveTo("cooking");
            }}
            onBack={() => moveTo("shoppingList")}
          />
        );
      case "cooking":
        return (
          <Cooking
            recipe={cookingRecipe}
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
              ingredients.find((ingredient) => ingredient.id === value)?.name ?? value
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

  const showNav = currentScreen !== "initialSetup";

  return (
    <main className="prototype-page">
      <PhoneFrame>
        <div className="app-content">
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
