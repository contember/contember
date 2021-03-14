import { FieldHelpers } from '../fieldHelpers'
import { FieldName, FieldValue } from '../treeParameters'
import { BatchUpdatesOptions } from './BatchUpdatesOptions'
import { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'

class FieldAccessor<Value extends FieldValue = FieldValue> implements Errorable {
	constructor(
		public readonly fieldName: FieldName,
		public readonly value: Value | null,
		public readonly valueOnServer: Value | null,
		public readonly defaultValue: Value | undefined,
		public readonly errors: ErrorAccessor | undefined,
		public readonly hasUnpersistedChanges: boolean,
		private readonly touchLog: ReadonlySet<string> | undefined,
		public readonly addError: FieldAccessor.AddError,
		public readonly addEventListener: FieldAccessor.AddFieldEventListener<Value>,
		public readonly updateValue: FieldAccessor.UpdateValue<Value>,
	) {}

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

	public get asTemporal() {
		return new FieldHelpers.Temporal(this.updateValue as FieldAccessor.UpdateValue<string>)
	}

	public get asUuid() {
		return new FieldHelpers.Uuid(this.updateValue as FieldAccessor.UpdateValue<string>)
	}
}
namespace FieldAccessor {
	export const userAgent = 'user'

	export interface UpdateOptions {
		agent?: string
	}

	export type GetFieldAccessor<Value extends FieldValue = FieldValue> = () => FieldAccessor<Value>

	export type AddError = ErrorAccessor.AddError
	export type BeforeUpdateListener<Value extends FieldValue = FieldValue> = (
		updatedAccessor: FieldAccessor<Value>,
	) => void
	export type InitializeListener<Value extends FieldValue = FieldValue> = (
		getAccessor: GetFieldAccessor<Value>,
		options: BatchUpdatesOptions,
	) => void
	export type UpdateListener<Value extends FieldValue = FieldValue> = (accessor: FieldAccessor<Value>) => void
	export type UpdateValue<Value extends FieldValue = FieldValue> = (
		newValue: Value | null,
		options?: FieldAccessor.UpdateOptions,
	) => void

	export interface RuntimeFieldEventListenerMap<Value extends FieldValue = FieldValue> {
		beforeUpdate: BeforeUpdateListener<Value>
		update: UpdateListener<Value>
	}
	export interface FieldEventListenerMap<Value extends FieldValue = FieldValue>
		extends RuntimeFieldEventListenerMap<Value> {
		initialize: InitializeListener<Value>
	}
	export type FieldEventType = keyof FieldEventListenerMap
	export interface AddFieldEventListener<Value extends FieldValue = FieldValue> {
		(type: 'beforeUpdate', listener: FieldEventListenerMap<Value>['beforeUpdate']): () => void
		(type: 'update', listener: FieldEventListenerMap<Value>['update']): () => void
	}
}

export { FieldAccessor }
