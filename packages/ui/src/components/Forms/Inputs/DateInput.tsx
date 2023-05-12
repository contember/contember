import { useClassName } from '@contember/utilities'
import { forwardRef, memo } from 'react'
import { toViewClass } from '../../../utils'
import { useTextBasedInput } from '../Hooks'
import { assertDateString } from '../Types'
import type { DateInputProps } from './Types'

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
		className: useClassName(['text-input', 'date-input'], [
			toViewClass('withTopToolbar', withTopToolbar),
			className,
		]),
	}, forwardedRed)

	return <input {...props} type="date" />
}))
DateInput.displayName = 'DateInput'
