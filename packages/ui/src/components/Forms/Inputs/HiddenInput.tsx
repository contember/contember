import { useClassName } from '@contember/react-utils'
import { dataAttribute, deprecate } from '@contember/utilities'
import { forwardRef, memo } from 'react'
import { useTextBasedInput } from '../Hooks'
import type { TextInputProps } from './Types'

/**
 * @group Forms UI
 */
export const HiddenInput = memo(forwardRef<HTMLInputElement, TextInputProps>(({
	className,
	focusRing = true,
	withTopToolbar,
	type: _INTENTIONALLY_OMITTED_type,
	...outerProps
}, forwardedRed) => {
	deprecate('1.4.0', withTopToolbar !== undefined, '`withTopToolbar` prop', null)

	const props = useTextBasedInput<HTMLInputElement>({
		...outerProps,
		className: useClassName('hidden-input', className),
	}, forwardedRed)

	return <input data-focus-ring={dataAttribute(focusRing)} {...props} type="hidden" />
}))
HiddenInput.displayName = 'HiddenInput'
