import { useEffect, useState } from "react";
import { useThemeContext } from "@/lib/theme-provider";

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web.
 * Delegates to ThemeContext (like the native hook) so the web build respects the in-app
 * theme setting instead of falling back to the OS/browser color-scheme preference.
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const { colorScheme } = useThemeContext();

  if (hasHydrated) {
    return colorScheme;
  }

  return "light";
}
