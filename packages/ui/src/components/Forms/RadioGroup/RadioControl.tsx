import classnames from 'classnames'
import { memo, ReactNode, useContext, useRef } from 'react'
import { useFocusRing, useHover, useRadio, VisuallyHidden } from 'react-aria'
import { useClassNamePrefix } from '../../../auxiliary'
import { Size, ValidationState } from '../../../types'
import { toEnumStateClass, toStateClass } from '../../../utils'
import { Label } from '../../Typography/Label'
import { RadioContext } from './RadioContext'
import type { RadioOption } from './types'

interface RadioProps {
	children: ReactNode
	description: ReactNode
	name?: string
	validationState?: ValidationState
	value: RadioOption['value']
	size?: Size
}

export const RadioControl = memo((props: RadioProps) => {
	const { children, description, size, validationState, value } = props

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

	return (
		<label className={classList}>
			<VisuallyHidden>
				<input {...inputProps} {...focusProps} ref={ref} />
			</VisuallyHidden>
			<span className={`${componentClassName}-button`} />
			<span className={`${componentClassName}-label`}>
				<Label size={size}>{children}</Label>
				{description && <span className={`${componentClassName}-label-description`}>{description}</span>}
			</span>
		</label>
	)
})

RadioControl.displayName = 'Radio'
