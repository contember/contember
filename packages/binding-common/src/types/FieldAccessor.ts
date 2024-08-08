import type { FieldName, FieldValue } from '../treeParameters'
import type { BatchUpdatesOptions } from './BatchUpdatesOptions'
import type { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'
import type { SchemaColumn } from '../schema'
import { EntityAccessor } from './EntityAccessor'


export const isFieldAccessor = (accessor: unknown): accessor is FieldAccessor =>
	accessor !== null && typeof accessor === 'object' && '__type' in accessor && accessor.__type === 'FieldAccessor'

interface FieldAccessor<Value extends FieldValue = FieldValue> extends Errorable {
	readonly __type: 'FieldAccessor'
	readonly fieldName: FieldName
	readonly value: Value | null
	readonly valueOnServer: Value | null
	readonly defaultValue: Value | undefined
	readonly errors: ErrorAccessor | undefined
	readonly hasUnpersistedChanges: boolean
	readonly getAccessor: FieldAccessor.GetFieldAccessor<Value>
	readonly schema: SchemaColumn

	addError(error: ErrorAccessor.Error | string): () => void

	clearErrors(): void

	addEventListener<Type extends keyof FieldAccessor.FieldEventListenerMap<Value>>(
		event: { type: Type; key?: string },
		listener: FieldAccessor.FieldEventListenerMap<Value>[Type],
	): () => void

	updateValue(newValue: Value | null, options?: FieldAccessor.UpdateOptions): void

	hasValue(candidate: this['value']): boolean

	isTouchedBy(agent: string): boolean

	isTouched: boolean

	resolvedValue: Value | null

	getParent(): EntityAccessor
}

namespace FieldAccessor {
	export interface UpdateOptions {
		agent?: 'user' | string
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

export { type FieldAccessor }
