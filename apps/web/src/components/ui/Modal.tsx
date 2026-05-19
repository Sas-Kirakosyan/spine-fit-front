import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Size = "sm" | "md" | "lg";

const dialogSizeClass: Record<Size, string> = {
  sm: "md:max-w-[440px]",
  md: "md:max-w-[560px]",
  lg: "md:max-w-[720px]",
};

interface BaseProps {
  isOpen: boolean;
  onClose: () => void;
  size?: Size;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
  /** Optional aria-label for the dialog itself; falls back to nothing. */
  ariaLabel?: string;
  /** When true (default) closes on Esc and overlay click. */
  dismissable?: boolean;
}

function useEscClose(isOpen: boolean, onClose: () => void, enabled: boolean) {
  useEffect(() => {
    if (!isOpen || !enabled) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose, enabled]);
}

function useLockScroll(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);
}

/**
 * Sheet: bottom-sheet on phone, centered dialog on md+.
 * Use for action sheets / multi-option pickers that originate "from the bottom" on phone.
 */
export function Sheet({
  isOpen,
  onClose,
  size = "md",
  className = "",
  bodyClassName = "",
  ariaLabel,
  dismissable = true,
  children,
}: BaseProps) {
  useEscClose(isOpen, onClose, dismissable);
  useLockScroll(isOpen);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex flex-col justify-end md:items-center md:justify-center md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={dismissable ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        className={[
          "relative z-10 w-full mx-auto max-w-[440px]",
          "bg-[#161827] text-white",
          "rounded-t-[24px] md:rounded-[20px]",
          "max-h-[90vh] flex flex-col",
          dialogSizeClass[size],
          className,
        ].join(" ")}
      >
        <div className="flex justify-center pt-3 md:hidden">
          <span className="h-1 w-10 rounded-full bg-slate-700" />
        </div>
        <div className={`flex-1 overflow-y-auto ${bodyClassName}`}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Dialog: always centered modal. Full-screen on phone, centered card on md+.
 * Use for confirmations, settings, structured content.
 */
export function Dialog({
  isOpen,
  onClose,
  size = "md",
  className = "",
  bodyClassName = "",
  ariaLabel,
  dismissable = true,
  children,
}: BaseProps) {
  useEscClose(isOpen, onClose, dismissable);
  useLockScroll(isOpen);
  const cardRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-stretch md:items-center md:justify-center md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={dismissable ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={cardRef}
        className={[
          "relative z-10 w-full bg-[#161827] text-white",
          "h-[100svh] md:h-auto md:max-h-[90vh] md:rounded-[20px]",
          "flex flex-col",
          dialogSizeClass[size],
          className,
        ].join(" ")}
      >
        <div className={`flex-1 min-h-0 overflow-y-auto ${bodyClassName}`}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Compact confirmation dialog: small centered card on all sizes (no full-screen on phone).
 * Use for short yes/no prompts (Exit workout, Reset plan, etc.).
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  className = "",
  bodyClassName = "",
  ariaLabel,
  dismissable = true,
  children,
}: Omit<BaseProps, "size">) {
  useEscClose(isOpen, onClose, dismissable);
  useLockScroll(isOpen);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={dismissable ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        className={[
          "relative z-10 w-full max-w-[420px] bg-[#161827] text-white rounded-2xl",
          className,
        ].join(" ")}
      >
        <div className={`p-5 md:p-6 ${bodyClassName}`}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
