import { useEffect, useRef, useState } from "react";

const FALLBACK_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23374151'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial,sans-serif' font-size='12' fill='%239CA3AF' text-anchor='middle' dominant-baseline='middle'%3ENo img%3C/text%3E%3C/svg%3E";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
  containerClassName?: string;
  skeletonClassName?: string;
}

const swapExtension = (url: string): string | null => {
  if (/\.webp(\?|$)/i.test(url)) return url.replace(/\.webp(\?|$)/i, ".png$1");
  if (/\.png(\?|$)/i.test(url)) return url.replace(/\.png(\?|$)/i, ".webp$1");
  return null;
};

export function LazyImage({
  fallback = FALLBACK_SVG,
  containerClassName = "",
  skeletonClassName = "",
  className = "",
  onLoad,
  onError,
  src,
  alt,
  ...rest
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(
    typeof src === "string" ? src : undefined,
  );
  const [triedSwap, setTriedSwap] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setCurrentSrc(typeof src === "string" ? src : undefined);
    setLoaded(false);
    setError(false);
    setTriedSwap(false);
  }, [src]);

  // Cached images may finish loading before the React onLoad listener attaches.
  // After each render, if the <img> reports complete with non-zero dimensions,
  // mark it loaded so the opacity-0 skeleton doesn't keep it hidden.
  useEffect(() => {
    const img = imgRef.current;
    if (!img || loaded || error) return;
    if (img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  });

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {!loaded && !error && (
        <div
          className={`absolute inset-0 animate-pulse bg-slate-700/60 ${skeletonClassName}`}
        />
      )}

      <img
        ref={imgRef}
        src={error ? fallback : currentSrc}
        alt={alt}
        loading="lazy"
        className={`transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"} ${className}`}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        onError={(e) => {
          if (!triedSwap && currentSrc) {
            const swapped = swapExtension(currentSrc);
            if (swapped) {
              setTriedSwap(true);
              setCurrentSrc(swapped);
              return;
            }
          }
          if (!error) {
            setError(true);
            setLoaded(true);
          }
          onError?.(e);
        }}
        {...rest}
      />
    </div>
  );
}
