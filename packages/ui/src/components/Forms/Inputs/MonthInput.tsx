import classNames from 'classnames'
import { forwardRef, memo } from 'react'
import { useComponentClassName } from '../../../auxiliary'
import { toViewClass } from '../../../utils'
import { assertMonthInputString } from '../Types'
import type { MonthInputProps } from './Types'
import { useTextBasedInput } from '../hooks/useTextBasedInput'

export const MonthInput = memo(
	forwardRef<HTMLInputElement, MonthInputProps>(({
		className,
		withTopToolbar,
		...outerProps
	}, forwardedRed) => {
		outerProps.max && assertMonthInputString(outerProps.max)
		outerProps.min && assertMonthInputString(outerProps.min)
		outerProps.value && assertMonthInputString(outerProps.value)

		const props = useTextBasedInput<HTMLInputElement>({
			...outerProps,
			className: classNames(
				useComponentClassName('text-input'),
				useComponentClassName('month-input'),
				toViewClass('withTopToolbar', withTopToolbar),
				className,
			),
		}, forwardedRed)

		return <input {...props} type="month" />
	}),
)
MonthInput.displayName = 'MonthInput'
