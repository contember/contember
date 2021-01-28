import { ErrorAccessor, FieldAccessor } from '../../accessors'
import { FieldMarker } from '../../markers'
import { FieldName, FieldValue } from '../../treeParameters'
import { EntityRealmState } from './EntityRealmState'
import { StateType } from './StateType'

export interface FieldState {
	type: StateType.Field

	errors: ErrorAccessor | undefined
	eventListeners: {
		[Type in FieldAccessor.FieldEventType]: Set<FieldAccessor.FieldEventListenerMap[Type]> | undefined
	}
	fieldMarker: FieldMarker
	getAccessor: () => FieldAccessor
	hasStaleAccessor: boolean
	hasUnpersistedChanges: boolean
	parent: EntityRealmState
	persistedValue: FieldValue | undefined // Undefined means that the parent entity doesn't exist on server
	placeholderName: FieldName
	touchLog: Set<string> | undefined
	value: FieldValue

	addError: FieldAccessor.AddError
	addEventListener: FieldAccessor.AddFieldEventListener
	updateValue: FieldAccessor.UpdateValue
}
