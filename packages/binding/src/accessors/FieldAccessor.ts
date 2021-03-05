import { FieldHelpers } from '../fieldHelpers'
import { FieldName, FieldValue } from '../treeParameters'
import { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'

class FieldAccessor<Persisted extends FieldValue = FieldValue, Produced extends Persisted = Persisted>
	implements Errorable {
	constructor(
		public readonly fieldName: FieldName,
		public readonly value: Persisted | null,
		public readonly valueOnServer: Persisted | null,
		public readonly defaultValue: Persisted | undefined,
		public readonly errors: ErrorAccessor | undefined,
		public readonly hasUnpersistedChanges: boolean,
		private readonly touchLog: ReadonlySet<string> | undefined,
		public readonly addError: FieldAccessor.AddError,
		public readonly addEventListener: FieldAccessor.AddFieldEventListener<Persisted, Produced>,
		public readonly updateValue: FieldAccessor.UpdateValue<Produced>,
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

	export type AddError = ErrorAccessor.AddError
	export type BeforeUpdateListener<
		Persisted extends FieldValue = FieldValue,
		Produced extends Persisted = Persisted
	> = (updatedAccessor: FieldAccessor<Persisted, Produced>) => void
	export type UpdateListener<Persisted extends FieldValue = FieldValue, Produced extends Persisted = Persisted> = (
		accessor: FieldAccessor<Persisted, Produced>,
	) => void
	export type UpdateValue<Produced extends FieldValue = FieldValue> = (
		newValue: Produced | null,
		options?: FieldAccessor.UpdateOptions,
	) => void

	export interface FieldEventListenerMap<
		Persisted extends FieldValue = FieldValue,
		Produced extends Persisted = Persisted
	> {
		beforeUpdate: BeforeUpdateListener<Persisted, Produced>
		update: UpdateListener<Persisted, Produced>
	}
	export type FieldEventType = keyof FieldEventListenerMap
	export interface AddFieldEventListener<
		Persisted extends FieldValue = FieldValue,
		Produced extends Persisted = Persisted
	> {
		(type: 'beforeUpdate', listener: FieldEventListenerMap<Persisted, Produced>['beforeUpdate']): () => void
		(type: 'update', listener: FieldEventListenerMap<Persisted, Produced>['update']): () => void
	}
}

export { FieldAccessor }
