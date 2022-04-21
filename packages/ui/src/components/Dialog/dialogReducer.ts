import type { Reducer } from 'react'
import type { DialogSettings } from './DialogSettings'

export type DialogId = number

export interface DialogSettingsWithMetadata<Success> {
	resolve: (value?: Success) => void
	settings: DialogSettings<Success>
}

export interface AggregateDialogState {
	dialogs: Map<DialogId, DialogSettingsWithMetadata<unknown>>
}

export type DialogAction<Success> =
	| {
			type: 'openDialog'
			dialogId: DialogId
			dialog: DialogSettingsWithMetadata<Success>
	  }
	| {
			type: 'closeDialog'
			dialogId: DialogId
	  }

export const initialDialogState: AggregateDialogState = {
	dialogs: new Map(),
}

export const dialogReducer: Reducer<AggregateDialogState, DialogAction<any>> = (previousState, action) => {
	switch (action.type) {
		case 'openDialog': {
			const clone = new Map(previousState.dialogs)
			clone.set(action.dialogId, action.dialog)
			return { dialogs: clone }
		}
		case 'closeDialog': {
			const clone = new Map(previousState.dialogs)
			return clone.delete(action.dialogId) ? { dialogs: clone } : previousState
		}
		default:
			return previousState
	}
}
