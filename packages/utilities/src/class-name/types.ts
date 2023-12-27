export type NestedClassName = string | false | null | undefined | (string | false | null | undefined)[] | NestedClassName[]
export type ClassNameStateMap = { [key: string]: string | number | boolean | null | undefined }

export interface ComponentClassNameProps {
	className?: NestedClassName;
	componentClassName?: string | string[];
}

export type ColorSchemeClassName = `scheme-${string}`
export type ThemeContentClassName = `theme-${string}-content`
export type ThemeControlsClassName = `theme-${string}-controls`
