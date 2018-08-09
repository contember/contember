export default class FieldAccessor<T = any> {

	constructor(
		public readonly currentValue: T,
		public readonly onChange: (newValue: T) => void) {
	}

}
