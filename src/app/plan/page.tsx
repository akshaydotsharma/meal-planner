"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CUISINE_OPTIONS } from "@/lib/schemas";

type DayOption = 3 | 5 | 7;

export default function PlanPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [days, setDays] = useState<DayOption>(5);
  const [maxCookTime, setMaxCookTime] = useState(45);
  const [diet, setDiet] = useState("");
  const [includeCuisines, setIncludeCuisines] = useState<string[]>([]);
  const [excludeCuisines, setExcludeCuisines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCuisine = (cuisine: string, type: "include" | "exclude") => {
    if (type === "include") {
      if (includeCuisines.includes(cuisine)) {
        setIncludeCuisines(includeCuisines.filter((c) => c !== cuisine));
      } else {
        setIncludeCuisines([...includeCuisines, cuisine]);
        // Remove from exclude if present
        setExcludeCuisines(excludeCuisines.filter((c) => c !== cuisine));
      }
    } else {
      if (excludeCuisines.includes(cuisine)) {
        setExcludeCuisines(excludeCuisines.filter((c) => c !== cuisine));
      } else {
        setExcludeCuisines([...excludeCuisines, cuisine]);
        // Remove from include if present
        setIncludeCuisines(includeCuisines.filter((c) => c !== cuisine));
      }
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          days,
          maxCookTime,
          diet: diet || undefined,
          includeCuisines: includeCuisines.length > 0 ? includeCuisines : undefined,
          excludeCuisines: excludeCuisines.length > 0 ? excludeCuisines : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate plan");
      }

      const data = await res.json();
      router.push(`/plan/${data.plan.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate plan");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1F1F1F]">Weekly Meal Plan</h1>
        <p className="text-[#7C7269] mt-1">
          Plan your dinners for the week with smart ingredient reuse
        </p>
      </div>

      {/* Progress */}
      <div className="flex gap-2">
        <div
          className={`flex-1 h-1.5 rounded-full ${
            step >= 1 ? "bg-[#E54D2E]" : "bg-[#E8E0DB]"
          }`}
        />
        <div
          className={`flex-1 h-1.5 rounded-full ${
            step >= 2 ? "bg-[#E54D2E]" : "bg-[#E8E0DB]"
          }`}
        />
      </div>

      {/* Step 1: Days and Time */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E8E0DB] rounded-2xl p-6 space-y-6">
            {/* Number of Days */}
            <div>
              <label className="block text-sm font-medium text-[#1F1F1F] mb-3">
                How many days?
              </label>
              <div className="flex gap-3">
                {([3, 5, 7] as DayOption[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`flex-1 py-4 rounded-xl font-semibold text-lg transition-all ${
                      days === d
                        ? "bg-[#E54D2E] text-white shadow-sm"
                        : "bg-[#FAF5F2] text-[#5C544D] hover:bg-[#F5F0ED] border border-[#E8E0DB]"
                    }`}
                  >
                    {d} days
                  </button>
                ))}
              </div>
            </div>

            {/* Max Cook Time */}
            <div>
              <label className="block text-sm font-medium text-[#1F1F1F] mb-3">
                Maximum cooking time per meal
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={15}
                  max={90}
                  step={5}
                  value={maxCookTime}
                  onChange={(e) => setMaxCookTime(Number(e.target.value))}
                  className="flex-1 h-2 bg-[#E8E0DB] rounded-full appearance-none cursor-pointer accent-[#E54D2E]"
                />
                <span className="w-24 text-center py-2 px-3 bg-[#FFF0ED] text-[#E54D2E] rounded-lg font-semibold">
                  {maxCookTime} min
                </span>
              </div>
              <div className="flex justify-between text-xs text-[#B5ADA6] mt-1">
                <span>Quick (15 min)</span>
                <span>Involved (90 min)</span>
              </div>
            </div>

            {/* Dietary Preference */}
            <div>
              <label className="block text-sm font-medium text-[#1F1F1F] mb-3">
                Dietary preference (optional)
              </label>
              <select
                value={diet}
                onChange={(e) => setDiet(e.target.value)}
                className="w-full p-3 border border-[#E8E0DB] rounded-xl bg-white text-[#1F1F1F] focus:outline-none focus:ring-2 focus:ring-[#E54D2E]/20 focus:border-[#E54D2E]"
              >
                <option value="">No restriction</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="pescatarian">Pescatarian</option>
                <option value="gluten-free">Gluten-free</option>
                <option value="dairy-free">Dairy-free</option>
                <option value="keto">Keto</option>
                <option value="low-carb">Low-carb</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full py-3 bg-gradient-to-r from-[#E54D2E] to-[#D13415] hover:from-[#D13415] hover:to-[#C12D0E] text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            Next: Cuisine Preferences
          </button>
        </div>
      )}

      {/* Step 2: Cuisines */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E8E0DB] rounded-2xl p-6 space-y-6">
            {/* Include Cuisines */}
            <div>
              <label className="block text-sm font-medium text-[#1F1F1F] mb-2">
                Include these cuisines (optional)
              </label>
              <p className="text-xs text-[#7C7269] mb-3">
                Click to select cuisines you want in your plan
              </p>
              <div className="flex flex-wrap gap-2">
                {CUISINE_OPTIONS.map((cuisine) => (
                  <button
                    key={`include-${cuisine}`}
                    onClick={() => toggleCuisine(cuisine, "include")}
                    disabled={excludeCuisines.includes(cuisine)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      includeCuisines.includes(cuisine)
                        ? "bg-[#2E7D32] text-white"
                        : excludeCuisines.includes(cuisine)
                        ? "bg-[#F5F0ED] text-[#B5ADA6] cursor-not-allowed"
                        : "bg-[#FAF5F2] text-[#5C544D] hover:bg-[#E8F5E9] hover:text-[#2E7D32] border border-[#E8E0DB]"
                    }`}
                  >
                    {includeCuisines.includes(cuisine) && "+ "}
                    {cuisine}
                  </button>
                ))}
              </div>
            </div>

            {/* Exclude Cuisines */}
            <div>
              <label className="block text-sm font-medium text-[#1F1F1F] mb-2">
                Exclude these cuisines (optional)
              </label>
              <p className="text-xs text-[#7C7269] mb-3">
                Click to select cuisines you want to avoid
              </p>
              <div className="flex flex-wrap gap-2">
                {CUISINE_OPTIONS.map((cuisine) => (
                  <button
                    key={`exclude-${cuisine}`}
                    onClick={() => toggleCuisine(cuisine, "exclude")}
                    disabled={includeCuisines.includes(cuisine)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      excludeCuisines.includes(cuisine)
                        ? "bg-[#C62828] text-white"
                        : includeCuisines.includes(cuisine)
                        ? "bg-[#F5F0ED] text-[#B5ADA6] cursor-not-allowed"
                        : "bg-[#FAF5F2] text-[#5C544D] hover:bg-[#FFEBEE] hover:text-[#C62828] border border-[#E8E0DB]"
                    }`}
                  >
                    {excludeCuisines.includes(cuisine) && "- "}
                    {cuisine}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-[#FAF5F2] border border-[#E8E0DB] rounded-xl p-4">
            <h3 className="text-sm font-medium text-[#1F1F1F] mb-2">Plan Summary</h3>
            <div className="text-sm text-[#5C544D] space-y-1">
              <p>
                <span className="text-[#7C7269]">Duration:</span> {days} days
              </p>
              <p>
                <span className="text-[#7C7269]">Max time:</span> {maxCookTime} min/meal
              </p>
              {diet && (
                <p>
                  <span className="text-[#7C7269]">Diet:</span> {diet}
                </p>
              )}
              {includeCuisines.length > 0 && (
                <p>
                  <span className="text-[#7C7269]">Include:</span>{" "}
                  {includeCuisines.join(", ")}
                </p>
              )}
              {excludeCuisines.length > 0 && (
                <p>
                  <span className="text-[#7C7269]">Exclude:</span>{" "}
                  {excludeCuisines.join(", ")}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-[#FFEBEE] text-[#C62828] px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              disabled={loading}
              className="flex-1 py-3 bg-white border border-[#E8E0DB] text-[#5C544D] font-semibold rounded-xl hover:bg-[#FAF5F2] transition-all disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-[#E54D2E] to-[#D13415] hover:from-[#D13415] hover:to-[#C12D0E] text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin w-5 h-5"
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
                  Generating Plan...
                </>
              ) : (
                <>
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Generate Plan
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Recent Plans */}
      <div className="pt-4 border-t border-[#E8E0DB]">
        <Link
          href="/plan/history"
          className="inline-flex items-center gap-2 text-[#7C7269] hover:text-[#E54D2E] text-sm font-medium transition-colors"
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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          View past plans
        </Link>
      </div>
    </div>
  );
}
