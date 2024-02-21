export const dictFormat = (value: string, replacements: Record<string, string>) => {
	return value.replace(/\${([^}]+)}/g, (_, key) => replacements[key] || '')
}
