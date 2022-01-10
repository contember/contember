import cn from 'classnames'
import { memo, ReactNode, useRef } from 'react'
import { mergeProps, useCheckbox, useFocusRing, useHover, VisuallyHidden } from 'react-aria'
import { useToggleState } from 'react-stately'
import { useClassNamePrefix } from '../../../auxiliary'
import type { Size, ValidationState } from '../../../types'
import { toEnumStateClass, toStateClass } from '../../../utils'
import { CheckboxButton as DefaultCheckboxButton } from './CheckboxButton'
import { FieldContainer } from '../FieldContainer'

export interface CheckboxProps {
	CheckboxButtonComponent?: typeof DefaultCheckboxButton
	children: ReactNode
	isDisabled?: boolean
	labelDescription?: ReactNode
	onChange: (newValue: boolean) => void
	size?: Size
	validationState?: ValidationState
	value: boolean | null
}

export const Checkbox = memo(
	({ CheckboxButtonComponent, value, onChange, size, isDisabled, children, labelDescription, validationState }: CheckboxProps) => {
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
			toEnumStateClass(validationState),
			toStateClass('focused', isFocusVisible),
			toStateClass('checked', value === true),
			toStateClass('indeterminate', value === null),
			toStateClass('disabled', isDisabled),
			toStateClass('readonly', inputProps.readOnly),
			toStateClass('hovered', isHovered),
		)

		const CheckboxButton = CheckboxButtonComponent ?? DefaultCheckboxButton

		return (
			<label {...hoverProps} className={finalClassName}>
				<FieldContainer
					useLabelElement={false}
					size={size}
					label={children}
					labelDescription={labelDescription}
					labelPosition="labelInlineRight"
				>
					<VisuallyHidden>
						<input {...mergeProps(inputProps, focusProps)} ref={checkboxRef} />
					</VisuallyHidden>

					<CheckboxButton
						isFocused={isFocusVisible}
						isChecked={value === true}
						isIndeterminate={value === null}
						isDisabled={isDisabled}
						isReadonly={inputProps.readOnly}
						isHovered={isHovered}
						isInvalid={validationState === 'invalid'}
					/>
				</FieldContainer>
			</label>
		)
	},
)
Checkbox.displayName = 'Checkbox'
