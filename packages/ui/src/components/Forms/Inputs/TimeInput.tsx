import { useClassName } from '@contember/react-utils'
import { dataAttribute, deprecate, isDefined } from '@contember/utilities'
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
	focusRing = true,
	seconds,
	withTopToolbar,
	...outerProps
}, forwardedRed) => {
	deprecate('1.4.0', isDefined(withTopToolbar), '`withTopToolbar` prop', null)

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

	return <input data-focus-ring={dataAttribute(focusRing)} {...props} step={seconds ? 1 : props.step} type="time" />
}))
TimeInput.displayName = 'TimeInput'
