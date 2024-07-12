import { FieldAccessor } from '../../accessors'
import type { FieldValue } from '../../treeParameters'

export class FieldHelper<Value extends FieldValue = FieldValue> {
	protected readonly getAccessor: FieldAccessor.GetFieldAccessor<Value>

	public constructor(field: FieldAccessor<Value> | FieldAccessor.GetFieldAccessor<Value>) {
		this.getAccessor = field instanceof FieldAccessor ? field.getAccessor : field
	}
}
