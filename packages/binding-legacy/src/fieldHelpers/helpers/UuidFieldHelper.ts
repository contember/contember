import { generateUuidV4 } from '@contember/utilities'
import type { FieldAccessor } from '@contember/binding-common'
import { FieldHelper } from './FieldHelper.js'

class UuidFieldHelper extends FieldHelper<string> {
	public setToUuid(options?: FieldAccessor.UpdateOptions) {
		this.getAccessor().updateValue(generateUuidV4(), options)
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
