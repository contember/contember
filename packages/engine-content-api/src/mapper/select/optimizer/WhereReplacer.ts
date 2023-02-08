import { Input, Writable } from '@contember/schema'
import deepEqual from 'fast-deep-equal'

export const replaceWhere = (subject: Input.OptionalWhere, find: Input.OptionalWhere, replace: Input.OptionalWhere, opts: { replaceSubOperands?: boolean } = {}): Input.OptionalWhere => {
	if (deepEqual(subject, find)) {
		return replace
	}
	let result: Writable<Input.OptionalWhere> = subject
	let copied = false
	// copy on write to preserve referential integrity, when nothing has changed
	const write = <T extends string>(key: T, value: Input.OptionalWhere[T]) => {
		if (!copied) {
			result = { ...result }
			copied = true
		}
		result[key] = value
	}

	for (const key in subject) {
		const value = subject[key]
		if (key === 'not') {
			const newNot = replaceWhere(value as Input.OptionalWhere, find, replace, opts)
			if (newNot !== value) {
				write('not', newNot)
			}
		} else if (key === 'and' || key === 'or') {
			const operands = value as Input.OptionalWhere[]
			const subOperandsToFind = opts.replaceSubOperands && Object.keys(find).length === 1 && find[key] ? (find[key] as Input.OptionalWhere[]) : null
			if (subOperandsToFind !== null && containsAllOperands(operands, subOperandsToFind)) {
				write(key, [replace])
			} else {
				const items: Input.OptionalWhere[] = []
				let itemChanged = false
				for (const el of operands) {
					const newEl = replaceWhere(el, find, replace, opts)
					if (newEl !== el) {
						itemChanged = true
					}
					items.push(newEl)
				}
				if (itemChanged) {
					write(key, items)
				}
			}

		}
	}
	return result
}


const containsAllOperands = (subjectOperands: Input.OptionalWhere[], findOperands: Input.OptionalWhere[]): boolean => {
	for (const op1 of findOperands) {
		let found = false
		for (const op2 of subjectOperands) {
			if (deepEqual(op1, op2)) {
				found = true
				break
			}
		}
		if (!found) {
			return false
		}
	}
	return true
}
