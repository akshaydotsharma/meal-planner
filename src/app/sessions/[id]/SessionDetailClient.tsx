"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OptionCard from "@/components/OptionCard";

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
  feedback?: { decision: string; reason?: string | null; reasonNote?: string | null } | null;
  savedMeal?: { id: string } | null;
}

interface RecommendationSet {
  id: string;
  createdAt: string;
  promptVersion: string;
  options: Option[];
}

interface SessionDetailClientProps {
  sessionId: string;
  recommendationSets: RecommendationSet[];
}

export default function SessionDetailClient({ sessionId, recommendationSets }: SessionDetailClientProps) {
  const router = useRouter();
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to regenerate");
      }

      // Refresh the page to show new recommendations
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate recommendations");
    } finally {
      setRegenerating(false);
    }
  };

  // Show sets in reverse chronological order (newest first)
  const sortedSets = [...recommendationSets].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header with Regenerate button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-[#1F1F1F]">Recommendations</h2>
          <span className="px-2 py-0.5 bg-[#FFF0ED] text-[#E54D2E] text-xs font-medium rounded-full">
            {recommendationSets.length} {recommendationSets.length === 1 ? "set" : "sets"}
          </span>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E8E0DB] text-[#5C544D] font-medium rounded-xl hover:bg-[#FAF5F2] hover:border-[#E54D2E] hover:text-[#E54D2E] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`}
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
          {regenerating ? "Regenerating..." : "Regenerate options"}
        </button>
      </div>

      {error && (
        <div className="bg-[#FFEBEE] text-[#C62828] px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Recommendation Sets */}
      {sortedSets.map((set, setIndex) => (
        <div key={set.id} className="space-y-4">
          {/* Set header - only show if multiple sets */}
          {recommendationSets.length > 1 && (
            <div className="flex items-center gap-2 pb-2 border-b border-[#F5F0ED]">
              <span className="text-sm font-medium text-[#7C7269]">
                {setIndex === 0 ? "Latest" : `Set ${recommendationSets.length - setIndex}`}
              </span>
              <span className="text-xs text-[#B5ADA6]">
                {new Date(set.createdAt).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
              <span className="text-xs px-2 py-0.5 bg-[#FAF5F2] text-[#7C7269] rounded">
                {set.promptVersion}
              </span>
            </div>
          )}

          {/* Options */}
          <div className="space-y-4">
            {set.options.map((option, index) => (
              <OptionCard key={option.id} option={option} animationDelay={index + 1} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
