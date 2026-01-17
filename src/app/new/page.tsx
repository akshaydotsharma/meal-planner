"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OptionCard from "@/components/OptionCard";
import { SkeletonCards } from "@/components/SkeletonCard";

interface Constraints {
  timeMins?: number;
  cuisineMood?: string;
  spiceLevel?: "mild" | "medium" | "spicy";
  diet?: string;
  effort?: "minimal" | "moderate" | "involved";
}

interface Option {
  id: string;
  idx: number;
  title: string;
  why: string;
  timeMins: number;
  difficulty: string;
  ingredientsUsedJson: string;
  missingIngredientsJson: string;
  stepsJson: string;
  substitutionsJson: string;
  feedback?: { decision: string } | null;
}

const stepTitles = [
  { num: 1, title: "Ingredients", desc: "What do you have?" },
  { num: 2, title: "Preferences", desc: "Any constraints?" },
  { num: 3, title: "Review", desc: "Ready to go!" },
  { num: 4, title: "Results", desc: "Your meals" },
];

export default function NewSessionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [extraIngredients, setExtraIngredients] = useState("");
  const [constraints, setConstraints] = useState<Constraints>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setStep(4);

    try {
      const sessionRes = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extraIngredientsText: extraIngredients,
          constraintsJson: constraints,
        }),
      });

      if (!sessionRes.ok) {
        throw new Error("Failed to create session");
      }

      const session = await sessionRes.json();
      setSessionId(session.id);

      const recRes = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id }),
      });

      if (!recRes.ok) {
        const errData = await recRes.json();
        throw new Error(errData.error || "Failed to generate recommendations");
      }

      const recSet = await recRes.json();
      setOptions(recSet.options);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = () => {};

  const inputClasses = "w-full px-4 py-3 border border-[#E8E0DB] rounded-xl text-[#1F1F1F] placeholder-[#B5ADA6] focus-ring";
  const selectClasses = "w-full px-4 py-3 border border-[#E8E0DB] rounded-xl text-[#1F1F1F] bg-white focus-ring";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1F1F1F]">Detailed Session</h1>
        <p className="text-[#7C7269] mt-1">Step-by-step meal planning with precise control</p>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border border-[#E8E0DB] rounded-2xl p-4">
        <div className="flex items-center justify-between">
          {stepTitles.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step >= s.num
                      ? "bg-gradient-to-br from-[#E54D2E] to-[#D13415] text-white"
                      : "bg-[#FAF5F2] text-[#B5ADA6]"
                  }`}
                >
                  {step > s.num ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    s.num
                  )}
                </div>
                <span className={`text-xs font-medium mt-1.5 ${step >= s.num ? "text-[#E54D2E]" : "text-[#B5ADA6]"}`}>
                  {s.title}
                </span>
              </div>
              {i < stepTitles.length - 1 && (
                <div
                  className={`w-16 md:w-24 h-0.5 mx-2 ${
                    step > s.num ? "bg-[#E54D2E]" : "bg-[#E8E0DB]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Extra Ingredients */}
      {step === 1 && (
        <div className="bg-white border border-[#E8E0DB] rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-[#1F1F1F] mb-1">Extra Ingredients</h2>
            <p className="text-[#7C7269]">
              What additional ingredients do you have for this session? (one per line)
            </p>
          </div>

          <textarea
            value={extraIngredients}
            onChange={(e) => setExtraIngredients(e.target.value)}
            rows={8}
            className={inputClasses}
            placeholder="chicken breast
broccoli
lemon
parmesan cheese"
          />

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#E54D2E] to-[#D13415] hover:from-[#D13415] hover:to-[#C12D0E] text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow-md btn-press"
            >
              Continue
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Constraints */}
      {step === 2 && (
        <div className="bg-white border border-[#E8E0DB] rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-[#1F1F1F] mb-1">Preferences (Optional)</h2>
            <p className="text-[#7C7269]">Set any preferences for your meal recommendations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#5C544D] mb-1.5">Max Time (minutes)</label>
              <input
                type="number"
                value={constraints.timeMins || ""}
                onChange={(e) =>
                  setConstraints({ ...constraints, timeMins: e.target.value ? parseInt(e.target.value) : undefined })
                }
                className={inputClasses}
                placeholder="30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5C544D] mb-1.5">Cuisine Mood</label>
              <input
                type="text"
                value={constraints.cuisineMood || ""}
                onChange={(e) => setConstraints({ ...constraints, cuisineMood: e.target.value || undefined })}
                className={inputClasses}
                placeholder="Italian, Asian, comfort food..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5C544D] mb-1.5">Spice Level</label>
              <select
                value={constraints.spiceLevel || ""}
                onChange={(e) =>
                  setConstraints({ ...constraints, spiceLevel: (e.target.value || undefined) as Constraints["spiceLevel"] })
                }
                className={selectClasses}
              >
                <option value="">Any</option>
                <option value="mild">Mild</option>
                <option value="medium">Medium</option>
                <option value="spicy">Spicy</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5C544D] mb-1.5">Diet</label>
              <input
                type="text"
                value={constraints.diet || ""}
                onChange={(e) => setConstraints({ ...constraints, diet: e.target.value || undefined })}
                className={inputClasses}
                placeholder="vegetarian, keto, gluten-free..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5C544D] mb-1.5">Effort Level</label>
              <select
                value={constraints.effort || ""}
                onChange={(e) =>
                  setConstraints({ ...constraints, effort: (e.target.value || undefined) as Constraints["effort"] })
                }
                className={selectClasses}
              >
                <option value="">Any</option>
                <option value="minimal">Minimal</option>
                <option value="moderate">Moderate</option>
                <option value="involved">Involved</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(1)}
              className="text-[#7C7269] hover:text-[#1F1F1F] px-4 py-2 font-medium transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#E54D2E] to-[#D13415] hover:from-[#D13415] hover:to-[#C12D0E] text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow-md btn-press"
            >
              Continue
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Generate */}
      {step === 3 && (
        <div className="bg-white border border-[#E8E0DB] rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-[#1F1F1F] mb-1">Review & Generate</h2>
            <p className="text-[#7C7269]">Ready to get your personalized meal recommendations!</p>
          </div>

          <div className="bg-[#FAF5F2] rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#7C7269] uppercase tracking-wide mb-2">Extra Ingredients</h3>
              <p className="text-[#1F1F1F]">
                {extraIngredients ? extraIngredients.split("\n").filter(Boolean).join(", ") : "None specified"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#7C7269] uppercase tracking-wide mb-2">Constraints</h3>
              <div className="flex flex-wrap gap-2">
                {constraints.timeMins && (
                  <span className="text-sm px-3 py-1.5 bg-white border border-[#E8E0DB] rounded-full text-[#5C544D]">
                    ⏱️ {constraints.timeMins} mins max
                  </span>
                )}
                {constraints.cuisineMood && (
                  <span className="text-sm px-3 py-1.5 bg-white border border-[#E8E0DB] rounded-full text-[#5C544D]">
                    🍽️ {constraints.cuisineMood}
                  </span>
                )}
                {constraints.spiceLevel && (
                  <span className="text-sm px-3 py-1.5 bg-white border border-[#E8E0DB] rounded-full text-[#5C544D]">
                    🌶️ {constraints.spiceLevel}
                  </span>
                )}
                {constraints.diet && (
                  <span className="text-sm px-3 py-1.5 bg-white border border-[#E8E0DB] rounded-full text-[#5C544D]">
                    🥗 {constraints.diet}
                  </span>
                )}
                {constraints.effort && (
                  <span className="text-sm px-3 py-1.5 bg-white border border-[#E8E0DB] rounded-full text-[#5C544D]">
                    💪 {constraints.effort} effort
                  </span>
                )}
                {!constraints.timeMins && !constraints.cuisineMood && !constraints.spiceLevel && !constraints.diet && !constraints.effort && (
                  <span className="text-sm text-[#B5ADA6]">No constraints</span>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-[#FFEBEE] border border-[#FFCDD2] text-[#C62828] px-4 py-3 rounded-xl flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(2)}
              disabled={loading}
              className="text-[#7C7269] hover:text-[#1F1F1F] px-4 py-2 font-medium transition-colors disabled:opacity-50"
            >
              ← Back
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#E54D2E] to-[#D13415] hover:from-[#D13415] hover:to-[#C12D0E] text-white px-8 py-3 rounded-xl font-medium transition-all shadow-sm hover:shadow-md btn-press disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Generate 3 Options
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Results */}
      {step === 4 && (
        <div className="space-y-6">
          {loading ? (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#FFF0ED] flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#E54D2E] animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-medium text-[#1F1F1F]">Finding perfect meals...</span>
                  <p className="text-xs text-[#B5ADA6]">Analyzing your ingredients and preferences</p>
                </div>
              </div>
              <SkeletonCards />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[#1F1F1F]">Your Recommendations</h2>
                  <p className="text-[#7C7269]">Click on a meal to see steps. Give feedback to help improve future recommendations.</p>
                </div>
                {sessionId && (
                  <button
                    onClick={() => router.push(`/sessions/${sessionId}`)}
                    className="inline-flex items-center gap-1 text-sm text-[#E54D2E] hover:text-[#D13415] font-medium transition-colors"
                  >
                    View Session
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {options.map((option, index) => (
                  <OptionCard key={option.id} option={option} onFeedback={handleFeedback} animationDelay={index + 1} />
                ))}
              </div>

              <div className="flex justify-center pt-4">
                <button
                  onClick={() => {
                    setStep(1);
                    setExtraIngredients("");
                    setConstraints({});
                    setOptions([]);
                    setSessionId(null);
                  }}
                  className="inline-flex items-center gap-2 text-[#E54D2E] hover:text-[#D13415] font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Start New Session
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
