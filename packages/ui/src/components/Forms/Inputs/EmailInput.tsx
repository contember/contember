import classNames from 'classnames'
import { forwardRef, memo } from 'react'
import { useComponentClassName } from '../../../auxiliary'
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
		className: classNames(
			useComponentClassName('text-input'),
			useComponentClassName('email-input'),
			toViewClass('withTopToolbar', withTopToolbar),
			className,
		),
	}, forwardedRed)

	return <input {...props} type="email" />
}))
EmailInput.displayName = 'EmailInput'
