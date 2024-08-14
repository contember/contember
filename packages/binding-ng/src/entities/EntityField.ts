import { Entity } from './Entity'
import { ErrorAccessor, FieldAccessor, FieldValue, type SchemaColumn } from '@contember/binding-common'
import { ErrorSet } from '../ErrorSet'

export type EntityFieldUpdateHandler<Value extends FieldValue = FieldValue> = () => void

export class EntityField<Value extends FieldValue = FieldValue> {
	#persistedValue: Value | null| undefined
	#value: Value | null = null

	#errors: ErrorSet | undefined

	listeners: Set<EntityFieldUpdateHandler<Value>> = new Set()

	#touchLog: Set<string> | undefined

	constructor(
		public readonly entity: Entity,
		public readonly fieldSchema: SchemaColumn,
	) {
	}

	setPersistedValue({ value }: { value: Value | null }) {
		this.#persistedValue = value
		this.#value = value
	}

	setValue({ value, agent }: { value: Value | null; agent?: string  }) {
		if (value === this.#value) {
			return
		}
		this.#value = value
		this.#touchLog ??= new Set()
		this.#touchLog.add(agent ?? 'user')
		this.notifyListeners()
	}

	get persistedValue(): Value | null | undefined {
		return this.#persistedValue
	}

	get hasUnpersistedChanges(): boolean {
		return this.#value !== (this.#persistedValue ?? null)
	}

	get value(): Value | null {
		return this.#value
	}

	get errors(): ErrorAccessor | undefined {
		return this.#errors?.errors
	}

	addError(error: ErrorAccessor.Error): ErrorAccessor.ClearError {
		this.#errors ??= new ErrorSet()
		const cleanup = this.#errors.addError(error)
		this.notifyListeners()
		return cleanup
	}

	clearErrors(): void {
		this.#errors = undefined
	}

	isTouchedBy(agent: FieldAccessor.TouchAgent): boolean {
		return this.#touchLog?.has(agent) ?? false
	}

	listen(listener: EntityFieldUpdateHandler<Value>): () => void {
		this.listeners.add(listener)
		return () => {
			this.listeners.delete(listener)
		}
	}

	private notifyListeners() {
		for (const listener of this.listeners) {
			listener()
		}
	}
}
