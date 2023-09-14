import { useClassName } from '@contember/react-utils'
import { dataAttribute, deprecate, isDefined } from '@contember/utilities'
import { forwardRef, memo } from 'react'
import { toViewClass } from '../../../utils'
import { useTextBasedInput } from '../Hooks'
import type { EmailInputProps } from './Types'

/**
 * @group Forms UI
 */
export const EmailInput = memo(forwardRef<HTMLInputElement, EmailInputProps>(({
	className,
	focusRing = true,
	withTopToolbar,
	...outerProps
}, forwardedRed) => {
	deprecate('1.4.0', isDefined(withTopToolbar), '`withTopToolbar` prop', null)

	const props = useTextBasedInput<HTMLInputElement>({
		...outerProps,
		className: useClassName(['text-input', 'email-input'], [
			toViewClass('withTopToolbar', withTopToolbar),
			className,
		]),
	}, forwardedRed)

	return <input data-focus-ring={dataAttribute(focusRing)} {...props} type="email" />
}))
EmailInput.displayName = 'EmailInput'
