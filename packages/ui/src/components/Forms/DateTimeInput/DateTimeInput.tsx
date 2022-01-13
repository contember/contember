import classNames from 'classnames'
import { forwardRef, memo, Ref } from 'react'
import { useComponentClassName } from '../../../auxiliary'
import { toEnumStateClass, toEnumViewClass, toViewClass } from '../../../utils'
import { TextInputOwnProps } from '../TextInput'
import { FallbackDateTimeInput } from './FallbackDateTimeInput'

export type DateTimeInputProps = TextInputOwnProps & {
	type: 'date' | 'time' | 'datetime'
	min?: string
	max?: string
}

const isInputDateTimeLocalSupported = (() => {
	const input = document.createElement('input')
	const value = 'a'
	input.setAttribute('type', 'datetime-local')
	input.setAttribute('value', value)
	return input.value !== value
})()

export const DateTimeInput = memo(
	forwardRef((props: DateTimeInputProps, ref: Ref<HTMLInputElement>) => {
		const { size, distinction, validationState, withTopToolbar, type, ...rest } = props

		const componentClassName = useComponentClassName('input')

		return type === 'datetime' && !isInputDateTimeLocalSupported
			? <FallbackDateTimeInput {...props} />
			: <input
				ref={ref}
				className={classNames(
					componentClassName,
					toEnumViewClass(size),
					toEnumViewClass(distinction),
					toEnumStateClass(validationState),
					toViewClass('withTopToolbar', withTopToolbar),
				)}
				{...rest}
				type={{
					date: 'date',
					time: 'time',
					datetime: 'datetime-local',
				}[type]}
			/>
	}),
)
DateTimeInput.displayName = 'DateTimeInput'
