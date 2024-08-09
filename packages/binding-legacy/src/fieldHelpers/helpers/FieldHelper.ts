import type { FieldValue } from '@contember/binding-common'
import { FieldAccessor } from '@contember/binding-common'

export class FieldHelper<Value extends FieldValue = FieldValue> {
	protected readonly getAccessor: FieldAccessor.GetFieldAccessor<Value>

	public constructor(field: FieldAccessor<Value> | FieldAccessor.GetFieldAccessor<Value>) {
		this.getAccessor = typeof field === 'function' ? field : field.getAccessor
	}
}
