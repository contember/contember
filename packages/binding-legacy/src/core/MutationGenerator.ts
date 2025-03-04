import { ContentMutation, ContentQueryBuilder, Input } from '@contember/client'
import { ClientGeneratedUuid,  ReceivedEntityData, ServerId } from '@contember/binding-common'
import { BindingError } from '@contember/binding-common'
import { PRIMARY_KEY_NAME, TYPENAME_KEY_NAME } from '@contember/binding-common'
import { EntityFieldMarkers, FieldMarker, HasManyRelationMarker, HasOneRelationMarker } from '@contember/binding-common'
import type { EntityId, EntityName, PlaceholderName, UniqueWhere } from '@contember/binding-common'
import { isEmptyObject } from '../utils'
import { assertNever } from '@contember/binding-common'
import { QueryGenerator } from './QueryGenerator'
import { MutationAlias } from './requestAliases'
import { EntityListState, EntityRealmState, EntityRealmStateStub, EntityState, FieldState, getEntityMarker, StateIterator } from './state'
import type { TreeStore } from './TreeStore'
import { EntityFieldPersistedData, EntityFieldPersistedValue } from '../accessorTree'


type ProcessedPlaceholdersByEntity = Map<EntityState, Set<PlaceholderName>>

export type SubMutationOperation =
	& {
		alias: string
		subTreePlaceholder: PlaceholderName
		subTreeType: 'list' | 'single'
	}
	& (
		| { type: 'delete'; id: EntityId }
		| { type: 'update'; markers: EntityFieldMarkers; id: EntityId }
		| { type: 'create'; markers: EntityFieldMarkers; id: EntityId }
	)

export type PersistMutationResult = {
	mutations: Record<string, ContentMutation<ReceivedEntityData>>
	operations: SubMutationOperation[]
}

// TODO enforce correct expected mutations in dev mode.
export class MutationGenerator {

	private aliasCounter = 1
	private processedPlaceholdersByEntity: ProcessedPlaceholdersByEntity = new Map()
	private processedDeletes = new Set<string>()

	private constructor(
		private readonly treeStore: TreeStore,
		private readonly qb: ContentQueryBuilder,
	) {
	}

	public static getPersistMutation(treeStore: TreeStore, qb: ContentQueryBuilder): PersistMutationResult {
		return new MutationGenerator(treeStore, qb).getPersistMutation()
	}

	private getPersistMutation(): PersistMutationResult {
		const mutations: Record<string, ContentMutation<any>> = {}
		const operations: SubMutationOperation[] = []

		for (const [treeRootId, rootStates] of this.treeStore.subTreeStatesByRoot.entries()) {
			for (const [placeholderName, subTreeState] of Array.from(rootStates.entries()).reverse()) {
				if (subTreeState.unpersistedChangesCount <= 0) {
					continue
				}
				if (subTreeState.type === 'entityRealm') {
					if (subTreeState.blueprint.type === 'subTree' && subTreeState.blueprint.marker.parameters.isCreating && subTreeState.blueprint.marker.parameters.isUnpersisted) {
						continue
					}
					const subMutation = this.createMutation(
						placeholderName,
						'single',
						subTreeState.entity.id.value,
						subTreeState,
					)
					if (subMutation) {
						mutations[subMutation[1].alias] = subMutation[0]
						operations.push(subMutation[1])
					}
				} else if (subTreeState.type === 'entityList') {
					if (subTreeState.blueprint.type === 'subTree' && subTreeState.blueprint.marker.parameters.isCreating && subTreeState.blueprint.marker.parameters.isUnpersisted) {
						continue
					}
					for (const childState of subTreeState.children.values()) {
						if (childState.type === 'entityRealmStub') {
							// TODO there can be a forceCreate somewhere in there that we're hereby ignoring.
							continue
						}
						const subMutation = this.createMutation(
							placeholderName,
							'list',
							childState.entity.id.value,
							childState,
						)
						if (subMutation) {
							mutations[subMutation[1].alias] = subMutation[0]
							operations.push(subMutation[1])
						}
					}
					if (subTreeState.plannedRemovals) {
						for (const [removedId, removalType] of subTreeState.plannedRemovals) {
							if (removalType === 'disconnect') {
								continue
							}
							if (removalType === 'delete') {
								const key = `${subTreeState.entityName}#${removedId}`
								if (this.processedDeletes.has(key)) {
									continue
								}
								this.processedDeletes.add(key)
								const alias = this.createAlias()
								mutations[alias] = this.createDeleteMutation(
									subTreeState.entityName,
									removedId,
								)
								operations.push({ alias, subTreePlaceholder: placeholderName, subTreeType: 'list', type: 'delete', id: removedId })
							} else {
								assertNever(removalType)
							}
						}
					}
				} else {
					assertNever(subTreeState)
				}
			}
		}

		return { mutations, operations }
	}

	private createMutation(
		subTreePlaceholder: PlaceholderName,
		subTreeType: 'list' | 'single',
		entityId: EntityId,
		realmState: EntityRealmState,
	): [ContentMutation<any>, SubMutationOperation] | undefined {
		if (realmState.unpersistedChangesCount === 0) {
			// Bail out early
			return undefined
		}
		const fieldMarkers = getEntityMarker(realmState).fields.markers

		const alias = this.createAlias()

		if (realmState.entity.isScheduledForDeletion) {
			const mutation = this.createDeleteMutation(
				realmState.entity.entityName,
				entityId,
			)
			return [
				mutation,
				{
					alias,
					subTreePlaceholder,
					subTreeType,
					type: 'delete',
					id: entityId,
				},
			]
		} else if (!realmState.entity.id.existsOnServer) {
			const builder = this.createCreateMutation(
				realmState,
				fieldMarkers,
			)
			if (!builder) {
				return undefined
			}
			return [
				builder,
				{
					alias,
					subTreePlaceholder,
					subTreeType,
					type: 'create',
					markers: fieldMarkers,
					id: entityId,
				},
			]
		}
		const builder = this.createUpdateMutation(
			realmState,
			fieldMarkers,
		)
		if (!builder) {
			return undefined
		}
		return [
			builder,
			{
				alias,
				subTreePlaceholder,
				subTreeType,
				type: 'update',
				id: entityId,
				markers: fieldMarkers,
			},
		]
	}

	private createDeleteMutation(
		entityName: EntityName,
		deletedId: EntityId,
	): ContentMutation<any> {
		return this.qb.delete(entityName, {
			by: { [PRIMARY_KEY_NAME]: deletedId },
		}, it  => it.$(PRIMARY_KEY_NAME).$('__typename'))
	}

	private createUpdateMutation(
		entityRealm: EntityRealmState,
		fieldMarkers: EntityFieldMarkers,
	): ContentMutation<any> | undefined {
		const input = this.getUpdateDataInput(entityRealm)

		if (input === undefined) {
			return undefined
		}

		const runtimeId = entityRealm.entity.id

		if (!runtimeId.existsOnServer) {
			return undefined
		}

		return this.qb.update(entityRealm.entity.entityName, {
			by: {
				[PRIMARY_KEY_NAME]: runtimeId.value,
			},
			data: input,
		}, it => QueryGenerator.registerQueryPart(fieldMarkers, it).$(PRIMARY_KEY_NAME).$('__typename'))
	}

	private createCreateMutation(
		entityRealm: EntityRealmState,
		fieldMarkers: EntityFieldMarkers,
	): ContentMutation<any> | undefined {
		const input = this.getCreateDataInput(entityRealm)
		if (input === undefined) {
			return undefined
		}

		return this.qb.create(entityRealm.entity.entityName, {
			data: input,
		}, it => QueryGenerator.registerQueryPart(fieldMarkers, it).$(PRIMARY_KEY_NAME).$('__typename'))
	}

	private getCreateDataInput(
		currentState: EntityRealmState | EntityRealmStateStub,
	): Input.CreateDataInput | undefined {
		let processedPlaceholders = this.processedPlaceholdersByEntity.get(currentState.entity)

		if (processedPlaceholders === undefined) {
			this.processedPlaceholdersByEntity.set(currentState.entity, (processedPlaceholders = new Set()))
		}

		if (currentState.type === 'entityRealmStub') {
			// TODO If there's a forceCreate, this is wrong.
			return undefined
		}

		const result: Input.CreateDataInput = {}
		for (const siblingState of StateIterator.eachSiblingRealm(currentState)) {

			const pathBack = this.treeStore.getPathBackToParent(siblingState)

			const nonbearingFields: Array<| { type: 'field'; marker: FieldMarker; fieldState: FieldState }
			| { type: 'hasOne'; marker: HasOneRelationMarker; fieldState: EntityRealmState | EntityRealmStateStub }
			| { type: 'hasMany'; marker: HasManyRelationMarker; fieldState: EntityListState }> = []

			for (const [placeholderName, fieldState] of siblingState.children) {
				if (processedPlaceholders.has(placeholderName)) {
					continue
				}
				processedPlaceholders.add(placeholderName)

				switch (fieldState.type) {
					case 'field': {
						const marker = fieldState.fieldMarker
						const placeholderName = marker.placeholderName

						if (
							placeholderName === TYPENAME_KEY_NAME ||
							(placeholderName === PRIMARY_KEY_NAME && !(siblingState.entity.id instanceof ClientGeneratedUuid))
						) {
							continue
						}
						if (marker.isNonbearing) {
							nonbearingFields.push({
								type: 'field',
								marker,
								fieldState,
							})
							continue
						}
						const accessor = fieldState.getAccessor()
						const value = accessor.value ?? accessor.defaultValue ?? null
						if (value !== undefined && value !== null) {
							result[marker.fieldName] = value
						}
						break
					}
					case 'entityRealmStub':
					case 'entityRealm': {
						const marker = getEntityMarker(fieldState)
						if (!(marker instanceof HasOneRelationMarker)) {
							throw new BindingError()
						}
						if (pathBack?.fieldBackToParent === marker.parameters.field) {
							continue
						}
						if (marker.parameters.isNonbearing) {
							nonbearingFields.push({
								type: 'hasOne',
								marker,
								fieldState,
							})
							continue
						}
						const input = this.getCreateOneRelationInput(fieldState, marker)
						if (input !== undefined) {
							const current = result[marker.parameters.field]
							if (Array.isArray(input) && Array.isArray(current)) {
								current.push(...input)
							} else {
								result[marker.parameters.field] = input
							}
						}
						break
					}
					case 'entityList': {
						const marker = fieldState.blueprint.marker
						if (!(marker instanceof HasManyRelationMarker)) {
							throw new BindingError()
						}
						if (pathBack?.fieldBackToParent === marker.parameters.field) {
							continue
						}
						if (marker.parameters.isNonbearing) {
							nonbearingFields.push({
								type: 'hasMany',
								marker,
								fieldState,
							})
							continue
						}
						const input = this.getCreateManyRelationInput(fieldState)
						if (input !== undefined) {
							const current = result[marker.parameters.field]
							if (Array.isArray(current)) {
								current.push(...input)
							} else {
								result[marker.parameters.field] = input
							}
						}
						break
					}
					default: {
						return assertNever(fieldState)
					}
				}
			}

			if ((!isEmptyObject(result)) || !getEntityMarker(siblingState).fields.hasAtLeastOneBearingField) {
				for (const field of nonbearingFields) {
					switch (field.type) {
						case 'field': {
							const accessor = field.fieldState.getAccessor()
							const value = accessor.value ?? accessor.defaultValue ?? null
							if (value !== undefined) {
								result[field.marker.fieldName] = value
							}
							break
						}
						case 'hasOne': {
							const input = this.getCreateOneRelationInput(
								field.fieldState,
								field.marker,
							)
							if (input !== undefined) {
								const current = result[field.marker.parameters.field]
								if (Array.isArray(input) && Array.isArray(current)) {
									current.push(...input)
								} else {
									result[field.marker.parameters.field] = input
								}
							}
							break
						}
						case 'hasMany': {
							const input = this.getCreateManyRelationInput(
								field.fieldState,
							)
							if (input !== undefined) {
								const current = result[field.marker.parameters.field]
								if (Array.isArray(current)) {
									current.push(...input)
								} else {
									result[field.marker.parameters.field] = input
								}
							}
							break
						}
						default:
							assertNever(field)
					}
				}
			}

			const setOnCreate = getEntityMarker(siblingState).parameters.setOnCreate
			if (setOnCreate && !isEmptyObject(result)) {
				for (const key in setOnCreate) {
					const field = setOnCreate[key]

					if (
						typeof field === 'string' ||
						typeof field === 'number' ||
						field === null
					) {
						result[key] = field
					} else {
						result[key] = { connect: field }
					}
				}
			}
		}

		return isEmptyObject(result) ? undefined : result
	}

	private getCreateOneRelationInput(
		fieldState: EntityRealmState | EntityRealmStateStub,
		marker: HasOneRelationMarker,
	): Input.CreateOneRelationInput | Input.CreateManyRelationInput | undefined {
		const reducedBy = marker.parameters.reducedBy
		const runtimeId = fieldState.entity.id

		if (reducedBy === undefined) {
			if (this.shouldConnectInsteadOfCreate(fieldState)) {
				return { connect: { [PRIMARY_KEY_NAME]: runtimeId.value } }
			}

			const createData = this.getCreateDataInput(fieldState)
			if (createData === undefined) {
				return undefined
			}
			return { create: createData }
		}

		const alias = MutationAlias.encodeEntityId(runtimeId)
		if (this.shouldConnectInsteadOfCreate(fieldState)) {
			// TODO also potentially update
			return [{ connect: { [PRIMARY_KEY_NAME]: runtimeId.value }, alias }]
		}
		const createData = this.getCreateDataInput(fieldState)
		if (createData === undefined) {
			return undefined
		}
		return [{ create: createData, alias }]
	}

	private getCreateManyRelationInput(fieldState: EntityListState): Input.CreateManyRelationInput | undefined {
		const result: Input.CreateManyRelationInput = []
		for (const entityRealm of fieldState.children.values()) {
			const runtimeId = entityRealm.entity.id
			const alias = MutationAlias.encodeEntityId(runtimeId)
			if (this.shouldConnectInsteadOfCreate(entityRealm)) {
				result.push({
					alias,
					connect: { [PRIMARY_KEY_NAME]: runtimeId.value },
				})
			} else {
				const createData = this.getCreateDataInput(entityRealm)
				if (createData === undefined) {
					continue
				}
				result.push({
					alias,
					create: createData,
				})
			}
		}
		return result.length === 0 ? undefined : result
	}

	private shouldConnectInsteadOfCreate(currentState: EntityRealmState | EntityRealmStateStub): boolean {
		const runtimeId = currentState.entity.id
		const processedPlaceholders = this.processedPlaceholdersByEntity.get(currentState.entity)

		return runtimeId.existsOnServer || (runtimeId instanceof ClientGeneratedUuid && (processedPlaceholders?.has(PRIMARY_KEY_NAME) ?? false))
	}

	private getUpdateDataInput(currentState: EntityRealmState): Input.UpdateDataInput | undefined {
		let processedPlaceholders = this.processedPlaceholdersByEntity.get(currentState.entity)

		if (processedPlaceholders === undefined) {
			this.processedPlaceholdersByEntity.set(currentState.entity, (processedPlaceholders = new Set()))
		}

		const pathBack = this.treeStore.getPathBackToParent(currentState)
		const entityData = this.treeStore.persistedEntityData.get(currentState.entity.id.uniqueValue)

		const result: Input.UpdateDataInput = {}

		for (const [placeholderName, fieldState] of currentState.children) {
			if (placeholderName === PRIMARY_KEY_NAME || placeholderName === TYPENAME_KEY_NAME) {
				continue
			}
			if (processedPlaceholders.has(placeholderName)) {
				continue
			}
			processedPlaceholders.add(placeholderName)

			switch (fieldState.type) {
				case 'field': {
					if (fieldState.persistedValue !== undefined) {
						const accessor = fieldState.getAccessor()
						const resolvedValue = accessor.value ?? accessor.defaultValue ?? null
						if (fieldState.persistedValue !== resolvedValue) {
							result[placeholderName] = resolvedValue
						}
					}
					break
				}
				case 'entityRealmStub':
				case 'entityRealm': {
					const marker = getEntityMarker(fieldState)
					if (!(marker instanceof HasOneRelationMarker)) {
						throw new BindingError()
					}
					if (pathBack?.fieldBackToParent === marker.parameters.field) {
						continue
					}
					const reducedBy = marker.parameters.reducedBy

					const persistedValue = entityData?.get?.(placeholderName)?.value
					if (reducedBy === undefined) {

						const relationData = this.getUpdateOneRelationInput(currentState, fieldState, persistedValue, placeholderName)
						if (relationData !== undefined) {
							result[marker.parameters.field] = relationData
						}


					} else {
						const relationData = this.getUpdateManyRelationForReducedInput(currentState, fieldState, persistedValue, placeholderName, reducedBy)
						if (relationData !== undefined) {
							const current = result[marker.parameters.field]
							if (Array.isArray(current)) {
								current.push(...relationData)
							} else {
								result[marker.parameters.field] = relationData
							}
						}

					}
					break
				}
				case 'entityList': {
					const marker = fieldState.blueprint.marker
					if (!(marker instanceof HasManyRelationMarker)) {
						throw new BindingError()
					}
					if (pathBack?.fieldBackToParent === marker.parameters.field) {
						continue
					}
					const persistedEntityIds = entityData?.get?.(placeholderName)?.value ?? new Set()

					if (!(persistedEntityIds instanceof Set)) {
						continue
					}
					const relationData = this.getUpdateManyRelationInput(fieldState, persistedEntityIds)
					if (relationData !== undefined) {
						const current = result[marker.parameters.field]
						if (Array.isArray(current)) {
							current.push(...relationData)
						} else {
							result[marker.parameters.field] = relationData
						}
					}
					break
				}
				default:
					return assertNever(fieldState)
			}
		}

		return isEmptyObject(result) ? undefined : result
	}

	private getUpdateOneRelationInput(
		currentState: EntityRealmState,
		fieldState: EntityRealmState | EntityRealmStateStub,
		persistedValue: EntityFieldPersistedValue | undefined,
		placeholderName: PlaceholderName,
	): Input.UpdateOneRelationInput | undefined {
		const runtimeId = fieldState.entity.id
		if (persistedValue instanceof ServerId) {
			if (persistedValue.value === runtimeId.value) {
				// The persisted and currently referenced ids match, and so this is an update.
				if (fieldState.type === 'entityRealmStub') {
					return undefined// …unless we're dealing with a stub. There cannot be any updates there.
				}
				const input = this.getUpdateDataInput(fieldState)
				if (input === undefined) {
					return undefined
				}
				return {
					update: input,
				}
			}

			// There was a referenced entity but currently, there is a different one. Let's investigate:

			const plannedDeletion = currentState.plannedHasOneDeletions?.get(placeholderName)
			if (plannedDeletion !== undefined) {
				// It's planned for deletion.
				// TODO also potentially do something about the current entity
				return {
					delete: true,
				}
			}
			if (runtimeId.existsOnServer) {
				// This isn't the persisted entity but it does exist on the server. Thus this is a connect.
				// TODO also potentially update
				return {
					connect: { [PRIMARY_KEY_NAME]: runtimeId.value },
				}

			}
			// The currently present entity doesn't exist on the server. Try if creating yields anything…
			const createInput = this.getCreateDataInput(fieldState)
			if (createInput !== undefined) {
				return {
					create: createInput,
				}
			} else {
				// …but if it doesn't, we just disconnect.
				return {
					disconnect: true,
				}
			}
		} else if (runtimeId.existsOnServer) {
			// There isn't a linked entity on the server but we're seeing one that exists there.
			// Thus this is a connect.
			// TODO also potentially update
			return {
				connect: { [PRIMARY_KEY_NAME]: runtimeId.value },
			}
		} else {
			const input = this.getCreateDataInput(fieldState)
			if (input === undefined) {
				return undefined
			}
			return {
				create: input,
			}
		}
	}

	private getUpdateManyRelationForReducedInput(
		currentState: EntityRealmState,
		fieldState: EntityRealmState | EntityRealmStateStub,
		persistedValue: EntityFieldPersistedValue | undefined,
		placeholderName: PlaceholderName,
		reducedBy: UniqueWhere,
	): Input.UpdateManyRelationInput | undefined {

		const runtimeId = fieldState.entity.id
		const alias = MutationAlias.encodeEntityId(runtimeId)

		if (persistedValue instanceof ServerId) {
			if (persistedValue.value === runtimeId.value) {
				if (fieldState.type === 'entityRealmStub') {
					return undefined
				}
				const updateData = this.getUpdateDataInput(fieldState)
				if (updateData === undefined) {
					return undefined
				}
				return [{
					alias,
					update: {
						by: reducedBy,
						data: updateData,
					},
				}]
			}
			const plannedDeletion = currentState.plannedHasOneDeletions?.get(placeholderName)
			if (plannedDeletion !== undefined) {
				// TODO also potentially do something about the current entity
				return [{
					alias,
					delete: reducedBy,
				}]
			}
			if (runtimeId.existsOnServer) {
				// TODO will re-using the alias like this work?
				// TODO also potentially update
				return [
					{
						alias,
						disconnect: reducedBy,
					},
					{
						alias,
						connect: { [PRIMARY_KEY_NAME]: runtimeId.value },
					},
				]
			}
			const createInput = this.getCreateDataInput(fieldState)

			if (createInput === undefined) {
				return [{
					alias,
					disconnect: reducedBy,
				}]
			}
			return [{
				alias,
				create: createInput,
			}]
		} else if (runtimeId.existsOnServer) {
			return [{
				alias,
				connect: { [PRIMARY_KEY_NAME]: runtimeId.value },
			}]
		} else {
			const createInput = this.getCreateDataInput(fieldState)
			if (createInput === undefined) {
				return undefined
			}
			return [{
				alias,
				create: createInput,
			}]
		}
	}

	private getUpdateManyRelationInput(
		fieldState: EntityListState,
		persistedEntityIds: Set<EntityId>,
	): Input.UpdateManyRelationInput | undefined {

		const input: Input.UpdateManyRelationInput = []
		for (const childState of fieldState.children.values()) {
			const runtimeId = childState.entity.id
			const alias = MutationAlias.encodeEntityId(runtimeId)

			if (runtimeId.existsOnServer) {
				if (persistedEntityIds.has(runtimeId.value)) {
					if (childState.type !== 'entityRealmStub') {
						const dataInput = this.getUpdateDataInput(childState)

						if (dataInput !== undefined) {
							input.push({
								alias,
								update: {
									by: { [PRIMARY_KEY_NAME]: runtimeId.value },
									data: dataInput,
								},
							})
						}
					}
				} else {
					input.push({
						alias,
						connect: { [PRIMARY_KEY_NAME]: runtimeId.value },
					})
				}
			} else {
				const dataInput = this.getCreateDataInput(childState)
				if (dataInput !== undefined) {
					input.push({
						alias,
						create: dataInput,
					})
				}
			}
		}
		if (fieldState.plannedRemovals) {
			for (const [removedId, removalType] of fieldState.plannedRemovals) {
				const alias = MutationAlias.encodeEntityId(new ServerId(removedId, fieldState.entityName))
				if (removalType === 'delete') {

					input.push({
						alias,
						delete: { [PRIMARY_KEY_NAME]: removedId },
					})

				} else if (removalType === 'disconnect') {
					// TODO also potentially update

					input.push({
						alias,
						disconnect: { [PRIMARY_KEY_NAME]: removedId },
					})
				} else {
					assertNever(removalType)
				}
			}
		}

		return input.length === 0 ? undefined : input
	}


	private createAlias(): string {
		return `op_${this.aliasCounter++}`
	}
}
