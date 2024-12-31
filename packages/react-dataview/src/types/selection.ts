import { StateStorageOrName } from '@contember/react-utils'
import { ReactNode, SetStateAction } from 'react'

export type DataViewSelectionLayout = { name: string; label?: ReactNode }

/**
 * Contains the current selection state of the DataView. This includes the current layout and visibility of columns.
 * Available using {@link useDataViewSelectionState}.
 */
export type DataViewSelectionState = {
	/**
	 * Actual selection values.
	 */
	values: DataViewSelectionValues
	/**
	 * Available layouts.
	 */
	layouts: DataViewSelectionLayout[]
}

export type DataViewSelectionValues = {
	/**
	 * Current layout.
	 */
	layout?: string
	/**
	 * Visibility of columns.
	 */
	visibility?: {
		[key: string]: boolean | undefined
	}
}

export type DataViewSelectionMethods = {
	/**
	 * Change the layout.
	 */
	setLayout: (layout: SetStateAction<string | undefined>) => void
	/**
	 * Change the visibility of a column.
	 */
	setVisibility: (key: string, visible: SetStateAction<boolean | undefined>) => void
}

export type DataViewSelectionProps = {
	/**
	 * Initial selection state if not available in storage.
	 */
	initialSelection?: DataViewSelectionValues | ((stored: DataViewSelectionValues) => DataViewSelectionValues)
	/**
	 * Storage for selection state.
	 * Possible values: 'url', 'session', 'local', 'null' or a custom storage.
	 */
	selectionStateStorage?: StateStorageOrName
	/**
	 * List of available layouts.
	 * Can also be defined using {@link DataViewLayout} component.
	 */
	layouts?: DataViewSelectionLayout[]
}
