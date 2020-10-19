import { FieldAccessor } from '../../accessors'
import { FieldValue } from '../../treeParameters'

export class FieldHelper<Produced extends FieldValue = FieldValue> {
	protected readonly updateValue: FieldAccessor.UpdateValue<Produced>

	public constructor(field: FieldAccessor<FieldValue, Produced> | FieldAccessor.UpdateValue<Produced>) {
		this.updateValue = field instanceof FieldAccessor ? field.updateValue : field
	}
}
