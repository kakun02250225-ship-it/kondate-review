import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the meal-planning prototype", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /まいにち献立/);
  assert.match(html, /大学生のための献立サポート/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("keeps all 14 review screens and fixed-data modules", async () => {
  const [appSource, dataSource, packageSource, screenFiles] = await Promise.all([
    readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/data.js", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readdir(new URL("../src/screens/", import.meta.url)),
  ]);

  assert.deepEqual(
    screenFiles.sort(),
    [
      "ConditionInput.jsx",
      "Cooking.jsx",
      "Feedback.jsx",
      "InitialSetup.jsx",
      "MealChange.jsx",
      "MealSuggestion.jsx",
      "ReMealSuggestion.jsx",
      "ReceiptScan.jsx",
      "RecipeConfirm.jsx",
      "RecipeList.jsx",
      "Settings.jsx",
      "ShoppingList.jsx",
      "SubstituteSuggestion.jsx",
      "UnavailableIngredient.jsx",
    ],
  );

  for (const exportName of [
    "recipes",
    "ingredients",
    "mealPlans",
    "shoppingList",
    "substitutions",
    "receiptItems",
  ]) {
    assert.match(dataSource, new RegExp(`export const ${exportName}\\b`));
  }

  assert.match(appSource, /useState/);
  assert.match(appSource, /case "feedback"/);
  assert.match(appSource, /case "settings"/);
  assert.doesNotMatch(appSource, /fetch\(|axios|localStorage/);
  assert.doesNotMatch(packageSource, /react-loading-skeleton/);
});

test("provides at least eight complete fixed recipes", async () => {
  const { recipes } = await import(new URL("../src/data.js", import.meta.url));
  assert.ok(recipes.length >= 8);

  const requiredFields = [
    "id",
    "name",
    "image",
    "mealType",
    "cookingTime",
    "price",
    "kcal",
    "protein",
    "fat",
    "carb",
    "washingLevel",
    "difficulty",
    "tags",
    "reason",
    "ingredients",
    "steps",
  ];

  for (const recipe of recipes) {
    for (const field of requiredFields) {
      assert.ok(field in recipe, `${recipe.id} is missing ${field}`);
    }
  }
});
