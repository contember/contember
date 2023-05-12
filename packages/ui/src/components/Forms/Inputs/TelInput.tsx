import { useClassName } from '@contember/utilities'
import { forwardRef, memo } from 'react'
import { toViewClass } from '../../../utils'
import { useTextBasedInput } from '../Hooks'
import type { TelInputProps } from './Types'

/**
 * @group Forms UI
 */
export const TelInput = memo(forwardRef<HTMLInputElement, TelInputProps>(({
	className,
	withTopToolbar,
	...outerProps
}, forwardedRed) => {
	const props = useTextBasedInput<HTMLInputElement>({
		...outerProps,
		className: useClassName(['text-input', 'tel-input'], [
			toViewClass('withTopToolbar', withTopToolbar),
			className,
		]),
	}, forwardedRed)

	return <input {...props} type="tel" />
}))
TelInput.displayName = 'TelInput'
