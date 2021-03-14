import { v4 as uuidV4 } from 'uuid'
import { FieldAccessor } from '../../accessors'
import { FieldHelper } from './FieldHelper'

class UuidFieldHelper extends FieldHelper<string> {
	public setToUuid(options?: FieldAccessor.UpdateOptions) {
		this.updateValue(uuidV4(), options)
	}
}
namespace UuidFieldHelper {
	export const setToUuid = (
		field: FieldAccessor<string> | FieldAccessor.UpdateValue<string>,
		options?: FieldAccessor.UpdateOptions,
	) => {
		new UuidFieldHelper(field).setToUuid(options)
	}
}
export { UuidFieldHelper }
