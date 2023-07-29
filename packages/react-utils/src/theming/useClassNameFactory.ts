import { NestedClassName, deduplicateClassName, flatClassNameList } from '@contember/utilities'
import { useContext } from 'react'
import { useReferentiallyStableCallback } from '../referentiallyStable'
import { GlobalClassNamePrefixContext } from './GlobalClassNamePrefixContext'

/**
 * Hook for component class name accepting outer class name
 *
 * Returns a reusable function almost that is handy for components
 * with many sub-component parts that should inherit the root component
 * name.
 *
 * Also, product of the factory is a function that can be used outside of rules of hooks.
 *
 * @param componentClassName - Component class name
 * @param glue - String to use to glue component and sub-component suffix
 * @param prefixOverride - Context component prefix override
 * @returns
 */
export function useClassNameFactory(
	componentClassName: NestedClassName,
	glue: string | null = '-',
	prefixOverride?: string | null | undefined,
) {
	const contextPrefix = useContext(GlobalClassNamePrefixContext)
	const classNamePrefix: string = prefixOverride === null || prefixOverride === '' ? '' : prefixOverride || contextPrefix

	const componentClassNameList: string[] = flatClassNameList(componentClassName).map(
		componentClassName => `${classNamePrefix}${componentClassName}`,
	)

	function componentClassNameFor(
		suffix: string | null | undefined = null,
		additionalClassName: NestedClassName = null,
	): string {
		const classNameSuffix: string = suffix ?? ''

		return deduplicateClassName((classNameSuffix
			? (classNameSuffix.match(/^[a-zA-Z0-9]/)
				? componentClassNameList.map(componentClassName => `${componentClassName}${glue}${classNameSuffix}`)
				: componentClassNameList.map(componentClassName => `${componentClassName}${classNameSuffix}`)
			)
			: componentClassNameList
		).concat(
			flatClassNameList(additionalClassName),
		)).join(' ')
	}

	return useReferentiallyStableCallback(componentClassNameFor)
}
