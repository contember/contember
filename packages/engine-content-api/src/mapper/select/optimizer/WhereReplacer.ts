import { Input, Writable } from '@contember/schema'
import deepEqual from 'fast-deep-equal'

export const replaceWhere = (subject: Input.Where, find: Input.Where, replace: Input.Where): Input.Where => {
	if (deepEqual(subject, find)) {
		return replace
	}
	const result: Writable<Input.Where> = {}
	for (const [key, value] of Object.entries(subject)) {
		if (key === 'not') {
			result['not'] = replaceWhere(value as Input.Where, find, replace)

		} else if (key === 'and' || key === 'or') {
			result[key] = (value as Input.Where[]).map(it => replaceWhere(it, find, replace))

		} else {
			result[key] = value
		}

	}
	return result
}
