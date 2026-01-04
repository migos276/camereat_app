import { useAppSelector } from "./useAppSelector"
import { COLORS, DARK_COLORS, getColors } from "../constants/config"
import { RootState } from "../redux/store"

export const useTheme = () => {
  const darkMode = useAppSelector((state: RootState) => state.theme.darkMode)
  const loading = useAppSelector((state: RootState) => state.theme.loading)

  const colors = getColors(darkMode)

  return {
    darkMode,
    loading,
    colors,
    // Convenience properties for common colors
    backgroundColor: colors.background,
    cardBackground: colors.card,
    textColor: colors.dark,
    textSecondaryColor: colors.gray,
    primaryColor: colors.primary,
    white: colors.white,
  }
}

