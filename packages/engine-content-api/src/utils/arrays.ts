const arrayEquals = (a: unknown[] | null, b: unknown[] | null): boolean => {
	if (a === b) {
		return true
	}
	if (a === null || b === null) {
		return false
	}
	if (a.length !== b.length) {
		return false
	}
	for (let i = 0; i < a.length; ++i) {
		if (a[i] !== b[i]) {
			return false
		}
	}
	return true
}

export { arrayEquals }
