import cn from 'classnames'
import { ChangeEvent, forwardRef, memo, Ref, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { VisuallyHidden } from 'react-aria'
import { useComponentClassName } from '../../../auxiliary'
import { toEnumStateClass, toEnumViewClass, toViewClass } from '../../../utils'
import { Stack } from '../../Stack'
import { TextInputOwnProps } from '../TextInput'
import { dateToDateValue, dateToTimeValue } from './Serializer'

function setNativeValue(element: HTMLInputElement, value: string) {
	const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set
	const prototype = Object.getPrototypeOf(element)
	const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set

	if (valueSetter && valueSetter !== prototypeValueSetter) {
		prototypeValueSetter?.call(element, value)
	} else {
		valueSetter?.call(element, value)
	}

	element.dispatchEvent(new Event('input', { bubbles: true }))
}

export const FallbackDateTimeInput = memo(
	forwardRef(({ size, distinction, validationState, withTopToolbar, value, ...rest }: TextInputOwnProps, ref: Ref<HTMLInputElement>) => {
		const finalClassName = cn(
			useComponentClassName('input'),
			toEnumViewClass(size),
			toEnumViewClass(distinction),
			toEnumStateClass(validationState),
			toViewClass('withTopToolbar', withTopToolbar),
		)

		const datetime: Date | null = useMemo(() => {
			if (value) {
				return new Date(value)
			}

			return null
		}, [value])

		const hiddenRef = useRef<HTMLInputElement>(null)
		const [date, setDate] = useState(datetime ? dateToDateValue(datetime) : '')
		const [time, setTime] = useState(datetime ? dateToTimeValue(datetime) : '')

		const onDateChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
			setDate(event.target.value)
		}, [])

		const onTimeChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
			setTime(event.target.value)
		}, [])

		useEffect(() => {
			if (hiddenRef.current && date && time) {
				setNativeValue(hiddenRef.current, `${date}T${time}`)
			}
		}, [hiddenRef, date, time])

		return <>
			<Stack direction="horizontal">
				<VisuallyHidden>
					<input ref={hiddenRef} {...rest} type="text" tabIndex={-1} />
				</VisuallyHidden>
				<input
					ref={ref}
					className={finalClassName}
					onChange={onDateChange}
					type="date"
					value={date}
				/>
				<input
					className={finalClassName}
					onChange={onTimeChange}
					type="time"
					value={time}
				/>
			</Stack>
    </>
	}),
)
FallbackDateTimeInput.displayName = 'FallbackDateTimeInput'
