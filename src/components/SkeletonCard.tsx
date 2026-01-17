"use client";

export default function SkeletonCard() {
  return (
    <div className="bg-white border border-[#E8E0DB] rounded-2xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="skeleton h-3 w-16 rounded" />
          <div className="skeleton h-6 w-48 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="skeleton h-7 w-16 rounded-full" />
          <div className="skeleton h-7 w-14 rounded-full" />
        </div>
      </div>

      {/* Description */}
      <div className="skeleton h-4 w-full rounded" />
      <div className="skeleton h-4 w-3/4 rounded" />

      {/* Ingredients */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="skeleton h-4 w-20 rounded" />
          <div className="flex flex-wrap gap-1">
            <div className="skeleton h-6 w-12 rounded" />
            <div className="skeleton h-6 w-16 rounded" />
            <div className="skeleton h-6 w-10 rounded" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="skeleton h-4 w-24 rounded" />
          <div className="flex flex-wrap gap-1">
            <div className="skeleton h-6 w-14 rounded" />
            <div className="skeleton h-6 w-12 rounded" />
          </div>
        </div>
      </div>

      {/* Show steps button */}
      <div className="skeleton h-4 w-24 rounded" />

      {/* Feedback buttons */}
      <div className="border-t border-[#F5F0ED] pt-4 mt-4">
        <div className="flex gap-2">
          <div className="skeleton h-9 w-20 rounded-lg" />
          <div className="skeleton h-9 w-20 rounded-lg" />
          <div className="skeleton h-9 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonCards() {
  return (
    <div className="space-y-4">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
