import { StateStorageOrName } from '@contember/react-utils'
import { ReactNode, SetStateAction } from 'react'

export type DataViewSelectionLayout = { name: string, label?: ReactNode }

export type DataViewSelectionState = {
	values: DataViewSelectionValues
	layouts: DataViewSelectionLayout[]
}

export type DataViewSelectionValues = {
	layout?: string
	visibility?: {
		[key: string]: boolean | undefined
	}
}

export type DataViewSelectionMethods = {
	setLayout: (layout: SetStateAction<string | undefined>) => void
	setVisibility: (key: string, visible: SetStateAction<boolean | undefined>) => void
}

export type DataViewSelectionProps = {
	initialSelection?: DataViewSelectionValues | ((stored: DataViewSelectionValues) => DataViewSelectionValues)
	selectionStateStorage?: StateStorageOrName
	layouts?: DataViewSelectionLayout[]
}
