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
      className={`
        w-full
        bg-[#1A1B1E]
        border
        border-[#2A2B30]
        focus:border-[#F97316]
        outline-none
        px-4
        py-3
        rounded-2xl
        text-[#F4F4F5]
        placeholder:text-[#A1A1AA]
        transition-all
        ${className}
      `}
      {...props}
    />
  );
}

export default Input;
