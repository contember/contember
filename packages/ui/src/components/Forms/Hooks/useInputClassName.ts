import { listClassName } from '@contember/utilities'
import { toEnumClass, toEnumStateClass, toEnumViewClass, toStateClass, toThemeClass } from '../../../utils'
import { NonOptionalVisuallyDependentControlProps } from '../Types'
import { VisuallyDependentControlProps } from '../Types/ControlProps'

export type UseInputClassNameProps = Omit<VisuallyDependentControlProps, 'id' | 'name' | 'placeholder' | 'style'>
export type NonOptionalUseInputClassNameProps = Omit<NonOptionalVisuallyDependentControlProps, 'id' | 'name' | 'placeholder' | 'style'>

/**
 * Generates className prop from the set of props
 *
 * By default all props are required to ensure none of the props are unintentionally left out,
 * but you can pass `UseInputClassNameProps` to P of `useInputClassName<P>()` to make them optional.
 *
 * @param props - Props to generate className from
 * @returns className CSS class name string
 *
 */
export function useInputClassName<P extends NonOptionalUseInputClassNameProps | UseInputClassNameProps = NonOptionalUseInputClassNameProps>({
	// ControlStateProps
	active,
	disabled,
	loading,
	readOnly,
	required,
	focused,
	hovered,

	// ControlDisplayProps
	className: outerClassName,
	distinction,
	intent,
	scheme,
	size,

	// ValidationStateProps
	validationState,

	...restNotImplemented
}: P): string {
	if (import.meta.env.DEV && Object.keys(restNotImplemented).length !== 0) {
		console.warn(`New props need to be implemented, see ...restNotImplemented: ${Object.keys(restNotImplemented).join(', ')}`)
	}

	let finalIntent: typeof intent = disabled
		? 'default'
		: intent

	if (validationState === 'invalid') {
		finalIntent = 'danger'
	}

	return listClassName([
		toStateClass('active', active),
		toStateClass('disabled', disabled),
		toStateClass('focused', focused),
		toStateClass('hovered', hovered),
		toStateClass('loading', loading),
		toStateClass('read-only', readOnly),
		toStateClass('required', required),

		toEnumClass('scheme-', !disabled ? scheme : undefined),
		toThemeClass(finalIntent, finalIntent),
		toEnumViewClass(size),
		toEnumViewClass(distinction),
		toEnumStateClass(validationState),

		outerClassName,
	])
}
