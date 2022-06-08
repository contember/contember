import classNames from 'classnames'
import { forwardRef, memo } from 'react'
import { useComponentClassName } from '../../../auxiliary'
import { toViewClass } from '../../../utils'
import type { RangeInputProps } from './Types'
import { useTextBasedInput } from '../hooks/useTextBasedInput'

export const RangeInput = memo(
	forwardRef<HTMLInputElement, RangeInputProps>(({
		className,
		withTopToolbar,
		...outerProps
	}, forwardedRed) => {
		const props = useTextBasedInput<HTMLInputElement>({
			...outerProps,
			className: classNames(
				useComponentClassName('text-input'),
				useComponentClassName('range-input'),
				toViewClass('withTopToolbar', withTopToolbar),
				className,
			),
		}, forwardedRed)

		return <input {...props} type="range" />
	}),
)
RangeInput.displayName = 'RangeInput'
