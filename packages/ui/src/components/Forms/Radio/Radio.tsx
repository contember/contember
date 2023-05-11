import classNames from 'classnames'
import { ComponentType, memo } from 'react'
import { useRadioGroup } from 'react-aria'
import { useRadioGroupState } from 'react-stately'
import { useClassNamePrefix } from '../../../auxiliary'
import type { Size, ValidationState } from '../../../types'
import { toEnumStateClass, toEnumViewClass } from '../../../utils'
import { RadioButtonProps } from './RadioButton'
import { RadioContext } from './RadioContext'
import { RadioControl } from './RadioControl'
import type { RadioOption } from './types'

export interface RadioProps {
	RadioButtonComponent?: ComponentType<RadioButtonProps>
	disabled?: boolean
	name?: string
	onChange: (newValue: string) => void
	options: RadioOption[]
	orientation?: 'horizontal' | 'vertical'
	readOnly?: boolean
	size?: Size
	validationState?: ValidationState
	value?: string
}

// TODO: Maybe extract later for reuse
function deriveAriaValidationState(validationState?: ValidationState): 'valid' | 'invalid' | undefined {
	if (validationState === 'valid') {
		return 'valid'
	}
	if (validationState === 'invalid') {
		return 'invalid'
	}

	return undefined
}

/**
 * @group Forms UI
 */
export const Radio = memo((props: RadioProps) => {
	const { name, options, orientation, size, validationState, RadioButtonComponent } = props

	const prefix = useClassNamePrefix()

	const ariaRadioGroupProps = {
		...props,
		validationState: deriveAriaValidationState(validationState),
	}

	const state = useRadioGroupState(ariaRadioGroupProps)
	const { radioGroupProps } = useRadioGroup(ariaRadioGroupProps, state)

	const classList = classNames(
		`${prefix}radio`,
		toEnumStateClass(validationState),
		toEnumViewClass(orientation ?? 'vertical'),
	)

	return (
		<div className={classList} {...radioGroupProps}>
			<RadioContext.Provider value={state}>
				{options.map(({ value, label, labelDescription }: RadioOption) => (
					<RadioControl
						key={value}
						RadioButtonComponent={RadioButtonComponent}
						name={name}
						value={value}
						validationState={validationState}
						description={labelDescription}
						size={size}
					>
						{label}
					</RadioControl>
				))}
			</RadioContext.Provider>
		</div>
	)
})

Radio.displayName = 'Radio'
