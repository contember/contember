import { NestedClassName } from '../Types'

export function flatClassNameList(className: NestedClassName): string[] {
	if (className == null) {
		return []
	} else if (typeof className === 'string') {
		return className.split(' ').filter(Boolean)
	} else if (Array.isArray(className)) {
		return className.map(flatClassNameList).flat(1)
	} else {
		throw new Error(`Unexpected className: ${JSON.stringify(className)}`)
	}
}
