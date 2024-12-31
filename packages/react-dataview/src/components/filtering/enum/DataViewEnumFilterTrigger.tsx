import * as React from 'react'
import { forwardRef, ReactElement, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { composeEventHandlers } from '@radix-ui/primitive'
import { dataAttribute } from '@contember/utilities'
import { DataViewEnumFilterCurrent, DataViewSetEnumFilterAction, useDataViewEnumFilter } from '../../../hooks'
import { useDataViewFilterName } from '../../../contexts'

export interface DataViewEnumFilterTriggerAttributes {
	['data-active']?: ''
	['data-current']: DataViewEnumFilterCurrent
}

const SlotType = Slot as React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement> & DataViewEnumFilterTriggerAttributes>

export interface DataViewEnumFilterTriggerProps {

	/**
	 * The name of the filter. If not provided, the component will attempt to infer it from the context.
	 */
	name?: string

	/**
	 * Specifies the enum value this button represents.
	 */
	value: string

	/**
	 * Determines how the filter behaves when the button is clicked:
	 *  - `'include'`: Sets the filter to include the value.
	 *  - `'exclude'`: Sets the filter to exclude the value.
	 *  - `'unset'`: Removes the filter.
	 *  - `'toggleInclude'`: Toggles the value in the inclusion filter.
	 *  - `'toggleExclude'`: Toggles the value in the exclusion filter.
	 */
	action?: DataViewSetEnumFilterAction

	/**
	 * The button element.
	 */
	children: ReactElement
}

/**
 * A trigger component for managing enum filters in a data view.
 *
 * ## Props
 * - name, value, action, children
 *
 * See {@link DataViewEnumFilterTriggerProps} for details.
 *
 * ## Data Attributes (applied to `Slot`)
 * - **`data-active`**: Present if the `value` matches the current filter state and action.
 * - **`data-current`**: Indicates the current filter state, which can be:
 *   - `'include'`: The filter includes the specified `value`.
 *   - `'exclude'`: The filter excludes the specified `value`.
 *   - `'none'`: The filter is not active.
 *
 * ## Example
 * ```tsx
 * <DataViewEnumFilterTrigger value="optionA" action="toggleInclude">
 *     <button>Include Option A</button>
 * </DataViewEnumFilterTrigger>
 * ```
 */
export const DataViewEnumFilterTrigger = forwardRef<HTMLButtonElement, DataViewEnumFilterTriggerProps>(
	({ name, action = 'include', value, ...props }: DataViewEnumFilterTriggerProps, ref) => {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		name ??= useDataViewFilterName()
		const [current, setFilter] = useDataViewEnumFilter(name, value)
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

DataViewEnumFilterTrigger.displayName = 'DataViewEnumFilterTrigger'

const actionToState: Record<DataViewSetEnumFilterAction, DataViewEnumFilterCurrent> = {
	exclude: 'exclude',
	include: 'include',
	unset: 'none',
	toggleInclude: 'include',
	toggleExclude: 'exclude',
}
