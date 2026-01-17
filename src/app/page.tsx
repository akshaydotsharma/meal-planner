"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import OptionCard from "@/components/OptionCard";
import Composer from "@/components/Composer";
import SuggestionChips from "@/components/SuggestionChips";
import { SkeletonCards } from "@/components/SkeletonCard";

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

interface RecommendationResult {
  id: string;
  query: string;
  options: Option[];
  sessionId: string;
}

export default function HomePage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;

    const query = input.trim();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to get recommendations");
      }

      const data = await res.json();

      setResult({
        id: Date.now().toString(),
        query,
        options: data.options,
        sessionId: data.sessionId,
      });
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleNewSearch = () => {
    setResult(null);
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="min-h-[calc(100vh-120px)]">
      {/* Hero Section */}
      <div className={`flex flex-col items-center ${result || loading ? "pt-4" : "pt-12 md:pt-20"}`}>
        <div className="w-full max-w-2xl">
          {/* Hero Content - only show when no result */}
          {!result && !loading && (
            <div className="text-center mb-8 animate-fade-in">
              {/* Animated Pizza Icon */}
              <div className="flex justify-center mb-4">
                <Image
                  src="/pizza.png"
                  alt="Pizza"
                  width={64}
                  height={64}
                  className="w-16 h-16 animate-wiggle"
                />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-[#1F1F1F] mb-4 tracking-tight">
                What are you craving<br />
                <span className="text-[#E54D2E]">today?</span>
              </h1>
              <p className="text-[#7C7269] text-sm max-w-md mx-auto">
                Describe your mood, ingredients, or constraints and get personalized meal recommendations in seconds.
              </p>
            </div>
          )}

          {/* Current Query Display - when showing results */}
          {result && (
            <div className="flex items-center justify-between mb-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FFF0ED] flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#E54D2E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs text-[#B5ADA6] uppercase tracking-wide font-medium">Your request</span>
                  <p className="text-[#1F1F1F] font-medium">
                    {result.query.length > 60 ? result.query.substring(0, 60) + "..." : result.query}
                  </p>
                </div>
              </div>
              <button
                onClick={handleNewSearch}
                className="inline-flex items-center gap-1.5 text-sm text-[#E54D2E] hover:text-[#D13415] font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New search
              </button>
            </div>
          )}

          {/* AI Composer */}
          <div className="mb-6">
            <Composer
              ref={inputRef}
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              loading={loading}
              placeholder="What are you in the mood for today?"
            />
          </div>

          {/* Suggestion Chips - only show when no result */}
          {!result && !loading && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 h-px bg-[#E8E0DB]" />
                <p className="text-sm text-[#B5ADA6]">Or try one of these</p>
                <div className="flex-1 h-px bg-[#E8E0DB]" />
              </div>
              <SuggestionChips onSelect={setInput} />

              {/* Quick Links */}
              <div className="mt-10 flex justify-center gap-6 text-sm">
                <Link
                  href="/history"
                  className="inline-flex items-center gap-1.5 text-[#7C7269] hover:text-[#E54D2E] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  View history
                </Link>
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-1.5 text-[#7C7269] hover:text-[#E54D2E] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Edit pantry
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading State with Skeletons */}
      {loading && (
        <div className="max-w-2xl mx-auto mt-8 pb-8">
          <div className="flex items-center gap-3 mb-6 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-[#FFF0ED] flex items-center justify-center">
              <svg className="w-4 h-4 text-[#E54D2E] animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-medium text-[#1F1F1F]">Finding perfect meals...</span>
              <p className="text-xs text-[#B5ADA6]">Analyzing your pantry and preferences</p>
            </div>
          </div>
          <SkeletonCards />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="max-w-2xl mx-auto mt-8 animate-fade-in">
          <div className="bg-[#FFEBEE] border border-[#FFCDD2] text-[#C62828] px-5 py-4 rounded-xl flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">Something went wrong</p>
              <p className="text-sm mt-1 opacity-80">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="max-w-2xl mx-auto mt-6 pb-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-[#1F1F1F]">Your Recommendations</span>
              <span className="px-2 py-0.5 bg-[#FFF0ED] text-[#E54D2E] text-xs font-medium rounded-full">
                3 options
              </span>
            </div>
            <Link
              href={`/sessions/${result.sessionId}`}
              className="inline-flex items-center gap-1 text-sm text-[#7C7269] hover:text-[#E54D2E] transition-colors"
            >
              View details
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="space-y-4">
            {result.options.map((option, index) => (
              <OptionCard
                key={option.id}
                option={option}
                animationDelay={index + 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
