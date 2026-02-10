import { Theme, ThemeColor, ThemeMode, UserPreferences } from '@/types/user';

const LEGACY_THEME_MAP: Record<Theme, { color: ThemeColor; mode: ThemeMode }> = {
  light: { color: 'rouge', mode: 'light' },
  dark: { color: 'rouge', mode: 'dark' },
  forest: { color: 'forest', mode: 'dark' },
  rose: { color: 'rose', mode: 'dark' },
  ocean: { color: 'ocean', mode: 'dark' },
  sunset: { color: 'sunset', mode: 'dark' },
};

export function resolveThemePreferences(prefs?: UserPreferences): { color: ThemeColor; mode: ThemeMode } {
  if (prefs?.themeColor && prefs?.themeMode) {
    return { color: prefs.themeColor, mode: prefs.themeMode };
  }
  if (prefs?.theme) {
    return LEGACY_THEME_MAP[prefs.theme] ?? { color: 'rouge', mode: 'dark' };
  }
  return { color: 'rouge', mode: 'dark' };
}

export function composeLegacyTheme(color: ThemeColor, mode: ThemeMode): Theme {
  if (color === 'rouge' || color === 'neutre') return mode === 'light' ? 'light' : 'dark';
  return color;
}
