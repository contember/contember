import { forwardRef, ReactNode, useCallback } from 'react'
import { useDataViewPagingMethods, useDataViewPagingState } from '../../contexts'
import { Slot } from '@radix-ui/react-slot'
import { dataAttribute } from '@contember/utilities'
import { composeEventHandlers } from '@radix-ui/primitive'

export interface DataViewSetItemsPerPageTriggerAttributes {
	['data-active']?: ''
}

const SlotType = Slot as React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement> & DataViewSetItemsPerPageTriggerAttributes>

export interface DataViewSetItemsPerPageTriggerProps {
	children: ReactNode
	value: number
}

/**
 * A trigger component for setting the number of items per page in a data view.
 *
 * ## Props
 * - **`value`**: The number of items per page to set when the trigger is clicked.
 * - **`children`**: The button element for the items-per-page trigger.
 *
 * ## Data Attributes (applied to `Slot`)
 * - **`data-active`**: Present if the current items-per-page value matches the trigger's `value`.
 *
 * #### Example
 * ```tsx
 * <DataViewSetItemsPerPageTrigger value={10}>
 *     <button>Show 10 Items</button>
 * </DataViewSetItemsPerPageTrigger>
 * <DataViewSetItemsPerPageTrigger value={20}>
 *     <button>Show 20 Items</button>
 * </DataViewSetItemsPerPageTrigger>
 * ```
 */
export const DataViewSetItemsPerPageTrigger = forwardRef<HTMLButtonElement, DataViewSetItemsPerPageTriggerProps>(
	({ value, ...props }: DataViewSetItemsPerPageTriggerProps, ref) => {
		const { setItemsPerPage } = useDataViewPagingMethods()
		const { itemsPerPage: current } = useDataViewPagingState()

		const setItems = useCallback(() => {
			setItemsPerPage(value)
		}, [setItemsPerPage, value])

		const { onClick, ...otherProps } = props as React.ButtonHTMLAttributes<HTMLButtonElement>

		return (
			<SlotType
				ref={ref}
				onClick={composeEventHandlers(onClick, setItems)}
				data-active={dataAttribute(value === current)}
				{...otherProps}
			/>
		)
	},
)

DataViewSetItemsPerPageTrigger.displayName = 'DataViewSetItemsPerPageTrigger'
