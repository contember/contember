import classNames from 'classnames'
import { AllHTMLAttributes, ForwardedRef, forwardRef, memo } from 'react'
import TextareaAutosize, { TextareaAutosizeProps } from 'react-textarea-autosize'
import { useComponentClassName } from '../../../auxiliary'
import { toViewClass } from '../../../utils'
import type { ControlProps, ControlPropsKeys } from '../Types'
import { useTextBasedInput } from '../hooks/useTextBasedInput'

export interface UnderlyingElementProps extends Omit<AllHTMLAttributes<HTMLTextAreaElement>, ControlPropsKeys<string>> {}

export interface TextareaInputOwnProps {
	withTopToolbar?: boolean
	minRows?: number
}

export type TextareaInputProps = ControlProps<string> & TextareaInputOwnProps & UnderlyingElementProps & {
	style?: TextareaAutosizeProps['style'],
}

export const TextareaInput = memo(
	forwardRef(({
		className,
		minRows,
		style,
		withTopToolbar,
		...outerProps
	}: TextareaInputProps, forwardedRed: ForwardedRef<HTMLTextAreaElement>) => {
		const props = useTextBasedInput<HTMLTextAreaElement>({
			...outerProps,
			className: classNames(
				useComponentClassName('textarea-input'),
				toViewClass('withTopToolbar', withTopToolbar),
				className,
			),
		}, forwardedRed)

		return <TextareaAutosize
			{...props}
			cacheMeasurements={true}
			minRows={minRows}
			style={style}
		/>
	}),
)
TextareaInput.displayName = 'TextareaInput'
