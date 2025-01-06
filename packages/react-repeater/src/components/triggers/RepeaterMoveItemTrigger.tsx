import React, { ReactElement, useCallback } from 'react'
import { RepeaterMoveItemIndex } from '../../types/RepeaterMethods'
import { useRepeaterCurrentEntity, useRepeaterMethods } from '../../contexts'
import { Slot } from '@radix-ui/react-slot'
import { composeEventHandlers } from '@radix-ui/primitive'

const SlotType = Slot as React.ForwardRefExoticComponent<
	React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>
>

/**
 * Props for the {@link RepeaterMoveItemTrigger} component.
 */
export interface RepeaterMoveItemTriggerProps {
	/**
	 * The button element to render inside the trigger.
	 */
	children: ReactElement

	/**
	 * The index to move the current item to.
	 * Can be one of:
	 * - number: Moves the item to the specified index.
	 * - `'first'`: Moves the item to the beginning.
	 * - `'last'`: Moves the item to the end.
	 * - `'previous'`: Moves the item to the previous index.
	 * - `'next'`: Moves the item to the next index.
	 */
	index: RepeaterMoveItemIndex
}

/**
 * A trigger component for moving a repeater item to a new index.
 *
 * ## Props {@link RepeaterMoveItemTriggerProps}
 * - children, index
 *
 * ## Example
 * ```tsx
 * <RepeaterMoveItemTrigger index={'previous'}>
 *   <button>Move Item Up</button>
 * </RepeaterMoveItemTrigger>
 * ```
 */
export const RepeaterMoveItemTrigger = ({
	children,
	index,
	...props
}: RepeaterMoveItemTriggerProps) => {
	const { moveItem } = useRepeaterMethods()
	const entity = useRepeaterCurrentEntity()

	const moveItemHandler = useCallback(() => moveItem?.(entity, index), [moveItem, entity, index])

	const { onClick, ...otherProps } = props as React.ButtonHTMLAttributes<HTMLButtonElement>

	return (
		<SlotType onClick={composeEventHandlers(onClick, moveItemHandler)} {...otherProps}>
			{children}
		</SlotType>
	)
}
