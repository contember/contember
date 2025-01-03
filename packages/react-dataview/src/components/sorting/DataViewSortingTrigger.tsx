import { forwardRef, MouseEvent, ReactElement, useCallback } from 'react'
import { useDataViewSortingMethods, useDataViewSortingState } from '../../contexts'
import { Slot } from '@radix-ui/react-slot'
import { dataAttribute } from '@contember/utilities'
import { DataViewSortingDirection, DataViewSortingDirectionAction } from '../../types'
import { composeEventHandlers } from '@radix-ui/primitive'

export interface DataViewSortingTriggerAttributes {
	['data-active']?: ''
	['data-current']: DataViewSortingDirection | 'none'
}

const SlotType = Slot as React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement> & DataViewSortingTriggerAttributes>

export interface DataViewSortingTriggerProps {
	action?: DataViewSortingDirectionAction
	field: string
	children: ReactElement
}

const actionToState: Record<Exclude<DataViewSortingDirectionAction, null>, DataViewSortingDirection> = {
	asc: 'asc',
	desc: 'desc',
	toggleAsc: 'asc',
	toggleDesc: 'desc',
	next: null,
	clear: null,
}

/**
 * A trigger component for managing sorting in a data view.
 * - Clicking the trigger updates the sorting state for the specified field.
 * - Supports multi-sorting if `ctrl` or `meta` key is held during the click.
 * - The trigger updates `data-active` and `data-current` attributes based on the current state.
 *
 * ## Props
 * - **`action`**: Defines how the sorting direction should be updated:
 *   - `'asc'`: Sets sorting direction to ascending.
 *   - `'desc'`: Sets sorting direction to descending.
 *   - `'toggleAsc'`: Toggles the ascending direction (activates if not active, deactivates if already active).
 *   - `'toggleDesc'`: Toggles the descending direction.
 *   - `'next'`: Cycles to the next sorting state (e.g., `asc` → `desc` → `clear`).
 *   - `'clear'`: Removes sorting for the field.
 * - **`field`**: The name of the field being sorted.
 * - **`children`**: The button element for the sorting trigger.
 *
 * ## Data Attributes (applied to `Slot`)
 * - **`data-active`**: Present if the current sorting state matches the specified action.
 * - **`data-current`**: Reflects the current sorting state for the field:
 *   - `'asc'`: Sorted in ascending order.
 *   - `'desc'`: Sorted in descending order.
 *   - `'none'`: No sorting applied.
 *
 * ## Example
 * ```tsx
 * <DataViewSortingTrigger field="name" action="next">
 *     <button>Sort by Name</button>
 * </DataViewSortingTrigger>
 * ```
 */
export const DataViewSortingTrigger = forwardRef<HTMLButtonElement, DataViewSortingTriggerProps>(
	({ action = 'next', field, ...props }: DataViewSortingTriggerProps, ref) => {
		const { setOrderBy } = useDataViewSortingMethods()
		const orderDirections = useDataViewSortingState()

		const orderDirection = orderDirections.directions[field]
		const changeOrder = useCallback(
			(e: MouseEvent) => {
				setOrderBy(field, action, e.ctrlKey || e.metaKey)
			},
			[field, action, setOrderBy],
		)

		const active = !!action && action !== 'next' && orderDirection === actionToState[action]

		const { onClick, ...otherProps } = props as React.ButtonHTMLAttributes<HTMLButtonElement>


		return (
			<SlotType
				ref={ref}
				onClick={composeEventHandlers(onClick, changeOrder)}
				data-active={dataAttribute(active)}
				data-current={orderDirection ?? 'none'}
				{...otherProps}
			/>
		)
	},
)

DataViewSortingTrigger.displayName = 'DataViewSortingTrigger'
