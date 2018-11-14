const arrayEquals = (a: any, b: any): boolean => {
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

const arraySplit = <T>(source: T[], condition: (value: T) => boolean): [T[], T[]] => {
	return source.reduce<[T[], T[]]>(
		([res1, res2], value) => {
			const valid = condition(value)
			return [[...res1, ...(valid ? [value] : [])], [...res2, ...(!valid ? [value] : [])]]
		},
		[[], []]
	)
}

export { arrayEquals, arraySplit }
