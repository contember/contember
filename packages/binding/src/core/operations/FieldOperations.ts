import { validate as uuidValidate } from 'uuid'
import { ErrorAccessor, FieldAccessor } from '../../accessors'
import { ClientGeneratedUuid, ServerId } from '../../accessorTree'
import { BindingError } from '../../BindingError'
import { PRIMARY_KEY_NAME } from '../../bindingTypes'
import type { FieldValue } from '../../treeParameters'
import type { AccessorErrorManager } from '../AccessorErrorManager'
import { EventManager } from '../EventManager'
import { FieldState, getEntityMarker, StateIterator } from '../state'
import type { StateInitializer } from '../StateInitializer'
import type { TreeStore } from '../TreeStore'
import { OperationsHelpers } from './OperationsHelpers'
import { EventListenersStore } from '../../treeParameters'

export class FieldOperations {
	public constructor(
		private readonly accessorErrorManager: AccessorErrorManager,
		private readonly eventManager: EventManager,
		private readonly stateInitializer: StateInitializer,
		private readonly treeStore: TreeStore,
	) {}

	public addError(fieldState: FieldState<any>, error: ErrorAccessor.Error): () => void {
		return this.accessorErrorManager.addError(fieldState, error)
	}

	public clearErrors(fieldState: FieldState<any>): void {
		return this.accessorErrorManager.clearErrorsByState(fieldState)
	}

	public addEventListener<
		Type extends keyof FieldAccessor.FieldEventListenerMap,
		Value extends FieldValue = FieldValue,
	>(
		state: FieldState<Value>,
		event: { type: Type; key?: string },
		listener: FieldAccessor.FieldEventListenerMap<Value>[Type],
	): () => void {
		if (!state.eventListeners) {
			state.eventListeners = new EventListenersStore()
		}
		return state.eventListeners.add(event, listener)
	}

	public updateValue<Value extends FieldValue = FieldValue>(
		fieldState: FieldState<Value>,
		newValue: Value | null,
		{ agent = FieldAccessor.userAgent }: FieldAccessor.UpdateOptions = {},
	) {
		this.eventManager.syncOperation(() => {
			const { placeholderName, parent } = fieldState
			if (placeholderName === PRIMARY_KEY_NAME) {
				const entity = fieldState.parent.entity

				if (import.meta.env.DEV) {
					if (newValue !== fieldState.value && (fieldState.touchLog !== undefined || entity.hasIdSetInStone)) {
						throw new BindingError(
							`Trying to set the '${PRIMARY_KEY_NAME}' field for the second time. This is prohibited.\n` +
								`Once set, it is immutable.`,
						)
					}
					if (typeof newValue !== 'string' || !uuidValidate(newValue)) {
						throw new BindingError(
							`Invalid value supplied for the '${PRIMARY_KEY_NAME}' field. ` +
								`Expecting a valid uuid but '${newValue}' was given.\n` +
								`Hint: you may use 'FieldAccessor.asUuid.setToUuid()'.`,
						)
					}
					if (this.treeStore.entityStore.has(ServerId.formatUniqueValue(newValue, entity.entityName))) {
						throw new BindingError(
							`Trying to set the '${PRIMARY_KEY_NAME}' field to '${newValue}' which is a valid uuid but is not unique. ` +
								`It is already in use by an existing entity.`,
						)
					}
				}
				if (typeof newValue !== 'string') {
					throw new BindingError()
				}
				OperationsHelpers.changeEntityId(
					this.treeStore,
					this.eventManager,
					this.stateInitializer,
					entity,
					new ClientGeneratedUuid(newValue),
				)
			}
			for (const field of StateIterator.eachSiblingRealmChild(this.treeStore, fieldState)) {
				if (newValue === field.value) {
					continue
				}
				if (field.touchLog === undefined) {
					field.touchLog = new Set()
				}
				field.touchLog.add(agent)
				field.value = newValue

				const resolvedValue =
					field.fieldMarker.defaultValue === undefined
						? newValue
						: newValue === null
						? field.fieldMarker.defaultValue
						: newValue
				const normalizedPersistedValue = field.persistedValue === undefined ? null : field.persistedValue
				const hadUnpersistedChangesBefore = field.hasUnpersistedChanges
				const hasUnpersistedChangesNow = resolvedValue !== normalizedPersistedValue
				field.hasUnpersistedChanges = hasUnpersistedChangesNow

				const shouldInfluenceUpdateCount =
					!getEntityMarker(parent).fields.hasAtLeastOneBearingField ||
					!field.fieldMarker.isNonbearing ||
					field.persistedValue !== undefined

				let changesDelta = EventManager.NO_CHANGES_DIFFERENCE

				if (shouldInfluenceUpdateCount) {
					if (!hadUnpersistedChangesBefore && hasUnpersistedChangesNow) {
						changesDelta++
					} else if (hadUnpersistedChangesBefore && !hasUnpersistedChangesNow) {
						changesDelta--
					}
				}

				this.eventManager.registerJustUpdated(field, changesDelta)
			}
		})
	}
}
