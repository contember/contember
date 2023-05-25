import { useClassName } from '@contember/utilities'
import { forwardRef, memo } from 'react'
import { toViewClass } from '../../../utils'
import { useTextBasedInput } from '../Hooks'
import { assertTimeString } from '../Types'
import type { TimeInputProps } from './Types'

/**
 * @group Forms UI
 */
export const TimeInput = memo(forwardRef<HTMLInputElement, TimeInputProps>(({
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
		className: useClassName(['text-input', 'time-input'], [
			toViewClass('withTopToolbar', withTopToolbar),
			className,
		]),
	}, forwardedRed)

	return <input {...props} step={seconds ? 1 : props.step} type="time" />
}))
TimeInput.displayName = 'TimeInput'
