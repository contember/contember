export const isSlugString = (value: string): value is string => {
	return /^[a-z0-9_-]+$/.test(value)
}
