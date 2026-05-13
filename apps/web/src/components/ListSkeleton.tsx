interface Props {
  rows?: number;
}

export function ListSkeleton({ rows = 5 }: Props) {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="h-[4.25rem] animate-pulse rounded-2xl border border-emerald-900/5 bg-emerald-900/10"
        />
      ))}
    </div>
  );
}
