import {
	EntityAccessor,
	ErrorAccessor,
	EventListenersStore,
	FieldAccessor,
	FieldMarker,
	FieldValue,
	SchemaColumn,
} from '@contember/binding-common'
import { EntityField } from '../entities/EntityField'

export class FieldAccessorImpl<Value extends FieldValue = FieldValue> implements FieldAccessor<Value> {
	readonly __type = 'FieldAccessor' as const

	#eventStore: EventListenersStore<FieldAccessor.FieldEventListenerMap<Value>> | undefined

	#cleanup: (() => void)[] = []

	constructor(
		public readonly schema: SchemaColumn,
		private readonly field: EntityField<Value>,
		private readonly marker: FieldMarker,
		private readonly parent: EntityAccessor,
	) {
		const cleanupFn = this.field.listen(() => {

		})
		this.#cleanup.push(cleanupFn)

		this.#eventStore = marker.parameters.eventListeners?.clone()
	}

	/**
	 * @internal
	 */
	_cleanup = (): void => {
		this.#cleanup.forEach(cleanup => cleanup())
		this.#cleanup = []
	}

	get fieldName(): string {
		return this.schema.name
	}

	get value(): Value | null {
		return this.field.value
	}

	get valueOnServer(): Value | null {
		return this.field.persistedValue ?? null
	}

	get defaultValue(): Value | undefined {
		return this.marker.defaultValue as Value | undefined
	}

	updateValue = (newValue: Value | null, options?: FieldAccessor.UpdateOptions): void => {
		this.field.setValue({ value: newValue, agent: options?.agent })
	}

	get hasUnpersistedChanges(): boolean {
		return this.field.hasUnpersistedChanges
	}

	isTouchedBy = (agent: 'user' | string): boolean => {
		return this.field.isTouchedBy(agent)
	}

	get isTouched(): boolean {
		return this.isTouchedBy('user')
	}

	get errors(): ErrorAccessor | undefined {
		return this.field.errors
	}

	addError = (error: ErrorAccessor.Error | string): ErrorAccessor.ClearError => {
		return this.field.addError(ErrorAccessor.normalizeError(error))
	}

	clearErrors = (): void => {
		this.field.clearErrors()
	}

	getAccessor: FieldAccessor.GetFieldAccessor<Value> = () => {
		return Object.assign(Object.create(Object.getPrototypeOf(this)), this)
	}

	addEventListener: FieldAccessor.AddEventListener = (event, listener) => {
		this.#eventStore ??= new EventListenersStore()
		return this.#eventStore.add(event, listener)
	}

	getParent = (): EntityAccessor => {
		return this.parent
	}
}
