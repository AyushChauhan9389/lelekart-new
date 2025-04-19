const tintColorLight = '#3B82F6'; // Softer Blue
const tintColorDark = '#60A5FA'; // Lighter Blue for Dark Mode

export default {
  light: {
    primary: tintColorLight, // Updated
    primaryLight: '#93C5FD', // Adjusted Light variant
    primaryDark: '#2563EB',  // Adjusted Dark variant
    secondary: '#6B7280', // Slightly darker secondary
    background: '#FFFFFF',
    surface: '#F9FAFB', // Slightly off-white surface
    card: '#FFFFFF',
    text: '#111827', // Darker text for better contrast
    textSecondary: '#6B7280', // Consistent secondary text
    border: '#E5E7EB', // Lighter border
    tint: tintColorLight,
    tabIconDefault: '#9CA3AF', // Adjusted default icon color
    tabIconSelected: tintColorLight,
    success: '#10B981', // Slightly adjusted success green
    error: '#EF4444',
    warning: '#F59E0B',
  },
  dark: {
    primary: tintColorDark, // Updated
    primaryLight: '#93C5FD', // Adjusted Light variant
    primaryDark: '#3B82F6',  // Adjusted Dark variant
    secondary: '#9CA3AF', // Lighter secondary for dark mode
    background: '#111827', // Darker background
    surface: '#1F2937', // Slightly lighter surface
    card: '#1F2937',
    text: '#F9FAFB', // Slightly off-white text
    textSecondary: '#9CA3AF', // Consistent secondary text
    border: '#374151', // Adjusted border
    tint: tintColorDark,
    tabIconDefault: '#6B7280', // Adjusted default icon color
    tabIconSelected: tintColorDark,
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
  },
};
