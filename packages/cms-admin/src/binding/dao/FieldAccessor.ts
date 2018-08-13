import { FieldName } from '../bindingTypes'

export default class FieldAccessor<T = any> {
	constructor(
		public readonly fieldName: FieldName,
		public readonly currentValue: T,
		public readonly onChange?: (newValue: T) => void
	) {}
}
