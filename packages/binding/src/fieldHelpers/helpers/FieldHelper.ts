import { FieldAccessor } from '../../accessors'
import { FieldValue } from '../../treeParameters'

export class FieldHelper<Value extends FieldValue = FieldValue> {
	protected readonly updateValue: FieldAccessor.UpdateValue<Value>

	public constructor(field: FieldAccessor<Value> | FieldAccessor.UpdateValue<Value>) {
		this.updateValue = field instanceof FieldAccessor ? field.updateValue : field
	}
}
