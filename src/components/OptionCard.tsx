"use client";

import { useState } from "react";
import {
  FeedbackReason,
  FeedbackReasonLabels,
  type FeedbackReasonType,
} from "@/lib/schemas";

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

interface OptionCardProps {
  option: Option;
  onFeedback?: (optionId: string, decision: string) => void;
  showFeedbackButtons?: boolean;
  animationDelay?: number;
}

export default function OptionCard({
  option,
  onFeedback,
  showFeedbackButtons = true,
  animationDelay = 0,
}: OptionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [feedbackState, setFeedbackState] = useState<string | null>(
    option.feedback?.decision || null
  );
  const [submitting, setSubmitting] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<FeedbackReasonType | null>(null);
  const [otherReasonNote, setOtherReasonNote] = useState("");
  const [isSaved, setIsSaved] = useState(!!option.savedMeal);
  const [savingBookmark, setSavingBookmark] = useState(false);

  const ingredientsUsed = JSON.parse(option.ingredientsUsedJson);
  const missingIngredients = JSON.parse(option.missingIngredientsJson);
  const steps = JSON.parse(option.stepsJson);
  const substitutions = JSON.parse(option.substitutionsJson);

  const handleFeedback = async (decision: string, reason?: FeedbackReasonType, reasonNote?: string) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          optionItemId: option.id,
          decision,
          reason: reason || undefined,
          reasonNote: reasonNote || undefined,
        }),
      });

      if (res.ok) {
        setFeedbackState(decision);
        onFeedback?.(option.id, decision);
      }
    } catch (err) {
      console.error("Failed to save feedback:", err);
    } finally {
      setSubmitting(false);
      setShowReasonModal(false);
      setPendingDecision(null);
      setSelectedReason(null);
      setOtherReasonNote("");
    }
  };

  const handleFeedbackClick = (decision: string) => {
    if (decision === "ACCEPT") {
      handleFeedback(decision);
    } else {
      setPendingDecision(decision);
      setShowReasonModal(true);
    }
  };

  const handleReasonSubmit = () => {
    if (pendingDecision) {
      handleFeedback(
        pendingDecision,
        selectedReason || undefined,
        selectedReason === FeedbackReason.OTHER ? otherReasonNote : undefined
      );
    }
  };

  const handleSkipReason = () => {
    if (pendingDecision) {
      handleFeedback(pendingDecision);
    }
  };

  const handleToggleSave = async () => {
    setSavingBookmark(true);
    try {
      const res = await fetch("/api/saved-meals", {
        method: isSaved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionItemId: option.id }),
      });

      if (res.ok) {
        setIsSaved(!isSaved);
      }
    } catch (err) {
      console.error("Failed to toggle save:", err);
    } finally {
      setSavingBookmark(false);
    }
  };

  const difficultyConfig = {
    Easy: { bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]", icon: "🟢" },
    Medium: { bg: "bg-[#FFF3E0]", text: "text-[#E65100]", icon: "🟡" },
    Hard: { bg: "bg-[#FFEBEE]", text: "text-[#C62828]", icon: "🔴" },
  }[option.difficulty] || { bg: "bg-[#F5F5F5]", text: "text-[#616161]", icon: "⚪" };

  const feedbackButtonStyle = (decision: string) => {
    const isActive = feedbackState === decision;
    const baseStyle = "px-4 py-2 rounded-xl font-medium transition-all text-sm btn-press";

    if (decision === "ACCEPT") {
      return `${baseStyle} ${
        isActive
          ? "bg-[#2E7D32] text-white shadow-sm"
          : "bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#C8E6C9]"
      }`;
    } else if (decision === "REJECT") {
      return `${baseStyle} ${
        isActive
          ? "bg-[#C62828] text-white shadow-sm"
          : "bg-[#FFEBEE] text-[#C62828] hover:bg-[#FFCDD2]"
      }`;
    } else {
      return `${baseStyle} ${
        isActive
          ? "bg-[#5C544D] text-white shadow-sm"
          : "bg-[#F5F0ED] text-[#5C544D] hover:bg-[#E8E0DB]"
      }`;
    }
  };

  const animationClass = animationDelay === 0
    ? "animate-fade-in"
    : animationDelay === 1
    ? "animate-fade-in-delay-1"
    : animationDelay === 2
    ? "animate-fade-in-delay-2"
    : "animate-fade-in-delay-3";

  return (
    <div className={`bg-white border border-[#E8E0DB] rounded-2xl shadow-sm overflow-hidden card-hover ${animationClass}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#B5ADA6] uppercase tracking-wide">
              <span className="w-5 h-5 rounded-full bg-[#FFF0ED] text-[#E54D2E] flex items-center justify-center text-xs font-bold">
                {option.idx}
              </span>
              Option
            </span>
            <h3 className="text-xl font-semibold text-[#1F1F1F] mt-1.5">
              {option.title}
            </h3>
          </div>
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1 text-sm px-3 py-1.5 bg-[#FFF8F6] text-[#E54D2E] rounded-full font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {option.timeMins} min
            </span>
            <span className={`text-sm px-3 py-1.5 rounded-full font-medium ${difficultyConfig.bg} ${difficultyConfig.text}`}>
              {option.difficulty}
            </span>
          </div>
        </div>

        {/* Why this fits */}
        <p className="text-[#5C544D] mb-5 leading-relaxed">{option.why}</p>

        {/* Ingredients Grid */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <h4 className="text-xs font-semibold text-[#7C7269] uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <span className="text-[#2E7D32]">●</span> From Pantry
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {ingredientsUsed.pantry.map((item: string, i: number) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 bg-[#FAF5F2] text-[#5C544D] rounded-lg border border-[#E8E0DB]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#7C7269] uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <span className="text-[#E54D2E]">●</span> Extra Used
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {ingredientsUsed.extra.length > 0 ? (
                ingredientsUsed.extra.map((item: string, i: number) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 bg-[#FFF0ED] text-[#E54D2E] rounded-lg border border-[#FFD9D0]"
                  >
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#B5ADA6]">None needed</span>
              )}
            </div>
          </div>
        </div>

        {/* Missing Ingredients */}
        {missingIngredients.length > 0 && (
          <div className="mb-5 p-3 bg-[#FFF8E1] rounded-xl border border-[#FFE082]">
            <h4 className="text-xs font-semibold text-[#F57C00] uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Missing Ingredients
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {missingIngredients.map((item: string, i: number) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 bg-white text-[#F57C00] rounded-lg border border-[#FFE082]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Expand/Collapse Steps */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1.5 text-[#E54D2E] hover:text-[#D13415] text-sm font-medium transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {expanded ? "Hide recipe steps" : "Show recipe steps"}
        </button>

        {/* Expanded Steps */}
        {expanded && (
          <div className="mt-5 space-y-5 pt-5 border-t border-[#F5F0ED]">
            <div>
              <h4 className="text-sm font-semibold text-[#1F1F1F] mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#FFF0ED] text-[#E54D2E] flex items-center justify-center text-xs">📝</span>
                Recipe Steps
              </h4>
              <ol className="space-y-3">
                {steps.map((step: string, i: number) => (
                  <li key={i} className="flex gap-3 text-sm text-[#5C544D]">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FAF5F2] text-[#7C7269] flex items-center justify-center text-xs font-medium">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {substitutions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[#1F1F1F] mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center text-xs">🔄</span>
                  Substitutions
                </h4>
                <ul className="space-y-2">
                  {substitutions.map((sub: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm text-[#5C544D]">
                      <span className="text-[#2E7D32]">•</span>
                      {sub}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Feedback Buttons */}
      {showFeedbackButtons && (
        <div className="border-t border-[#F5F0ED] px-6 py-4 bg-[#FAFAFA]">
          <div className="flex gap-2 items-center">
            <button
              onClick={() => handleFeedbackClick("ACCEPT")}
              disabled={submitting}
              className={feedbackButtonStyle("ACCEPT")}
            >
              {feedbackState === "ACCEPT" ? "Accepted" : "Accept"}
            </button>
            <button
              onClick={() => handleFeedbackClick("REJECT")}
              disabled={submitting}
              className={feedbackButtonStyle("REJECT")}
            >
              {feedbackState === "REJECT" ? "Rejected" : "Reject"}
            </button>
            <button
              onClick={() => handleFeedbackClick("NOT_NOW")}
              disabled={submitting}
              className={feedbackButtonStyle("NOT_NOW")}
            >
              {feedbackState === "NOT_NOW" ? "Later" : "Not Now"}
            </button>
            <div className="flex-1" />
            <button
              onClick={handleToggleSave}
              disabled={savingBookmark}
              className={`p-2 rounded-xl transition-all btn-press ${
                isSaved
                  ? "bg-[#FFF0ED] text-[#E54D2E]"
                  : "bg-[#F5F0ED] text-[#7C7269] hover:bg-[#E8E0DB]"
              }`}
              title={isSaved ? "Remove from saved" : "Save meal"}
            >
              <svg
                className="w-5 h-5"
                fill={isSaved ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Feedback Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl animate-fade-in">
            <h3 className="text-lg font-semibold text-[#1F1F1F] mb-1">
              {pendingDecision === "REJECT" ? "Why not this meal?" : "Why not now?"}
            </h3>
            <p className="text-sm text-[#7C7269] mb-4">
              Help us learn your preferences (optional)
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {(Object.keys(FeedbackReason) as FeedbackReasonType[]).map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(selectedReason === reason ? null : reason)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedReason === reason
                      ? "bg-[#E54D2E] text-white"
                      : "bg-[#F5F0ED] text-[#5C544D] hover:bg-[#E8E0DB]"
                  }`}
                >
                  {FeedbackReasonLabels[reason]}
                </button>
              ))}
            </div>

            {selectedReason === FeedbackReason.OTHER && (
              <textarea
                value={otherReasonNote}
                onChange={(e) => setOtherReasonNote(e.target.value)}
                placeholder="Tell us more..."
                className="w-full p-3 border border-[#E8E0DB] rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#E54D2E]/20 focus:border-[#E54D2E] mb-4"
                rows={2}
              />
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowReasonModal(false);
                  setPendingDecision(null);
                  setSelectedReason(null);
                  setOtherReasonNote("");
                }}
                className="px-4 py-2 text-sm font-medium text-[#7C7269] hover:bg-[#F5F0ED] rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSkipReason}
                className="px-4 py-2 text-sm font-medium text-[#5C544D] bg-[#F5F0ED] hover:bg-[#E8E0DB] rounded-xl transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleReasonSubmit}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-[#E54D2E] hover:bg-[#D13415] rounded-xl transition-colors disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
