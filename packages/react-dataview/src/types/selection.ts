import { StateStorageOrName } from '@contember/react-utils'
import { SetStateAction } from 'react'

export type DataViewSelectionValue = boolean | string | number | null

export type DataViewSelectionValues = {
	[key: string]: DataViewSelectionValue
};
export type DataViewSelectionState = {
	values: DataViewSelectionValues
	fallback?: DataViewSelectionValue
}

export type DataViewSelectionMethods = {
	setSelection: (key: string, value: SetStateAction<DataViewSelectionValue | undefined>) => void
}

export type DataViewSelectionProps = {
	initialSelection?: DataViewSelectionValues | ((stored: DataViewSelectionValues) => DataViewSelectionValues)
	selectionFallback?: DataViewSelectionValue
	selectionStateStorage?: StateStorageOrName
}
