import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_DAYS = 14;

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return (
    /iphone|ipad|ipod/i.test(window.navigator.userAgent) &&
    !/crios|fxios|edgios/i.test(window.navigator.userAgent)
  );
}

function recentlyDismissed(): boolean {
  const at = Number(localStorage.getItem(DISMISS_KEY));
  if (!at) return false;
  return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export function InstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      setShowIos(false);
      localStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // iOS has no beforeinstallprompt — show manual instructions instead.
    if (isIos()) setShowIos(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDeferredPrompt(null);
    setShowIos(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch {
      // prompt() throws if called in an invalid state (e.g. twice) — ignore.
    } finally {
      setDeferredPrompt(null);
    }
  };

  if (!deferredPrompt && !showIos) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] flex justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-white/10 bg-[#11141f] p-4 shadow-2xl">
        <img
          src="/logo/pwa-192x192.png"
          alt=""
          className="h-12 w-12 shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">
            {showIos ? t("installPrompt.iosTitle") : t("installPrompt.title")}
          </p>
          <p className="mt-0.5 text-xs leading-snug text-white/60">
            {showIos
              ? t("installPrompt.iosInstructions")
              : t("installPrompt.description")}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          {!showIos && (
            <button
              type="button"
              onClick={install}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#080A14] active:scale-95"
            >
              {t("installPrompt.install")}
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-white/50 active:scale-95"
          >
            {t("installPrompt.dismiss")}
          </button>
        </div>
      </div>
    </div>
  );
}