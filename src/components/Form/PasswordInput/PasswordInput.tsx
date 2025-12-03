import React, { useState } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/Icons/Icons";

interface PasswordInputProps {
  label: string;
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
  className?: string;
}

export function PasswordInput({
  label,
  id,
  name,
  value,
  onChange,
  error,
  placeholder,
  className = "",
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          className={`w-full rounded-lg border px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-main focus:border-transparent transition ${
            error ? "border-red-500" : "border-gray-300"
          }`}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition hover:text-gray-600"
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
