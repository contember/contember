import cn from 'classnames'
import * as React from 'react'
import { ChangeEventHandler } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { ControlDistinction, Size, ValidationState } from '../../types'
import { toEnumStateClass, toEnumViewClass, toViewClass } from '../../utils'

type PropWhiteList = 'autoComplete' | 'disabled' | 'placeholder' | 'readOnly'

interface TextAreaProps extends Pick<React.TextareaHTMLAttributes<HTMLTextAreaElement>, PropWhiteList> {
	allowNewlines?: true
	minRows?: number
}

interface InputProps extends Pick<React.InputHTMLAttributes<HTMLInputElement>, PropWhiteList | 'type'> {
	allowNewlines?: false
}

export type TextInputProps = {
	value: string
	onChange: (newValue: string) => void

	size?: Size
	distinction?: ControlDistinction
	validationState?: ValidationState
	withTopToolbar?: boolean
	readOnly?: boolean
} & (TextAreaProps | InputProps)

export const TextInput = React.memo(
	React.forwardRef(
		({ size, distinction, validationState, onChange, withTopToolbar, ...otherProps }: TextInputProps, ref) => {
			const finalClassName = cn(
				'input',
				toEnumViewClass(size),
				toEnumViewClass(distinction),
				toEnumStateClass(validationState),
				toViewClass('withTopToolbar', withTopToolbar),
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
