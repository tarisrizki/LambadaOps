'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';

/**
 * LambadaOps ThemeProvider — wraps the app with next-themes.
 *
 * The dark-mode CSS variables already live in `globals.css` under the
 * `.dark` class selector, so this provider only controls class toggling
 * (no class, no style).  Components read the current theme via `useTheme()`.
 *
 * Design target: Linear / Stripe aesthetic — dark slate backgrounds,
 * subtle borders, never pure black.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
