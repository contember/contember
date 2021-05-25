import { v4 as uuidV4 } from 'uuid'
import type { FieldAccessor } from '../../accessors'
import { FieldHelper } from './FieldHelper'

class UuidFieldHelper extends FieldHelper<string> {
	public setToUuid(options?: FieldAccessor.UpdateOptions) {
		this.getAccessor().updateValue(uuidV4(), options)
	}
}
namespace UuidFieldHelper {
	export const setToUuid = (
		field: FieldAccessor<string> | FieldAccessor.GetFieldAccessor<string>,
		options?: FieldAccessor.UpdateOptions,
	) => {
		new UuidFieldHelper(field).setToUuid(options)
	}
}
export { UuidFieldHelper }
