import classNames from 'classnames'
import { forwardRef, memo } from 'react'
import { useComponentClassName } from '../../../auxiliary'
import { toViewClass } from '../../../utils'
import { assertWeekInputString } from '../Types'
import { useNativeInput } from '../useNativeInput'
import type { WeekInputProps } from './Types'

export const WeekInput = memo(
	forwardRef<HTMLInputElement, WeekInputProps>(({
		className,
		withTopToolbar,
		...outerProps
	}, forwardedRed) => {
		outerProps.max && assertWeekInputString(outerProps.max)
		outerProps.min && assertWeekInputString(outerProps.min)
		outerProps.value && assertWeekInputString(outerProps.value)

		const { props } = useNativeInput<HTMLInputElement>({
			...outerProps,
			className: classNames(
				useComponentClassName('text-input'),
				useComponentClassName('week-input'),
				toViewClass('withTopToolbar', withTopToolbar),
				className,
			),
		}, forwardedRed)

		return <input {...props} type="week" />
	}),
)
WeekInput.displayName = 'WeekInput'
