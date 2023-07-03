import { useContext } from 'react'
import { GlobalClassNamePrefixContext } from './GlobalClassNamePrefixContext'
import { NestedClassName } from './Types'
import { deduplicateClassName } from './deduplicateClassName'
import { flatClassNameList } from './flatClassNameList'

/**
 * Prefixes leaf component class name
 *
 * @param componentClassName - Component class name.
 * @param additionalClassName - Additional class name.
 * @returns Prefixed component class name.
 */
export const useClassName = (
	componentClassName: NestedClassName,
	additionalClassName: NestedClassName = null,
	prefixOverride?: string | null | undefined,
) => {
	const contextPrefix = useContext(GlobalClassNamePrefixContext)
	const classNamePrefix: string = prefixOverride === null || prefixOverride === '' ? '' : prefixOverride || contextPrefix

	const componentClassNameList: string[] = flatClassNameList(componentClassName).map(
		componentClassName => `${classNamePrefix}${componentClassName}`,
	)

	return deduplicateClassName(componentClassNameList.concat(
		flatClassNameList(additionalClassName),
	)).join(' ')
}
