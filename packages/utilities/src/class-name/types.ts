import { KebabCase } from 'type-fest'

export type NestedClassName = string | false | null | undefined | (string | false | null | undefined)[] | NestedClassName[]
export type ClassNameStateMap = { [key: string]: string | number | boolean | null | undefined }

export interface ComponentClassNameProps {
	className?: NestedClassName;
	componentClassName?: string | string[];
}

export type ColorSchemeClassName<T extends KebabCase<string> = KebabCase<string>> = `scheme-${T}`
export type ThemeContentClassName<T extends KebabCase<string> = KebabCase<string>> = `theme-${T}-content`
export type ThemeControlsClassName<T extends KebabCase<string> = KebabCase<string>> = `theme-${T}-controls`
