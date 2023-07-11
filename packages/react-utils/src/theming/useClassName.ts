import { NestedClassName, deduplicateClassName, flatClassNameList } from '@contember/utilities'
import { useContext } from 'react'
import { GlobalClassNamePrefixContext } from './GlobalClassNamePrefixContext'

/**
 * Hook for component class name accepting outer class name
 *
 * @param componentClassName - Component class name
 * @param additionalClassName - Additional class name
 * @param prefixOverride - Context component prefix override
 * @returns Prefixed component class name.
 */
export function useClassName (
	componentClassName: NestedClassName,
	additionalClassName: NestedClassName = null,
	prefixOverride?: string | null | undefined,
) {
	const contextPrefix = useContext(GlobalClassNamePrefixContext)
	const classNamePrefix: string = prefixOverride === null || prefixOverride === '' ? '' : prefixOverride || contextPrefix

	const componentClassNameList: string[] = flatClassNameList(componentClassName).map(
		componentClassName => `${classNamePrefix}${componentClassName}`,
	)

	return deduplicateClassName(componentClassNameList.concat(
		flatClassNameList(additionalClassName),
	)).join(' ')
}
