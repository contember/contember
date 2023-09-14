import { useClassName } from '@contember/react-utils'
import { dataAttribute, deprecate, isDefined } from '@contember/utilities'
import { Ref, forwardRef, memo } from 'react'
import { HTMLInputElementProps } from '../../../types'
import { toViewClass } from '../../../utils'
import { useTextBasedInput } from '../Hooks'
import { assertDatetimeString } from '../Types'
import { DateTimeInputFallback } from './DateTimeInputFallback'
import { DateTimeInputProps } from './Types'

let _isInputDateTimeLocalSupported: boolean | null = null

function isInputDateTimeLocalSupported() {
	if (_isInputDateTimeLocalSupported === null) {
		const input = document.createElement('input')
		const value = 'a'
		input.setAttribute('type', 'datetime-local')
		input.setAttribute('value', value)

		_isInputDateTimeLocalSupported = input.value !== value
	}

	return _isInputDateTimeLocalSupported
}

type InnerInputProps = HTMLInputElementProps

const InnerDatetimeInput = memo(forwardRef((props: InnerInputProps, ref: Ref<HTMLInputElement>) => {
	if (props.value) {
		assertDatetimeString(props.value)
	}

	if (props.max) {
		assertDatetimeString(props.max)
	}

	if (props.min) {
		assertDatetimeString(props.min)
	}

	return <input ref={ref} {...props} type="datetime-local" />
}))
InnerDatetimeInput.displayName = 'InnerDatetimeInput'

/**
 * @group Forms UI
 */
export const DateTimeInput = memo(
	forwardRef(({
		className,
		focusRing = true,
		withTopToolbar,
		...outerProps
	}: DateTimeInputProps, forwardedRef: Ref<HTMLInputElement>) => {
		deprecate('1.4.0', isDefined(withTopToolbar), '`withTopToolbar` prop', null)

		const props = useTextBasedInput<HTMLInputElement>({
			...outerProps,
			className: useClassName(['text-input', 'datetime-input'], [
				toViewClass('withTopToolbar', withTopToolbar),
				className,
			]),
		}, forwardedRef)

		return isInputDateTimeLocalSupported()
			? <InnerDatetimeInput data-focus-ring={dataAttribute(focusRing)} {...props} />
			: <DateTimeInputFallback data-focus-ring={dataAttribute(focusRing)} {...outerProps} />
	}),
)
DateTimeInput.displayName = 'DateTimeInput'
