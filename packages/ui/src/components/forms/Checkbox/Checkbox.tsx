import cn from 'classnames'
import { memo, ReactNode, useRef } from 'react'
import { mergeProps, useCheckbox, useFocusRing, useHover, VisuallyHidden } from 'react-aria'
import { useToggleState } from 'react-stately'
import { useClassNamePrefix } from '../../../auxiliary'
import { Size, ValidationState } from '../../../types'
import { toEnumStateClass, toEnumViewClass, toStateClass } from '../../../utils'
import { ErrorList, ErrorListProps } from '../ErrorList'

export interface CheckboxProps extends ErrorListProps {
	value: boolean | null
	onChange: (newValue: boolean) => void
	children: ReactNode
	labelDescription?: ReactNode

	size?: Size
	validationState?: ValidationState
	isDisabled?: boolean
}

export const Checkbox = memo(
	({ value, onChange, size, isDisabled, children, labelDescription, errors, validationState }: CheckboxProps) => {
		const prefix = useClassNamePrefix()

		const toggleProps: Parameters<typeof useToggleState>[0] = {
			isDisabled,
			children,
			onChange,
			isSelected: value ?? false,
		}

		const toggleState = useToggleState(toggleProps)
		const checkboxRef = useRef<HTMLInputElement>(null)
		const { inputProps } = useCheckbox(
			{
				...toggleProps,
				isIndeterminate: value === null,
			},
			toggleState,
			checkboxRef,
		)

		const { isFocusVisible, focusProps } = useFocusRing()
		const { isHovered, hoverProps } = useHover({ isDisabled })

		const finalClassName = cn(
			`${prefix}checkbox`,
			toEnumViewClass(size),
			toEnumStateClass(validationState),
			//toEnumStateClass(validationState),
			toStateClass('focused', isFocusVisible),
			toStateClass('checked', value === true),
			toStateClass('indeterminate', value === null),
			toStateClass('disabled', isDisabled),
			toStateClass('hovered', isHovered),
		)

		return (
			<label {...hoverProps} className={finalClassName}>
				<VisuallyHidden>
					<input {...mergeProps(inputProps, focusProps)} ref={checkboxRef} />
				</VisuallyHidden>
				<span className={`${prefix}checkbox-tick`} />
				<span className={`${prefix}checkbox-label`}>
					<span className={`${prefix}checkbox-label-main`}>{children}</span>
					{labelDescription && <span className={`${prefix}checkbox-label-description`}>{labelDescription}</span>}
				</span>
				{!!errors && (
					<div className={`${prefix}checkbox-errors`}>
						<ErrorList errors={errors} size={size} />
					</div>
				)}
			</label>
		)
	},
)
Checkbox.displayName = 'Checkbox'
