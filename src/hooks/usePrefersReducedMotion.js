import React from 'react';

const PREFERS_REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const getInitialState = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia(PREFERS_REDUCED_MOTION_QUERY).matches;
};

export const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(getInitialState);

  React.useEffect(() => {
    const mediaQueryList = window.matchMedia(PREFERS_REDUCED_MOTION_QUERY);
    const listener = (event) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQueryList.addEventListener('change', listener);
    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, []);

  return prefersReducedMotion;
};
