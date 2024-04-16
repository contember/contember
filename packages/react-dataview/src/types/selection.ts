import { StateStorageOrName } from '@contember/react-utils'
import { SetStateAction } from 'react'

export type DataViewSelectionState = {
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
	initialSelection?: DataViewSelectionState | ((stored: DataViewSelectionState) => DataViewSelectionState)
	selectionStateStorage?: StateStorageOrName
}
