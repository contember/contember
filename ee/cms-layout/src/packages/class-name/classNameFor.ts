import { deduplicateClassName } from './Internal/deduplicateClassName'
import { flatClassNameList } from './Internal/flatClassNameList'
import { ClassNameStateMap, NestedClassName } from './Types'
import { stateClassName } from './stateClassName'

/**
 * Creates a function that can be used to generate class names for a component
 *
 * @param componentClassName Base class name for the component.
 * @param className External class name passed to a component.
 * @param state State map object similar to the one used by `stateClassName`.
 * @param glue Glue to use between the component class name and the suffix, default is '-'. Set to '' to disable.
 * @param stateGlue Glue to use between the state class name and the value, default is '-'. Set to '' to disable.
 * @returns Function that can be used to generate class names for a component and its sub-components.
 */
export function classNameForFactory(componentClassName: NestedClassName, className?: NestedClassName, state?: ClassNameStateMap, glue: string = '-', stateGlue: string = '-') {
	const classNameList: string[] = flatClassNameList(className)
	const componentClassNameList: string[] = flatClassNameList(componentClassName)

	return function classNameFor(suffix: string | null | undefined = null, additionalClassName: NestedClassName = null) {
		return deduplicateClassName((!suffix
			? componentClassNameList.concat(classNameList)
			: suffix.match(/^\w/)
				? componentClassNameList.map(componentClassName => `${componentClassName}${glue}${suffix}`)
				: componentClassNameList.map(componentClassName => `${componentClassName}${suffix}`)
		).concat(
			stateClassName(state, stateGlue),
		).concat(
			flatClassNameList(additionalClassName),
		)).join(' ')
	}
}
