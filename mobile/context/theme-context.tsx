import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import Colors from '../constants/Colors';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  colors: typeof Colors;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  colors: Colors,
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('system');
  const systemColorScheme = useColorScheme() || 'light';
  
  // Determine the active color scheme based on theme setting
  const activeColorScheme = theme === 'system' ? systemColorScheme : theme;
  const colors = activeColorScheme === 'dark' ? Colors : Colors;

  // Listen for system color scheme changes
  useEffect(() => {
    if (theme === 'system') {
      // No need to do anything here as useColorScheme will update automatically
    }
  }, [systemColorScheme, theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
