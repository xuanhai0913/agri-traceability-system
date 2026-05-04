import { useState, useEffect } from "react";

export function useImagePreloader(src) {
  const [status, setStatus] = useState({
    src: "",
    isLoaded: false,
    hasError: false,
  });

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.src = src;

    img.onload = () => {
      setStatus({ src, isLoaded: true, hasError: false });
    };

    img.onerror = () => {
      setStatus({ src, isLoaded: true, hasError: true });
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  if (!src) {
    return { isLoaded: true, hasError: false };
  }

  if (status.src !== src) {
    return { isLoaded: false, hasError: false };
  }

  return {
    isLoaded: status.isLoaded,
    hasError: status.hasError,
  };
}
