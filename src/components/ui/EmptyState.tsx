import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37] p-10 text-center">
      {icon && <div className="mb-2 flex justify-center text-[#89918B]">{icon}</div>}
      <p className="text-base font-bold text-[#242A26] dark:text-[#F3F5F1]">{title}</p>
      <p className="mt-1 text-xs text-[#89918B] dark:text-[#9AA69E] max-w-md mx-auto">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 px-4 py-2.5 rounded-xl bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18] text-xs font-bold hover:bg-[#1D4A38] dark:hover:bg-[#96C7AC] transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
