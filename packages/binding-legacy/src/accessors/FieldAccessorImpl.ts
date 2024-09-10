import type { FieldState } from '../core/state'
import type { FieldOperations } from '../core/operations'
import { TemporalFieldHelper, UuidFieldHelper } from '../fieldHelpers'
import { EntityAccessor, ErrorAccessor, FieldAccessor, FieldName, FieldValue, SchemaColumn } from '@contember/binding-common'

export class FieldAccessorImpl<Value extends FieldValue = FieldValue> implements FieldAccessor {
	public readonly __type = 'FieldAccessor' as const

	constructor(
		private readonly state: FieldState<Value>,
		private readonly operations: FieldOperations,
		public readonly fieldName: FieldName,
		public readonly value: Value | null,
		public readonly valueOnServer: Value | null,
		public readonly defaultValue: Value | undefined,
		public readonly errors: ErrorAccessor | undefined,
		public readonly hasUnpersistedChanges: boolean,
		private readonly touchLog: ReadonlySet<string> | undefined,
		public readonly getAccessor: FieldAccessor.GetFieldAccessor<Value>,
		public readonly schema: SchemaColumn,
	) {
	}

	public addError(error: ErrorAccessor.Error | string): () => void {
		return this.operations.addError(this.state, ErrorAccessor.normalizeError(error))
	}

	public clearErrors(): void {
		this.operations.clearErrors(this.state)
	}

	public addEventListener<Type extends keyof FieldAccessor.FieldEventListenerMap<Value>>(
		event: { type: Type; key?: string },
		listener: FieldAccessor.FieldEventListenerMap<Value>[Type],
	): () => void {
		return this.operations.addEventListener(this.state, event, listener)
	}

	public updateValue(newValue: Value | null, options?: FieldAccessor.UpdateOptions): void {
		this.operations.updateValue(this.state, newValue, options)
	}

	public isTouchedBy(agent: 'user' | (string & {})) {
		return this.touchLog?.has(agent) ?? false
	}

	public get isTouched() {
		return this.isTouchedBy('user')
	}

	// helpers

	public get asTemporal(): TemporalFieldHelper {
		return new TemporalFieldHelper(this.getAccessor as FieldAccessor.GetFieldAccessor<any>)
	}

	public get asUuid(): UuidFieldHelper {
		return new UuidFieldHelper(this.getAccessor as FieldAccessor.GetFieldAccessor<any>)
	}

	public getParent(): EntityAccessor {
		return this.state.parent.getAccessor()
	}
}
