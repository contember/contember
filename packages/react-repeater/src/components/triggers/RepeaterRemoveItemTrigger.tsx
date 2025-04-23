import React, { ReactElement, useCallback } from 'react'
import { useRepeaterCurrentEntity, useRepeaterMethods } from '../../contexts'
import { Slot } from '@radix-ui/react-slot'
import { composeEventHandlers } from '@radix-ui/primitive'

const SlotType = Slot as React.ForwardRefExoticComponent<
	React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>
>

/**
 * Props for the {@link RepeaterRemoveItemTrigger} component.
 */
export interface RepeaterRemoveItemTriggerProps {
	/**
	 * The button element to render inside the trigger.
	 */
	children: ReactElement
}

/**
 * A trigger component for removing a repeater item.
 *
 * ## Props {@link RepeaterRemoveItemTriggerProps}
 * - children
 *
 * #### Example
 * ```tsx
 * <RepeaterRemoveItemTrigger>
 *   <button>Remove Item</button>
 * </RepeaterRemoveItemTrigger>
 * ```
 */
export const RepeaterRemoveItemTrigger = ({
	children,
	...props
}: RepeaterRemoveItemTriggerProps) => {
	const { removeItem } = useRepeaterMethods()
	const entity = useRepeaterCurrentEntity()

	const removeItemHandler = useCallback(() => removeItem?.(entity), [removeItem, entity])

	const { onClick, ...otherProps } = props as React.ButtonHTMLAttributes<HTMLButtonElement>

	return (
		<SlotType onClick={composeEventHandlers(onClick, removeItemHandler)} {...otherProps}>
			{children}
		</SlotType>
	)
}
