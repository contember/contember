import { useClassName } from '@contember/utilities'
import { forwardRef, memo } from 'react'
import { useTextBasedInput } from '../Hooks'
import type { TextInputProps } from './Types'

/**
 * @group Forms UI
 */
export const HiddenInput = memo(forwardRef<HTMLInputElement, TextInputProps>(({
	className,
	withTopToolbar,
	type,
	...outerProps
}, forwardedRed) => {
	const props = useTextBasedInput<HTMLInputElement>({
		...outerProps,
		className: useClassName('hidden-input', className),
	}, forwardedRed)

	return <input {...props} type="hidden" />
}))
HiddenInput.displayName = 'HiddenInput'
