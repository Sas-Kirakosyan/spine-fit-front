interface AuthSwitchLinkProps {
  question: string;
  linkText: string;
  onClick: () => void;
  variant?: "onDark" | "onLight";
}

export function AuthSwitchLink({
  question,
  linkText,
  onClick,
  variant = "onDark",
}: AuthSwitchLinkProps) {
  const isOnLight = variant === "onLight";
  return (
    <div
      className={`mt-6 mb-4 text-center text-sm ${
        isOnLight ? "text-gray-600" : "text-white"
      }`}
    >
      {question}{" "}
      <button
        type="button"
        onClick={onClick}
        className={`font-medium underline-offset-4 transition hover:underline ${
          isOnLight ? "text-main" : "text-white"
        }`}
      >
        {linkText}
      </button>
    </div>
  );
}
