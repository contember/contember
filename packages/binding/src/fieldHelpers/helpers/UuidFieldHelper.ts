import { v4 as uuidV4 } from 'uuid'
import { FieldAccessor } from '../../accessors'
import { FieldValue } from '../../treeParameters'
import { FieldHelper } from './FieldHelper'

class UuidFieldHelper extends FieldHelper<string> {
	public setToUuid(options?: FieldAccessor.UpdateOptions) {
		this.updateValue(uuidV4(), options)
	}
}
namespace UuidFieldHelper {
	export const setToUuid = (
		field: FieldAccessor<FieldValue, string> | FieldAccessor.UpdateValue<string>,
		options?: FieldAccessor.UpdateOptions,
	) => {
		new UuidFieldHelper(field).setToUuid(options)
	}
}
export { UuidFieldHelper }
