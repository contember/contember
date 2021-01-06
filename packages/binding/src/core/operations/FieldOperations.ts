import { GraphQlBuilder } from '@contember/client'
import { validate as uuidValidate } from 'uuid'
import { FieldAccessor } from '../../accessors'
import { BindingError } from '../../BindingError'
import { PRIMARY_KEY_NAME } from '../../bindingTypes'
import { Scalar } from '../../treeParameters'
import { DirtinessTracker } from '../DirtinessTracker'
import { EventManager } from '../EventManager'
import { FieldState } from '../state'
import { TreeStore } from '../TreeStore'

export class FieldOperations {
	public constructor(
		private readonly dirtinessTracker: DirtinessTracker,
		private readonly eventManager: EventManager,
		private readonly treeStore: TreeStore,
	) {}

	public updateValue(
		fieldState: FieldState,
		newValue: Scalar | GraphQlBuilder.Literal,
		{ agent = FieldAccessor.userAgent }: FieldAccessor.UpdateOptions = {},
	) {
		this.eventManager.syncOperation(() => {
			const { placeholderName, parent } = fieldState
			if (__DEV_MODE__) {
				if (
					placeholderName === PRIMARY_KEY_NAME &&
					newValue !== fieldState.value &&
					fieldState.touchLog !== undefined
				) {
					throw new BindingError(
						`Trying to set the '${PRIMARY_KEY_NAME}' field for the second time. This is prohibited.\n` +
							`Once set, it is immutable.`,
					)
				}
			}
			if (__DEV_MODE__) {
				if (placeholderName === PRIMARY_KEY_NAME) {
					if (typeof newValue !== 'string' || !uuidValidate(newValue)) {
						throw new BindingError(
							`Invalid value supplied for the '${PRIMARY_KEY_NAME}' field. ` +
								`Expecting a valid uuid but '${newValue}' was given.\n` +
								`Hint: you may use 'FieldAccessor.asUuid.setToUuid()'.`,
						)
					}
					if (this.treeStore.entityStore.has(newValue)) {
						throw new BindingError(
							`Trying to set the '${PRIMARY_KEY_NAME}' field to '${newValue}' which is a valid uuid but is not unique. ` +
								`It is already in use by an existing entity.`,
						)
					}
				}
			}
			if (newValue === fieldState.value) {
				return
			}
			if (fieldState.touchLog === undefined) {
				fieldState.touchLog = new Set()
			}
			fieldState.touchLog.add(agent)
			fieldState.value = newValue
			fieldState.hasPendingUpdate = true
			fieldState.hasStaleAccessor = true

			const resolvedValue =
				fieldState.fieldMarker.defaultValue === undefined
					? newValue
					: newValue === null
					? fieldState.fieldMarker.defaultValue
					: newValue
			const normalizedValue = resolvedValue instanceof GraphQlBuilder.Literal ? resolvedValue.value : resolvedValue
			const normalizedPersistedValue = fieldState.persistedValue === undefined ? null : fieldState.persistedValue
			const hadUnpersistedChangesBefore = fieldState.hasUnpersistedChanges
			const hasUnpersistedChangesNow = normalizedValue !== normalizedPersistedValue
			fieldState.hasUnpersistedChanges = hasUnpersistedChangesNow

			const shouldInfluenceUpdateCount =
				!parent.combinedMarkersContainer.hasAtLeastOneBearingField ||
				!fieldState.fieldMarker.isNonbearing ||
				fieldState.persistedValue !== undefined

			if (shouldInfluenceUpdateCount) {
				if (!hadUnpersistedChangesBefore && hasUnpersistedChangesNow) {
					this.dirtinessTracker.increment()
				} else if (hadUnpersistedChangesBefore && !hasUnpersistedChangesNow) {
					this.dirtinessTracker.decrement()
				}
			}

			this.eventManager.registerJustUpdated(fieldState)
			this.eventManager.notifyParents(fieldState)
		})
	}
}
