// Utilidades para optimización de rendimiento

export const optimizedTransitions = {
  fast: "transition-all duration-150",
  normal: "transition-all duration-200", 
  slow: "transition-all duration-300"
};

export const optimizedBlur = {
  light: "blur-sm",
  medium: "blur-md",
  heavy: "blur-xl"
};

export const optimizedBackgroundEffects = {
  minimal: "bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800",
  withEffects: `
    bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 
    relative
    before:absolute before:inset-0 before:pointer-events-none
    before:bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.1)_0%,transparent_50%),radial-gradient(circle_at_75%_75%,rgba(6,182,212,0.1)_0%,transparent_50%)]
  `
};

// Hook para detectar dispositivos de bajo rendimiento
export const usePerformanceMode = () => {
  const isLowEnd = navigator.hardwareConcurrency <= 4 || 
                   /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  return {
    isLowEnd,
    shouldReduceAnimations: isLowEnd,
    shouldReduceEffects: isLowEnd
  };
};
