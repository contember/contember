import { useClassNameFactory } from '@contember/utilities'
import { forwardRef, memo, ReactNode, useState } from 'react'
import { useFocus, useFocusVisible } from 'react-aria'
import { HTMLButtonElementProps } from '../../types'
import { toStateClass } from '../../utils'
import { Label } from '../Typography'

export type TabButtonProps =
	& {
		isSelected?: boolean
		isDisabled?: boolean
		children: ReactNode
	}
	& Omit<HTMLButtonElementProps, 'ref'>

/**
 * @group UI
 */
export const TabButton = memo(forwardRef<HTMLButtonElement, TabButtonProps>(({
	isSelected,
	isDisabled = false,
	children,
	...rest
}, ref) => {
	const componentClassName = useClassNameFactory('tab-button')
	const [isFocused, setIsFocused] = useState(false)
	const { isFocusVisible } = useFocusVisible()

	const { focusProps } = useFocus({
		isDisabled,
		onFocusChange: setIsFocused,
	})

	return (
		<button
			{...focusProps}
			{...rest}
			className={componentClassName(null, [
				toStateClass('selected', !isDisabled && isSelected),
				toStateClass('focused', !isDisabled && isFocused && isFocusVisible),
				toStateClass('disabled', isDisabled),
			])}
			ref={ref}
			disabled={isDisabled}
		>
			<span className={componentClassName('label')}>
				{typeof children === 'string'
					? <Label isActive={isSelected} isDisabled={isDisabled} isFocused={isFocused && isFocusVisible}>{children}</Label>
					: children}
			</span>
		</button>
	)
}))

TabButton.displayName = 'TabButton'
