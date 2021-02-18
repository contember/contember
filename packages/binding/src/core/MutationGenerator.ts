import { CrudQueryBuilder, GraphQlBuilder } from '@contember/client'
import { ClientGeneratedUuid, ServerGeneratedUuid } from '../accessorTree'
import { BindingError } from '../BindingError'
import { PRIMARY_KEY_NAME, TYPENAME_KEY_NAME } from '../bindingTypes'
import { FieldMarker, HasManyRelationMarker, HasOneRelationMarker } from '../markers'
import { assertNever, isEmptyObject } from '../utils'
import { AliasTransformer } from './AliasTransformer'
import { QueryGenerator } from './QueryGenerator'
import {
	EntityListState,
	EntityRealmState,
	EntityRealmStateStub,
	EntityState,
	FieldState,
	getEntityMarker,
	RootStateNode,
	StateIterator,
	StateType,
} from './state'
import { TreeStore } from './TreeStore'

type QueryBuilder = Omit<CrudQueryBuilder.CrudQueryBuilder, CrudQueryBuilder.Queries>

type ProcessedEntities = Set<EntityState>

// TODO enforce correct expected mutations in dev mode.
export class MutationGenerator {
	public constructor(private readonly treeStore: TreeStore) {}

	public getPersistMutation(): string | undefined {
		try {
			let builder: QueryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
			const processedEntities: ProcessedEntities = new Set()

			for (const [placeholderName, subTreeState] of StateIterator.eachRootState(this.treeStore)) {
				// TODO there *CAN* be duplicate placeholders. Need to handle this later.
				builder = this.addSubMutation(processedEntities, subTreeState, placeholderName, builder)
			}
			return builder.inTransaction().getGql()
		} catch (e) {
			return undefined
		}
	}

	private addSubMutation(
		processedEntities: ProcessedEntities,
		rootState: RootStateNode | EntityRealmStateStub,
		alias: string,
		queryBuilder: QueryBuilder,
	): QueryBuilder {
		if (rootState.type === StateType.EntityRealmStub) {
			// Do nothing. For now.
			// TODO there can be a forceCreate somewhere in there that we're hereby ignoring.
			return queryBuilder
		}
		if (rootState.unpersistedChangesCount === 0) {
			// Bail out early
			return queryBuilder
		}
		if (rootState.type === StateType.EntityRealm) {
			if (rootState.entity.isScheduledForDeletion) {
				queryBuilder = this.addDeleteMutation(processedEntities, rootState, alias, queryBuilder)
			} else if (!rootState.entity.id.existsOnServer) {
				queryBuilder = this.addCreateMutation(processedEntities, rootState, alias, queryBuilder)
			} else {
				queryBuilder = this.addUpdateMutation(processedEntities, rootState, alias, queryBuilder)
			}
		} else if (rootState.type === StateType.EntityList) {
			for (const childState of rootState.children.values()) {
				queryBuilder = this.addSubMutation(
					processedEntities,
					childState,
					AliasTransformer.joinAliasSections(alias, AliasTransformer.entityToAlias(childState.entity.id)),
					queryBuilder,
				)
			}
			if (rootState.plannedRemovals) {
				for (const [removedEntity, removalType] of rootState.plannedRemovals) {
					if (removalType === 'delete') {
						queryBuilder = this.addDeleteMutation(
							processedEntities,
							removedEntity,
							AliasTransformer.joinAliasSections(alias, AliasTransformer.entityToAlias(removedEntity.entity.id)),
							queryBuilder,
						)
					} else if (removalType === 'disconnect') {
						throw new BindingError(`EntityList: cannot disconnect top-level entities.`)
					}
				}
			}
		} else {
			assertNever(rootState)
		}

		return queryBuilder
	}

	private addDeleteMutation(
		processedEntities: ProcessedEntities,
		entityRealm: EntityRealmState | EntityRealmStateStub,
		alias: string,
		queryBuilder: QueryBuilder = new CrudQueryBuilder.CrudQueryBuilder(),
	): QueryBuilder {
		if (processedEntities.has(entityRealm.entity)) {
			return queryBuilder
		}
		processedEntities.add(entityRealm.entity)

		return queryBuilder.delete(
			entityRealm.entity.entityName,
			builder =>
				builder
					.ok()
					.node(builder => builder.column(PRIMARY_KEY_NAME))
					.by({ [PRIMARY_KEY_NAME]: entityRealm.entity.id.value })
					.errors()
					.errorMessage(),
			alias,
		)
	}

	private addUpdateMutation(
		processedEntities: ProcessedEntities,
		entityRealm: EntityRealmState,
		alias: string,
		queryBuilder: QueryBuilder = new CrudQueryBuilder.CrudQueryBuilder(),
	): QueryBuilder {
		if (processedEntities.has(entityRealm.entity)) {
			return queryBuilder
		}
		// Deliberately not adding the entity to processedEntities - it will be done by registerUpdateMutationPart.

		const runtimeId = entityRealm.entity.id

		if (!runtimeId.existsOnServer) {
			return queryBuilder
		}

		return queryBuilder.update(
			entityRealm.entity.entityName,
			builder => {
				return builder
					.data(builder => this.registerUpdateMutationPart(processedEntities, entityRealm, builder))
					.by({ [PRIMARY_KEY_NAME]: runtimeId.value })
					.node(builder => QueryGenerator.registerQueryPart(getEntityMarker(entityRealm).fields.markers, builder))
					.ok()
					.validation()
					.errors()
					.errorMessage()
			},
			alias,
		)
	}

	private addCreateMutation(
		processedEntities: ProcessedEntities,
		entityRealm: EntityRealmState,
		alias: string,
		queryBuilder: QueryBuilder = new CrudQueryBuilder.CrudQueryBuilder(),
	): QueryBuilder {
		if (processedEntities.has(entityRealm.entity)) {
			return queryBuilder
		}
		// Deliberately not adding the entity to processedEntities - it will be done by registerCreateMutationPart.

		return queryBuilder.create(
			entityRealm.entity.entityName,
			builder => {
				let writeBuilder = this.registerCreateMutationPart(
					processedEntities,
					entityRealm,
					new CrudQueryBuilder.WriteDataBuilder(),
				)
				// if (where && writeBuilder.data !== undefined && !isEmptyObject(writeBuilder.data)) {
				// 	// Shallow cloning the parameters like this IS too naïve but it will likely last surprisingly long before we
				// 	// run into issues.
				// 	writeBuilder = new CrudQueryBuilder.WriteDataBuilder({ ...writeBuilder.data, ...where })
				// }

				return builder
					.data(writeBuilder)
					.node(builder => QueryGenerator.registerQueryPart(getEntityMarker(entityRealm).fields.markers, builder))
					.ok()
					.validation()
					.errors()
					.errorMessage()
			},
			alias,
		)
	}

	private registerCreateMutationPart(
		processedEntities: ProcessedEntities,
		currentState: EntityRealmState | EntityRealmStateStub,
		builder: CrudQueryBuilder.WriteDataBuilder<
			CrudQueryBuilder.WriteOperation.Create
		> = new CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Create>(),
	): CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Create> {
		if (processedEntities.has(currentState.entity)) {
			return builder
		}
		processedEntities.add(currentState.entity)

		if (currentState.type === StateType.EntityRealmStub) {
			// TODO If there's a forceCreate, this is wrong.
			return builder
		}

		const nonbearingFields: Array<
			| { type: 'field'; marker: FieldMarker; fieldState: FieldState }
			| { type: 'hasOne'; marker: HasOneRelationMarker; fieldState: EntityRealmState | EntityRealmStateStub }
			| { type: 'hasMany'; marker: HasManyRelationMarker; fieldState: EntityListState }
		> = []

		for (const fieldMeta of StateIterator.eachDistinctEntityFieldState(currentState)) {
			switch (fieldMeta.type) {
				case StateType.Field: {
					const { marker, fieldState } = fieldMeta
					const placeholderName = marker.placeholderName

					if (
						placeholderName === TYPENAME_KEY_NAME ||
						(placeholderName === PRIMARY_KEY_NAME && !(currentState.entity.id instanceof ClientGeneratedUuid))
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
				case StateType.EntityRealmStub:
				case StateType.EntityRealm: {
					const { marker, fieldState } = fieldMeta
					if (marker.parameters.isNonbearing) {
						nonbearingFields.push({
							type: 'hasOne',
							marker,
							fieldState,
						})
						continue
					}
					builder = this.registerCreateEntityPart(processedEntities, fieldState, marker, builder)
					break
				}
				case StateType.EntityList: {
					const { marker, fieldState } = fieldMeta
					if (marker.parameters.isNonbearing) {
						nonbearingFields.push({
							type: 'hasMany',
							marker,
							fieldState,
						})
						continue
					}
					builder = this.registerCreateEntityListPart(processedEntities, fieldState, marker, builder)
					break
				}
				default: {
					return assertNever(fieldMeta)
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
			!getEntityMarker(currentState).fields.hasAtLeastOneBearingField
		) {
			for (const field of nonbearingFields) {
				switch (field.type) {
					case 'field': {
						builder = this.registerCreateFieldPart(field.fieldState, field.marker, builder)
						break
					}
					case 'hasOne': {
						builder = this.registerCreateEntityPart(processedEntities, field.fieldState, field.marker, builder)
						break
					}
					case 'hasMany': {
						builder = this.registerCreateEntityListPart(processedEntities, field.fieldState, field.marker, builder)
						break
					}
					default:
						assertNever(field)
				}
			}
		}

		const setOnCreate = getEntityMarker(currentState).parameters.setOnCreate
		if (setOnCreate && builder.data !== undefined && !isEmptyObject(builder.data)) {
			for (const key in setOnCreate) {
				const field = setOnCreate[key]

				if (
					typeof field === 'string' ||
					typeof field === 'number' ||
					field === null ||
					field instanceof GraphQlBuilder.Literal
				) {
					builder = builder.set(key, field)
				} else {
					builder = builder.one(key, builder => builder.connect(field))
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
			return builder.set(marker.fieldName, resolvedValue)
		}
		return builder
	}

	private registerCreateEntityPart(
		processedEntities: ProcessedEntities,
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
				return builder.create(this.registerCreateMutationPart(processedEntities, fieldState))
			})
		}
		return builder.many(marker.parameters.field, builder => {
			const alias = AliasTransformer.entityToAlias(runtimeId)
			if (runtimeId.existsOnServer) {
				// TODO also potentially update
				return builder.connect({ [PRIMARY_KEY_NAME]: runtimeId.value }, alias)
			}
			return builder.create(this.registerCreateMutationPart(processedEntities, fieldState), alias)
		})
	}

	private registerCreateEntityListPart(
		processedEntities: ProcessedEntities,
		fieldState: EntityListState,
		marker: HasManyRelationMarker,
		builder: CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Create>,
	) {
		return builder.many(marker.parameters.field, builder => {
			for (const entityRealm of fieldState.children.values()) {
				const alias = AliasTransformer.entityToAlias(entityRealm.entity.id)
				if (entityRealm.entity.id.existsOnServer) {
					// TODO also potentially update
					builder = builder.connect({ [PRIMARY_KEY_NAME]: entityRealm.entity.id.value }, alias)
				} else {
					builder = builder.create(this.registerCreateMutationPart(processedEntities, entityRealm), alias)
				}
			}
			return builder
		})
	}

	private registerUpdateMutationPart(
		processedEntities: ProcessedEntities,
		currentState: EntityRealmState,
		builder: CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Update>,
	): CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Update> {
		if (processedEntities.has(currentState.entity)) {
			return builder
		}
		processedEntities.add(currentState.entity)

		const entityData = this.treeStore.persistedEntityData.get(currentState.entity.id.value)

		for (const fieldMeta of StateIterator.eachDistinctEntityFieldState(currentState)) {
			const placeholderName = fieldMeta.marker.placeholderName
			if (placeholderName === PRIMARY_KEY_NAME || placeholderName === TYPENAME_KEY_NAME) {
				continue
			}

			switch (fieldMeta.type) {
				case StateType.Field: {
					const fieldState = fieldMeta.fieldState
					if (fieldState.persistedValue !== undefined) {
						const resolvedValue = fieldState.getAccessor().resolvedValue
						if (fieldState.persistedValue !== resolvedValue) {
							builder = builder.set(placeholderName, resolvedValue)
						}
					}
					break
				}
				case StateType.EntityRealmStub:
				case StateType.EntityRealm: {
					const { fieldState, marker } = fieldMeta
					const runtimeId = fieldState.entity.id
					const reducedBy = marker.parameters.reducedBy

					if (reducedBy === undefined) {
						const subBuilder = ((
							builder: CrudQueryBuilder.WriteOneRelationBuilder<CrudQueryBuilder.WriteOperation.Update>,
						) => {
							const persistedValue = entityData?.get?.(placeholderName)

							if (persistedValue instanceof ServerGeneratedUuid) {
								if (persistedValue.value === runtimeId.value) {
									// The persisted and currently referenced ids match, and so this is an update.
									if (fieldState.type === StateType.EntityRealmStub) {
										return builder // …unless we're dealing with a stub. There cannot be any updates there.
									}
									return builder.update(builder =>
										this.registerUpdateMutationPart(processedEntities, fieldState, builder),
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
								const subBuilder = builder.create(this.registerCreateMutationPart(processedEntities, fieldState))
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
								return builder.create(this.registerCreateMutationPart(processedEntities, fieldState))
							}
						})(CrudQueryBuilder.WriteOneRelationBuilder.instantiate<CrudQueryBuilder.WriteOperation.Update>())

						if (subBuilder.data) {
							builder = builder.one(marker.parameters.field, subBuilder)
						}
					} else {
						// This is a reduced has many relation.
						builder = builder.many(marker.parameters.field, builder => {
							const persistedValue = entityData?.get?.(placeholderName)
							const alias = AliasTransformer.entityToAlias(runtimeId)

							if (persistedValue instanceof ServerGeneratedUuid) {
								if (persistedValue.value === runtimeId.value) {
									if (fieldState.type === StateType.EntityRealmStub) {
										return builder
									}
									return builder.update(
										reducedBy,
										builder => this.registerUpdateMutationPart(processedEntities, fieldState, builder),
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
								const subBuilder = builder.create(this.registerCreateMutationPart(processedEntities, fieldState))
								if (isEmptyObject(subBuilder.data)) {
									return builder.disconnect(reducedBy, alias)
								}
								return subBuilder
							} else if (runtimeId.existsOnServer) {
								return builder.connect({ [PRIMARY_KEY_NAME]: runtimeId.value }, alias)
							} else {
								return builder.create(this.registerCreateMutationPart(processedEntities, fieldState))
							}
						})
					}
					break
				}
				case StateType.EntityList: {
					const { marker, fieldState } = fieldMeta
					const persistedEntityIds = entityData?.get?.(placeholderName) ?? new Set()

					if (!(persistedEntityIds instanceof Set)) {
						continue
					}

					builder = builder.many(marker.parameters.field, builder => {
						for (const childState of fieldState.children.values()) {
							const runtimeId = childState.entity.id
							const alias = AliasTransformer.entityToAlias(runtimeId)

							if (runtimeId.existsOnServer) {
								if (persistedEntityIds.has(runtimeId.value)) {
									if (childState.type !== StateType.EntityRealmStub) {
										// A stub cannot have any pending changes.
										builder = builder.update(
											{ [PRIMARY_KEY_NAME]: runtimeId.value },
											builder => this.registerUpdateMutationPart(processedEntities, childState, builder),
											alias,
										)
									}
								} else {
									// TODO also potentially update
									builder = builder.connect({ [PRIMARY_KEY_NAME]: runtimeId.value }, alias)
								}
							} else {
								builder = builder.create(this.registerCreateMutationPart(processedEntities, childState), alias)
							}
						}
						if (fieldState.plannedRemovals) {
							for (const [realmToRemove, removalType] of fieldState.plannedRemovals) {
								const runtimeId = realmToRemove.entity.id
								const alias = AliasTransformer.entityToAlias(runtimeId)
								if (removalType === 'delete') {
									builder = builder.delete({ [PRIMARY_KEY_NAME]: runtimeId.value }, alias)
								} else if (removalType === 'disconnect') {
									// TODO also potentially update
									builder = builder.disconnect({ [PRIMARY_KEY_NAME]: runtimeId.value }, alias)
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
					return assertNever(fieldMeta)
			}
		}

		return builder
	}
}
