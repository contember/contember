import classNames from 'classnames'
import { useClassNamePrefix } from '../../../auxiliary'
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
	const componentClassName = `${useClassNamePrefix()}radio-button`

	return <span
		className={classNames(
			`${componentClassName}`,
			toStateClass('checked', checked),
			toStateClass('disabled', disabled),
			toStateClass('focused', focused),
			toStateClass('hovered', hovered),
			toStateClass('invalid', invalid),
			toStateClass('indeterminate', indeterminate),
			toStateClass('readonly', readonly),
		)}
		children={indeterminate
			? <span aria-hidden="true" className={`${componentClassName}-questionmark`}>?</span>
			: undefined}
	/>
}
