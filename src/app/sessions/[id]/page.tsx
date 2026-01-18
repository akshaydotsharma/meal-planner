import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SessionDetailClient from "./SessionDetailClient";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function SessionDetailPage({ params }: PageProps) {
  const { id } = await params;

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      recommendationSets: {
        include: {
          options: {
            include: {
              feedback: true,
              savedMeal: true,
            },
            orderBy: { idx: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!session) {
    notFound();
  }

  const constraints = JSON.parse(session.constraintsJson || "{}");
  const chatInput = constraints.chatInput;
  // Remove chatInput from constraints for display
  const displayConstraints = { ...constraints };
  delete displayConstraints.chatInput;
  const hasConstraints = Object.values(displayConstraints).some((v) => v);

  // Check for accepted meal across all recommendation sets
  const acceptedOption = session.recommendationSets
    .flatMap((set) => set.options)
    .find((opt) => opt.feedback?.decision === "ACCEPT");

  // Serialize dates for client component
  const serializedSets = session.recommendationSets.map((set) => ({
    ...set,
    createdAt: set.createdAt.toISOString(),
    options: set.options.map((opt) => ({
      ...opt,
      feedback: opt.feedback,
      savedMeal: opt.savedMeal,
    })),
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
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
          <h1 className="text-2xl font-bold text-[#1F1F1F]">Session Details</h1>
          <p className="text-[#7C7269]">{formatDate(session.createdAt)}</p>
        </div>
      </div>

      {/* Accepted Meal Banner */}
      {acceptedOption && (
        <div className="bg-gradient-to-r from-[#E8F5E9] to-[#C8E6C9] border border-[#A5D6A7] rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#2E7D32]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <span className="text-xs text-[#2E7D32] font-medium uppercase tracking-wide">Chosen Meal</span>
              <p className="text-[#1F1F1F] font-semibold">{acceptedOption.title}</p>
            </div>
          </div>
        </div>
      )}

      {/* Session Inputs Card */}
      <div className="bg-white border border-[#E8E0DB] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F5F0ED] bg-[#FAFAFA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF0ED] flex items-center justify-center">
              <svg className="w-5 h-5 text-[#E54D2E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[#1F1F1F]">Session Inputs</h2>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Query / Natural Language Input */}
          {chatInput && (
            <div>
              <h3 className="text-sm font-medium text-[#7C7269] mb-2">Your Request</h3>
              <p className="text-[#1F1F1F] bg-[#FAF5F2] rounded-xl px-4 py-3 border border-[#F5F0ED]">
                &ldquo;{chatInput}&rdquo;
              </p>
            </div>
          )}

          {/* Extra Ingredients - only show for non-chat sessions */}
          {!chatInput && (
            <div>
              <h3 className="text-sm font-medium text-[#7C7269] mb-2">Extra Ingredients</h3>
              {session.extraIngredientsText ? (
                <div className="flex flex-wrap gap-2">
                  {session.extraIngredientsText.split("\n").filter(Boolean).map((ingredient, i) => (
                    <span
                      key={i}
                      className="text-sm px-3 py-1.5 bg-[#FFF0ED] text-[#E54D2E] rounded-full font-medium"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[#B5ADA6] italic">None specified</p>
              )}
            </div>
          )}

          {/* Constraints */}
          <div>
            <h3 className="text-sm font-medium text-[#7C7269] mb-2">Constraints</h3>
            {hasConstraints ? (
              <div className="flex flex-wrap gap-2">
                {displayConstraints.timeMins && (
                  <span className="text-sm px-3 py-1.5 bg-[#FAF5F2] text-[#5C544D] rounded-full border border-[#E8E0DB]">
                    ⏱️ {displayConstraints.timeMins} mins max
                  </span>
                )}
                {displayConstraints.cuisineMood && (
                  <span className="text-sm px-3 py-1.5 bg-[#FAF5F2] text-[#5C544D] rounded-full border border-[#E8E0DB]">
                    🍽️ {displayConstraints.cuisineMood}
                  </span>
                )}
                {displayConstraints.spiceLevel && (
                  <span className="text-sm px-3 py-1.5 bg-[#FAF5F2] text-[#5C544D] rounded-full border border-[#E8E0DB]">
                    🌶️ {displayConstraints.spiceLevel} spice
                  </span>
                )}
                {displayConstraints.diet && (
                  <span className="text-sm px-3 py-1.5 bg-[#FAF5F2] text-[#5C544D] rounded-full border border-[#E8E0DB]">
                    🥗 {displayConstraints.diet}
                  </span>
                )}
                {displayConstraints.effort && (
                  <span className="text-sm px-3 py-1.5 bg-[#FAF5F2] text-[#5C544D] rounded-full border border-[#E8E0DB]">
                    💪 {displayConstraints.effort} effort
                  </span>
                )}
              </div>
            ) : (
              <p className="text-[#B5ADA6] italic">No constraints applied</p>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {serializedSets.length > 0 ? (
        <SessionDetailClient sessionId={session.id} recommendationSets={serializedSets} />
      ) : (
        <div className="text-center py-16 bg-white border border-[#E8E0DB] rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-[#FAF5F2] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-[#B5ADA6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-[#7C7269]">No recommendations generated yet</p>
        </div>
      )}
    </div>
  );
}
