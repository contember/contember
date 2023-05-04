import classNames from 'classnames'
import { forwardRef, memo, ReactNode, useState } from 'react'
import { useFocus, useFocusVisible } from 'react-aria'
import { useClassNamePrefix } from '../../auxiliary'
import { toStateClass } from '../../utils'
import { Label } from '../Typography'
import { HTMLButtonElementProps } from '../../types'

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
	const prefix = `${useClassNamePrefix()}tab-button`
	const [isFocused, setIsFocused] = useState(false)
	const { isFocusVisible } = useFocusVisible()

	const classList = classNames(
		`${prefix}`,
		toStateClass('selected', !isDisabled && isSelected),
		toStateClass('focused', !isDisabled && isFocused && isFocusVisible),
		toStateClass('disabled', isDisabled),
	)

	const { focusProps } = useFocus({
		isDisabled,
		onFocusChange: setIsFocused,
	})

	return (
		<button
			{...focusProps}
			{...rest}
			className={classList}
			ref={ref}
			disabled={isDisabled}
		>
  			<span className={`${prefix}-label`}>
				{typeof children === 'string'
	  			? <Label isActive={isSelected} isDisabled={isDisabled} isFocused={isFocused && isFocusVisible}>{children}</Label>
	  			: children}
			</span>
		</button>
	)
}))

TabButton.displayName = 'TabButton'
