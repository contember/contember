const genericTaggedString = (strings: TemplateStringsArray, ...values: string[]) => {
	return strings.reduce((combined, string, i) => {
		return combined + string + (i < values.length ? values[i] : '')
	}, '')
}

export const SQL = (strings: TemplateStringsArray, ...values: string[]) =>
	genericTaggedString(strings, ...values)
		.replace(/\s+/g, ' ')
		.trim()
