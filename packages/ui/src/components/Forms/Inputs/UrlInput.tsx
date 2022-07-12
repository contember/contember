import classNames from 'classnames'
import { forwardRef, memo } from 'react'
import { useComponentClassName } from '../../../auxiliary'
import { toViewClass } from '../../../utils'
import type { UrlInputProps } from './Types'
import { useTextBasedInput } from '../hooks/useTextBasedInput'

export const UrlInput = memo(
	forwardRef<HTMLInputElement, UrlInputProps>(({
		className,
		withTopToolbar,
		...outerProps
	}, forwardedRed) => {
		const props = useTextBasedInput<HTMLInputElement>({
			...outerProps,
			className: classNames(
				useComponentClassName('text-input'),
				useComponentClassName('url-input'),
				toViewClass('withTopToolbar', withTopToolbar),
				className,
			),
		}, forwardedRed)

		return <input {...props} type="url" />
	}),
)
UrlInput.displayName = 'UrlInput'
