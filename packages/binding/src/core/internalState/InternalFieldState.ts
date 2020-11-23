import { ErrorAccessor, FieldAccessor } from '../../accessors'
import { FieldMarker } from '../../markers'
import { FieldName, FieldValue, Scalar } from '../../treeParameters/primitives'
import { InternalStateType } from './InternalStateType'

export type OnFieldUpdate = (state: InternalFieldState) => void
export interface InternalFieldState {
	type: InternalStateType.Field
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
	onFieldUpdate: OnFieldUpdate // To be called by this field to inform the parent entity
	value: FieldValue
	persistedValue: FieldValue | undefined // Undefined means that the parent entity doesn't exist on server
	placeholderName: FieldName
	touchLog: Map<string, boolean> | undefined
	addError: FieldAccessor.AddError
	isTouchedBy: FieldAccessor.IsTouchedBy
	updateValue: FieldAccessor.UpdateValue
}
