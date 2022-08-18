import type { FieldOperations } from '../core/operations'
import type { FieldState } from '../core/state'
import { TemporalFieldHelper, UuidFieldHelper } from '../fieldHelpers'
import type { FieldName, FieldValue } from '../treeParameters'
import type { BatchUpdatesOptions } from './BatchUpdatesOptions'
import type { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'
import type { SchemaColumn } from '../core/schema/SchemaColumn'

class FieldAccessor<Value extends FieldValue = FieldValue> implements Errorable {
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
	) {}

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

	public hasValue(candidate: this['value']): boolean {
		return this.value === candidate
	}

	public isTouchedBy(agent: string) {
		return this.touchLog?.has(agent) ?? false
	}

	public get isTouched() {
		return this.isTouchedBy(FieldAccessor.userAgent)
	}

	public get resolvedValue() {
		if (this.defaultValue === undefined) {
			return this.value
		}
		return this.value === null ? this.defaultValue : this.value
	}

	// helpers

	public get asTemporal(): TemporalFieldHelper {
		return new TemporalFieldHelper(this.getAccessor as FieldAccessor.GetFieldAccessor<any>)
	}

	public get asUuid(): UuidFieldHelper {
		return new UuidFieldHelper(this.getAccessor as FieldAccessor.GetFieldAccessor<any>)
	}
}
namespace FieldAccessor {
	export const userAgent = 'user'

	export interface UpdateOptions {
		agent?: string
	}

	export type GetFieldAccessor<Value extends FieldValue = FieldValue> = () => FieldAccessor<Value>

	export type BeforeUpdateListener<Value extends FieldValue = FieldValue> = (
		updatedAccessor: FieldAccessor<Value>,
	) => void
	export type InitializeListener<Value extends FieldValue = FieldValue> = (
		getAccessor: GetFieldAccessor<Value>,
		options: BatchUpdatesOptions,
	) => void
	export type UpdateListener<Value extends FieldValue = FieldValue> = (accessor: FieldAccessor<Value>) => void

	export interface RuntimeFieldEventListenerMap<Value extends FieldValue = FieldValue> {
		beforeUpdate: BeforeUpdateListener<Value>
		update: UpdateListener<Value>
	}
	export interface FieldEventListenerMap<Value extends FieldValue = FieldValue>
		extends RuntimeFieldEventListenerMap<Value> {
		initialize: InitializeListener<Value>
	}
	export type FieldEventType = keyof FieldEventListenerMap
}

export { FieldAccessor }
