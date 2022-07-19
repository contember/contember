// noinspection JSVoidFunctionReturnValueUsed // IntelliJ seems to be super confused througouht this file.

import { CrudQueryBuilder, GraphQlBuilder } from '@contember/client'
import { ClientGeneratedUuid, ServerId } from '../accessorTree'
import { BindingError } from '../BindingError'
import { PRIMARY_KEY_NAME, TYPENAME_KEY_NAME } from '../bindingTypes'
import { EntityFieldMarkers, FieldMarker, HasManyRelationMarker, HasOneRelationMarker } from '../markers'
import type { EntityId, EntityName, FieldValue, PlaceholderName, TreeRootId } from '../treeParameters'
import { assertNever, isEmptyObject } from '../utils'
import { QueryGenerator } from './QueryGenerator'
import { MutationAlias, mutationOperationSubTreeType, mutationOperationType } from './requestAliases'
import {
	EntityListState,
	EntityRealmState,
	EntityRealmStateStub,
	EntityState,
	FieldState,
	getEntityMarker,
	StateIterator,
} from './state'
import type { TreeStore } from './TreeStore'

type QueryBuilder = Omit<CrudQueryBuilder.CrudQueryBuilder, CrudQueryBuilder.Queries>

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
	query: string
	operations: SubMutationOperation[]
}

// TODO enforce correct expected mutations in dev mode.
export class MutationGenerator {
	public constructor(private readonly treeStore: TreeStore) {
	}

	public getPersistMutation(): PersistMutationResult | undefined {
		try {
			let builder: QueryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
			const operations: SubMutationOperation[] = []
			const processedPlaceholdersByEntity: ProcessedPlaceholdersByEntity = new Map()


			for (const [treeRootId, rootStates] of this.treeStore.subTreeStatesByRoot.entries()) {
				for (const [placeholderName, subTreeState] of Array.from(rootStates.entries()).reverse()) {
					if (subTreeState.unpersistedChangesCount <= 0) {
						continue
					}
					if (subTreeState.type === 'entityRealm') {
						const [newBuilder, op] = this.addSubMutation(
							processedPlaceholdersByEntity,
							treeRootId,
							placeholderName,
							mutationOperationSubTreeType.singleEntity,
							subTreeState.entity.id.value,
							subTreeState,
							builder,
						)
						builder = newBuilder
						if (op) {
							operations.push(op)
						}
					} else if (subTreeState.type === 'entityList') {
						for (const childState of subTreeState.children.values()) {
							if (childState.type === 'entityRealmStub') {
								// TODO there can be a forceCreate somewhere in there that we're hereby ignoring.
								continue
							}
							const [newBuilder, op] = this.addSubMutation(
								processedPlaceholdersByEntity,
								treeRootId,
								placeholderName,
								mutationOperationSubTreeType.entityList,
								childState.entity.id.value,
								childState,
								builder,
							)
							if (op) {
								operations.push(op)
							}
							builder = newBuilder
						}
						if (subTreeState.plannedRemovals) {
							for (const [removedId, removalType] of subTreeState.plannedRemovals) {
								if (removalType === 'disconnect') {
									continue
								}
								if (removalType === 'delete') {
									const alias = MutationAlias.encodeTopLevel({
										treeRootId,
										subTreePlaceholder: placeholderName,
										type: mutationOperationType.delete,
										subTreeType: mutationOperationSubTreeType.entityList,
										entityId: removedId,
									})
									builder = this.addDeleteMutation(
										subTreeState.entityName,
										removedId,
										alias,
										builder,
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

			const query = builder.inTransaction(undefined, { deferForeignKeyConstraints: true }).getGql()
			return { query, operations }
		} catch (e) {
			return undefined
		}
	}

	private addSubMutation(
		processedPlaceholdersByEntity: ProcessedPlaceholdersByEntity,
		treeRootId: TreeRootId | undefined,
		subTreePlaceholder: PlaceholderName,
		subTreeType: typeof mutationOperationSubTreeType[keyof typeof mutationOperationSubTreeType],
		entityId: EntityId,
		realmState: EntityRealmState,
		queryBuilder: QueryBuilder,
	): [QueryBuilder, SubMutationOperation | undefined] {
		if (realmState.unpersistedChangesCount === 0) {
			// Bail out early
			return [queryBuilder, undefined]
		}
		const fieldMarkers = getEntityMarker(realmState).fields.markers

		const subTreeTypeNormalized = subTreeType === 'l' ? 'list' : 'single'
		if (realmState.entity.isScheduledForDeletion) {
			const alias = MutationAlias.encodeTopLevel({
				treeRootId,
				subTreePlaceholder,
				type: mutationOperationType.delete,
				subTreeType,
				entityId,
			})
			const builder = this.addDeleteMutation(
				realmState.entity.entityName,
				entityId,
				alias,
				queryBuilder,
			)
			return [
				builder,
				{
					alias,
					subTreePlaceholder,
					subTreeType: subTreeTypeNormalized,
					type: 'delete',
					id: entityId,
				},
			]
		} else if (!realmState.entity.id.existsOnServer) {
			const alias = MutationAlias.encodeTopLevel({
				treeRootId,
				subTreePlaceholder,
				type: mutationOperationType.create,
				subTreeType,
				entityId,
			})
			const builder = this.addCreateMutation(
				processedPlaceholdersByEntity,
				realmState,
				alias,
				this.getNodeFragmentName(subTreePlaceholder, subTreeType, realmState),
				queryBuilder,
				fieldMarkers,
			)
			return [
				builder,
				{
					alias,
					subTreePlaceholder,
					subTreeType: subTreeTypeNormalized,
					type: 'create',
					markers: fieldMarkers,
					id: entityId,
				},
]
		}

		const alias = MutationAlias.encodeTopLevel({
			treeRootId,
			subTreePlaceholder,
			type: mutationOperationType.update,
			subTreeType,
			entityId,
		})
		const builder = this.addUpdateMutation(
			processedPlaceholdersByEntity,
			realmState,
			alias,
			this.getNodeFragmentName(subTreePlaceholder, subTreeType, realmState),
			queryBuilder,
			fieldMarkers,
		)
		return [
			builder,
			{
				alias,
				subTreePlaceholder,
				subTreeType: subTreeTypeNormalized,
				type: 'update',
				id: entityId,
				markers: fieldMarkers,
			},
		]
	}

	private getNodeFragmentName(
		subTreePlaceholder: PlaceholderName,
		subTreeType: typeof mutationOperationSubTreeType[keyof typeof mutationOperationSubTreeType],
		realmState: EntityRealmState,
	): string | undefined {
		if (subTreeType !== mutationOperationSubTreeType.entityList) {
			return undefined
		}
		return `${realmState.entity.entityName}_${subTreePlaceholder}`
	}

	private addDeleteMutation(
		entityName: EntityName,
		deletedId: EntityId,
		alias: string,
		queryBuilder: QueryBuilder = new CrudQueryBuilder.CrudQueryBuilder(),
	): QueryBuilder {
		return queryBuilder.delete(
			entityName,
			builder =>
				builder
					.ok()
					.node(builder => builder.column(PRIMARY_KEY_NAME))
					.by({ [PRIMARY_KEY_NAME]: deletedId })
					.errors()
					.errorMessage(),
			alias,
		)
	}

	private addUpdateMutation(
		processedPlaceholdersByEntity: ProcessedPlaceholdersByEntity,
		entityRealm: EntityRealmState,
		alias: string,
		nodeFragmentName: string | undefined,
		queryBuilder: QueryBuilder = new CrudQueryBuilder.CrudQueryBuilder(),
		fieldMarkers: EntityFieldMarkers,
	): QueryBuilder {
		const updateBuilder: CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Update> =
			this.registerUpdateMutationPart(
				processedPlaceholdersByEntity,
				entityRealm,
				new CrudQueryBuilder.WriteDataBuilder(),
			)
		if (updateBuilder.data === undefined || isEmptyObject(updateBuilder.data)) {
			return queryBuilder
		}

		const runtimeId = entityRealm.entity.id

		if (!runtimeId.existsOnServer) {
			return queryBuilder
		}

		const readBuilder = QueryGenerator.registerQueryPart(
			fieldMarkers,
			CrudQueryBuilder.ReadBuilder.instantiate(),
		)

		if (nodeFragmentName) {
			queryBuilder = queryBuilder.fragment(nodeFragmentName, entityRealm.entity.entityName, readBuilder)
		}

		return queryBuilder.update(
			entityRealm.entity.entityName,
			builder =>
				builder
					.node(nodeFragmentName ? builder => builder.applyFragment(nodeFragmentName) : readBuilder)
					.data(updateBuilder)
					.by({ [PRIMARY_KEY_NAME]: runtimeId.value })
					.ok()
					.validation()
					.errors()
					.errorMessage(),
			alias,
		)
	}

	private addCreateMutation(
		processedPlaceholdersByEntity: ProcessedPlaceholdersByEntity,
		entityRealm: EntityRealmState,
		alias: string,
		nodeFragmentName: string | undefined,
		queryBuilder: QueryBuilder = new CrudQueryBuilder.CrudQueryBuilder(),
		fieldMarkers: EntityFieldMarkers,
	): QueryBuilder {
		const createBuilder: CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Create> =
			this.registerCreateMutationPart(
				processedPlaceholdersByEntity,
				entityRealm,
				new CrudQueryBuilder.WriteDataBuilder(),
			)
		if (createBuilder.data === undefined || isEmptyObject(createBuilder.data)) {
			return queryBuilder
		}
		const readBuilder = QueryGenerator.registerQueryPart(
			fieldMarkers,
			CrudQueryBuilder.ReadBuilder.instantiate(),
		)
		if (nodeFragmentName) {
			queryBuilder = queryBuilder.fragment(nodeFragmentName, entityRealm.entity.entityName, readBuilder)
		}

		return queryBuilder.create(
			entityRealm.entity.entityName,
			builder => {
				// if (where && writeBuilder.data !== undefined && !isEmptyObject(writeBuilder.data)) {
				// 	// Shallow cloning the parameters like this IS too naïve but it will likely last surprisingly long before we
				// 	// run into issues.
				// 	writeBuilder = new CrudQueryBuilder.WriteDataBuilder({ ...writeBuilder.data, ...where })
				// }
				return builder
					.node(nodeFragmentName ? builder => builder.applyFragment(nodeFragmentName) : readBuilder)
					.data(createBuilder)
					.ok()
					.validation()
					.errors()
					.errorMessage()
			},
			alias,
		)
	}

	private registerCreateMutationPart(
		processedPlaceholdersByEntity: ProcessedPlaceholdersByEntity,
		currentState: EntityRealmState | EntityRealmStateStub,
		builder: CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Create> = new CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Create>(),
	): CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Create> {
		let processedPlaceholders = processedPlaceholdersByEntity.get(currentState.entity)

		if (processedPlaceholders === undefined) {
			processedPlaceholdersByEntity.set(currentState.entity, (processedPlaceholders = new Set()))
		}

		if (currentState.type === 'entityRealmStub') {
			// TODO If there's a forceCreate, this is wrong.
			return builder
		}

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
						builder = this.registerCreateFieldPart(fieldState, marker, builder)
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
						builder = this.registerCreateEntityPart(processedPlaceholdersByEntity, fieldState, marker, builder)
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
						builder = this.registerCreateEntityListPart(processedPlaceholdersByEntity, fieldState, marker, builder)
						break
					}
					default: {
						return assertNever(fieldState)
					}
				}
			}

			// if (
			// 	currentState.blueprint.creationParameters.forceCreation &&
			// 	(builder.data === undefined || isEmptyObject(builder.data))
			// ) {
			// 	builder = builder.set('_dummy_field_', true)
			// }

			if (
				(builder.data !== undefined && !isEmptyObject(builder.data)) ||
				!getEntityMarker(siblingState).fields.hasAtLeastOneBearingField
			) {
				for (const field of nonbearingFields) {
					switch (field.type) {
						case 'field': {
							builder = this.registerCreateFieldPart(field.fieldState, field.marker, builder)
							break
						}
						case 'hasOne': {
							builder = this.registerCreateEntityPart(
								processedPlaceholdersByEntity,
								field.fieldState,
								field.marker,
								builder,
							)
							break
						}
						case 'hasMany': {
							builder = this.registerCreateEntityListPart(
								processedPlaceholdersByEntity,
								field.fieldState,
								field.marker,
								builder,
							)
							break
						}
						default:
							assertNever(field)
					}
				}
			}

			const setOnCreate = getEntityMarker(siblingState).parameters.setOnCreate
			if (setOnCreate && builder.data !== undefined && !isEmptyObject(builder.data)) {
				for (const key in setOnCreate) {
					const field = setOnCreate[key]

					if (
						typeof field === 'string' ||
						typeof field === 'number' ||
						field === null ||
						field instanceof GraphQlBuilder.GraphQlLiteral
					) {
						builder = builder.set(key, field)
					} else {
						builder = builder.one(key, builder => builder.connect(field))
					}
				}
			}
		}

		return builder
	}

	private registerCreateFieldPart(
		fieldState: FieldState,
		marker: FieldMarker,
		builder: CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Create>,
	) {
		const resolvedValue = fieldState.getAccessor().resolvedValue

		if (resolvedValue !== undefined && resolvedValue !== null) {
			return builder.set(marker.fieldName, this.transformFieldValue(fieldState, resolvedValue))
		}
		return builder
	}

	private registerCreateEntityPart(
		processedPlaceholdersByEntity: ProcessedPlaceholdersByEntity,
		fieldState: EntityRealmState | EntityRealmStateStub,
		marker: HasOneRelationMarker,
		builder: CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Create>,
	) {
		const reducedBy = marker.parameters.reducedBy
		const runtimeId = fieldState.entity.id

		if (reducedBy === undefined) {
			return builder.one(marker.parameters.field, builder => {
				if (runtimeId.existsOnServer) {
					// TODO also potentially update
					return builder.connect({ [PRIMARY_KEY_NAME]: runtimeId.value })
				}
				return builder.create(this.registerCreateMutationPart(processedPlaceholdersByEntity, fieldState))
			})
		}
		return builder.many(marker.parameters.field, builder => {
			const alias = MutationAlias.encodeEntityId(runtimeId)
			if (runtimeId.existsOnServer) {
				// TODO also potentially update
				return builder.connect({ [PRIMARY_KEY_NAME]: runtimeId.value }, alias)
			}
			return builder.create(this.registerCreateMutationPart(processedPlaceholdersByEntity, fieldState), alias)
		})
	}

	private registerCreateEntityListPart(
		processedPlaceholdersByEntity: ProcessedPlaceholdersByEntity,
		fieldState: EntityListState,
		marker: HasManyRelationMarker,
		builder: CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Create>,
	) {
		return builder.many(marker.parameters.field, builder => {
			for (const entityRealm of fieldState.children.values()) {
				const alias = MutationAlias.encodeEntityId(entityRealm.entity.id)
				if (entityRealm.entity.id.existsOnServer) {
					// TODO also potentially update
					builder = builder.connect({ [PRIMARY_KEY_NAME]: entityRealm.entity.id.value }, alias)
				} else {
					builder = builder.create(this.registerCreateMutationPart(processedPlaceholdersByEntity, entityRealm), alias)
				}
			}
			return builder
		})
	}

	private registerUpdateMutationPart(
		processedPlaceholdersByEntity: ProcessedPlaceholdersByEntity,
		currentState: EntityRealmState,
		builder: CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Update>,
	): CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Update> {
		let processedPlaceholders = processedPlaceholdersByEntity.get(currentState.entity)

		if (processedPlaceholders === undefined) {
			processedPlaceholdersByEntity.set(currentState.entity, (processedPlaceholders = new Set()))
		}

		const pathBack = this.treeStore.getPathBackToParent(currentState)
		const entityData = this.treeStore.persistedEntityData.get(currentState.entity.id.uniqueValue)

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
							builder = builder.set(placeholderName, this.transformFieldValue(fieldState, resolvedValue))
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
					const runtimeId = fieldState.entity.id
					const reducedBy = marker.parameters.reducedBy

					if (reducedBy === undefined) {
						const subBuilder = ((
							builder: CrudQueryBuilder.WriteOneRelationBuilder<CrudQueryBuilder.WriteOperation.Update>,
						) => {
							const persistedValue = entityData?.get?.(placeholderName)

							if (persistedValue instanceof ServerId) {
								if (persistedValue.value === runtimeId.value) {
									// The persisted and currently referenced ids match, and so this is an update.
									if (fieldState.type === 'entityRealmStub') {
										return builder // …unless we're dealing with a stub. There cannot be any updates there.
									}
									return builder.update(builder =>
										this.registerUpdateMutationPart(processedPlaceholdersByEntity, fieldState, builder),
									)
								}
								// There was a referenced entity but currently, there is a different one. Let's investigate:

								const plannedDeletion = currentState.plannedHasOneDeletions?.get(placeholderName)
								if (plannedDeletion !== undefined) {
									// It's planned for deletion.
									// TODO also potentially do something about the current entity
									return builder.delete()
								}
								if (runtimeId.existsOnServer) {
									// This isn't the persisted entity but it does exist on the server. Thus this is a connect.
									// TODO also potentially update
									return builder.connect({
										[PRIMARY_KEY_NAME]: runtimeId.value,
									})
								}
								// The currently present entity doesn't exist on the server. Try if creating yields anything…
								const subBuilder = builder.create(
									this.registerCreateMutationPart(processedPlaceholdersByEntity, fieldState),
								)
								if (isEmptyObject(subBuilder.data)) {
									// …and if it doesn't, we just disconnect.
									return builder.disconnect()
								}
								// …but if it does, we return the create, disconnecting implicitly.
								return subBuilder
							} else if (runtimeId.existsOnServer) {
								// There isn't a linked entity on the server but we're seeing one that exists there.
								// Thus this is a connect.
								// TODO also potentially update
								return builder.connect({
									[PRIMARY_KEY_NAME]: runtimeId.value,
								})
							} else {
								return builder.create(this.registerCreateMutationPart(processedPlaceholdersByEntity, fieldState))
							}
						})(CrudQueryBuilder.WriteOneRelationBuilder.instantiate<CrudQueryBuilder.WriteOperation.Update>())

						if (subBuilder.data) {
							builder = builder.one(marker.parameters.field, subBuilder.data)
						}
					} else {
						// This is a reduced has many relation.
						builder = builder.many(marker.parameters.field, builder => {
							const persistedValue = entityData?.get?.(placeholderName)
							const alias = MutationAlias.encodeEntityId(runtimeId)

							if (persistedValue instanceof ServerId) {
								if (persistedValue.value === runtimeId.value) {
									if (fieldState.type === 'entityRealmStub') {
										return builder
									}
									return builder.update(
										reducedBy,
										builder => this.registerUpdateMutationPart(processedPlaceholdersByEntity, fieldState, builder),
										alias,
									)
								}
								const plannedDeletion = currentState.plannedHasOneDeletions?.get(placeholderName)
								if (plannedDeletion !== undefined) {
									// TODO also potentially do something about the current entity
									return builder.delete(reducedBy, alias)
								}
								if (runtimeId.existsOnServer) {
									// TODO will re-using the alias like this work?
									// TODO also potentially update
									return builder.disconnect(reducedBy, alias).connect({ [PRIMARY_KEY_NAME]: runtimeId.value }, alias)
								}
								const subBuilder = builder.create(
									this.registerCreateMutationPart(processedPlaceholdersByEntity, fieldState),
								)
								if (isEmptyObject(subBuilder.data)) {
									return builder.disconnect(reducedBy, alias)
								}
								return subBuilder
							} else if (runtimeId.existsOnServer) {
								return builder.connect({ [PRIMARY_KEY_NAME]: runtimeId.value }, alias)
							} else {
								return builder.create(this.registerCreateMutationPart(processedPlaceholdersByEntity, fieldState))
							}
						})
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

					builder = builder.many(marker.parameters.field, builder => {
						for (const childState of fieldState.children.values()) {
							const runtimeId = childState.entity.id
							const alias = MutationAlias.encodeEntityId(runtimeId)

							if (runtimeId.existsOnServer) {
								if (persistedEntityIds.has(runtimeId.value)) {
									if (childState.type !== 'entityRealmStub') {
										// A stub cannot have any pending changes.
										builder = builder.update(
											{ [PRIMARY_KEY_NAME]: runtimeId.value },
											builder => this.registerUpdateMutationPart(processedPlaceholdersByEntity, childState, builder),
											alias,
										)
									}
								} else {
									// TODO also potentially update
									builder = builder.connect({ [PRIMARY_KEY_NAME]: runtimeId.value }, alias)
								}
							} else {
								builder = builder.create(
									this.registerCreateMutationPart(processedPlaceholdersByEntity, childState),
									alias,
								)
							}
						}
						if (fieldState.plannedRemovals) {
							for (const [removedId, removalType] of fieldState.plannedRemovals) {
								const alias = MutationAlias.encodeEntityId(new ServerId(removedId, fieldState.entityName))
								if (removalType === 'delete') {
									builder = builder.delete({ [PRIMARY_KEY_NAME]: removedId }, alias)
								} else if (removalType === 'disconnect') {
									// TODO also potentially update
									builder = builder.disconnect({ [PRIMARY_KEY_NAME]: removedId }, alias)
								} else {
									assertNever(removalType)
								}
							}
						}
						return builder
					})
					break
				}
				default:
					return assertNever(fieldState)
			}
		}

		return builder
	}

	private transformFieldValue(fieldState: FieldState, value: FieldValue): FieldValue | GraphQlBuilder.GraphQlLiteral {
		if (typeof value !== 'string') {
			return value
		}
		const fieldSchema = this.treeStore.schema.getEntityField(
			fieldState.parent.entity.entityName,
			fieldState.fieldMarker.fieldName,
		)
		if (fieldSchema === undefined || fieldSchema.__typename !== '_Column') {
			throw new BindingError()
		}
		return fieldSchema.enumName === null ? value : new GraphQlBuilder.GraphQlLiteral(value)
	}
}
