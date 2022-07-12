import classNames from 'classnames'
import { forwardRef, memo } from 'react'
import { useComponentClassName } from '../../../auxiliary'
import type { TextInputProps } from './Types'
import { useTextBasedInput } from '../hooks/useTextBasedInput'

export const HiddenInput = memo(
	forwardRef<HTMLInputElement, TextInputProps>(({
		className,
		withTopToolbar,
		type,
		...outerProps
	}, forwardedRed) => {
		const props = useTextBasedInput<HTMLInputElement>({
			...outerProps,
			className: classNames(
				useComponentClassName('hidden-input'),
				className,
			),
		}, forwardedRed)

		return <input {...props} type="hidden" />
	}),
)
HiddenInput.displayName = 'HiddenInput'
