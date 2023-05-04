import classNames from 'classnames'
import { forwardRef, memo } from 'react'
import { useComponentClassName } from '../../../auxiliary'
import { toViewClass } from '../../../utils'
import { assertDateString } from '../Types'
import type { DateInputProps } from './Types'
import { useTextBasedInput } from '../hooks/useTextBasedInput'

/**
 * @group Forms UI
 */
export const DateInput = memo(forwardRef<HTMLInputElement, DateInputProps>(({
	className,
	withTopToolbar,
	...outerProps
}, forwardedRed) => {
	outerProps.max && assertDateString(outerProps.max)
	outerProps.min && assertDateString(outerProps.min)
	outerProps.value && assertDateString(outerProps.value)

	const props = useTextBasedInput<HTMLInputElement>({
		...outerProps,
		className: classNames(
			useComponentClassName('text-input'),
			useComponentClassName('date-input'),
			toViewClass('withTopToolbar', withTopToolbar),
			className,
		),
	}, forwardedRed)

	return <input {...props} type="date" />
}))
DateInput.displayName = 'DateInput'
