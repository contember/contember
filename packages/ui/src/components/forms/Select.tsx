import cn from 'classnames'
import * as React from 'react'
import ReactDOMServer from 'react-dom/server'
import { ControlDistinction, Size, ValidationState } from '../../types'
import { toEnumStateClass, toEnumViewClass } from '../../utils'

export interface SelectOption {
	value: string | number
	label: React.ReactNode
	disabled?: boolean
}

export type SelectProps = Omit<JSX.IntrinsicElements['select'], 'children' | 'size'> & {
	onChange: React.ChangeEventHandler<HTMLSelectElement>
	options: SelectOption[]
	value: SelectOption['value']

	size?: Size
	distinction?: ControlDistinction
	validationState?: ValidationState
	readOnly?: boolean
}

export const Select = React.memo(
	React.forwardRef(
		(
			{ size, distinction, validationState, className, options, ...otherProps }: SelectProps,
			ref: React.Ref<HTMLSelectElement>,
		) => {
			const baseClassName = cn(toEnumViewClass(size), toEnumViewClass(distinction), toEnumStateClass(validationState))
			const selectClassName = cn('select', className, baseClassName)
			const wrapperClassName = cn('select-wrapper', baseClassName)

			/*
				This is a super ugly workaround to React's unfortunate limitation that all <option> contents must be just
				strings, otherwise it will just call .toString() which, in our case, would result into '[object Object]'.

				We, however, need to support JSX in order to allow for custom field formatting, and the like. It does,
				of course, depend on people only attempting to render components that render just text but that is fine.

				Relevant issue: https://github.com/facebook/react/issues/13586
			*/
			return (
				<div className={wrapperClassName}>
					<select className={selectClassName} {...otherProps} ref={ref}>
						{options.map(option => {
							const optionProps: React.DetailedHTMLProps<
								React.OptionHTMLAttributes<HTMLOptionElement>,
								HTMLOptionElement
							> = {
								value: option.value,
								disabled: option.disabled,
								key: option.value,
							}
							if (typeof option.label === 'object' && option.label !== null) {
								optionProps.dangerouslySetInnerHTML = {
									__html: ReactDOMServer.renderToStaticMarkup(option.label as React.ReactElement),
								}
							} else {
								optionProps.children = option.label
							}
							return <option {...optionProps} />
						})}
					</select>
				</div>
			)
		},
	),
)
