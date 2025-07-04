import React, { ReactElement, useCallback, useMemo } from 'react'
import { RepeaterAddItemIndex } from '../../types/RepeaterMethods'
import { useRepeaterMethods } from '../../contexts'
import { Slot } from '@radix-ui/react-slot'
import { EntityAccessor } from '@contember/react-binding'
import { composeEventHandlers } from '@radix-ui/primitive'

const SlotType = Slot as React.ForwardRefExoticComponent<
	React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>
>

/**
 * Props for the {@link RepeaterAddItemTrigger} component.
 */
export interface RepeaterAddItemTriggerProps {
	/**
	 * The button element to be rendered.
	 */
	children: ReactElement

	/**
	 * The index at which to add the item.
	 * Can be one of:
	 * - number: Adds the item at the specified index.
	 * - `'first'`: Adds the item at the beginning.
	 * - undefined or `'last'`: Adds the item at the end.
	 */
	index?: RepeaterAddItemIndex

	/**
	 * A function to preprocess the entity.
	 */
	preprocess?: EntityAccessor.BatchUpdatesHandler
}

/**
 * A trigger component for adding an item to a repeater.
 *
 * ## Props {@link RepeaterAddItemTriggerProps}
 * - children, ?index, ?preprocess
 *
 * #### Example
 * ```tsx
 * <RepeaterAddItemTrigger index="first">
 *   <button>Add Item</button>
 * </RepeaterAddItemTrigger>
 * ```
 */
export const RepeaterAddItemTrigger = ({
	children,
	index,
	preprocess,
	...props
}: RepeaterAddItemTriggerProps) => {
	const { addItem } = useRepeaterMethods()

	const doAddItem = useCallback(
		() => addItem(index, preprocess),
		[addItem, index, preprocess],
	)

	const { onClick, ...otherProps } = props as React.ButtonHTMLAttributes<HTMLButtonElement>

	return <SlotType onClick={composeEventHandlers(onClick, doAddItem)} {...otherProps}>{children}</SlotType>
}
