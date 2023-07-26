export function fallback<R>(current: R, condition: boolean, mapped: R): R {
	if (condition === true) {
		return mapped
	} else {
		return current
	}
}
