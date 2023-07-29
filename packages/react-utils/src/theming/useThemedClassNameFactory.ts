import { NestedClassName, colorSchemeClassName, deduplicateClassName, filterThemedClassName, flatClassNameList } from '@contember/utilities'
import { useContext } from 'react'
import { useReferentiallyStableCallback } from '../referentiallyStable'
import { GlobalClassNamePrefixContext } from './GlobalClassNamePrefixContext'
import { useColorScheme } from './contexts'

export function useThemedClassNameFactory(
	componentClassName: NestedClassName,
	glue: string | null = '-',
	prefixOverride?: string | null | undefined,
) {
	const contextPrefix = useContext(GlobalClassNamePrefixContext)
	const classNamePrefix: string = prefixOverride === null || prefixOverride === '' ? '' : prefixOverride || contextPrefix

	const componentClassNameList: string[] = flatClassNameList(componentClassName).map(
		componentClassName => `${classNamePrefix}${componentClassName}`,
	)

	const colorScheme = colorSchemeClassName(useColorScheme())

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
			flatClassNameList(
				filterThemedClassName(
					additionalClassName,
					colorScheme,
				),
			),
		)).join(' ')
	}

	return useReferentiallyStableCallback(componentClassNameFor)
}
