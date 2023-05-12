import { useClassName } from '@contember/utilities'
import { forwardRef, memo } from 'react'
import { toViewClass } from '../../../utils'
import { useTextBasedInput } from '../Hooks'
import type { EmailInputProps } from './Types'

/**
 * @group Forms UI
 */
export const EmailInput = memo(forwardRef<HTMLInputElement, EmailInputProps>(({
	className,
	withTopToolbar,
	...outerProps
}, forwardedRed) => {
	const props = useTextBasedInput<HTMLInputElement>({
		...outerProps,
		className: useClassName(['text-input', 'email-input'], [
			toViewClass('withTopToolbar', withTopToolbar),
			className,
		]),
	}, forwardedRed)

	return <input {...props} type="email" />
}))
EmailInput.displayName = 'EmailInput'
