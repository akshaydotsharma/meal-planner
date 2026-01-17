"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { PlanDayRecipe, PlanInputs } from "@/lib/schemas";

interface PlanDay {
  id: string;
  dayIndex: number;
  recipeJson: string;
}

interface Plan {
  id: string;
  inputsJson: string;
  createdAt: string;
  days: PlanDay[];
  reuseStrategy?: {
    sharedIngredients: string[];
    leftoversStrategy: string;
  };
}

export default function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [parsedDays, setParsedDays] = useState<PlanDayRecipe[]>([]);
  const [inputs, setInputs] = useState<PlanInputs | null>(null);
  const [loading, setLoading] = useState(true);
  const [swappingDay, setSwappingDay] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      const { id } = await params;
      try {
        const res = await fetch(`/api/plans/${id}`);
        if (!res.ok) {
          throw new Error("Plan not found");
        }
        const data = await res.json();
        setPlan(data.plan);
        setInputs(JSON.parse(data.plan.inputsJson));

        // Parse recipe data for each day
        const recipes = data.plan.days.map((day: PlanDay) =>
          JSON.parse(day.recipeJson)
        );
        setParsedDays(recipes);

        // Get reuse strategy if present in raw response
        if (data.plan.days[0]?.rawResponseJson) {
          try {
            const rawResponse = JSON.parse(data.plan.days[0].rawResponseJson);
            if (rawResponse.reuseStrategy) {
              setPlan((prev) =>
                prev ? { ...prev, reuseStrategy: rawResponse.reuseStrategy } : prev
              );
            }
          } catch {
            // Ignore parse errors for raw response
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load plan");
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [params]);

  const handleSwapDay = async (dayIndex: number) => {
    if (!plan) return;

    setSwappingDay(dayIndex);
    setError(null);

    try {
      const res = await fetch(`/api/plans/${plan.id}/swap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayIndex }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to swap day");
      }

      const data = await res.json();

      // Update the local state with the new recipe
      setParsedDays((prev) => {
        const updated = [...prev];
        updated[dayIndex] = data.recipe;
        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to swap day");
    } finally {
      setSwappingDay(null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-[#E8F5E9] text-[#2E7D32]";
      case "Medium":
        return "bg-[#FFF3E0] text-[#F57C00]";
      case "Hard":
        return "bg-[#FFEBEE] text-[#C62828]";
      default:
        return "bg-[#F5F0ED] text-[#5C544D]";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg
            className="animate-spin w-8 h-8 mx-auto text-[#E54D2E]"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="mt-2 text-[#7C7269]">Loading plan...</p>
        </div>
      </div>
    );
  }

  if (error && !plan) {
    return (
      <div className="space-y-4">
        <div className="bg-[#FFEBEE] text-[#C62828] px-4 py-3 rounded-xl">
          {error}
        </div>
        <Link
          href="/plan"
          className="inline-flex items-center gap-2 text-[#E54D2E] hover:underline"
        >
          ← Create a new plan
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/plan"
            className="inline-flex items-center gap-1 text-sm text-[#7C7269] hover:text-[#E54D2E] mb-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Plan
          </Link>
          <h1 className="text-2xl font-bold text-[#1F1F1F]">
            {inputs?.days}-Day Meal Plan
          </h1>
          <p className="text-[#7C7269] text-sm mt-1">
            {inputs?.maxCookTime} min max • {inputs?.diet || "No dietary restrictions"}
            {inputs?.includeCuisines && inputs.includeCuisines.length > 0 && (
              <> • {inputs.includeCuisines.join(", ")}</>
            )}
          </p>
        </div>

        <Link
          href={`/plan/${plan?.id}/shopping-list`}
          className="flex items-center gap-2 px-4 py-2 bg-[#E54D2E] text-white rounded-xl hover:bg-[#D13415] transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          Shopping List
        </Link>
      </div>

      {/* Reuse Strategy Banner */}
      {plan?.reuseStrategy && (
        <div className="bg-[#E8F5E9] border border-[#A5D6A7] rounded-xl p-4">
          <h3 className="font-medium text-[#2E7D32] mb-2 flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Ingredient Reuse Strategy
          </h3>
          <p className="text-sm text-[#1B5E20] mb-2">
            {plan.reuseStrategy.leftoversStrategy}
          </p>
          {plan.reuseStrategy.sharedIngredients.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {plan.reuseStrategy.sharedIngredients.map((ingredient, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-white/60 text-[#2E7D32] rounded-full text-xs"
                >
                  {ingredient}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-[#FFEBEE] text-[#C62828] px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Days Grid */}
      <div className="space-y-4">
        {parsedDays.map((recipe, index) => (
          <div
            key={index}
            className="bg-white border border-[#E8E0DB] rounded-2xl overflow-hidden"
          >
            {/* Day Header */}
            <div
              className="p-4 cursor-pointer hover:bg-[#FAF5F2] transition-colors"
              onClick={() => setExpandedDay(expandedDay === index ? null : index)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FFF0ED] text-[#E54D2E] rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1F1F1F]">{recipe.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-[#7C7269]">
                      <span>{recipe.timeMins} min</span>
                      <span>•</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(
                          recipe.difficulty
                        )}`}
                      >
                        {recipe.difficulty}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSwapDay(index);
                    }}
                    disabled={swappingDay !== null}
                    className="px-3 py-1.5 text-sm bg-[#FAF5F2] text-[#5C544D] rounded-lg hover:bg-[#E8E0DB] transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {swappingDay === index ? (
                      <>
                        <svg
                          className="animate-spin w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Swapping...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Swap
                      </>
                    )}
                  </button>

                  <svg
                    className={`w-5 h-5 text-[#7C7269] transition-transform ${
                      expandedDay === index ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Reuse Notes */}
              {recipe.reuseNotes && (
                <div className="mt-2 ml-13 text-sm text-[#2E7D32] bg-[#E8F5E9] px-3 py-1.5 rounded-lg inline-block">
                  ♻️ {recipe.reuseNotes}
                </div>
              )}
            </div>

            {/* Expanded Content */}
            {expandedDay === index && (
              <div className="border-t border-[#E8E0DB] p-4 space-y-4">
                {/* Why this recipe */}
                <div>
                  <p className="text-sm text-[#5C544D] italic">{recipe.why}</p>
                </div>

                {/* Ingredients */}
                <div>
                  <h4 className="text-sm font-medium text-[#1F1F1F] mb-2">
                    Ingredients
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[#7C7269] mb-1">From Pantry</p>
                      <ul className="text-sm text-[#5C544D] space-y-1">
                        {recipe.ingredientsUsed.pantry.map((ing, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <span className="text-[#2E7D32]">✓</span> {ing}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs text-[#7C7269] mb-1">Need to Buy</p>
                      <ul className="text-sm text-[#5C544D] space-y-1">
                        {recipe.missingIngredients.map((ing, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <span className="text-[#E54D2E]">+</span> {ing}
                          </li>
                        ))}
                        {recipe.ingredientsUsed.extra.map((ing, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <span className="text-[#E54D2E]">+</span> {ing}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Steps */}
                <div>
                  <h4 className="text-sm font-medium text-[#1F1F1F] mb-2">Steps</h4>
                  <ol className="text-sm text-[#5C544D] space-y-2">
                    {recipe.steps.map((step, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="font-medium text-[#E54D2E] shrink-0">
                          {i + 1}.
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Substitutions */}
                {recipe.substitutions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-[#1F1F1F] mb-2">
                      Substitutions
                    </h4>
                    <ul className="text-sm text-[#7C7269] space-y-1">
                      {recipe.substitutions.map((sub, i) => (
                        <li key={i}>• {sub}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="flex gap-3 pt-4">
        <Link
          href="/plan"
          className="flex-1 py-3 text-center bg-white border border-[#E8E0DB] text-[#5C544D] font-semibold rounded-xl hover:bg-[#FAF5F2] transition-all"
        >
          Create New Plan
        </Link>
        <Link
          href={`/plan/${plan?.id}/shopping-list`}
          className="flex-1 py-3 text-center bg-gradient-to-r from-[#E54D2E] to-[#D13415] hover:from-[#D13415] hover:to-[#C12D0E] text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
        >
          View Shopping List
        </Link>
      </div>
    </div>
  );
}
