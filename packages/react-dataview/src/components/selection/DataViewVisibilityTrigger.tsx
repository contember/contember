import { forwardRef, ReactElement, SetStateAction, useCallback } from 'react'
import { useDataViewSelectionMethods, useDataViewSelectionState } from '../../contexts'
import { Slot } from '@radix-ui/react-slot'
import { dataAttribute } from '@contember/utilities'
import { composeEventHandlers } from '@radix-ui/primitive'

export interface DataViewVisibilityTriggerAttributes {
	['data-active']?: ''
	['data-current']?: ''
}

const SlotType = Slot as React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement> & DataViewVisibilityTriggerAttributes>

export interface DataViewVisibilityTriggerProps {
	name: string
	value: SetStateAction<boolean | undefined>
	fallbackValue?: boolean
	children: ReactElement
}

/**
 * A trigger component to toggle visibility of an element (e.g., a column in a table or a part of a tile).
 *
 * ## Props
 * - **`name`**: The name of the element whose visibility is being controlled.
 * - **`value`**: The visibility state to set when the trigger is clicked (e.g., `true` or `false`).
 * - **`fallbackValue`**: The default visibility state if no explicit state is available (defaults to `true`).
 * - **`children`**: The button element for the visibility trigger.
 *
 * ## Data Attributes (applied to `Slot`)
 * - **`data-active`**: Present if the visibility state matches the trigger's `value`.
 * - **`data-current`**: Present if visible.
 *
 * #### Example
 * ```tsx
 * <DataViewVisibilityTrigger name="column1" value={true}>
 *     <button>Show Column 1</button>
 * </DataViewVisibilityTrigger>
 * <DataViewVisibilityTrigger name="column1" value={false}>
 *     <button>Hide Column 1</button>
 * </DataViewVisibilityTrigger>
 * <DataViewVisibilityTrigger name="column1" value={it => !it}>
 *     <button>Toggle Column 1</button>
 * </DataViewVisibilityTrigger>
 * ```
 */
export const DataViewVisibilityTrigger = forwardRef<HTMLButtonElement, DataViewVisibilityTriggerProps>(
	({ name, value, fallbackValue = true, ...props }: DataViewVisibilityTriggerProps, ref) => {
		const { setVisibility } = useDataViewSelectionMethods()
		const state = useDataViewSelectionState()

		const handleClick = useCallback(() => {
			setVisibility(name, value)
		}, [name, setVisibility, value])

		const resolvedValue = state?.values?.visibility?.[name] ?? fallbackValue
		const isActive = resolvedValue === value

		const { onClick, ...otherProps } = props as React.ButtonHTMLAttributes<HTMLButtonElement>

		return (
			<SlotType
				ref={ref}
				onClick={composeEventHandlers(onClick, handleClick)}
				data-active={dataAttribute(isActive)}
				data-current={dataAttribute(resolvedValue)}
				{...otherProps}
			/>
		)
	},
)

DataViewVisibilityTrigger.displayName = 'DataViewVisibilityTrigger'
