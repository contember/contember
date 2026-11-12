/** Lowercase ASCII slug: diacritics stripped, every other run of non-alphanumerics becomes one dash. */
export const slugify = (value: string): string =>
	value
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
