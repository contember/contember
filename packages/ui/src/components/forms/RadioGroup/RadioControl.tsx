import classnames from 'classnames'
import { memo, ReactNode, useContext, useRef } from 'react'
import { useFocusRing, useHover, useRadio, VisuallyHidden } from 'react-aria'
import { useClassNamePrefix } from '../../../auxiliary'
import { toEnumStateClass, toEnumViewClass, toStateClass } from '../../../utils'
import { RadioContext } from './RadioContext'
import type { RadioOption } from './types'
import { Size, ValidationState } from '../../../types'

interface RadioProps {
	children: ReactNode
	description: ReactNode
	name?: string
	size?: Size
	validationState?: ValidationState
	value: RadioOption['value']
}

export const RadioControl = memo((props: RadioProps) => {
	const { children, description, size, validationState, value } = props

	const prefix = useClassNamePrefix()
	const ref = useRef<HTMLInputElement>(null)

	const state = useContext(RadioContext)
	const { isDisabled, isReadOnly } = state
	const { inputProps } = useRadio(props, state, ref)
	const { isFocusVisible, focusProps } = useFocusRing()
	const { isHovered } = useHover({ isDisabled })

	const isSelected = state.selectedValue === value

	const classList = classnames(
		`${prefix}radio-option`,
		toEnumViewClass(size),
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
			<span className={`${prefix}radio-control`} />
			<span className={`${prefix}radio-label`}>
				<span className={`${prefix}radio-label-main`}>{children}</span>
				{description && <span className={`${prefix}radio-label-description`}>{description}</span>}
			</span>
		</label>
	)
})

RadioControl.displayName = 'Radio'
