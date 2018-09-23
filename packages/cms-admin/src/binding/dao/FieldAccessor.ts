import { FieldName } from '../bindingTypes'

export default class FieldAccessor<Persisted = any, Produced extends Persisted = Persisted> {
	constructor(
		public readonly fieldName: FieldName,
		public readonly currentValue: Persisted,
		public readonly onChange?: (newValue: Produced) => void,
	) {}
}
