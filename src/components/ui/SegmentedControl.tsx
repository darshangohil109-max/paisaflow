interface SegmentedOption<T extends string> {
  id: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: ReadonlyArray<SegmentedOption<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#FFFFFF] dark:bg-[#1F2723] border border-[#E8E7E0] dark:border-[#343D37]"
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
            value === opt.id
              ? 'bg-[#245C45] text-white dark:bg-[#83B89A] dark:text-[#151A18]'
              : 'text-[#89918B] dark:text-[#9AA69E] hover:text-[#242A26] dark:hover:text-[#F3F5F1]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
