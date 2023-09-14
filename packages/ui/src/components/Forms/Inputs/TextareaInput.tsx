import { useAutoHeightTextArea, useClassName, useComposeRef } from '@contember/react-utils'
import { dataAttribute } from '@contember/utilities'
import { AllHTMLAttributes, ForwardedRef, forwardRef, memo, useRef } from 'react'
import { useTextBasedInput } from '../Hooks'
import type { ControlProps, ControlPropsKeys } from '../Types'

export interface UnderlyingElementProps extends Omit<AllHTMLAttributes<HTMLTextAreaElement>, ControlPropsKeys<string> | 'rows'> { }

export type TextareaInputOwnProps =
	| {
		maxRows?: number
		minRows?: number
		rows?: never
	}
	| {
		maxRows?: never
		minRows?: never
		rows?: number
	}


export type TextareaInputProps = ControlProps<string> & TextareaInputOwnProps & {
	focusRing?: boolean
}

/**
 * @group Forms UI
 */
export const TextareaInput = memo(forwardRef(({
	className,
	focusRing = true,
	maxRows,
	minRows,
	rows,
	style,
	...outerProps
}: TextareaInputProps & UnderlyingElementProps, forwardedRef: ForwardedRef<HTMLTextAreaElement>) => {
	if (typeof rows === 'number' && (typeof minRows === 'number' || typeof maxRows === 'number')) {
		throw new Error('TextareaInput: `rows` prop cannot be used with `minRows` or `maxRows` simultaneously')
	}

	minRows = minRows ?? rows ?? 3
	maxRows = maxRows ?? rows ?? Infinity

	if (minRows < 1) {
		throw new Error('TextareaInput: `minRows` prop cannot be less than 1')
	}

	if (maxRows < 1) {
		throw new Error('TextareaInput: `maxRows` prop cannot be less than 1')
	}

	const { value, ref: _INTENTIONALLY_OMITTED_REF_, ...props } = useTextBasedInput<HTMLTextAreaElement>({
		...outerProps,
		className: useClassName('textarea-input', className),
	}, forwardedRef)

	const innerRef = useRef<HTMLTextAreaElement>(null)
	const composeRef = useComposeRef(forwardedRef, innerRef)

	useAutoHeightTextArea(innerRef, value ? `${value}` : '', minRows, maxRows)

	return (
		<textarea
			{...props}
			ref={composeRef}
			data-rows={dataAttribute(rows)}
			data-min-rows={dataAttribute(minRows)}
			data-max-rows={dataAttribute(maxRows)}
			data-focus-ring={dataAttribute(focusRing)}
			value={value}
			style={style}
			rows={minRows}
		/>
	)
}))
TextareaInput.displayName = 'TextareaInput'
