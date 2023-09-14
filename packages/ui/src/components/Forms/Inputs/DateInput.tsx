import { useClassName } from '@contember/react-utils'
import { dataAttribute, deprecate, isDefined } from '@contember/utilities'
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
	focusRing = true,
	withTopToolbar,
	...outerProps
}, forwardedRed) => {
	deprecate('1.4.0', isDefined(withTopToolbar), '`withTopToolbar` prop', null)
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

	return <input data-focus-ring={dataAttribute(focusRing)} {...props} type="date" />
}))
DateInput.displayName = 'DateInput'
