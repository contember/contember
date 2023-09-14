import { useClassName } from '@contember/react-utils'
import { dataAttribute, deprecate, isDefined } from '@contember/utilities'
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
	focusRing = true,
	withTopToolbar,
	...outerProps
}, forwardedRed) => {
	deprecate('1.4.0', isDefined(withTopToolbar), '`withTopToolbar` prop', null)

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

	return <input data-focus-ring={dataAttribute(focusRing)} {...props} type="month" />
}))
MonthInput.displayName = 'MonthInput'
