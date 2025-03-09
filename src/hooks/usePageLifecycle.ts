import { useCallback, useEffect, useRef } from "react";

const usePageLifecycle = (onChange: (pageState: string) => void) => {
  const getPageState = useCallback((): string => {
    if (document.visibilityState === 'hidden') {
      return 'hidden';
    }
    if (document.hasFocus()) {
      return 'active';
    }
    return 'passive';
  }, []);

  const state = useRef<string>(getPageState());

  // Accepts a next state and, if there's been a state change, logs the
  // change to the console. It also updates the `state` value defined above.
  const logStateChange = (nextState: string) => {
    const prevState = state.current;
    if (nextState !== prevState) {
      // console.log(`State change: ${prevState} >>> ${nextState}`);
      
      state.current = nextState;
      onChange(state.current);
    }
  };

  useEffect(() => {
    const events = [
      'pageshow',
      'focus',
      'blur',
      'visibilitychange',
      'resume'
    ];
    const listeners = events.map(() => {
      return () => logStateChange(getPageState());
    });
    const freezeHandle = () => {
      logStateChange('frozen');
    };
    const hideHandle = (event: PageTransitionEvent) => {
      logStateChange(event.persisted ? 'frozen' : 'terminated');
    };

    listeners.forEach((listener, i) => {
      window.addEventListener(events[i], listener);
    });
    window.addEventListener('freeze', freezeHandle);
    window.addEventListener('pagehide', hideHandle);

    return () => {
      listeners.forEach((listener, i) => {
        window.removeEventListener(events[i], listener);
      });
      window.removeEventListener('freeze', freezeHandle);
      window.removeEventListener('pagehide', hideHandle);
    }
  });

  return {
    getPageState,
  }
};

export default usePageLifecycle;
