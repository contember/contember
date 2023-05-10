import classNames from 'classnames'
import { memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import { Default, Size } from '../../types'
import { toEnumViewClass, toStateClass } from '../../utils'

export interface LabelOwnProps {
	isDisabled?: boolean
	isActive?: boolean
	isFocused?: boolean
	isHover?: boolean
	size?: Size
	weight?: Default | 'bold'
	children?: ReactNode
}

export type LabelProps = Omit<LabelOwnProps, 'children'> & JSX.IntrinsicElements['div']

export const Label = memo(({
	className,
	isDisabled,
	isActive,
	isFocused,
	isHover,
	children,
	size,
	weight,
}: LabelProps) => {
	const componentClassName = `${useClassNamePrefix()}label`
	const classList = classNames(
		componentClassName,
		toStateClass('active', !isDisabled && isActive),
		toStateClass('focused', !isDisabled && isFocused),
		toStateClass('disabled', isDisabled),
		toStateClass('hover', !isDisabled && isHover),
		toEnumViewClass(size),
		toEnumViewClass(weight),
		className,
	)

	return <span className={classList}>{children}</span>
})

Label.displayName = 'Label'
