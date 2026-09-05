'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemePreset = 'teal' | 'navy' | 'green' | 'burgundy' | 'slate';

interface ThemeConfig {
  id: ThemePreset;
  name: string;
  accent: string;
  hover: string;
  subtle: string;
  border: string;
}

export const THEME_PRESETS: Record<ThemePreset, ThemeConfig> = {
  teal: {
    id: 'teal',
    name: 'Deep Teal',
    accent: '#0f766e',
    hover: '#0d9488',
    subtle: '#f0fdf4',
    border: '#99f6e4',
  },
  navy: {
    id: 'navy',
    name: 'Executive Navy',
    accent: '#0f365e',
    hover: '#164677',
    subtle: '#f9f9ff',
    border: '#c3c6cf',
  },
  green: {
    id: 'green',
    name: 'Forest Green',
    accent: '#166534',
    hover: '#15803d',
    subtle: '#f0fdf4',
    border: '#bbf7d0',
  },
  burgundy: {
    id: 'burgundy',
    name: 'Warm Burgundy',
    accent: '#881337',
    hover: '#9f1239',
    subtle: '#fff1f2',
    border: '#fecdd3',
  },
  slate: {
    id: 'slate',
    name: 'Slate Blue',
    accent: '#3b82f6',
    hover: '#2563eb',
    subtle: '#eff6ff',
    border: '#bfdbfe',
  },
};

interface ThemeContextType {
  activePreset: ThemePreset;
  setAccentTheme: (preset: ThemePreset) => void;
  isCollapsed: boolean;
  toggleSidebarCollapse: () => void;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [activePreset, setActivePreset] = useState<ThemePreset>('navy');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedPreset = localStorage.getItem('hr_theme_accent') as ThemePreset;
    const savedCollapsed = localStorage.getItem('hr_sidebar_collapsed') === 'true';

    if (savedPreset && THEME_PRESETS[savedPreset]) {
      applyPreset(savedPreset);
    } else {
      applyPreset('navy');
    }

    setIsCollapsed(savedCollapsed);
  }, []);

  const applyPreset = (preset: ThemePreset) => {
    setActivePreset(preset);
    const config = THEME_PRESETS[preset];
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--color-accent', config.accent);
      root.style.setProperty('--color-accent-hover', config.hover);
      root.style.setProperty('--color-accent-subtle', config.subtle);
      root.style.setProperty('--color-accent-border', config.border);
    }
  };

  const setAccentTheme = (preset: ThemePreset) => {
    applyPreset(preset);
    localStorage.setItem('hr_theme_accent', preset);
  };

  const toggleSidebarCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('hr_sidebar_collapsed', String(next));
      return next;
    });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <ThemeContext.Provider
      value={{
        activePreset,
        setAccentTheme,
        isCollapsed,
        toggleSidebarCollapse,
        isMobileMenuOpen,
        toggleMobileMenu,
        closeMobileMenu,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
