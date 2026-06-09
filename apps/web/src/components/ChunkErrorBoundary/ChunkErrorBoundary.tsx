import { Component, type ReactNode } from "react";
import { withTranslation, type WithTranslation } from "react-i18next";
import { CHUNK_RELOAD_KEY } from "@/constants/chunkReload";

interface Props extends WithTranslation {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// Safety net for failed lazy-page imports. The `vite:preloadError` handler in
// main.tsx reloads once to recover from stale chunk hashes after a redeploy;
// if that reload already happened (guard set) or the failure is otherwise
// unrecoverable, this boundary shows a manual "reload" prompt instead of a
// blank white screen.
class ChunkErrorBoundaryBase extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  handleReload = () => {
    // Clear the guard so the fresh load is allowed to reload again if needed.
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { t } = this.props;
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#080A14] px-6 text-center"
        role="alert"
      >
        <p className="text-base text-white/90">{t("common.chunkError.message")}</p>
        <button
          type="button"
          onClick={this.handleReload}
          className="rounded-xl bg-main px-6 py-3 font-semibold text-white"
        >
          {t("common.chunkError.reload")}
        </button>
      </div>
    );
  }
}

export const ChunkErrorBoundary = withTranslation()(ChunkErrorBoundaryBase);
