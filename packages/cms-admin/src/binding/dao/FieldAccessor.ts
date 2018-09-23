import { FieldName } from '../bindingTypes'

export type Scalar = string | number | boolean | null

export default class FieldAccessor<Persisted extends Scalar = Scalar, Produced extends Persisted = Persisted> {
	constructor(
		public readonly fieldName: FieldName,
		public readonly currentValue: Persisted,
		public readonly onChange?: (newValue: Produced) => void,
	) {}
}
