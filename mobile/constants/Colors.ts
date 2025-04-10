const tintColorLight = 'hsl(355,79%,36%)'; // Ehgezli primary color (deep red/maroon)
const tintColorDark = 'hsl(355,79%,40%)'; // Slightly lighter for dark mode
const tintColorHover = 'hsl(355,79%,30%)'; // Darker shade for hover states

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    primary: tintColorLight,
    primaryHover: tintColorHover,
    secondary: '#f5f5f5',
    border: '#e5e5e5',
    error: '#F44336',
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    primary: tintColorDark,
    primaryHover: tintColorHover,
    secondary: '#272727',
    border: '#333333',
    error: '#F44336',
  },
};
