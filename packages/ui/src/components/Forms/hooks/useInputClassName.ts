import classNames from 'classnames'
import { toEnumClass, toEnumStateClass, toEnumViewClass, toStateClass, toThemeClass } from '../../../utils'
import { AllVisuallyDependentControlProps } from '../Types'
import { VisuallyDependentControlProps } from '../Types/ControlProps'

/**
 * Generates className prop from the set of props
 *
 * `AllVisuallyDependentControlProps` and `VisuallyDependentControlProps` are basically the same.
 *  Hover `All*` has all props required and is the default which ensures none of the props are unintentionaly left out.
 *
 * Use `useInputClassName<VisuallyDependentControlProps>(...)` to ease usage of the hook.
 *
 */

export function useInputClassName<P extends AllVisuallyDependentControlProps | VisuallyDependentControlProps = AllVisuallyDependentControlProps>({
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

  // ValidationSteteProps
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

  return classNames(
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
	)
}
