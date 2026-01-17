"use client";

interface Suggestion {
  emoji: string;
  text: string;
}

const suggestions: Suggestion[] = [
  { emoji: "🍗", text: "Quick chicken dinner" },
  { emoji: "🍝", text: "Something Italian with pasta" },
  { emoji: "🥗", text: "Healthy and light" },
  { emoji: "🌶️", text: "Spicy comfort food" },
  { emoji: "⏱️", text: "Under 20 minutes" },
  { emoji: "🥬", text: "Vegetarian tonight" },
];

interface SuggestionChipsProps {
  onSelect: (text: string) => void;
}

export default function SuggestionChips({ onSelect }: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {suggestions.map((suggestion, i) => (
        <button
          key={i}
          onClick={() => onSelect(suggestion.text)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E8E0DB] rounded-full text-sm font-medium text-[#5C544D] hover:border-[#E54D2E]/30 hover:bg-[#FFF8F6] hover:text-[#E54D2E] hover:-translate-y-0.5 hover:shadow-sm transition-all card-hover"
        >
          <span className="text-base">{suggestion.emoji}</span>
          <span>{suggestion.text}</span>
        </button>
      ))}
    </div>
  );
}
