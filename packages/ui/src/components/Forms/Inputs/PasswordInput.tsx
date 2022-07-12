import classNames from 'classnames'
import { forwardRef, memo } from 'react'
import { useComponentClassName } from '../../../auxiliary'
import { toViewClass } from '../../../utils'
import type { PasswordInputProps } from './Types'
import { useTextBasedInput } from '../hooks/useTextBasedInput'

export const PasswordInput = memo(
	forwardRef<HTMLInputElement, PasswordInputProps>(({
		className,
		withTopToolbar,
		...outerProps
	}, forwardedRed) => {
		const props = useTextBasedInput<HTMLInputElement>({
			...outerProps,
			className: classNames(
				useComponentClassName('text-input'),
				useComponentClassName('password-input'),
				toViewClass('withTopToolbar', withTopToolbar),
				className,
			),
		}, forwardedRed)

		return <input {...props} type="password" />
	}),
)
PasswordInput.displayName = 'PasswordInput'
