export default (object: any): boolean => {
	// This is faster than Object.keys(object).length === 0 && object.constructor === Object
	for (const key in object) {
		if (object.hasOwnProperty(key)) {
			return false
		}
	}
	return true
}
