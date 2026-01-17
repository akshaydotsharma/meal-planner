"use client";

import { useState } from "react";
import Link from "next/link";

interface SessionWithDetails {
  id: string;
  createdAt: string;
  extraIngredientsText: string;
  constraintsJson: string;
  recommendationSets: {
    options: {
      title: string;
      feedback: { decision: string } | null;
    }[];
  }[];
}

interface LastAccepted {
  title: string;
  sessionId: string;
  createdAt: string;
}

interface HistoryClientProps {
  sessions: SessionWithDetails[];
  lastAccepted: LastAccepted | null;
}

type FilterType = "all" | "accepted";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getRequestSummary(session: SessionWithDetails): string {
  try {
    const constraints = JSON.parse(session.constraintsJson);
    if (constraints.chatInput) {
      return constraints.chatInput.length > 80
        ? constraints.chatInput.substring(0, 80) + "..."
        : constraints.chatInput;
    }
  } catch {
    // ignore
  }

  if (session.extraIngredientsText) {
    const items = session.extraIngredientsText.split("\n").filter(Boolean);
    return items.slice(0, 3).join(", ") + (items.length > 3 ? "..." : "");
  }

  return "No details";
}

export default function HistoryClient({ sessions, lastAccepted }: HistoryClientProps) {
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredSessions = sessions.filter((session) => {
    if (filter === "all") return true;

    // For "accepted" filter, only show sessions with at least one accepted option
    return session.recommendationSets.some((set) =>
      set.options.some((opt) => opt.feedback?.decision === "ACCEPT")
    );
  });

  const acceptedCount = sessions.filter((session) =>
    session.recommendationSets.some((set) =>
      set.options.some((opt) => opt.feedback?.decision === "ACCEPT")
    )
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1F1F1F]">Session History</h1>
          <p className="text-[#7C7269] mt-1">Browse your past meal recommendations</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/saved"
            className="inline-flex items-center gap-2 bg-white border border-[#E8E0DB] text-[#5C544D] px-4 py-2.5 rounded-xl font-medium hover:bg-[#FAF5F2] hover:border-[#E54D2E] hover:text-[#E54D2E] transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Saved
          </Link>
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
      </div>

      {/* Last Accepted Meal */}
      {lastAccepted && (
        <section className="bg-gradient-to-r from-[#E8F5E9] to-[#F1F8E9] border border-[#C8E6C9] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-full bg-[#2E7D32] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
            <h2 className="text-lg font-semibold text-[#2E7D32]">Last Accepted Meal</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-semibold text-[#1B5E20]">{lastAccepted.title}</p>
              <p className="text-sm text-[#558B2F] mt-1">{formatDate(lastAccepted.createdAt)}</p>
            </div>
            <Link
              href={`/sessions/${lastAccepted.sessionId}`}
              className="inline-flex items-center gap-1 text-[#2E7D32] hover:text-[#1B5E20] text-sm font-medium transition-colors"
            >
              View Details
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      )}

      {/* Filter Tabs */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex bg-[#F5F0ED] p-1 rounded-xl">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                filter === "all"
                  ? "bg-white text-[#1F1F1F] shadow-sm"
                  : "text-[#7C7269] hover:text-[#5C544D]"
              }`}
            >
              All Sessions
              <span className="ml-1.5 text-xs text-[#B5ADA6]">{sessions.length}</span>
            </button>
            <button
              onClick={() => setFilter("accepted")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                filter === "accepted"
                  ? "bg-white text-[#1F1F1F] shadow-sm"
                  : "text-[#7C7269] hover:text-[#5C544D]"
              }`}
            >
              Accepted Only
              <span className="ml-1.5 text-xs text-[#B5ADA6]">{acceptedCount}</span>
            </button>
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#E8E0DB] rounded-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FAF5F2] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#B5ADA6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[#7C7269] mb-4">
              {filter === "accepted" ? "No accepted meals yet" : "No sessions yet"}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[#E54D2E] hover:text-[#D13415] font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Start your first chat
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session) => {
              const hasRecommendations = session.recommendationSets.length > 0;
              const options = session.recommendationSets[0]?.options || [];
              const acceptedCount = options.filter((o) => o.feedback?.decision === "ACCEPT").length;
              const rejectedCount = options.filter((o) => o.feedback?.decision === "REJECT").length;

              return (
                <Link
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  className="block bg-white border border-[#E8E0DB] rounded-xl p-5 hover:border-[#E54D2E]/30 hover:shadow-md transition-all card-hover"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-[#1F1F1F]">{formatDate(session.createdAt)}</p>
                        {hasRecommendations && (
                          <span className="px-2 py-0.5 bg-[#FFF0ED] text-[#E54D2E] text-xs font-medium rounded-full">
                            {options.length} options
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#7C7269] mt-1 line-clamp-1">
                        {getRequestSummary(session)}
                      </p>
                      {hasRecommendations && options.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {options.slice(0, 3).map((o, i) => (
                            <span
                              key={i}
                              className="text-xs px-2.5 py-1 bg-[#FAF5F2] text-[#5C544D] rounded-lg border border-[#E8E0DB]"
                            >
                              {o.title}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      {hasRecommendations ? (
                        <div className="flex gap-2">
                          {acceptedCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#2E7D32] bg-[#E8F5E9] px-2 py-1 rounded-full">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {acceptedCount}
                            </span>
                          )}
                          {rejectedCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#C62828] bg-[#FFEBEE] px-2 py-1 rounded-full">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {rejectedCount}
                            </span>
                          )}
                          {acceptedCount === 0 && rejectedCount === 0 && (
                            <span className="text-xs text-[#B5ADA6]">No feedback</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-[#F57C00] bg-[#FFF3E0] px-2 py-1 rounded-full">
                          Pending
                        </span>
                      )}
                      <svg className="w-5 h-5 text-[#B5ADA6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
