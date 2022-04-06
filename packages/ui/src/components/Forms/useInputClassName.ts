import classNames from 'classnames'
import { VisuallyDependententControlProps } from '.'
import { toEnumClass, toEnumStateClass, toEnumViewClass, toStateClass, toThemeClass } from '../../utils'
import { AllVisuallyDependententControlProps } from './Types'

/**
 * Generates className prop from the set of props
 *
 * `AllVisuallyDependententControlProps` and `VisuallyDependententControlProps` are basically the same.
 *  Hover `All*` has all props required and is the default which ensures none of the props are unintentionaly left out.
 *
 * Use `useInputClassName<VisuallyDependententControlProps>(...)` to ease usage of the hook.
 *
 */

export function useInputClassName<P extends AllVisuallyDependententControlProps | VisuallyDependententControlProps = AllVisuallyDependententControlProps>({
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

	...restNotImplementd
}: P): string {
	if (import.meta.env.DEV && Object.keys(restNotImplementd).length !== 0) {
		console.warn(`New props need to be implemented, see ...restNotImplementd: ${Object.keys(restNotImplementd).join(', ')}`)
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
