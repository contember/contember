import * as React from 'react'
import { forwardRef, ReactElement, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useDataViewLoaderState, useDataViewPagingMethods, useDataViewReload } from '../contexts'
import { dataAttribute } from '@contember/utilities'
import { EntityListSubTreeLoaderState } from '@contember/react-binding'
import { composeEventHandlers } from '@radix-ui/primitive'

export interface DataViewReloadTriggerAttributes {
	['data-state']: EntityListSubTreeLoaderState
}

const SlotType = Slot as React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement> & DataViewReloadTriggerAttributes>

export interface DataViewReloadTriggerProps {
	/**
	 * The button element for the reload trigger.
	 */
	children: ReactElement
}

/**
 * A trigger component to reload a data view.
 *
 * ## Props
 * - **`children`**: The button element for the reload trigger.
 *
 * ## Data Attributes (applied to `Slot`)
 * - **`data-state`**: Reflects the current state of the data view loader (e.g., `'loading'`, `'loaded'`, `'failed'`, `'refreshing'`, `'initial'`).
 *
 * #### Example
 * ```tsx
 * <DataViewReloadTrigger>
 *     <button>Reload</button>
 * </DataViewReloadTrigger>
 * ```
 */
export const DataViewReloadTrigger = forwardRef<HTMLButtonElement, DataViewReloadTriggerProps>(
	({ children, ...props }: DataViewReloadTriggerProps, ref) => {
		const reload = useDataViewReload()
		const state = useDataViewLoaderState()
		const { refreshTotalCount } = useDataViewPagingMethods()

		const { onClick, ...otherProps } = props as React.ButtonHTMLAttributes<HTMLButtonElement>

		return (
			<SlotType
				ref={ref}
				onClick={composeEventHandlers(onClick, useCallback(() => {
					refreshTotalCount()
					reload()
				}, [reload, refreshTotalCount]))}
				data-state={dataAttribute(state)}
				{...otherProps}
			>
				{children}
			</SlotType>
		)
	},
)

DataViewReloadTrigger.displayName = 'DataViewReloadTrigger'
