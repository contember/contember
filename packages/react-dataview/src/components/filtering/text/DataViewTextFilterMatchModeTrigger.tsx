import * as React from 'react'
import { forwardRef, ReactElement } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { TextFilterArtifactsMatchMode } from '../../../filterTypes'
import { dataAttribute } from '@contember/utilities'
import { useDataViewTextFilterMatchMode } from '../../../hooks'
import { useDataViewFilterName } from '../../../contexts'
import { composeEventHandlers } from '@radix-ui/primitive'

export interface DataViewTextFilterMatchModeTriggerProps {
	/**
	 * The name of the filter. If not provided, the component will attempt to infer it from the context.
	 */
	name?: string
	/**
	 * Specifies the match mode for the text filter (matches, matchesExactly, startsWith, endsWith, 'doesNotMatch)
	 */
	mode: TextFilterArtifactsMatchMode
	/**
	 * The button element that triggers the match mode change.
	 */
	children: ReactElement
}

/**
 * A trigger component for managing text filter match modes in a data view.
 *
 * ## Props
 * - name, mode, children
 *
 * See {@link DataViewTextFilterMatchModeTriggerProps} for details.
 *
 * ## Data Attributes (applied to `Slot`)
 * - **`data-active`**: Present if the trigger's match mode is currently active.
 *
 * ## Example
 * ```tsx
 * <DataViewTextFilterMatchModeTrigger mode="contains">
 *     <button>Contains</button>
 * </DataViewTextFilterMatchModeTrigger>
 * ```
 */
export const DataViewTextFilterMatchModeTrigger = forwardRef<HTMLButtonElement, DataViewTextFilterMatchModeTriggerProps>(
	({ name, children, mode, ...props }: DataViewTextFilterMatchModeTriggerProps, ref) => {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		name ??= useDataViewFilterName()
		const [active, cb] = useDataViewTextFilterMatchMode(name, mode)
		const { onClick, ...otherProps } = props as React.ButtonHTMLAttributes<HTMLButtonElement>

		return (
			<Slot
				ref={ref}
				onClick={composeEventHandlers(onClick, cb)}
				data-active={dataAttribute(active)}
				{...otherProps}
			>
				{children}
			</Slot>
		)
	},
)

DataViewTextFilterMatchModeTrigger.displayName = 'DataViewTextFilterMatchModeTrigger'
