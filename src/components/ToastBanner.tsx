import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export function ToastBanner({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium transition-all ${
            t.type === 'success'
              ? 'bg-[#FFFFFF] dark:bg-[#1F2723] border-[#245C45]/30 dark:border-[#83B89A]/40 text-[#242A26] dark:text-[#F3F5F1]'
              : t.type === 'error'
                ? 'bg-[#FFFFFF] dark:bg-[#1F2723] border-red-400/50 text-red-700 dark:text-red-300'
                : 'bg-[#FFFFFF] dark:bg-[#1F2723] border-[#E8E7E0] dark:border-[#343D37] text-[#242A26] dark:text-[#F3F5F1]'
          }`}
        >
          {t.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#245C45] dark:text-[#83B89A] shrink-0" />
          ) : t.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-[#D9B98C] shrink-0" />
          )}
          <span className="flex-1 leading-snug">{t.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
            className="p-1 rounded-md text-[#89918B] hover:text-[#242A26] dark:hover:text-[#F3F5F1]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
