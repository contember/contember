import { Input } from '@contember/schema'

export const optimizeJunction = <P>(type: 'and' | 'or', parts: readonly (P[] | boolean)[]): P[] | boolean => {
	if (type === 'and') {
		return optimizeAnd(parts)
	} else {
		return optimizeOr(parts)
	}
}

export const optimizeOr = <P>(parts: readonly (P[] | boolean)[]): P[] | boolean => {
	const resultParts: P[] = []
	for (const part of parts) {
		if (part === true) {
			return true
		}
		if (part === false) {
			continue
		}
		resultParts.push((part.length === 1 ? part[0] : { and: part }) as P)
	}
	return resultParts
}

export const optimizeAnd = <P>(parts: readonly (P[] | boolean)[]): P[] | boolean => {
	const resultParts: P[] = []
	let hasAlways = false
	for (const part of parts) {
		if (part === true) {
			hasAlways = true
			continue
		}
		if (part === false) {
			return false
		}
		resultParts.push(...part)
	}
	if (resultParts.length === 0 && hasAlways) {
		return true
	}
	return resultParts
}


export class ResultCollector<T extends Input.Condition | Input.Where> {
	private hasAlways = false
	private hasNever = false

	private values: T[] = []

	constructor(
		private canFlatten = false,
	) {
	}

	public add(value: T[] | boolean, wrapper: 'not' | 'or' | 'and' = 'and'): void {
		if (wrapper === 'not' && typeof value === 'boolean') {
			value = !value
		}
		if (value === true) {
			this.hasAlways = true
		} else if (value === false) {
			this.hasNever = true
		} else if (wrapper === 'and' && value.length > 0) {
			if (this.canFlatten) {
				this.values.push(...value)
			} else {
				this.values.push(value.length === 1 ? value[0] : { and: value } as unknown as T)
			}
		} else if (wrapper === 'or' && value.length > 0) {
			this.values.push(value.length === 1 ? value[0] : { or: value } as unknown as T)
		} else if (wrapper === 'not' && value.length > 0) {
			this.values.push({ not: value.length === 1 ? value[0] : { and: value } } as unknown as T)
		}
	}

	public getResult(): T[] | boolean {
		if (this.hasNever) {
			return false
		}
		if (this.values.length === 0 && this.hasAlways) {
			return true
		}
		return this.values
	}
}
