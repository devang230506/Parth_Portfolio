declare const process: any;

const getEnv = (key: string, fallback: string): string => {
  if (typeof window !== 'undefined' && (window as any).__ENV__?.[key]) {
    return (window as any).__ENV__[key];
  }
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.[key]) {
      return (import.meta as any).env[key];
    }
  } catch {}
  return fallback;
};

export const environment = {
  production: true,
  calLink: getEnv('CAL_LINK', getEnv('NEXT_PUBLIC_CAL_LINK', getEnv('VITE_CAL_LINK', 'devang-panchal-k5bhsg/30min'))),
  calNamespace: getEnv('CAL_NAMESPACE', getEnv('NEXT_PUBLIC_CAL_NAMESPACE', getEnv('VITE_CAL_NAMESPACE', '30min')))
};
