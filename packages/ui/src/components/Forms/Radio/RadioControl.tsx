import classnames from 'classnames'
import { ComponentType, memo, ReactNode, useContext, useRef } from 'react'
import { useFocusRing, useHover, useRadio, VisuallyHidden } from 'react-aria'
import { useClassNamePrefix } from '../../../auxiliary'
import { Size, ValidationState } from '../../../types'
import { toEnumStateClass, toStateClass } from '../../../utils'
import { FieldContainer } from '../FieldContainer'
import { RadioButton as DefaultRadioButton, RadioButtonProps } from './RadioButton'
import { RadioContext } from './RadioContext'
import type { RadioOption } from './types'

export interface RadioControlProps {
	RadioButtonComponent?: ComponentType<RadioButtonProps>
	children: ReactNode
	description: ReactNode
	name?: string
	validationState?: ValidationState
	value: RadioOption['value']
	size?: Size
}

/**
 * @group Forms UI
 */
export const RadioControl = memo(({ RadioButtonComponent, description, size, validationState, ...props }: RadioControlProps) => {
	const { children, value } = props

	const componentClassName = `${useClassNamePrefix()}radio-control`
	const ref = useRef<HTMLInputElement>(null)

	const state = useContext(RadioContext)
	const { isDisabled, isReadOnly } = state
	const { inputProps } = useRadio(props, state, ref)
	const { isFocusVisible, focusProps } = useFocusRing()
	const { isHovered } = useHover({ isDisabled })

	const isSelected = state.selectedValue === value

	const classList = classnames(
		componentClassName,
		toEnumStateClass(validationState),
		toStateClass('focused', isFocusVisible),
		toStateClass('checked', isSelected),
		toStateClass('indeterminate', state.selectedValue === null),
		toStateClass('disabled', isDisabled),
		toStateClass('readonly', isReadOnly),
		toStateClass('hovered', isHovered),
	)

	const RadioButton = RadioButtonComponent ?? DefaultRadioButton

	return (
		<label className={classList}>
			<FieldContainer
				useLabelElement={false}
				size={size}
				label={children}
				labelDescription={description}
				labelPosition="labelInlineRight"
			>
				<VisuallyHidden>
					<input {...inputProps} {...focusProps} ref={ref} />
				</VisuallyHidden>

				<RadioButton
					focused={isFocusVisible}
					checked={isSelected}
					indeterminate={value === null}
					disabled={isDisabled}
					readonly={inputProps.readOnly}
					hovered={isHovered}
					invalid={validationState === 'invalid'}
				/>
			</FieldContainer>
		</label>
	)
})

RadioControl.displayName = 'Radio'
