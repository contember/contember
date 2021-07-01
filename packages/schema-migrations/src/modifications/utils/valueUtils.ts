export const changeValue =
	(from: string, to: string) =>
	(value: string): string =>
		value === from ? to : value
