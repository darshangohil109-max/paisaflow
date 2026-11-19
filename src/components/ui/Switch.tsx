interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
}

export function Switch({ checked, onChange, ariaLabel }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      className={`w-10 h-5 rounded-full transition-colors p-0.5 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245C45] dark:focus-visible:outline-[#83B89A] ${
        checked ? 'bg-[#245C45] dark:bg-[#83B89A]' : 'bg-[#E8E7E0] dark:bg-[#343D37]'
      }`}
    >
      <span
        className={`block w-4 h-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
