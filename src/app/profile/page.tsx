"use client";

import { useState, useEffect } from "react";

export default function ProfilePage() {
  const [pantryText, setPantryText] = useState("");
  const [utensilsText, setUtensilsText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        setPantryText(data.pantryText || "");
        setUtensilsText(data.utensilsText || "");
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load profile:", err);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pantryText, utensilsText }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 rounded-full bg-[#FFF0ED] flex items-center justify-center mb-4">
          <svg className="w-5 h-5 text-[#E54D2E] animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <p className="text-[#7C7269]">Loading your profile...</p>
      </div>
    );
  }

  const pantryCount = pantryText.split("\n").filter(Boolean).length;
  const utensilsCount = utensilsText.split("\n").filter(Boolean).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1F1F1F]">Your Kitchen</h1>
          <p className="text-[#7C7269] mt-1">
            Manage your pantry staples and equipment for better recommendations
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all btn-press ${
            saved
              ? "bg-[#2E7D32] text-white"
              : "bg-gradient-to-r from-[#E54D2E] to-[#D13415] hover:from-[#D13415] hover:to-[#C12D0E] text-white shadow-sm hover:shadow-md"
          } disabled:opacity-60`}
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : saved ? (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Saved!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-[#FFF8F6] border border-[#FFD9D0] rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#FFF0ED] flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-[#E54D2E]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <p className="text-sm text-[#5C544D]">
            <span className="font-medium text-[#E54D2E]">Tip:</span> The more accurate your pantry list, the better meal suggestions you&apos;ll get. We prioritize using what you already have!
          </p>
        </div>
      </div>

      {/* Form Cards */}
      <div className="grid gap-6">
        {/* Pantry Card */}
        <div className="bg-white border border-[#E8E0DB] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F5F0ED] bg-[#FAFAFA]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF0ED] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#E54D2E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#1F1F1F]">Pantry Staples</h2>
                  <p className="text-sm text-[#7C7269]">Ingredients you always have on hand</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-[#FAF5F2] text-[#7C7269] text-sm font-medium rounded-full">
                {pantryCount} items
              </span>
            </div>
          </div>
          <div className="p-6">
            <textarea
              id="pantry"
              value={pantryText}
              onChange={(e) => setPantryText(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 border border-[#E8E0DB] rounded-xl text-[#1F1F1F] placeholder-[#B5ADA6] focus-ring resize-none"
              placeholder="salt
pepper
olive oil
garlic
onions
butter
flour
sugar
eggs
milk
rice
pasta"
            />
          </div>
        </div>

        {/* Utensils Card */}
        <div className="bg-white border border-[#E8E0DB] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F5F0ED] bg-[#FAFAFA]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#2E7D32]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#1F1F1F]">Kitchen Equipment</h2>
                  <p className="text-sm text-[#7C7269]">Tools and utensils you have available</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-[#FAF5F2] text-[#7C7269] text-sm font-medium rounded-full">
                {utensilsCount} items
              </span>
            </div>
          </div>
          <div className="p-6">
            <textarea
              id="utensils"
              value={utensilsText}
              onChange={(e) => setUtensilsText(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 border border-[#E8E0DB] rounded-xl text-[#1F1F1F] placeholder-[#B5ADA6] focus-ring resize-none"
              placeholder="knife
cutting board
frying pan
saucepan
pot
baking sheet
mixing bowls
spatula
whisk"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
