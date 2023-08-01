import { deduplicateClassName } from './deduplicateClassName'
import { flatClassNameList } from './flatClassNameList'
import { NestedClassName } from './types'

/**
 * Combines a list of class names into a single string, even nested
 *
 * @param list - List of class names
 * @returns Combined class names as string
 */
export function listClassName(list: NestedClassName) {
	return deduplicateClassName(flatClassNameList(list)).join(' ')
}
