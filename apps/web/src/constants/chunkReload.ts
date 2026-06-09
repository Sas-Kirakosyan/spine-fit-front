// sessionStorage flag used to break reload loops when recovering from a stale
// lazy-chunk reference after a redeploy. Set before a recovery reload, cleared
// once the app mounts successfully (see App.tsx).
export const CHUNK_RELOAD_KEY = "spinefit:chunk-reload";
