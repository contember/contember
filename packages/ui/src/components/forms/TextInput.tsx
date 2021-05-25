import cn from 'classnames'
import { ChangeEventHandler, createElement, forwardRef, memo, Ref } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { useComponentClassName } from '../../auxiliary'
import type { ControlDistinction, Size, ValidationState } from '../../types'
import { toEnumStateClass, toEnumViewClass, toViewClass } from '../../utils'

type PropBlackList = 'onChange' | 'ref' | 'defaultValue' | 'size'

type UnderlyingTextAreaProps = Omit<JSX.IntrinsicElements['textarea'], PropBlackList> & {
	allowNewlines: true
	minRows?: number
}

type UnderlyingInputProps = Omit<JSX.IntrinsicElements['input'], PropBlackList> & {
	allowNewlines?: false
}

export interface TextInputOwnProps {
	value: string
	onChange: ChangeEventHandler<HTMLTextAreaElement | HTMLInputElement>

	size?: Size
	distinction?: ControlDistinction
	validationState?: ValidationState
	withTopToolbar?: boolean
	readOnly?: boolean
}

export type TextInputProps = TextInputOwnProps & (UnderlyingTextAreaProps | UnderlyingInputProps)

export type SingleLineTextInputProps = TextInputOwnProps & UnderlyingInputProps
export type MultiLineTextInputProps = TextInputOwnProps & UnderlyingTextAreaProps

export const TextInput = memo(
	forwardRef(({ size, distinction, validationState, withTopToolbar, ...otherProps }: TextInputProps, ref: Ref<any>) => {
		const finalClassName = cn(
			useComponentClassName('input'),
			toEnumViewClass(size),
			toEnumViewClass(distinction),
			toEnumStateClass(validationState),
			toViewClass('withTopToolbar', withTopToolbar),
		)

		if (otherProps.allowNewlines) {
			const { allowNewlines, style, ...textareaProps } = otherProps

			// Casting because the typings are currently just wrong. The actual library now supplies its own but
			// a storybook dependency requires an ancient version of the definitely typed package from before that.
			return createElement(TextareaAutosize, {
				ref: ref,
				className: finalClassName,
				cacheMeasurements: true,
				style: style as any,
				...textareaProps,
			} as any)
		}
		const { allowNewlines, ...inputProps } = otherProps
		return <input ref={ref} type="text" className={finalClassName} {...inputProps} />
	}),
)
TextInput.displayName = 'TextInput'
