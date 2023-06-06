type Path = (string | number)[]

type CompareError = {
	path: Path
	message: string
}

type BaseTypes = 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'object' | 'function'
type ExtendedType = BaseTypes | 'null' | 'array' | 'date' | 'regexp'

const getType = (val: any): ExtendedType => {
	if (val === null) {
		return 'null'
	}
	const type = typeof val
	if (type !== 'object') {
		return type
	}
	if (Array.isArray(val)) {
		return 'array'
	}
	if (val instanceof Date) {
		return 'date'
	}
	if (val instanceof RegExp) {
		return 'regexp'
	}
	return 'object'
}

type Comparator = (a: unknown, b: unknown) => CompareError[]

export const compareArraysIgnoreOrder = (a: unknown, b: unknown, path: Path) => {
	if (!Array.isArray(a) || !Array.isArray(b)) {
		return [{ path, message: 'Invalid type, expected array' }]
	}
	if (a.length !== b.length) {
		return [{ path, message: `Array length: ${a.length} != ${b.length}` }]
	}
	const haystack = [...b]
	for (const needle of a) {
		const index = haystack.findIndex(it => {
			const errors = deepCompare(needle, it, path)
			return errors.length === 0
		})
		if (index < 0) {
			return [{ path, message: `Array item: ${JSON.stringify(needle)} not found in ${JSON.stringify(haystack)}` }]
		}
		haystack.splice(index, 1)
	}
	if (haystack.length > 0) {
		return [{ path, message: `Array items: ${JSON.stringify(haystack)} not found in ${JSON.stringify(a)}` }]
	}
	return []
}

export function deepCompare(a: any, b: any, path: Path = [], getCustomComparator?: (path: Path) => Comparator | null): CompareError[] {
	if (a === b) {
		return []
	}
	const comparator = getCustomComparator?.(path)
	if (comparator) {
		return comparator(a, b)
	}

	const aType = getType(a)
	const bType = getType(b)
	if (aType !== bType) {
		return [
			{
				path,
				message: `Type: ${aType} != ${bType}`,
			},
		]
	}
	if (aType === 'array') {
		const aLength = (a as any[]).length
		const bLength = (b as any[]).length
		if (aLength !== bLength) {
			return [
				{
					path,
					message: `Array length: ${aLength} != ${bLength}`,
				},
			]
		}
		const errors: CompareError[] = []
		for (let i = 0; i < aLength; i++) {
			errors.push(...deepCompare(a[i], b[i], [...path, i], getCustomComparator))
		}
		return errors
	}

	if (aType === 'date') {
		const aTime = a.getTime()
		const bTime = b.getTime()
		if (aTime == bTime) {
			return []
		}
		return [
			{
				path,
				message: `Time: ${aTime} !== ${bTime}`,
			},
		]
	}
	if (aType === 'regexp') {
		const aRegexp = a.toString()
		const bRegexp = b.toString()
		if (aRegexp === bRegexp) {
			return []
		}
		return [{ path, message: `Regexp: ${aRegexp} !== ${bRegexp}` }]
	}
	if (aType === 'object') {
		const aKeys = Object.keys(a)
		const bKeys = Object.keys(b)

		const errors: CompareError[] = []
		for (const key of aKeys) {
			if (!b.hasOwnProperty(key)) {
				errors.push({
					path,
					message: `Missing property: ${key} not in right`,
				})
			} else {
				errors.push(...deepCompare(a[key], b[key], [...path, key], getCustomComparator))
			}
		}
		for (const key of bKeys) {
			if (!a.hasOwnProperty(key)) {
				errors.push({
					path,
					message: `Missing property: ${key} not in left`,
				})
			}
		}
		return errors
	}
	return [
		{
			path,
			message: `Value: ${JSON.stringify(a)} != ${JSON.stringify(b)}`,
		},
	]
}
