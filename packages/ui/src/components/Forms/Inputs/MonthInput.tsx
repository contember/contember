import { useClassName } from '@contember/utilities'
import { forwardRef, memo } from 'react'
import { toViewClass } from '../../../utils'
import { useTextBasedInput } from '../Hooks'
import { assertMonthInputString } from '../Types'
import type { MonthInputProps } from './Types'

/**
 * @group Forms UI
 */
export const MonthInput = memo(forwardRef<HTMLInputElement, MonthInputProps>(({
	className,
	withTopToolbar,
	...outerProps
}, forwardedRed) => {
	outerProps.max && assertMonthInputString(outerProps.max)
	outerProps.min && assertMonthInputString(outerProps.min)
	outerProps.value && assertMonthInputString(outerProps.value)

	const props = useTextBasedInput<HTMLInputElement>({
		...outerProps,
		className: useClassName(['text-input', 'month-input'], [
			toViewClass('withTopToolbar', withTopToolbar),
			className,
		]),
	}, forwardedRed)

	return <input {...props} type="month" />
}))
MonthInput.displayName = 'MonthInput'
