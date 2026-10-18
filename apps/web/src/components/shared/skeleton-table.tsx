'use client';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonTableProps {
  /** Number of skeleton rows to render. */
  rows?: number;
  /** Number of columns to render. */
  columns?: number;
  /** Optional height override (Tailwind height class, e.g. "h-5"). */
  cellHeight?: string;
  /** When true, renders a header row with skeleton cells too. */
  withHeader?: boolean;
  className?: string;
}

/**
 * Shared table skeleton — used by asset-table, asset-form, pages, etc.
 * Renders a configurable grid of pulsing placeholders so layouts stay
 * stable while real data is in-flight.
 */
export function SkeletonTable({
  rows = 5,
  columns = 5,
  cellHeight = 'h-5',
  withHeader = true,
  className,
}: SkeletonTableProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {withHeader && (
        <div className="flex items-center gap-2">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={`header-${i}`} className={`h-4 flex-1 ${i === columns - 1 ? 'w-1/4' : ''}`} />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex items-center gap-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`row-${rowIndex}-col-${colIndex}`}
              className={`${cellHeight} flex-1 ${colIndex === columns - 1 ? 'w-1/4' : ''}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
