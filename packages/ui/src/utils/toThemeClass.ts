import { Intent } from '../types'

export const toThemeClass = <T extends Intent>(theme?: T, suffix?: 'content' | 'controls'): string | undefined => theme && ['theme', theme, suffix].filter(Boolean).join('-')
