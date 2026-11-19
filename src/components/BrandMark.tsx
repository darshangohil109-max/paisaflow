export function BrandMark({
  size = 36,
  showWordmark = false,
  subtitle,
}: {
  size?: number;
  showWordmark?: boolean;
  subtitle?: string;
}) {
  return (
    <div className="inline-flex items-center gap-2.5 shrink-0">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Organic outer leaf */}
        <path
          d="M8 15C8 15 11.5 34.5 28.5 37.5C34.5 38.5 40 34 40 27.5C40 16 25 11 8 15Z"
          className="fill-[#245C45] dark:fill-[#83B89A]"
          fillOpacity="0.22"
        />
        <path
          d="M6 12C6 26.5 14.5 38 29.5 39.5C34.5 40 39 36.8 40.5 32.5C31 33 21.5 27.5 16.5 19.5C13.5 14.8 9.5 12.6 6 12Z"
          className="fill-[#245C45] dark:fill-[#83B89A]"
        />
        {/* Rising finance bars */}
        <rect
          x="19"
          y="22"
          width="4.5"
          height="9"
          rx="1.5"
          className="fill-[#245C45] dark:fill-[#83B89A]"
        />
        <rect
          x="26"
          y="16"
          width="4.5"
          height="15"
          rx="1.5"
          className="fill-[#245C45] dark:fill-[#83B89A]"
        />
        <rect
          x="33"
          y="10"
          width="4.5"
          height="21"
          rx="1.5"
          className="fill-[#D9B98C]"
        />
        {/* Growth trend arrow */}
        <path
          d="M17 17.5L24.5 12.5L29.5 14.5L38 7.5M38 7.5H33.5M38 7.5V12"
          className="stroke-[#245C45] dark:stroke-[#F3F5F1]"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className="text-lg font-extrabold tracking-tight text-[#242A26] dark:text-[#F3F5F1] whitespace-nowrap">
            PaisaFlow
          </span>
          {subtitle && (
            <span className="text-[11px] font-medium text-[#89918B] dark:text-[#9AA69E] mt-0.5 whitespace-nowrap">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
