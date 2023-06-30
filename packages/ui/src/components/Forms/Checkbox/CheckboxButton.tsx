import { useClassNameFactory } from '@contember/utilities'
import { toStateClass } from '../../../utils'
import { useInputClassName } from '../Hooks'
import { NonOptionalVisuallyDependentControlProps } from '../Types'

export interface CheckboxButtonProps extends NonOptionalVisuallyDependentControlProps {
	checked?: boolean | null
	indeterminate?: boolean
}

/**
 * @group UI
 */
export const CheckboxButton = ({
	id,
	name,
	placeholder,
	checked,
	indeterminate,
	style,
	...props
}: CheckboxButtonProps) => {
	const componentClassName = useClassNameFactory('checkbox-button')

	return <span
		id={id}
		className={componentClassName(null, [
			toStateClass('checked', checked === true),
			toStateClass('indeterminate', indeterminate),
			useInputClassName(props),
		])}
		children={indeterminate
			? <span aria-hidden="true" className={componentClassName('questionmark')}>?</span>
			: undefined}
	/>
}
