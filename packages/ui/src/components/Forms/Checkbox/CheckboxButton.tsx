import classNames from 'classnames'
import { useComponentClassName } from '../../../auxiliary'
import { toStateClass } from '../../../utils'
import { useInputClassName } from '../Hooks'
import { NonOptionalVisuallyDependentControlProps } from '../Types'

export interface CheckboxButtonProps extends NonOptionalVisuallyDependentControlProps {
	checked?: boolean | null
	indeterminate?: boolean
}

/**
 * @group Forms UI
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
	const componentClassName = useComponentClassName('checkbox-button')

	return (
		<span
			id={id}
			className={classNames(
				componentClassName,
				toStateClass('checked', checked === true),
				toStateClass('indeterminate', indeterminate),
				useInputClassName(props),
			)}
			children={indeterminate
				? <span aria-hidden="true" className={`${componentClassName}-questionmark`}>?</span>
				: undefined}
			style={style}
		/>
	)
}
