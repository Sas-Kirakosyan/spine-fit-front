import { useState } from "react";

const FALLBACK_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23374151'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial,sans-serif' font-size='12' fill='%239CA3AF' text-anchor='middle' dominant-baseline='middle'%3ENo img%3C/text%3E%3C/svg%3E";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
  containerClassName?: string;
  skeletonClassName?: string;
}

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

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {!loaded && !error && (
        <div
          className={`absolute inset-0 animate-pulse bg-slate-700/60 ${skeletonClassName}`}
        />
      )}

      <img
        src={error ? fallback : src}
        alt={alt}
        loading="lazy"
        className={`transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"} ${className}`}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        onError={(e) => {
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
