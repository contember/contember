import classNames from 'classnames'
import { forwardRef, memo } from 'react'
import { useComponentClassName } from '../../../auxiliary'
import { toViewClass } from '../../../utils'
import { assertTimeString } from '../Types'
import type { TimeInputProps } from './Types'
import { useTextBasedInput } from '../hooks/useTextBasedInput'

export const TimeInput = memo(
	forwardRef<HTMLInputElement, TimeInputProps>(({
		className,
		seconds,
		withTopToolbar,
		...outerProps
	}, forwardedRed) => {
		outerProps.max && assertTimeString(outerProps.max)
		outerProps.min && assertTimeString(outerProps.min)
		outerProps.value && assertTimeString(outerProps.value)

		const props = useTextBasedInput<HTMLInputElement>({
			...outerProps,
			className: classNames(
				useComponentClassName('text-input'),
				useComponentClassName('time-input'),
				toViewClass('withTopToolbar', withTopToolbar),
				className,
			),
		}, forwardedRed)

		return <input {...props} step={seconds ? 1 : props.step} type="time" />
	}),
)
TimeInput.displayName = 'TimeInput'
