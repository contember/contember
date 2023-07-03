import { assertNever } from '../assert-types'
import { NestedClassName } from './Types'

export function flatClassNameList(className: NestedClassName): string[] {
	if (!className) {
		return []
	} else if (typeof className === 'string') {
		return className.split(' ').filter(Boolean)
	} else if (Array.isArray(className)) {
		return className.flatMap(flatClassNameList)
	} else {
		if (import.meta.env.DEV) {
			console.error(`Unexpected className: ${JSON.stringify(className)}`)
		}

		assertNever(className)
	}
}
