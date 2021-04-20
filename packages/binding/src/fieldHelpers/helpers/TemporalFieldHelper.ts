import { FieldAccessor } from '../../accessors'
import { FieldHelper } from './FieldHelper'

class TemporalFieldHelper extends FieldHelper<string> {
	public setToNow(options?: FieldAccessor.UpdateOptions) {
		this.getAccessor().updateValue(new Date().toISOString(), options)
	}

	//public setToDate() TODO
	//public setToTime() TODO
	//public setToDateTime() TODO
}
namespace TemporalFieldHelper {
	export const setToNow = (
		field: FieldAccessor<string> | FieldAccessor.GetFieldAccessor<string>,
		options?: FieldAccessor.UpdateOptions,
	) => {
		new TemporalFieldHelper(field).setToNow(options)
	}
}
export { TemporalFieldHelper }
