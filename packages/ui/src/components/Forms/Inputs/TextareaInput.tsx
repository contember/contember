import { useClassName } from '@contember/utilities'
import { AllHTMLAttributes, ForwardedRef, forwardRef, memo } from 'react'
import TextareaAutosize, { TextareaAutosizeProps } from 'react-textarea-autosize'
import { toViewClass } from '../../../utils'
import { useTextBasedInput } from '../Hooks'
import type { ControlProps, ControlPropsKeys } from '../Types'

export interface UnderlyingElementProps extends Omit<AllHTMLAttributes<HTMLTextAreaElement>, ControlPropsKeys<string>> { }

export interface TextareaInputOwnProps {
	withTopToolbar?: boolean
	minRows?: number
}

export type TextareaInputProps = ControlProps<string> & TextareaInputOwnProps & {
	style?: TextareaAutosizeProps['style'];
}

/**
 * @group Forms UI
 */
export const TextareaInput = memo(forwardRef(({
	className,
	minRows,
	style,
	withTopToolbar,
	...outerProps
}: TextareaInputProps & UnderlyingElementProps, forwardedRed: ForwardedRef<HTMLTextAreaElement>) => {
	const props = useTextBasedInput<HTMLTextAreaElement>({
		...outerProps,
		className: useClassName('textarea-input', [
			toViewClass('withTopToolbar', withTopToolbar),
			className,
		]),
	}, forwardedRed)

	return <TextareaAutosize
		{...props}
		cacheMeasurements={true}
		minRows={minRows}
		style={style}
	/>
}))
TextareaInput.displayName = 'TextareaInput'
