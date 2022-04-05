import cn from 'classnames'
import {
	ChangeEventHandler,
	ComponentType,
	DetailedHTMLProps,
	forwardRef,
	memo,
	OptionHTMLAttributes,
	Ref,
	RefAttributes,
} from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import type { ControlDistinction, Size, ValidationState } from '../../types'
import { toEnumStateClass, toEnumViewClass } from '../../utils'

export interface SelectOption {
	value: string | number
	label: string
	disabled?: boolean
}

export type SelectProps = Omit<JSX.IntrinsicElements['select'], 'children' | 'size'> & {
	onChange: ChangeEventHandler<HTMLSelectElement>
	options: SelectOption[]
	value: SelectOption['value']

	size?: Size
	distinction?: ControlDistinction
	validationState?: ValidationState
	readOnly?: boolean
}

export const Select: ComponentType<SelectProps & RefAttributes<HTMLSelectElement>> = memo(
	forwardRef(
		(
			{ size, distinction, validationState, className, options, ...otherProps }: SelectProps,
			ref: Ref<HTMLSelectElement>,
		) => {
			const prefix = useClassNamePrefix()
			const baseClassName = cn(toEnumViewClass(size), toEnumViewClass(distinction), toEnumStateClass(validationState))
			const selectClassName = cn(`${prefix}select`, className, baseClassName)
			const wrapperClassName = cn(`${prefix}select-wrapper`, baseClassName)

			return (
				<div className={wrapperClassName}>
					<select className={selectClassName} {...otherProps} ref={ref}>
						{options.map(option => {
							return <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>
						})}
					</select>
				</div>
			)
		},
	),
)
