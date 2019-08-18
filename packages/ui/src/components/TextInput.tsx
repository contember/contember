import { ChangeEventHandler } from 'react'
import * as React from 'react'
import cn from 'classnames'
import TextareaAutosize from 'react-textarea-autosize'
import { Size } from '../types'
import { toViewClass } from '../utils'

interface TextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
	allowNewlines: true
	minRows?: number
}

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
	allowNewlines?: false
}

export type TextInputProps = {
	value: string
	size?: Size
	onChange: (newValue: string) => void
} & (TextAreaProps | InputProps)

export const TextInput = React.memo(
	React.forwardRef((props: TextInputProps, ref) => {
		const finalClassName = cn('input', toViewClass(props.size), props.className)
		const innerOnChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = event =>
			props.onChange(event.target.value)

		if (props.allowNewlines) {
			const { className, size, onChange, ...otherProps } = props
			return (
				<TextareaAutosize
					ref={ref as any}
					className={finalClassName}
					onChange={innerOnChange}
					useCacheForDOMMeasurements
					{...otherProps}
				/>
			)
		}
		const { className, size, onChange, ...otherProps } = props
		return <input ref={ref as any} type="text" className={finalClassName} onChange={innerOnChange} {...otherProps} />
	}),
)
