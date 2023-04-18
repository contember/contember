import { deduplicateClassName } from './Internal/deduplicateClassName'
import { flatClassNameList } from './Internal/flatClassNameList'

/**
 * Combines a list of class names into a single string, even nested
 *
 * @param list List of class names
 * @returns Combined class names as string
 */
export function listClassName(list: (string | false | null | undefined)[]) {
	return deduplicateClassName(flatClassNameList(list)).join(' ')
}
