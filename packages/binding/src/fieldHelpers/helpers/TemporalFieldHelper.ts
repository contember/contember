import { FieldAccessor } from '../../accessors'
import { FieldValue } from '../../treeParameters'
import { FieldHelper } from './FieldHelper'

class TemporalFieldHelper extends FieldHelper<string> {
	public setToNow(options?: FieldAccessor.UpdateOptions) {
		this.updateValue(new Date().toISOString(), options)
	}

	//public setToDate() TODO
	//public setToTime() TODO
	//public setToDateTime() TODO
}
namespace TemporalFieldHelper {
	export const setToNow = (
		field: FieldAccessor<FieldValue, string> | FieldAccessor.UpdateValue<string>,
		options?: FieldAccessor.UpdateOptions,
	) => {
		new TemporalFieldHelper(field).setToNow(options)
	}
}
export { TemporalFieldHelper }
