export function deduplicateClassName(classNameArray: string[]): string[] {
	return [...new Set(classNameArray)]
}
