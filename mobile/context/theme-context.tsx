import React, { createContext, useContext, ReactNode } from 'react';
import { ColorSchemeName } from 'react-native';

type ThemeContextType = {
  colorScheme: ColorSchemeName;
};

// Create context with light mode as default
const ThemeContext = createContext<ThemeContextType>({
  colorScheme: 'light',
});

// Custom hook to use the theme context
export function useTheme() {
  return useContext(ThemeContext);
}

// Provider component that forces light mode regardless of system settings
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Always return 'light' as the color scheme
  const colorScheme: ColorSchemeName = 'light';

  return (
    <ThemeContext.Provider value={{ colorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
