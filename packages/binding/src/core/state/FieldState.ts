import type { ErrorAccessor, FieldAccessor } from '../../accessors'
import type { FieldMarker } from '../../markers'
import type { FieldEventListenerStore, FieldName, FieldValue, Scalar } from '../../treeParameters'
import type { EntityRealmState } from './EntityRealmState'

export interface FieldState {
	type: 'field'

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
