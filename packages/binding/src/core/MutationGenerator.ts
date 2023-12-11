import { ContentMutation, ContentQueryBuilder, GraphQlLiteral, Input, replaceGraphQlLiteral } from '@contember/client'
import { ClientGeneratedUuid, EntityFieldPersistedData,  ReceivedEntityData, ServerId } from '../accessorTree'
import { BindingError } from '../BindingError'
import { PRIMARY_KEY_NAME, TYPENAME_KEY_NAME } from '../bindingTypes'
import { EntityFieldMarkers, FieldMarker, HasManyRelationMarker, HasOneRelationMarker } from '../markers'
import type { EntityId, EntityName, PlaceholderName, UniqueWhere } from '../treeParameters'
import { assertNever, isEmptyObject } from '../utils'
import { QueryGenerator } from './QueryGenerator'
import { MutationAlias } from './requestAliases'
import { EntityListState, EntityRealmState, EntityRealmStateStub, EntityState, FieldState, getEntityMarker, StateIterator } from './state'
import type { TreeStore } from './TreeStore'


type ProcessedPlaceholdersByEntity = Map<EntityState, Set<PlaceholderName>>

export type SubMutationOperation =
	& {
		alias: string,
		subTreePlaceholder: PlaceholderName,
		subTreeType: 'list' | 'single'
	}
	& (
		| { type: 'delete', id: EntityId }
		| { type: 'update', markers: EntityFieldMarkers, id: EntityId }
		| { type: 'create', markers: EntityFieldMarkers, id: EntityId }
	)

export type PersistMutationResult = {
	mutations: Record<string, ContentMutation<ReceivedEntityData>>
	operations: SubMutationOperation[]
}

// TODO enforce correct expected mutations in dev mode.
export class MutationGenerator {

	private aliasCounter = 1

	public constructor(
		private readonly treeStore: TreeStore,
		private readonly qb: ContentQueryBuilder,
	) {
	}

	public getPersistMutation(): PersistMutationResult | undefined {
		const mutations: Record<string, ContentMutation<any>> = {}
		const operations: SubMutationOperation[] = []
		const processedPlaceholdersByEntity: ProcessedPlaceholdersByEntity = new Map()
		const processedDeletes = new Set<string>()

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
						processedPlaceholdersByEntity,
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
							processedPlaceholdersByEntity,
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
								if (processedDeletes.has(key)) {
									continue
								}
								processedDeletes.add(key)
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
		processedPlaceholdersByEntity: ProcessedPlaceholdersByEntity,
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
				processedPlaceholdersByEntity,
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
			processedPlaceholdersByEntity,
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
		processedPlaceholdersByEntity: ProcessedPlaceholdersByEntity,
		entityRealm: EntityRealmState,
		fieldMarkers: EntityFieldMarkers,
	): ContentMutation<any> | undefined {
		const input = this.getUpdateDataInput(processedPlaceholdersByEntity, entityRealm)

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
		processedPlaceholdersByEntity: ProcessedPlaceholdersByEntity,
		entityRealm: EntityRealmState,
		fieldMarkers: EntityFieldMarkers,
	): ContentMutation<any> | undefined {
		const input = this.getCreateDataInput(
			processedPlaceholdersByEntity,
			entityRealm,
		)
		if (input === undefined) {
			return undefined
		}

		return this.qb.create(entityRealm.entity.entityName, {
			data: input,
		}, it => QueryGenerator.registerQueryPart(fieldMarkers, it).$(PRIMARY_KEY_NAME).$('__typename'))
	}

	private getCreateDataInput(
		processedPlaceholdersByEntity: ProcessedPlaceholdersByEntity,
		currentState: EntityRealmState | EntityRealmStateStub,
	): Input.CreateDataInput | undefined {
		let processedPlaceholders = processedPlaceholdersByEntity.get(currentState.entity)

		if (processedPlaceholders === undefined) {
			processedPlaceholdersByEntity.set(currentState.entity, (processedPlaceholders = new Set()))
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
						const value = fieldState.getAccessor().resolvedValue
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
						const input = this.getCreateOneRelationInput(processedPlaceholdersByEntity, fieldState, marker)
						if (input !== undefined) {
							result[marker.parameters.field] = input
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
						const input = this.getCreateManyRelationInput(processedPlaceholdersByEntity, fieldState)
						if (input !== undefined) {
							result[marker.parameters.field] = input
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
							const value = field.fieldState.getAccessor().resolvedValue
							if (value !== undefined) {
								result[field.marker.fieldName] = value
							}
							break
						}
						case 'hasOne': {
							const input = this.getCreateOneRelationInput(
								processedPlaceholdersByEntity,
								field.fieldState,
								field.marker,
							)
							if (input !== undefined) {
								result[field.marker.parameters.field] = input
							}
							break
						}
						case 'hasMany': {
							const input = this.getCreateManyRelationInput(
								processedPlaceholdersByEntity,
								field.fieldState,
							)
							if (input !== undefined) {
								result[field.marker.parameters.field] = input
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
						field === null ||
						field instanceof GraphQlLiteral
					) {
						result[key] = field instanceof GraphQlLiteral ? field.value : field
					} else {
						result[key] = { connect: replaceGraphQlLiteral(field) }
					}
				}
			}
		}

		return isEmptyObject(result) ? undefined : result
	}

	private getCreateOneRelationInput(
		processedPlaceholdersByEntity: ProcessedPlaceholdersByEntity,
		fieldState: EntityRealmState | EntityRealmStateStub,
		marker: HasOneRelationMarker,
	): Input.CreateOneRelationInput | Input.CreateManyRelationInput | undefined {
		const reducedBy = marker.parameters.reducedBy
		const runtimeId = fieldState.entity.id

		if (reducedBy === undefined) {
			if (this.shouldConnectInsteadOfCreate(processedPlaceholdersByEntity, fieldState)) {
				return { connect: { [PRIMARY_KEY_NAME]: runtimeId.value } }
			}

			const createData = this.getCreateDataInput(processedPlaceholdersByEntity, fieldState)
			if (createData === undefined) {
				return undefined
			}
			return { create: createData }
		}

		const alias = MutationAlias.encodeEntityId(runtimeId)
		if (this.shouldConnectInsteadOfCreate(processedPlaceholdersByEntity, fieldState)) {
			// TODO also potentially update
			return [{ connect: { [PRIMARY_KEY_NAME]: runtimeId.value }, alias }]
		}
		const createData = this.getCreateDataInput(processedPlaceholdersByEntity, fieldState)
		if (createData === undefined) {
			return undefined
		}
		return [{ create: createData, alias }]
	}

	private getCreateManyRelationInput(
		processedPlaceholdersByEntity: ProcessedPlaceholdersByEntity,
		fieldState: EntityListState,
	): Input.CreateManyRelationInput | undefined {
		const result: Input.CreateManyRelationInput = []
		for (const entityRealm of fieldState.children.values()) {
			const runtimeId = entityRealm.entity.id
			const alias = MutationAlias.encodeEntityId(runtimeId)
			if (this.shouldConnectInsteadOfCreate(processedPlaceholdersByEntity, entityRealm)) {
				result.push({
					alias,
					connect: { [PRIMARY_KEY_NAME]: runtimeId.value },
				})
			} else {
				const createData = this.getCreateDataInput(processedPlaceholdersByEntity, entityRealm)
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

	private shouldConnectInsteadOfCreate(
		processedPlaceholdersByEntity: ProcessedPlaceholdersByEntity,
		currentState: EntityRealmState | EntityRealmStateStub,
	): boolean {
		const runtimeId = currentState.entity.id
		const processedPlaceholders = processedPlaceholdersByEntity.get(currentState.entity)

		return runtimeId.existsOnServer || (runtimeId instanceof ClientGeneratedUuid && (processedPlaceholders?.has(PRIMARY_KEY_NAME) ?? false))
	}

	private getUpdateDataInput(
		processedPlaceholdersByEntity: ProcessedPlaceholdersByEntity,
		currentState: EntityRealmState,
	): Input.UpdateDataInput | undefined {
		let processedPlaceholders = processedPlaceholdersByEntity.get(currentState.entity)

		if (processedPlaceholders === undefined) {
			processedPlaceholdersByEntity.set(currentState.entity, (processedPlaceholders = new Set()))
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
						const resolvedValue = fieldState.getAccessor().resolvedValue
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

					const persistedValue = entityData?.get?.(placeholderName)
					if (reducedBy === undefined) {

						const relationData = this.getUpdateOneRelationInput(currentState, fieldState, persistedValue, processedPlaceholdersByEntity, placeholderName)
						if (relationData !== undefined) {
							result[marker.parameters.field] = relationData
						}


					} else {
						const relationData = this.getUpdateManyRelationForReducedInput(currentState, fieldState, persistedValue, processedPlaceholdersByEntity, placeholderName, reducedBy)
						if (relationData !== undefined) {
							result[marker.parameters.field] = relationData
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
					const persistedEntityIds = entityData?.get?.(placeholderName) ?? new Set()

					if (!(persistedEntityIds instanceof Set)) {
						continue
					}
					const relationData = this.getUpdateManyRelationInput(fieldState, persistedEntityIds, processedPlaceholdersByEntity)
					if (relationData !== undefined) {
						result[marker.parameters.field] = relationData
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
		persistedValue: EntityFieldPersistedData | undefined,
		processedPlaceholdersByEntity: ProcessedPlaceholdersByEntity,
		placeholderName: PlaceholderName,
	): Input.UpdateOneRelationInput | undefined {
		const runtimeId = fieldState.entity.id
		if (persistedValue instanceof ServerId) {
			if (persistedValue.value === runtimeId.value) {
				// The persisted and currently referenced ids match, and so this is an update.
				if (fieldState.type === 'entityRealmStub') {
					return undefined// …unless we're dealing with a stub. There cannot be any updates there.
				}
				const input = this.getUpdateDataInput(processedPlaceholdersByEntity, fieldState)
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
			const createInput = this.getCreateDataInput(processedPlaceholdersByEntity, fieldState)
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
			const input = this.getCreateDataInput(processedPlaceholdersByEntity, fieldState)
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
		persistedValue: EntityFieldPersistedData | undefined,
		processedPlaceholdersByEntity: ProcessedPlaceholdersByEntity,
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
				const updateData = this.getUpdateDataInput(processedPlaceholdersByEntity, fieldState)
				if (updateData === undefined) {
					return undefined
				}
				return [{
					alias,
					update: {
						by: replaceGraphQlLiteral(reducedBy),
						data: updateData,
					},
				}]
			}
			const plannedDeletion = currentState.plannedHasOneDeletions?.get(placeholderName)
			if (plannedDeletion !== undefined) {
				// TODO also potentially do something about the current entity
				return [{
					alias,
					delete: replaceGraphQlLiteral(reducedBy),
				}]
			}
			if (runtimeId.existsOnServer) {
				// TODO will re-using the alias like this work?
				// TODO also potentially update
				return [
					{
						alias,
						disconnect: replaceGraphQlLiteral(reducedBy),
					},
					{
						alias,
						connect: { [PRIMARY_KEY_NAME]: runtimeId.value },
					},
				]
			}
			const createInput = this.getCreateDataInput(processedPlaceholdersByEntity, fieldState)

			if (createInput === undefined) {
				return [{
					alias,
					disconnect: replaceGraphQlLiteral(reducedBy),
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
			const createInput = this.getCreateDataInput(processedPlaceholdersByEntity, fieldState)
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
		processedPlaceholdersByEntity: ProcessedPlaceholdersByEntity,
	): Input.UpdateManyRelationInput | undefined {

		const input: Input.UpdateManyRelationInput = []
		for (const childState of fieldState.children.values()) {
			const runtimeId = childState.entity.id
			const alias = MutationAlias.encodeEntityId(runtimeId)

			if (runtimeId.existsOnServer) {
				if (persistedEntityIds.has(runtimeId.value)) {
					if (childState.type !== 'entityRealmStub') {
						const dataInput = this.getUpdateDataInput(processedPlaceholdersByEntity, childState)

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
				const dataInput = this.getCreateDataInput(processedPlaceholdersByEntity, childState)
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
