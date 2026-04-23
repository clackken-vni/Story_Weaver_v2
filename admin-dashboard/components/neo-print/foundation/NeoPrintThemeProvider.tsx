import type { ReactNode } from 'react';

interface NeoPrintThemeProviderProps {
  dark: boolean;
  children: ReactNode;
}

export function NeoPrintThemeProvider({ dark, children }: NeoPrintThemeProviderProps) {
  return (
    <div data-neo-print-theme={dark ? 'dark' : 'light'} style={{ minHeight: '100vh' }}>
      {children}
    </div>
  );
}
