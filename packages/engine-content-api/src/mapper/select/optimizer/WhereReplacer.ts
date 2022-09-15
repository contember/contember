import { Input, Writable } from '@contember/schema'
import deepEqual from 'fast-deep-equal'

export interface ReplaceWhereResult {
	count: number
}

export const replaceWhere = (subject: Input.OptionalWhere, find: Input.OptionalWhere, replace: Input.OptionalWhere, resultTracker: ReplaceWhereResult = { count: 0 }): Input.OptionalWhere => {
	if (deepEqual(subject, find)) {
		resultTracker.count++
		return replace
	}
	const result: Writable<Input.OptionalWhere> = {}
	for (const [key, value] of Object.entries(subject)) {
		if (key === 'not') {
			result['not'] = replaceWhere(value as Input.OptionalWhere, find, replace, resultTracker)

		} else if (key === 'and' || key === 'or') {
			result[key] = (value as Input.OptionalWhere[]).map(it => replaceWhere(it, find, replace, resultTracker))

		} else {
			result[key] = value
		}

	}
	return result
}
