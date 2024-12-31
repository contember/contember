import * as React from 'react'
import { forwardRef, ReactElement, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { composeEventHandlers } from '@radix-ui/primitive'
import { dataAttribute } from '@contember/utilities'
import { DataViewNullFilterState, DataViewSetNullFilterAction, useDataViewNullFilter } from '../../../hooks'
import { useDataViewFilterName } from '../../../contexts'

export interface DataViewNullFilterTriggerAttributes {
	['data-active']?: ''
	['data-current']: DataViewNullFilterState
}

const SlotType = Slot as React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement> & DataViewNullFilterTriggerAttributes>

export interface DataViewNullFilterTriggerProps {
	/**
	 * The name of the filter. If not provided, the component will attempt to infer it from the context.
	 */
	name?: string
	/**
	 * - **`action`**: Determines how the filter behaves when the button is clicked:
	 *   - `'include'`: Sets the filter to include null values.
	 *   - `'exclude'`: Sets the filter to exclude null values.
	 *   - `'unset'`: Removes the filter.
	 *   - `'toggleInclude'`: Toggles the value in the inclusion filter.
	 *   - `'toggleExclude'`: Toggles the value in the exclusion filter.
	 */
	action: DataViewSetNullFilterAction
	/**
	 * The button element.
	 */
	children: ReactElement
}

/**
 *
 * A trigger component for managing null filters in a data view.
 *
 * ## Props
 * - name, action, children
 *
 * See {@link DataViewNullFilterTriggerProps} for details.
 *
 * ## Data Attributes (applied to `Slot`)
 * - **`data-active`**: Present if the current filter state matches the action.
 * - **`data-current`**: Indicates the current filter state, which can be:
 *   - `'include'`: Null values are included in the filter.
 *   - `'exclude'`: Null values are excluded from the filter.
 *   - `'none'`: The filter is not active.
 *
 * ## Example
 * ```tsx
 * <DataViewNullFilterTrigger action="toggleInclude">
 *     <button>Include Nulls</button>
 * </DataViewNullFilterTrigger>
 * ```
 */
export const DataViewNullFilterTrigger = forwardRef<HTMLButtonElement, DataViewNullFilterTriggerProps>(
	({ name, action, ...props }: DataViewNullFilterTriggerProps, ref) => {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		name ??= useDataViewFilterName()
		const [current, setFilter] = useDataViewNullFilter(name)
		const toggleFilter = useCallback(() => {
			setFilter(action)
		}, [action, setFilter])
		const { onClick, ...otherProps } = props as React.ButtonHTMLAttributes<HTMLButtonElement>

		return (
			<SlotType
				ref={ref}
				onClick={composeEventHandlers(onClick, toggleFilter)}
				data-active={dataAttribute(current === actionToState[action])}
				data-current={current}
				{...otherProps}
			/>
		)
	},
)

DataViewNullFilterTrigger.displayName = 'DataViewNullFilterTrigger'

const actionToState: Record<DataViewSetNullFilterAction, DataViewNullFilterState> = {
	exclude: 'exclude',
	include: 'include',
	unset: 'none',
	toggleInclude: 'include',
	toggleExclude: 'exclude',
}
