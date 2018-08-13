export const isIt = <T extends object, P extends keyof T = keyof T>(val: any, property: P, value?: T[P]): val is T => {
	if (value !== undefined) {
		return val[property] === value
	}
	return val[property] !== undefined
}
