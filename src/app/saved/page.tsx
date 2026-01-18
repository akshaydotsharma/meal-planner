import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SavedMealsClient from "./SavedMealsClient";

export const dynamic = 'force-dynamic';

export default async function SavedMealsPage() {
  const savedMeals = await prisma.savedMeal.findMany({
    include: {
      optionItem: {
        include: {
          feedback: true,
          recommendationSet: {
            include: {
              session: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Serialize for client component
  const serializedMeals = savedMeals.map((saved) => ({
    id: saved.id,
    createdAt: saved.createdAt.toISOString(),
    optionItem: {
      id: saved.optionItem.id,
      idx: saved.optionItem.idx,
      title: saved.optionItem.title,
      why: saved.optionItem.why,
      timeMins: saved.optionItem.timeMins,
      difficulty: saved.optionItem.difficulty,
      ingredientsUsedJson: saved.optionItem.ingredientsUsedJson,
      missingIngredientsJson: saved.optionItem.missingIngredientsJson,
      stepsJson: saved.optionItem.stepsJson,
      substitutionsJson: saved.optionItem.substitutionsJson,
      feedback: saved.optionItem.feedback,
      savedMeal: { id: saved.id },
      sessionId: saved.optionItem.recommendationSet.sessionId,
    },
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/history"
            className="w-10 h-10 rounded-xl bg-white border border-[#E8E0DB] flex items-center justify-center text-[#7C7269] hover:text-[#E54D2E] hover:border-[#E54D2E] transition-all"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#1F1F1F]">Saved Meals</h1>
            <p className="text-[#7C7269]">Your bookmarked recipes</p>
          </div>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#E54D2E] to-[#D13415] hover:from-[#D13415] hover:to-[#C12D0E] text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow-md btn-press"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </Link>
      </div>

      {/* Saved meals list */}
      {serializedMeals.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#E8E0DB] rounded-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FAF5F2] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#B5ADA6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <p className="text-[#7C7269] mb-2">No saved meals yet</p>
          <p className="text-sm text-[#B5ADA6] mb-4">
            Click the bookmark icon on any meal to save it here
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#E54D2E] hover:text-[#D13415] font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Get recommendations
          </Link>
        </div>
      ) : (
        <SavedMealsClient meals={serializedMeals} />
      )}
    </div>
  );
}
