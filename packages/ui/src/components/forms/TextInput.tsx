import cn from 'classnames'
import * as React from 'react'
import { ChangeEventHandler } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { ControlDistinction, ControlFlow, Size, ValidationState } from '../../types'
import { toEnumStateClass, toViewClass } from '../../utils'

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
	distinction?: ControlDistinction
	flow?: ControlFlow
	validationState?: ValidationState
	onChange: (newValue: string) => void
} & (TextAreaProps | InputProps)

export const TextInput = React.memo(
	React.forwardRef(
		({ className, size, distinction, flow, validationState, onChange, ...otherProps }: TextInputProps, ref) => {
			const finalClassName = cn(
				'input',
				toViewClass(size),
				toViewClass(distinction),
				toViewClass(flow),
				toEnumStateClass(validationState),
				className,
			)
			const innerOnChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = event =>
				onChange(event.target.value)

			if (otherProps.allowNewlines) {
				const { allowNewlines, ...textareaProps } = otherProps
				return (
					<TextareaAutosize
						ref={ref as any}
						className={finalClassName}
						onChange={innerOnChange}
						useCacheForDOMMeasurements
						{...textareaProps}
					/>
				)
			}
			const { allowNewlines, ...inputProps } = otherProps
			return <input ref={ref as any} type="text" className={finalClassName} onChange={innerOnChange} {...inputProps} />
		},
	),
)
