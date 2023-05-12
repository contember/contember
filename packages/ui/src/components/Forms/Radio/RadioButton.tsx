import { useClassNameFactory } from '@contember/utilities'
import { toStateClass } from '../../../utils'

export interface RadioButtonProps {
	focused?: boolean
	checked?: boolean
	indeterminate?: boolean
	disabled?: boolean
	readonly?: boolean
	hovered?: boolean
	invalid?: boolean
}

/**
 * @group Forms UI
 */
export const RadioButton = ({
	checked,
	disabled,
	focused,
	hovered,
	indeterminate,
	readonly,
	invalid,
}: RadioButtonProps) => {
	const componentClassName = useClassNameFactory('radio-button')

	return <span
		className={componentClassName(null, [
			toStateClass('checked', checked),
			toStateClass('disabled', disabled),
			toStateClass('focused', focused),
			toStateClass('hovered', hovered),
			toStateClass('invalid', invalid),
			toStateClass('indeterminate', indeterminate),
			toStateClass('readonly', readonly),
		])}
		children={indeterminate
			? <span aria-hidden="true" className={componentClassName('questionmark')}>?</span>
			: undefined}
	/>
}
