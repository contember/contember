import { forwardRef, ReactElement, useCallback } from 'react'
import { useDataViewSelectionMethods, useDataViewSelectionState } from '../../contexts'
import { Slot } from '@radix-ui/react-slot'
import { dataAttribute } from '@contember/utilities'
import { composeEventHandlers } from '@radix-ui/primitive'

export interface DataViewLayoutTriggerAttributes {
	['data-active']?: ''
	['data-current']?: string
}

const SlotType = Slot as React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement> & DataViewLayoutTriggerAttributes>

export interface DataViewLayoutTriggerProps {
	/**
	 * The name of the layout this trigger activates (e.g., "table" or "tiles").
	 */
	name: string | undefined
	/**
	 * The button element for the layout trigger.
	 */
	children: ReactElement
}

/**
 * A trigger component for switching the layout of a data view (e.g., table vs. tiles).
 *
 * ## Props
 * - name, children
 *
 * See {@link DataViewLayoutTriggerProps} for details.
 *
 * ## Data Attributes (applied to `Slot`)
 * - **`data-active`**: Present if the current layout matches the trigger's layout name.
 * - **`data-current`**: Reflects the name of the currently active layout.
 *
 * #### Example
 * ```tsx
 * <DataViewLayoutTrigger name="table">
 *     <button>Table View</button>
 * </DataViewLayoutTrigger>
 * <DataViewLayoutTrigger name="tiles">
 *     <button>Tile View</button>
 * </DataViewLayoutTrigger>
 * ```
 */
export const DataViewLayoutTrigger = forwardRef<HTMLButtonElement, DataViewLayoutTriggerProps>(
	({ name, ...props }: DataViewLayoutTriggerProps, ref) => {
		const { setLayout } = useDataViewSelectionMethods()
		const layoutCurrent = useDataViewSelectionState()?.values?.layout

		const handleClick = useCallback(() => {
			setLayout(name)
		}, [setLayout, name])

		const isActive = name === layoutCurrent

		const { onClick, ...otherProps } = props as React.ButtonHTMLAttributes<HTMLButtonElement>

		return (
			<SlotType
				ref={ref}
				onClick={composeEventHandlers(onClick, handleClick)}
				data-active={dataAttribute(isActive)}
				data-current={dataAttribute(layoutCurrent)}
				{...otherProps}
			/>
		)
	},
)

DataViewLayoutTrigger.displayName = 'DataViewLayoutTrigger'
