import { Slot } from '@radix-ui/react-slot'
import { useBlockRepeaterConfig } from '../contexts'
import React, { ReactElement, useCallback, useMemo } from 'react'
import { EntityAccessor } from '@contember/react-binding'
import { RepeaterAddItemIndex, useRepeaterMethods } from '@contember/react-repeater'
import { composeEventHandlers } from '@radix-ui/primitive'


const SlotType = Slot as React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>>

/**
 * Props for the {@link BlockRepeaterAddItemTrigger} component.
 */
export interface BlockRepeaterAddItemTriggerProps {

	/**
	 * The type of the item to add.
	 */
	type: string

	/**
	 * The index at which to add the item.
	 * Can be one of:
	 *  - number: Adds the item at the specified index.
	 *  - `'first'`: Adds the item at the beginning.
	 *  - undefined or `'last'`: Adds the item at the end.
	 */
	index?: RepeaterAddItemIndex

	/**
	 * A function to preprocess the entity.
	 */
	preprocess?: EntityAccessor.BatchUpdatesHandler

	/**
	 * The button element.
	 */
	children: ReactElement
}

/**
 * A trigger component for adding item of given type to a block repeater.
 *
 * ## Props {@link BlockRepeaterAddItemTriggerProps}
 * - type, ?index, ?preprocess, children
 *
 * #### Example
 * ```tsx
 * <BlockRepeaterAddItemTrigger type="image" index="first">
 *     <button>Add Image</button>
 * </BlockRepeaterAddItemTrigger>
 * ```
 */
export const BlockRepeaterAddItemTrigger = ({ preprocess, index, type, ...props }: BlockRepeaterAddItemTriggerProps) => {
	const { discriminatedBy } = useBlockRepeaterConfig()

	const { addItem } = useRepeaterMethods()
	const doAddItem = useCallback(() => addItem(index, (it, options) => {
		it().getField(discriminatedBy).updateValue(type)
		preprocess?.(it, options)
	}), [addItem, discriminatedBy, index, preprocess, type])

	const { onClick, ...otherProps } = props as React.ButtonHTMLAttributes<HTMLButtonElement>

	return <SlotType onClick={composeEventHandlers(onClick, doAddItem)} {...otherProps} />
}
