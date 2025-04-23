import React, { ReactNode } from 'react'
import { useDataViewLoaderState } from '../contexts'

export interface DataViewLoaderStateProps {
	children: ReactNode
	/**
	 * Render children when the DataView is loaded.
	 */
	loaded?: boolean
	/**
	 * Render children when the DataView is refreshing.
	 * This means that the DataView is currently loading new data, but the old data is still available.
	 */
	refreshing?: boolean
	/**
	 * Render children when the DataView is initial.
	 * This means that the DataView has not yet loaded any data.
	 */
	initial?: boolean
	/**
	 * Render children when the DataView has failed to load.
	 */
	failed?: boolean
}

/**
 * Renders children based on the DataView loading state.
 *
 * ## Props
 * - loaded, refreshing, initial, failed
 *
 * See {@link DataViewLoaderStateProps} for more details.
 *
 * #### Example
 * ```tsx
 * <DataViewLoaderState loaded>
 *     <p>Data loaded</p>
 * </DataViewLoaderState>
 * <DataViewLoaderState refreshing>
 *     <p>Refreshing data</p>
 * </DataViewLoaderState>
 * ```
 */
export const DataViewLoaderState = ({ children, ...props }: DataViewLoaderStateProps) => {
	const state = useDataViewLoaderState()
	return props[state] ? <>{children}</> : null
}
