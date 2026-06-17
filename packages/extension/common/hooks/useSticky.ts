import { useState, useEffect, useRef } from "preact/hooks";

export default function useSticky<T>(
  defaultState: T,
  nonDefaultStatesAndTimeouts: Map<T, number>,
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [curState, setState] = useState<T>(defaultState);

  useEffect(() => {
    if (curState === defaultState) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(
      () => {
        setState(defaultState);
        timeoutRef.current = null;
      },
      nonDefaultStatesAndTimeouts.get(curState) ?? 0,
    );

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [curState]);

  return [curState, setState] as const;
}
