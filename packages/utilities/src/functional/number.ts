export function number<T>(value: T, fallback: number): number {
	return typeof value === 'number' ? value : fallback
}
