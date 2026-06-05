import { useEffect, useRef, useState } from "react";

export function Counter({
  value,
  direction = "up",
}) {
  const ref = useRef(null);
  const [displayValue, setDisplayValue] = useState(direction === "down" ? value : 0);

  useEffect(() => {
    if (!ref.current) return undefined;

    let frameId = 0;
    let observer;
    const start = direction === "down" ? value : 0;
    const end = direction === "down" ? 0 : value;
    const duration = 850;

    function animate(startTime) {
      frameId = requestAnimationFrame((now) => {
        const progress = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        const nextValue = start + (end - start) * eased;
        setDisplayValue(Math.floor(nextValue));
        if (progress < 1) animate(startTime);
      });
    }

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            animate(performance.now());
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(ref.current);
    } else {
      animate(performance.now());
    }

    return () => {
      cancelAnimationFrame(frameId);
      if (observer) observer.disconnect();
    };
  }, [direction, value]);

  return (
    <span ref={ref}>
      {Intl.NumberFormat("en-US").format(displayValue)}
    </span>
  );
}
