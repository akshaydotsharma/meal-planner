"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { ShoppingList } from "@/lib/schemas";

const CATEGORY_CONFIG = {
  produce: {
    label: "Produce",
    icon: "🥬",
    color: "bg-[#E8F5E9] text-[#2E7D32] border-[#A5D6A7]",
  },
  protein: {
    label: "Protein",
    icon: "🥩",
    color: "bg-[#FFEBEE] text-[#C62828] border-[#EF9A9A]",
  },
  dairy: {
    label: "Dairy",
    icon: "🧀",
    color: "bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]",
  },
  pantry: {
    label: "Pantry",
    icon: "🥫",
    color: "bg-[#FFF3E0] text-[#E65100] border-[#FFCC80]",
  },
  spices: {
    label: "Spices",
    icon: "🌶️",
    color: "bg-[#FCE4EC] text-[#C2185B] border-[#F48FB1]",
  },
};

export default function ShoppingListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [planId, setPlanId] = useState<string>("");
  const [list, setList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { id } = await params;
      setPlanId(id);
      await fetchList(id);
    };
    init();
  }, [params]);

  const fetchList = async (id: string) => {
    try {
      const res = await fetch(`/api/plans/${id}/shopping-list`);
      if (res.ok) {
        const data = await res.json();
        setList(data.list);
      } else if (res.status === 404) {
        // No list yet, that's ok
        setList(null);
      } else {
        throw new Error("Failed to load shopping list");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const generateList = async () => {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/plans/${planId}/shopping-list`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate list");
      }

      const data = await res.json();
      setList(data.list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  const toggleItem = (category: string, item: string) => {
    const key = `${category}:${item}`;
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const exportAsText = () => {
    if (!list) return;

    const lines: string[] = ["SHOPPING LIST", "=".repeat(40), ""];

    (Object.keys(CATEGORY_CONFIG) as (keyof typeof CATEGORY_CONFIG)[]).forEach(
      (category) => {
        const items = list[category];
        if (items && items.length > 0) {
          lines.push(
            `${CATEGORY_CONFIG[category].icon} ${CATEGORY_CONFIG[category].label.toUpperCase()}`
          );
          items.forEach((item) => {
            const key = `${category}:${item}`;
            const checked = checkedItems.has(key);
            lines.push(`  ${checked ? "[x]" : "[ ]"} ${item}`);
          });
          lines.push("");
        }
      }
    );

    const text = lines.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shopping-list.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsJSON = () => {
    if (!list) return;

    const data = {
      ...list,
      checkedItems: Array.from(checkedItems),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shopping-list.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    if (!list) return;

    const lines: string[] = [];

    (Object.keys(CATEGORY_CONFIG) as (keyof typeof CATEGORY_CONFIG)[]).forEach(
      (category) => {
        const items = list[category];
        if (items && items.length > 0) {
          lines.push(`${CATEGORY_CONFIG[category].label}:`);
          items.forEach((item) => lines.push(`• ${item}`));
          lines.push("");
        }
      }
    );

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = lines.join("\n");
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const totalItems = list
    ? Object.values(list).reduce((sum, items) => sum + items.length, 0)
    : 0;

  const checkedCount = checkedItems.size;

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
          <p className="mt-2 text-[#7C7269]">Loading shopping list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <Link
          href={`/plan/${planId}`}
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
          Back to Plan
        </Link>
        <h1 className="text-2xl font-bold text-[#1F1F1F]">Shopping List</h1>
        {list && (
          <p className="text-[#7C7269] text-sm mt-1">
            {checkedCount} of {totalItems} items checked
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-[#FFEBEE] text-[#C62828] px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* No List Yet */}
      {!list && !generating && (
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
            No Shopping List Yet
          </h2>
          <p className="text-[#7C7269] mb-6">
            Generate a shopping list based on your meal plan. It will
            automatically categorize ingredients and exclude items from your
            pantry.
          </p>
          <button
            onClick={generateList}
            className="px-6 py-3 bg-gradient-to-r from-[#E54D2E] to-[#D13415] hover:from-[#D13415] hover:to-[#C12D0E] text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            Generate Shopping List
          </button>
        </div>
      )}

      {/* Generating State */}
      {generating && (
        <div className="bg-white border border-[#E8E0DB] rounded-2xl p-8 text-center">
          <svg
            className="animate-spin w-8 h-8 mx-auto text-[#E54D2E] mb-4"
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
          <h2 className="text-lg font-semibold text-[#1F1F1F] mb-2">
            Generating Shopping List...
          </h2>
          <p className="text-[#7C7269]">
            Analyzing your recipes and checking your pantry
          </p>
        </div>
      )}

      {/* Shopping List */}
      {list && (
        <>
          {/* Export Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E8E0DB] rounded-xl hover:bg-[#FAF5F2] transition-colors text-sm"
            >
              {copied ? (
                <>
                  <svg
                    className="w-4 h-4 text-[#2E7D32]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
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
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy
                </>
              )}
            </button>
            <button
              onClick={exportAsText}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E8E0DB] rounded-xl hover:bg-[#FAF5F2] transition-colors text-sm"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export .txt
            </button>
            <button
              onClick={exportAsJSON}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E8E0DB] rounded-xl hover:bg-[#FAF5F2] transition-colors text-sm"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export .json
            </button>
            <button
              onClick={generateList}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E8E0DB] rounded-xl hover:bg-[#FAF5F2] transition-colors text-sm ml-auto"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Regenerate
            </button>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            {(
              Object.keys(CATEGORY_CONFIG) as (keyof typeof CATEGORY_CONFIG)[]
            ).map((category) => {
              const items = list[category];
              if (!items || items.length === 0) return null;

              const config = CATEGORY_CONFIG[category];

              return (
                <div
                  key={category}
                  className={`bg-white border rounded-2xl overflow-hidden ${config.color.split(" ")[2]}`}
                >
                  <div className={`px-4 py-3 ${config.color.split(" ").slice(0, 2).join(" ")}`}>
                    <h3 className="font-semibold flex items-center gap-2">
                      <span>{config.icon}</span>
                      {config.label}
                      <span className="text-sm font-normal opacity-75">
                        ({items.length})
                      </span>
                    </h3>
                  </div>
                  <div className="p-4">
                    <ul className="space-y-2">
                      {items.map((item, index) => {
                        const key = `${category}:${item}`;
                        const isChecked = checkedItems.has(key);

                        return (
                          <li key={index}>
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleItem(category, item)}
                                className="w-5 h-5 rounded border-[#E8E0DB] text-[#E54D2E] focus:ring-[#E54D2E]/20"
                              />
                              <span
                                className={`text-[#1F1F1F] group-hover:text-[#E54D2E] transition-colors ${
                                  isChecked ? "line-through text-[#B5ADA6]" : ""
                                }`}
                              >
                                {item}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          {totalItems > 0 && (
            <div className="bg-white border border-[#E8E0DB] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#7C7269]">Shopping Progress</span>
                <span className="text-sm font-medium text-[#1F1F1F]">
                  {checkedCount} / {totalItems}
                </span>
              </div>
              <div className="h-2 bg-[#E8E0DB] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#E54D2E] transition-all duration-300"
                  style={{ width: `${(checkedCount / totalItems) * 100}%` }}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Bottom Navigation */}
      <div className="flex gap-3 pt-4">
        <Link
          href={`/plan/${planId}`}
          className="flex-1 py-3 text-center bg-white border border-[#E8E0DB] text-[#5C544D] font-semibold rounded-xl hover:bg-[#FAF5F2] transition-all"
        >
          Back to Plan
        </Link>
        <Link
          href="/plan"
          className="flex-1 py-3 text-center bg-gradient-to-r from-[#E54D2E] to-[#D13415] hover:from-[#D13415] hover:to-[#C12D0E] text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
        >
          Create New Plan
        </Link>
      </div>
    </div>
  );
}
