import type { ErrorAccessor, FieldAccessor } from '@contember/binding-common'
import type { FieldMarker } from '@contember/binding-common'
import type { FieldEventListenerStore, FieldName, FieldValue } from '@contember/binding-common'
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
