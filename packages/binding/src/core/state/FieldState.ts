import { ErrorAccessor, FieldAccessor } from '../../accessors'
import { FieldMarker } from '../../markers'
import { FieldEventListenerStore, FieldName, FieldValue, Scalar } from '../../treeParameters'
import { EntityRealmState } from './EntityRealmState'
import { StateType } from './StateType'

export interface FieldState {
	type: StateType.Field

	accessor: FieldAccessor | undefined
	errors: ErrorAccessor | undefined
	eventListeners: FieldEventListenerStore | undefined
	fieldMarker: FieldMarker
	readonly getAccessor: () => FieldAccessor
	hasUnpersistedChanges: boolean
	parent: EntityRealmState
	persistedValue: Scalar | undefined // Undefined means that the parent entity doesn't exist on server
	placeholderName: FieldName
	touchLog: Set<string> | undefined
	value: FieldValue
}
