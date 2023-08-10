import { useClassName } from '@contember/react-utils'
import { dataAttribute } from '@contember/utilities'
import { forwardRef, memo } from 'react'
import { toViewClass } from '../../../utils'
import { useTextBasedInput } from '../Hooks'
import type { PasswordInputProps } from './Types'

/**
 * @group Forms UI
 */
export const PasswordInput = memo(forwardRef<HTMLInputElement, PasswordInputProps>(({
	className,
	focusRing = true,
	withTopToolbar,
	...outerProps
}, forwardedRed) => {
	const props = useTextBasedInput<HTMLInputElement>({
		...outerProps,
		className: useClassName(['text-input', 'password-input'], [
			toViewClass('withTopToolbar', withTopToolbar),
			className,
		]),
	}, forwardedRed)

	return <input data-focus-ring={dataAttribute(focusRing)} {...props} type="password" />
}))
PasswordInput.displayName = 'PasswordInput'
