export const isEmptyObject = (arg: object): boolean => {
	// This is faster than Object.keys(arg).length === 0 && arg.constructor === Object
	for (const key in arg) {
		if (arg.hasOwnProperty(key)) {
			return false
		}
	}
	return true
}
