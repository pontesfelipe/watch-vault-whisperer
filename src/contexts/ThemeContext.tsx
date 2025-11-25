import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const darkTheme = {
  background: "222 36% 5%",
  foreground: "210 20% 98%",
  card: "217 19% 10%",
  cardForeground: "210 20% 98%",
  popover: "217 19% 10%",
  popoverForeground: "210 20% 98%",
  primary: "36 92% 69%",
  primaryForeground: "0 0% 0%",
  secondary: "215 14% 13%",
  secondaryForeground: "210 20% 98%",
  muted: "215 14% 13%",
  mutedForeground: "220 9% 46%",
  accent: "36 92% 69%",
  accentForeground: "0 0% 0%",
  destructive: "0 84% 60%",
  destructiveForeground: "210 20% 98%",
  border: "215 16% 17%",
  input: "215 16% 17%",
  ring: "36 92% 69%",
  sidebarBackground: "222 50% 2%",
  sidebarForeground: "220 9% 46%",
  sidebarPrimary: "210 20% 98%",
  sidebarPrimaryForeground: "222 50% 2%",
  sidebarAccent: "217 19% 10%",
  sidebarAccentForeground: "210 20% 98%",
  sidebarBorder: "215 16% 17%",
  sidebarRing: "36 92% 69%",
};

const lightTheme = {
  background: "216 33% 97%",
  foreground: "215 25% 12%",
  card: "0 0% 100%",
  cardForeground: "215 25% 12%",
  popover: "0 0% 100%",
  popoverForeground: "215 25% 12%",
  primary: "215 65% 57%",
  primaryForeground: "0 0% 100%",
  secondary: "214 14% 95%",
  secondaryForeground: "215 25% 12%",
  muted: "214 14% 95%",
  mutedForeground: "215 15% 33%",
  accent: "215 65% 57%",
  accentForeground: "0 0% 100%",
  destructive: "0 72% 61%",
  destructiveForeground: "0 0% 100%",
  border: "215 15% 89%",
  input: "215 15% 89%",
  ring: "215 65% 57%",
  sidebarBackground: "0 0% 100%",
  sidebarForeground: "215 15% 33%",
  sidebarPrimary: "215 25% 12%",
  sidebarPrimaryForeground: "0 0% 100%",
  sidebarAccent: "214 100% 97%",
  sidebarAccentForeground: "215 25% 12%",
  sidebarBorder: "215 15% 89%",
  sidebarRing: "215 65% 57%",
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme");
    return (stored as Theme) || "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    const colors = theme === "dark" ? darkTheme : lightTheme;

    root.style.setProperty("--background", colors.background);
    root.style.setProperty("--foreground", colors.foreground);
    root.style.setProperty("--card", colors.card);
    root.style.setProperty("--card-foreground", colors.cardForeground);
    root.style.setProperty("--popover", colors.popover);
    root.style.setProperty("--popover-foreground", colors.popoverForeground);
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--primary-foreground", colors.primaryForeground);
    root.style.setProperty("--secondary", colors.secondary);
    root.style.setProperty("--secondary-foreground", colors.secondaryForeground);
    root.style.setProperty("--muted", colors.muted);
    root.style.setProperty("--muted-foreground", colors.mutedForeground);
    root.style.setProperty("--accent", colors.accent);
    root.style.setProperty("--accent-foreground", colors.accentForeground);
    root.style.setProperty("--destructive", colors.destructive);
    root.style.setProperty("--destructive-foreground", colors.destructiveForeground);
    root.style.setProperty("--border", colors.border);
    root.style.setProperty("--input", colors.input);
    root.style.setProperty("--ring", colors.ring);
    root.style.setProperty("--sidebar-background", colors.sidebarBackground);
    root.style.setProperty("--sidebar-foreground", colors.sidebarForeground);
    root.style.setProperty("--sidebar-primary", colors.sidebarPrimary);
    root.style.setProperty("--sidebar-primary-foreground", colors.sidebarPrimaryForeground);
    root.style.setProperty("--sidebar-accent", colors.sidebarAccent);
    root.style.setProperty("--sidebar-accent-foreground", colors.sidebarAccentForeground);
    root.style.setProperty("--sidebar-border", colors.sidebarBorder);
    root.style.setProperty("--sidebar-ring", colors.sidebarRing);

    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
