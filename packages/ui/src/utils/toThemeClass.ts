import { Intent } from '../types'

const REQUIRED_THEME_CLASS = 'cui-theme'

export const toThemeClass = <T extends string = Intent>(contentTheme: T | null | undefined, controlsTheme: T | null | undefined): string | undefined => {
  if (contentTheme === controlsTheme) {
    const both = contentTheme

    return both ? `${REQUIRED_THEME_CLASS} theme-${both}` : undefined
  }

  return [
    REQUIRED_THEME_CLASS,
    contentTheme ? `theme-${contentTheme}-content` : undefined,
    controlsTheme ? `theme-${controlsTheme}-controls` : undefined,
  ].filter(Boolean).join(' ')
}
