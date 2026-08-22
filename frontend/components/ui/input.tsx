import type React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  type?: string;
  placeholder: string;
  className?: string;
}

export function Input({
  type = "text",
  placeholder,
  className = "",
  ...props
}: InputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      suppressHydrationWarning
      className={`
        w-full
        bg-[#0B0B0B]
        border
        border-neutral-800
        focus:border-[#7F1D1D]
        outline-none
        px-4
        py-3
        rounded-2xl
        text-white
        placeholder:text-neutral-500
        transition-all
        ${className}
      `}
      {...props}
    />
  );
}

export default Input;
