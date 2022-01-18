import classNames from 'classnames'
import { ChangeEventHandler, DetailedHTMLProps, forwardRef, InputHTMLAttributes, memo, Ref, useCallback } from 'react'
import { assertDateString, assertDatetimeString, assertTimeString } from '.'
import { useComponentClassName } from '../../../auxiliary'
import { toEnumStateClass, toEnumViewClass, toViewClass } from '../../../utils'
import { FallbackDateTimeInput } from './FallbackDateTimeInput'
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

type InnerInputProps = DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>

const InnerDateInput = memo(
	forwardRef((props: InnerInputProps, ref: Ref<HTMLInputElement>) => {
		if (props.value) {
			assertDateString(props.value)
		}

		if (props.max) {
			assertDateString(props.max)
		}

		if (props.min) {
			assertDateString(props.min)
		}

		return <input ref={ref} {...props} type="date" />
	}),
)
InnerDateInput.displayName = 'InnerDateInput'

const InnerTimeInput = memo(
	forwardRef((props: InnerInputProps, ref: Ref<HTMLInputElement>) => {
		if (props.value) {
			assertTimeString(props.value)
		}

		if (props.max) {
			assertTimeString(props.max)
		}

		if (props.min) {
			assertTimeString(props.min)
		}

		return <input ref={ref} {...props} type="time" />
	}),
)
InnerTimeInput.displayName = 'InnerTimeInput'

const InnerDatetimeInput = memo(
	forwardRef((props: InnerInputProps, ref: Ref<HTMLInputElement>) => {
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
	}),
)
InnerDatetimeInput.displayName = 'InnerDatetimeInput'

export const DateTimeInput = memo(
	forwardRef((props: DateTimeInputProps, ref: Ref<HTMLInputElement>) => {
		const { className: _className, size, distinction, onChange: _onChange, validationState, withTopToolbar, type, ...rest } = props

		const className = classNames(
			useComponentClassName('input'),
			toEnumViewClass(size),
			toEnumViewClass(distinction),
			toEnumStateClass(validationState),
			toViewClass('withTopToolbar', withTopToolbar),
			_className,
		)

		const onChange: ChangeEventHandler<HTMLInputElement> = useCallback(event => {
			_onChange(event.target.value ? event.target.value : null)
		}, [_onChange])

		switch (type) {
			case 'date':
				return <InnerDateInput ref={ref} className={className} onChange={onChange} {...rest} />
			case 'time':
				return <InnerTimeInput ref={ref} className={className} onChange={onChange} {...rest} />
			default:
				return isInputDateTimeLocalSupported()
					? <InnerDatetimeInput ref={ref} className={className} onChange={onChange} {...rest} />
					: <FallbackDateTimeInput ref={ref} {...props} className={className} />
		}
	}),
)
DateTimeInput.displayName = 'DateTimeInput'
