"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { PlanInputs } from "@/lib/schemas";

interface Plan {
  id: string;
  inputsJson: string;
  createdAt: string;
  days: { id: string; dayIndex: number; recipeJson: string }[];
}

export default function PlanHistoryPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/plans");
        if (!res.ok) throw new Error("Failed to load plans");
        const data = await res.json();
        setPlans(data.plans);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const deletePlan = async (id: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;

    try {
      const res = await fetch(`/api/plans/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setPlans(plans.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
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
          <p className="mt-2 text-[#7C7269]">Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            Back
          </Link>
          <h1 className="text-2xl font-bold text-[#1F1F1F]">Past Meal Plans</h1>
          <p className="text-[#7C7269] text-sm mt-1">
            View and manage your previous plans
          </p>
        </div>

        <Link
          href="/plan"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Plan
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-[#FFEBEE] text-[#C62828] px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Empty State */}
      {plans.length === 0 && (
        <div className="bg-white border border-[#E8E0DB] rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-[#FAF5F2] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-[#7C7269]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[#1F1F1F] mb-2">
            No Plans Yet
          </h2>
          <p className="text-[#7C7269] mb-6">
            Create your first weekly meal plan to get started.
          </p>
          <Link
            href="/plan"
            className="inline-block px-6 py-3 bg-gradient-to-r from-[#E54D2E] to-[#D13415] hover:from-[#D13415] hover:to-[#C12D0E] text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            Create Your First Plan
          </Link>
        </div>
      )}

      {/* Plans List */}
      {plans.length > 0 && (
        <div className="space-y-3">
          {plans.map((plan) => {
            const inputs: PlanInputs = JSON.parse(plan.inputsJson);
            const mealTitles = plan.days
              .slice(0, 3)
              .map((d) => JSON.parse(d.recipeJson).title);

            return (
              <div
                key={plan.id}
                className="bg-white border border-[#E8E0DB] rounded-xl p-4 hover:border-[#E54D2E]/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <Link href={`/plan/${plan.id}`} className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-[#FFF0ED] text-[#E54D2E] rounded-full flex items-center justify-center font-bold">
                        {inputs.days}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#1F1F1F]">
                          {inputs.days}-Day Plan
                        </h3>
                        <p className="text-xs text-[#7C7269]">
                          {formatDate(plan.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Meal previews */}
                    <div className="ml-13 text-sm text-[#5C544D]">
                      {mealTitles.map((title, i) => (
                        <span key={i}>
                          {title}
                          {i < mealTitles.length - 1 && " • "}
                        </span>
                      ))}
                      {plan.days.length > 3 && (
                        <span className="text-[#7C7269]">
                          {" "}
                          +{plan.days.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-2 ml-13">
                      <span className="px-2 py-0.5 bg-[#FAF5F2] text-[#5C544D] rounded text-xs">
                        {inputs.maxCookTime} min max
                      </span>
                      {inputs.diet && (
                        <span className="px-2 py-0.5 bg-[#E8F5E9] text-[#2E7D32] rounded text-xs">
                          {inputs.diet}
                        </span>
                      )}
                      {inputs.includeCuisines &&
                        inputs.includeCuisines.length > 0 && (
                          <span className="px-2 py-0.5 bg-[#FFF0ED] text-[#E54D2E] rounded text-xs">
                            {inputs.includeCuisines.join(", ")}
                          </span>
                        )}
                    </div>
                  </Link>

                  <button
                    onClick={() => deletePlan(plan.id)}
                    className="p-2 text-[#7C7269] hover:text-[#C62828] hover:bg-[#FFEBEE] rounded-lg transition-colors"
                    title="Delete plan"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
