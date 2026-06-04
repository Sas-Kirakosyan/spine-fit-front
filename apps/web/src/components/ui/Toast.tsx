interface ToastProps {
  message: string;
  variant: "success" | "error";
}

/**
 * Presentational toast rendered once at the App root (above renderPage()), so a
 * message triggered before navigation stays visible on the destination page.
 * z-[60] keeps it above the z-50 BottomNav and the plan-generating loader.
 */
export function Toast({ message, variant }: ToastProps) {
  const color = variant === "error" ? "bg-red-600" : "bg-green-600";
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 left-1/2 z-[60] max-w-[92vw] -translate-x-1/2 rounded-xl px-5 py-2.5 text-center text-sm font-semibold text-white shadow-lg ${color}`}
    >
      {message}
    </div>
  );
}
