import { useRef } from 'react'

const compareObjects = (a: object, b: object): boolean => {
	if (a === b) {
		return true
	}
	const aEntries = Object.entries(a)
	if (aEntries.length !== Object.keys(b).length) {
		return false
	}
	for (const [key, val] of aEntries) {
		if (!(key in b) || (b as any)[key] !== val) {
			return false
		}
	}
	return true
}

export const useObjectMemo = <A extends object>(value: A): A => {
	const valueRef = useRef(value)
	if (!compareObjects(valueRef.current, value)) {
		valueRef.current = value
	}
	return valueRef.current
}
