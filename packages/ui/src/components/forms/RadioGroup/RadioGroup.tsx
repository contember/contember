import classNames from 'classnames'
import { memo } from 'react'
import { useRadioGroup } from 'react-aria'
import { useRadioGroupState } from 'react-stately'
import type { Size, ValidationState } from '../../../types'
import { useClassNamePrefix } from '../../../auxiliary'
import { toEnumStateClass, toEnumViewClass } from '../../../utils'
import { ErrorList, ErrorListProps } from '../ErrorList'
import { RadioContext } from './RadioContext'
import { RadioControl } from './RadioControl'
import type { RadioOption } from './types'

export interface RadioGroupProps extends ErrorListProps {
	isDisabled?: boolean
	isReadOnly?: boolean
	name?: string
	onChange: (newValue: string) => void
	options: RadioOption[]
	orientation?: 'horizontal' | 'vertical'
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

export const RadioGroup = memo((props: RadioGroupProps) => {
	const { errors, name, options, orientation, size, validationState } = props

	const prefix = useClassNamePrefix()

	const ariaRadioGroupProps = {
		...props,
		validationState: deriveAriaValidationState(validationState),
	}

	const state = useRadioGroupState(ariaRadioGroupProps)
	const { radioGroupProps } = useRadioGroup(ariaRadioGroupProps, state)

	const classList = classNames(
		`${prefix}radio-group`,
		toEnumStateClass(validationState),
		toEnumViewClass(orientation ?? 'vertical'),
	)

	return (
		<div className={classList} {...radioGroupProps}>
			<RadioContext.Provider value={state}>
				{options.map(({ value, label, labelDescription }: RadioOption) => (
					<RadioControl
						key={value}
						name={name}
						value={value}
						validationState={validationState}
						description={labelDescription}
					>
						{label}
					</RadioControl>
				))}
			</RadioContext.Provider>
			{!!errors && (
				<div className={`${prefix}checkbox-errors`}>
					<ErrorList errors={errors} size={size} />
				</div>
			)}
		</div>
	)
})

RadioGroup.displayName = 'RadioGroup'
