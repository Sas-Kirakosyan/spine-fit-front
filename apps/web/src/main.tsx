import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import "./i18n/config";
import { initAnalytics } from "./utils/analytics";
import { CHUNK_RELOAD_KEY } from "./constants/chunkReload";

initAnalytics();

// Recover from stale chunk references after a redeploy. When a lazy import
// points at a hash that no longer exists on the server, the Vercel catch-all
// rewrite returns index.html (text/html) and the module load fails with a MIME
// error → white screen. Reload once to fetch the fresh index.html + current
// chunk hashes. A sessionStorage guard prevents an infinite reload loop if the
// freshly deployed build is genuinely broken.
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return;
  sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
