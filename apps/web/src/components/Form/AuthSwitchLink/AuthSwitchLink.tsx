interface AuthSwitchLinkProps {
  question: string;
  linkText: string;
  onClick: () => void;
}

export function AuthSwitchLink({
  question,
  linkText,
  onClick,
}: AuthSwitchLinkProps) {
  return (
    <div className="mt-6 mb-4 text-center text-sm text-white">
      {question}{" "}
      <button
        type="button"
        onClick={onClick}
        className="font-medium text-white underline-offset-4 transition hover:underline"
      >
        {linkText}
      </button>
    </div>
  );
}
