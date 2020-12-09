import { ErrorAccessor, FieldAccessor } from '../../accessors'
import { FieldMarker } from '../../markers'
import { FieldName, FieldValue } from '../../treeParameters'
import { EntityState } from './EntityState'
import { StateType } from './StateType'

export interface FieldState {
	type: StateType.Field
	hasStaleAccessor: boolean
	getAccessor: () => FieldAccessor
	addEventListener: FieldAccessor.AddFieldEventListener
	errors: ErrorAccessor | undefined
	eventListeners: {
		[Type in FieldAccessor.FieldEventType]: Set<FieldAccessor.FieldEventListenerMap[Type]> | undefined
	}
	fieldMarker: FieldMarker
	hasPendingUpdate: boolean
	hasUnpersistedChanges: boolean
	parent: EntityState
	value: FieldValue
	persistedValue: FieldValue | undefined // Undefined means that the parent entity doesn't exist on server
	placeholderName: FieldName
	touchLog: Map<string, boolean> | undefined
	addError: FieldAccessor.AddError
	isTouchedBy: FieldAccessor.IsTouchedBy
	updateValue: FieldAccessor.UpdateValue
}
