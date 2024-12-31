import * as React from 'react'
import { forwardRef, ReactElement, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { composeEventHandlers } from '@radix-ui/primitive'
import { useEntity } from '@contember/react-binding'
import { dataAttribute } from '@contember/utilities'
import { DataViewRelationFilterCurrent, DataViewSetRelationFilterAction, useDataViewRelationFilter } from '../../../hooks'
import { useDataViewFilterName } from '../../../contexts'

export interface DataViewRelationFilterTriggerAttributes {
	['data-active']?: ''
	['data-current']: DataViewRelationFilterCurrent
}

const SlotType = Slot as React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement> & DataViewRelationFilterTriggerAttributes>

export interface DataViewRelationFilterTriggerProps {
	/**
	 * The name of the filter. If not provided, the component will attempt to infer it from the context.
	 */
	name?: string
	/**
	 * Determines how the filter behaves when the button is clicked:
	 * - `'include'`: Sets the filter to include the relation.
	 * - `'exclude'`: Sets the filter to exclude the relation.
	 * - `'unset'`: Removes the filter.
	 * - `'toggleInclude'`: Toggles the relation in the inclusion filter.
	 * - `'toggleExclude'`: Toggles the relation in the exclusion filter.
	 */
	action?: DataViewSetRelationFilterAction
	/**
	 * The button element for the filter trigger.
	 */
	children: ReactElement
}

/**
 * A trigger component for managing relation filters in a data view.
 *
 * ## Props
 * - name, action, children
 *
 * See {@link DataViewRelationFilterTriggerProps} for details.
 *
 * ## Data Attributes (applied to `Slot`)
 * - **`data-active`**: Present if the current filter state matches the toggled action.
 * - **`data-current`**: Indicates the current filter state, which can be:
 *   - `'include'`: The relation is included in the filter.
 *   - `'exclude'`: The relation is excluded from the filter.
 *   - `'none'`: The relation is not active in the filter.
 *
 * ## Example
 * ```tsx
 * <DataViewRelationFilterTrigger action="toggleInclude">
 *     <button>Include Relation</button>
 * </DataViewRelationFilterTrigger>
 * ```
 */
export const DataViewRelationFilterTrigger = forwardRef<HTMLButtonElement, DataViewRelationFilterTriggerProps>(
	({ name, action = 'include', ...props }: DataViewRelationFilterTriggerProps, ref) => {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		name ??= useDataViewFilterName()
		const entity = useEntity()
		const [current, setFilter] = useDataViewRelationFilter(name, entity.id)
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

DataViewRelationFilterTrigger.displayName = 'DataViewRelationFilterTrigger'

const actionToState: Record<DataViewSetRelationFilterAction, DataViewRelationFilterCurrent> = {
	exclude: 'exclude',
	include: 'include',
	unset: 'none',
	toggleInclude: 'include',
	toggleExclude: 'exclude',
}
