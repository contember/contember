import { GraphQlBuilder } from '@contember/client'
import { FieldName, FieldValue } from '../treeParameters'
import { Accessor } from './Accessor'
import { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'

export class FieldAccessor<Persisted extends FieldValue = FieldValue, Produced extends Persisted = Persisted>
	extends Accessor
	implements Errorable {
	constructor(
		public readonly fieldName: FieldName,
		public readonly currentValue: Persisted | null,
		public readonly persistedValue: Persisted | null,
		public readonly errors: ErrorAccessor[],
		public readonly updateValue: ((newValue: Produced | null) => void) | undefined,
	) {
		super()
	}

	public hasValue(candidate: this['currentValue']): boolean {
		const currentValue = this.currentValue

		// This may seem like absolute bogus but it is indeed desirable because when updating entities with fields whose
		// values are supposed to be literals, we still get strings from the API, and so, at least for now, this sort of
		// looser definition of equality is necessary.
		const left = currentValue instanceof GraphQlBuilder.Literal ? currentValue.value : currentValue
		const right = candidate instanceof GraphQlBuilder.Literal ? candidate.value : candidate

		return left === right
	}
}
