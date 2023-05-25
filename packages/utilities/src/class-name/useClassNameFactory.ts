import { useContext } from 'react'
import { GlobalClassNamePrefixContext } from './GlobalClassNamePrefixContext'
import { deduplicateClassName } from './Internal/deduplicateClassName'
import { flatClassNameList } from './Internal/flatClassNameList'
import { NestedClassName } from './Types'

export function useClassNameFactory(componentClassName: NestedClassName, glue: string | null = '-', prefixOverride?: string | null | undefined) {
	const contextPrefix = useContext(GlobalClassNamePrefixContext)
	const classNamePrefix: string = prefixOverride === null || prefixOverride === '' ? '' : prefixOverride || contextPrefix

	const componentClassNameList: string[] = flatClassNameList(componentClassName).map(
		componentClassName => `${classNamePrefix}${componentClassName}`,
	)

	return function componentClassNameFor(
		suffix: string | null | undefined = null,
		additionalClassName: NestedClassName = null,
	): string {
		const classNameSuffix: string = !suffix ? '' : (suffix || contextPrefix)

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
}
