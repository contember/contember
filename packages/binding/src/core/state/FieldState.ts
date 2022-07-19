import type { ErrorAccessor, FieldAccessor } from '../../accessors'
import type { FieldMarker } from '../../markers'
import type { FieldEventListenerStore, FieldName, FieldValue } from '../../treeParameters'
import type { EntityRealmState } from './EntityRealmState'

export interface FieldState<Value extends FieldValue = FieldValue> {
	type: 'field'

	accessor: FieldAccessor<Value> | undefined
	errors: ErrorAccessor | undefined
	eventListeners: FieldEventListenerStore<Value> | undefined
	fieldMarker: FieldMarker
	readonly getAccessor: () => FieldAccessor
	hasUnpersistedChanges: boolean
	parent: EntityRealmState
	persistedValue: Value | undefined // Undefined means that the parent entity doesn't exist on server
	placeholderName: FieldName
	touchLog: Set<string> | undefined
	value: Value | null
}
