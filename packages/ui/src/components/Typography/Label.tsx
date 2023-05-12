import { useClassName } from '@contember/utilities'
import { ReactNode, memo } from 'react'
import { Default, HTMLSpanElementProps, Size } from '../../types'
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

export type LabelProps =
	& LabelOwnProps
	& HTMLSpanElementProps

/**
 * @group UI
 */
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
	return <span className={useClassName('label', [
		toStateClass('active', !isDisabled && isActive),
		toStateClass('focused', !isDisabled && isFocused),
		toStateClass('disabled', isDisabled),
		toStateClass('hover', !isDisabled && isHover),
		toEnumViewClass(size),
		toEnumViewClass(weight),
		className,
	])}>{children}</span>
})

Label.displayName = 'Label'
