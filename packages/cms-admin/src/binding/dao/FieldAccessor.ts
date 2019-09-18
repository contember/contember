import { GraphQlBuilder } from 'cms-client'
import { FieldName, Scalar } from '../bindingTypes'
import { Accessor } from './Accessor'
import { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'

export class FieldAccessor<
	Persisted extends Scalar | GraphQlBuilder.Literal = Scalar | GraphQlBuilder.Literal,
	Produced extends Persisted = Persisted
> extends Accessor implements Errorable {
	constructor(
		public readonly fieldName: FieldName,
		public readonly currentValue: Persisted | null,
		public readonly errors: ErrorAccessor[],
		public readonly updateValue?: (newValue: Produced | null) => void,
	) {
		super()
	}

	public hasValue(candidate: this['currentValue']): boolean {
		const currentValue = this.currentValue

		const left = currentValue instanceof GraphQlBuilder.Literal ? currentValue.value : currentValue
		const right = candidate instanceof GraphQlBuilder.Literal ? candidate.value : candidate

		return left === right
	}
}
