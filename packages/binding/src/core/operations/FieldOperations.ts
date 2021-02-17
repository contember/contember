import { GraphQlBuilder } from '@contember/client'
import { validate as uuidValidate } from 'uuid'
import { FieldAccessor } from '../../accessors'
import { ClientGeneratedUuid } from '../../accessorTree'
import { BindingError } from '../../BindingError'
import { PRIMARY_KEY_NAME } from '../../bindingTypes'
import { Scalar } from '../../treeParameters'
import { EventManager } from '../EventManager'
import { RealmKeyGenerator } from '../RealmKeyGenerator'
import { FieldState, getEntityMarker, StateIterator, StateType } from '../state'
import { TreeStore } from '../TreeStore'

export class FieldOperations {
	public constructor(private readonly eventManager: EventManager, private readonly treeStore: TreeStore) {}

	public updateValue(
		fieldState: FieldState,
		newValue: Scalar | GraphQlBuilder.Literal,
		{ agent = FieldAccessor.userAgent }: FieldAccessor.UpdateOptions = {},
	) {
		this.eventManager.syncOperation(() => {
			const { placeholderName, parent } = fieldState
			if (placeholderName === PRIMARY_KEY_NAME) {
				this.changeEntityId(fieldState, newValue)
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
				field.hasStaleAccessor = true

				const resolvedValue =
					field.fieldMarker.defaultValue === undefined
						? newValue
						: newValue === null
						? field.fieldMarker.defaultValue
						: newValue
				const normalizedValue = resolvedValue instanceof GraphQlBuilder.Literal ? resolvedValue.value : resolvedValue
				const normalizedPersistedValue = field.persistedValue === undefined ? null : field.persistedValue
				const hadUnpersistedChangesBefore = field.hasUnpersistedChanges
				const hasUnpersistedChangesNow = normalizedValue !== normalizedPersistedValue
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

	public changeEntityId(fieldState: FieldState, newValue: Scalar | GraphQlBuilder.Literal) {
		this.eventManager.syncOperation(() => {
			const entity = fieldState.parent.entity

			if (__DEV_MODE__) {
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
				if (this.treeStore.entityStore.has(newValue)) {
					throw new BindingError(
						`Trying to set the '${PRIMARY_KEY_NAME}' field to '${newValue}' which is a valid uuid but is not unique. ` +
							`It is already in use by an existing entity.`,
					)
				}
			}

			const previousId = entity.id
			const newId = new ClientGeneratedUuid(newValue as string)

			this.treeStore.entityStore.delete(previousId.value)
			this.treeStore.entityStore.set(newId.value, entity)
			entity.hasIdSetInStone = true
			entity.id = newId

			const existingRealms = new Map(entity.realms)
			entity.realms.clear()

			for (const [oldRealmKey, realm] of existingRealms) {
				const newRealmKey = RealmKeyGenerator.getRealmKey(newId, realm.blueprint)

				realm.realmKey = newRealmKey
				entity.realms.set(newRealmKey, realm)

				this.treeStore.entityRealmStore.delete(oldRealmKey)
				this.treeStore.entityRealmStore.set(newRealmKey, realm)

				if (realm.blueprint.type === 'listEntity') {
					realm.blueprint.parent.children.changeKey(previousId.value, newId.value) // 😎
				} else if (realm.blueprint.type === 'hasOne') {
					this.eventManager.registerUpdatedConnection(realm.blueprint.parent, realm.blueprint.marker.placeholderName)
				}
				if (realm.type === StateType.EntityRealm) {
					this.eventManager.registerJustUpdated(realm, EventManager.NO_CHANGES_DIFFERENCE)
				}
			}
		})
	}
}
