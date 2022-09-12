import { Input, Writable } from '@contember/schema'
import deepEqual from 'fast-deep-equal'

export interface ReplaceWhereResult {
	count: number
}

export const replaceWhere = (subject: Input.Where, find: Input.Where, replace: Input.Where, resultTracker: ReplaceWhereResult = { count: 0 }): Input.Where => {
	if (deepEqual(subject, find)) {
		resultTracker.count++
		return replace
	}
	const result: Writable<Input.Where> = {}
	for (const [key, value] of Object.entries(subject)) {
		if (key === 'not') {
			result['not'] = replaceWhere(value as Input.Where, find, replace, resultTracker)

		} else if (key === 'and' || key === 'or') {
			result[key] = (value as Input.Where[]).map(it => replaceWhere(it, find, replace, resultTracker))

		} else {
			result[key] = value
		}

	}
	return result
}
