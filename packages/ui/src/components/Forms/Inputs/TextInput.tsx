import { useClassName } from '@contember/react-utils'
import { dataAttribute, deprecate, isDefined } from '@contember/utilities'
import { forwardRef, memo } from 'react'
import { toViewClass } from '../../../utils'
import { useTextBasedInput } from '../Hooks'
import type { TextInputProps } from './Types'

/** @deprecated Use {@link TextInputProps} instead since 1.4.0 */
export type TextInputPropsWithDeprecated = TextInputProps

/**
 * @group Forms UI
 */
export const TextInput = memo(
	forwardRef<HTMLInputElement, TextInputProps>(({
		className,
		type: _INTENTIONALLY_OMITTED_type,
		focusRing = true,
		withTopToolbar,
		...outerProps
	}, forwardedRed) => {
		deprecate('1.4.0', isDefined(withTopToolbar), '`withTopToolbar` prop', null)

		const props = useTextBasedInput<HTMLInputElement>({
			...outerProps,
			className: useClassName('text-input', [
				toViewClass('withTopToolbar', withTopToolbar),
				className,
			]),
		}, forwardedRed)

		return <input data-focus-ring={dataAttribute(focusRing)} {...props} type="text" />
	}),
)
TextInput.displayName = 'Interface.TextInput'

/** @deprecated Use {@link TextInput} instead since 1.4.0 */
export const InternalTextInput = memo(forwardRef<HTMLInputElement, TextInputProps>((props, forwardedRed) => {
	deprecate('1.4.0', true, 'InternalTextInput', 'TextInput')

	return (
		<TextInput {...props} ref={forwardedRed} />
	)
}))
InternalTextInput.displayName = 'Interface.InternalTextInput'
