import { Intent } from '../types'

const REQUIRED_THEME_CLASS = 'cui-theme'

export const toThemeClass = <T extends string = Intent>(
	contentTheme: T | null | undefined,
	controlsTheme: T | null | undefined,
	suffix: string = '',
): string | undefined => {
	if (contentTheme === controlsTheme) {
		const both = contentTheme

		return both ? `${REQUIRED_THEME_CLASS} theme-${both}${suffix}` : undefined
	}

	return [
		REQUIRED_THEME_CLASS,
		contentTheme ? `theme-${contentTheme}-content${suffix}` : undefined,
		controlsTheme ? `theme-${controlsTheme}-controls${suffix}` : undefined,
	].filter(Boolean).join(' ')
}
