export function SessionListSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-label="Loading sessions">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: name + date */}
            <div className="flex flex-col gap-2">
              <div className="h-4 w-36 rounded bg-gray-200" />
              <div className="h-3 w-28 rounded bg-gray-200" />
            </div>
            {/* Right: duration + score */}
            <div className="flex gap-4">
              <div className="h-4 w-20 rounded bg-gray-200" />
              <div className="h-4 w-16 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SessionDetailSkeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-6" aria-label="Loading session details">
      {/* Header block */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="h-6 w-48 rounded bg-gray-200 mb-3" />
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <div className="h-4 w-32 rounded bg-gray-200" />
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-4 w-20 rounded bg-gray-200" />
        </div>
      </div>

      {/* Chart area block */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-40 rounded bg-gray-200 mb-4" />
        <div className="h-72 w-full rounded bg-gray-200" />
        {/* Legend placeholder */}
        <div className="mt-4 flex justify-center gap-6">
          <div className="h-3 w-20 rounded bg-gray-200" />
          <div className="h-3 w-16 rounded bg-gray-200" />
          <div className="h-3 w-14 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
