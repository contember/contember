/**
 * Structural equality of plain data: arrays, plain objects, Map, Set, RegExp, typed arrays (byte-wise),
 * and objects with a custom `valueOf` or `toString` (e.g. Date). Both sides must share a constructor.
 * NaN equals NaN. Only own enumerable string keys of objects are compared.
 */
export const deepEqual = (a: unknown, b: unknown): boolean => {
	if (a === b) {
		return true
	}
	if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
		return Number.isNaN(a) && Number.isNaN(b)
	}
	if (a.constructor !== b.constructor) {
		return false
	}
	if (Array.isArray(a)) {
		if (!Array.isArray(b) || a.length !== b.length) {
			return false
		}
		for (let i = 0; i < a.length; i++) {
			if (!deepEqual(a[i], b[i])) {
				return false
			}
		}
		return true
	}
	if (a instanceof Map && b instanceof Map) {
		if (a.size !== b.size) {
			return false
		}
		for (const key of a.keys()) {
			if (!b.has(key)) {
				return false
			}
		}
		for (const [key, value] of a) {
			if (!deepEqual(value, b.get(key))) {
				return false
			}
		}
		return true
	}
	if (a instanceof Set && b instanceof Set) {
		if (a.size !== b.size) {
			return false
		}
		for (const value of a) {
			if (!b.has(value)) {
				return false
			}
		}
		return true
	}
	if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
		const left = new Uint8Array(a.buffer, a.byteOffset, a.byteLength)
		const right = new Uint8Array(b.buffer, b.byteOffset, b.byteLength)
		if (left.length !== right.length) {
			return false
		}
		for (let i = 0; i < left.length; i++) {
			if (left[i] !== right[i]) {
				return false
			}
		}
		return true
	}
	if (a instanceof RegExp && b instanceof RegExp) {
		return a.source === b.source && a.flags === b.flags
	}
	if (a.valueOf !== Object.prototype.valueOf) {
		return a.valueOf() === b.valueOf()
	}
	if (a.toString !== Object.prototype.toString) {
		return a.toString() === b.toString()
	}
	const keysA = Object.keys(a)
	if (keysA.length !== Object.keys(b).length) {
		return false
	}
	for (const key of keysA) {
		if (!Object.prototype.hasOwnProperty.call(b, key)) {
			return false
		}
	}
	for (const key of keysA) {
		if (!deepEqual(Reflect.get(a, key), Reflect.get(b, key))) {
			return false
		}
	}
	return true
}
