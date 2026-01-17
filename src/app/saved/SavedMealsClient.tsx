"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OptionCard from "@/components/OptionCard";
import Link from "next/link";

interface SavedMeal {
  id: string;
  createdAt: string;
  optionItem: {
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
    feedback: { decision: string; reason?: string | null; reasonNote?: string | null } | null;
    savedMeal: { id: string } | null;
    sessionId: string;
  };
}

interface SavedMealsClientProps {
  meals: SavedMeal[];
}

export default function SavedMealsClient({ meals: initialMeals }: SavedMealsClientProps) {
  const router = useRouter();
  const [meals, setMeals] = useState(initialMeals);

  const handleRemove = async (savedMealId: string, optionItemId: string) => {
    try {
      const res = await fetch("/api/saved-meals", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionItemId }),
      });

      if (res.ok) {
        setMeals(meals.filter((m) => m.id !== savedMealId));
      }
    } catch (err) {
      console.error("Failed to remove saved meal:", err);
    }
  };

  if (meals.length === 0) {
    router.refresh();
    return null;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#7C7269]">
        {meals.length} saved {meals.length === 1 ? "meal" : "meals"}
      </p>
      {meals.map((saved, index) => (
        <div key={saved.id} className="relative">
          <OptionCard
            option={saved.optionItem}
            showFeedbackButtons={false}
            animationDelay={index + 1}
          />
          <div className="absolute top-4 right-4 flex gap-2">
            <Link
              href={`/sessions/${saved.optionItem.sessionId}`}
              className="p-2 bg-white/90 backdrop-blur rounded-lg border border-[#E8E0DB] text-[#7C7269] hover:text-[#E54D2E] hover:border-[#E54D2E] transition-all"
              title="View session"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
            <button
              onClick={() => handleRemove(saved.id, saved.optionItem.id)}
              className="p-2 bg-white/90 backdrop-blur rounded-lg border border-[#E8E0DB] text-[#E54D2E] hover:bg-[#FFEBEE] hover:border-[#E54D2E] transition-all"
              title="Remove from saved"
            >
              <svg className="w-4 h-4" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
