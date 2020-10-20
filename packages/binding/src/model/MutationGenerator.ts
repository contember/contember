import { CrudQueryBuilder, GraphQlBuilder } from '@contember/client'
import { EntityAccessor } from '../accessors'
import { BoxedSingleEntityId } from '../accessorTree'
import { BindingError } from '../BindingError'
import { PRIMARY_KEY_NAME, TYPENAME_KEY_NAME } from '../bindingTypes'
import {
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	MarkerTreeRoot,
	SubTreeMarker,
	SubTreeMarkerParameters,
} from '../markers'
import { assertNever, isEmptyObject } from '../utils'
import { AliasTransformer } from './AliasTransformer'
import {
	InternalEntityListState,
	InternalEntityState,
	InternalFieldState,
	InternalRootStateNode,
	InternalStateType,
} from './internalState'

type QueryBuilder = Omit<CrudQueryBuilder.CrudQueryBuilder, CrudQueryBuilder.Queries>

type ProcessedEntities = Set<InternalEntityState>

// TODO enforce correct expected mutations in dev mode.
export class MutationGenerator {
	public constructor(
		private markerTree: MarkerTreeRoot,
		private allSubTrees: Map<string, InternalRootStateNode>,
		private entityStore: Map<string, InternalEntityState>,
	) {}

	public getPersistMutation(): string | undefined {
		try {
			let builder: QueryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
			const processedEntities: ProcessedEntities = new Set()

			for (const [placeholderName, subTreeMarker] of this.markerTree.subTrees) {
				builder = this.addSubMutation(
					processedEntities,
					this.allSubTrees.get(placeholderName)!,
					placeholderName,
					subTreeMarker.parameters,
					builder,
				)
			}
			return builder.getGql()
		} catch (e) {
			return undefined
		}
	}

	private addSubMutation(
		processedEntities: ProcessedEntities,
		rootState: InternalRootStateNode,
		alias: string,
		parameters: SubTreeMarkerParameters,
		queryBuilder: QueryBuilder,
	): QueryBuilder {
		if (rootState.type === InternalStateType.SingleEntity) {
			if (rootState.isScheduledForDeletion) {
				queryBuilder = this.addDeleteMutation(processedEntities, rootState, alias, parameters, queryBuilder)
			} else if (!rootState.getAccessor().existsOnServer) {
				queryBuilder = this.addCreateMutation(processedEntities, rootState, alias, parameters, queryBuilder)
			} else {
				queryBuilder = this.addUpdateMutation(processedEntities, rootState, alias, parameters, queryBuilder)
			}
		} else if (rootState.type === InternalStateType.EntityList) {
			for (const [, childState] of rootState.children) {
				queryBuilder = this.addSubMutation(
					processedEntities,
					childState,
					AliasTransformer.joinAliasSections(alias, AliasTransformer.entityToAlias(childState.getAccessor())),
					parameters,
					queryBuilder,
				)
			}
			if (rootState.plannedRemovals) {
				for (const [removedEntity, removalType] of rootState.plannedRemovals) {
					if (removalType === 'delete') {
						queryBuilder = this.addDeleteMutation(
							processedEntities,
							removedEntity,
							AliasTransformer.joinAliasSections(alias, AliasTransformer.entityToAlias(removedEntity.getAccessor())),
							parameters,
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
		entityState: InternalEntityState,
		alias: string,
		parameters: SubTreeMarkerParameters,
		queryBuilder?: QueryBuilder,
	): QueryBuilder {
		if (!queryBuilder) {
			queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}
		if (processedEntities.has(entityState)) {
			return queryBuilder
		}
		processedEntities.add(entityState)

		return queryBuilder.delete(
			parameters.value.entityName,
			builder => {
				let where = {}
				if (parameters && parameters.type === 'qualifiedSingleEntity') {
					where = parameters.value.where
				}

				return builder
					.ok()
					.node(builder => builder.column(PRIMARY_KEY_NAME))
					.by({ ...where, [PRIMARY_KEY_NAME]: entityState.getAccessor().primaryKey! })
					.errors()
					.errorMessage()
			},
			alias,
		)
	}

	private addUpdateMutation(
		processedEntities: ProcessedEntities,
		entityState: InternalEntityState,
		alias: string,
		parameters: SubTreeMarkerParameters,
		queryBuilder?: QueryBuilder,
	): QueryBuilder {
		if (!queryBuilder) {
			queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}
		if (processedEntities.has(entityState)) {
			return queryBuilder
		}
		// Deliberately not adding the entity to processedEntities - it will be done by registerUpdateMutationPart.

		const runtimeId = entityState.id

		if (runtimeId instanceof EntityAccessor.UnpersistedEntityId) {
			return queryBuilder
		}

		return queryBuilder.update(
			parameters.value.entityName,
			builder => {
				let where = {}
				if (parameters && parameters.type === 'qualifiedSingleEntity') {
					where = parameters.value.where
				}

				return builder
					.data(builder => this.registerUpdateMutationPart(processedEntities, entityState, builder))
					.by({ ...where, [PRIMARY_KEY_NAME]: runtimeId })
					.node(builder => builder.column(PRIMARY_KEY_NAME))
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
		entityState: InternalEntityState,
		alias: string,
		parameters: SubTreeMarkerParameters,
		queryBuilder?: QueryBuilder,
	): QueryBuilder {
		if (!queryBuilder) {
			queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}
		if (processedEntities.has(entityState)) {
			return queryBuilder
		}
		// Deliberately not adding the entity to processedEntities - it will be done by registerCreateMutationPart.

		return queryBuilder.create(
			parameters.value.entityName,
			builder => {
				let writeBuilder = this.registerCreateMutationPart(
					processedEntities,
					entityState,
					new CrudQueryBuilder.WriteDataBuilder(),
				)
				if (
					parameters &&
					parameters.type === 'qualifiedSingleEntity' &&
					writeBuilder.data !== undefined &&
					!isEmptyObject(writeBuilder.data)
				) {
					// Shallow cloning the parameters like this IS too naïve but it will likely last surprisingly long before we
					// run into issues.
					writeBuilder = new CrudQueryBuilder.WriteDataBuilder({ ...writeBuilder.data, ...parameters.value.where })
				}

				return builder
					.data(writeBuilder)
					.node(builder => builder.column(PRIMARY_KEY_NAME))
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
		currentState: InternalEntityState,
		builder: CrudQueryBuilder.WriteDataBuilder<
			CrudQueryBuilder.WriteOperation.Create
		> = new CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Create>(),
	): CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Create> {
		if (processedEntities.has(currentState)) {
			return builder
		}
		processedEntities.add(currentState)

		// It shouldn't
		const nonbearingFields: Array<
			| { type: 'field'; marker: FieldMarker; fieldState: InternalFieldState }
			| { type: 'hasOne'; marker: HasOneRelationMarker; fieldState: InternalEntityState }
			| { type: 'hasMany'; marker: HasManyRelationMarker; fieldState: InternalEntityListState }
		> = []

		for (const [placeholderName, marker] of currentState.markersContainer.markers) {
			if (placeholderName === PRIMARY_KEY_NAME || placeholderName === TYPENAME_KEY_NAME) {
				continue
			}
			if (marker instanceof SubTreeMarker) {
				continue // Do nothing: all sub trees have been hoisted and are handled elsewhere.
			}
			const fieldState = currentState.fields.get(placeholderName)
			if (marker instanceof FieldMarker) {
				if (fieldState?.type !== InternalStateType.Field) {
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
			} else if (marker instanceof HasOneRelationMarker) {
				if (fieldState?.type !== InternalStateType.SingleEntity) {
					continue
				}
				if (marker.relation.isNonbearing) {
					nonbearingFields.push({
						type: 'hasOne',
						marker,
						fieldState,
					})
					continue
				}
				builder = this.registerCreateEntityPart(processedEntities, fieldState, marker, builder)
			} else if (marker instanceof HasManyRelationMarker) {
				if (fieldState?.type !== InternalStateType.EntityList) {
					continue
				}
				if (marker.relation.isNonbearing) {
					nonbearingFields.push({
						type: 'hasMany',
						marker,
						fieldState,
					})
					continue
				}
				builder = this.registerCreateEntityListPart(processedEntities, fieldState, marker, builder)
			} else {
				assertNever(marker)
			}
		}

		if (currentState.creationParameters.forceCreation && (builder.data === undefined || isEmptyObject(builder.data))) {
			builder = builder.set('_dummy_field_', true)
		}

		if (
			(builder.data !== undefined && !isEmptyObject(builder.data)) ||
			!currentState.markersContainer.hasAtLeastOneBearingField
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

		const setOnCreate = currentState.creationParameters.setOnCreate
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
		fieldState: InternalFieldState,
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
		fieldState: InternalEntityState,
		marker: HasOneRelationMarker,
		builder: CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Create>,
	) {
		const reducedBy = marker.relation.reducedBy

		if (reducedBy === undefined) {
			return builder.one(marker.relation.field, builder => {
				if (typeof fieldState.id === 'string') {
					// TODO also potentially update
					return builder.connect({ [PRIMARY_KEY_NAME]: fieldState.id })
				}
				return builder.create(this.registerCreateMutationPart(processedEntities, fieldState))
			})
		}
		return builder.many(marker.relation.field, builder => {
			const alias = AliasTransformer.entityToAlias(fieldState.getAccessor())
			if (typeof fieldState.id === 'string') {
				// TODO also potentially update
				return builder.connect({ [PRIMARY_KEY_NAME]: fieldState.id }, alias)
			}
			return builder.create(this.registerCreateMutationPart(processedEntities, fieldState), alias)
		})
	}

	private registerCreateEntityListPart(
		processedEntities: ProcessedEntities,
		fieldState: InternalEntityListState,
		marker: HasManyRelationMarker,
		builder: CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Create>,
	) {
		return builder.many(marker.relation.field, builder => {
			for (const [, entityState] of fieldState.children) {
				const alias = AliasTransformer.entityToAlias(entityState.getAccessor())
				if (typeof entityState.id === 'string') {
					// TODO also potentially update
					builder = builder.connect({ [PRIMARY_KEY_NAME]: entityState.id }, alias)
				} else {
					builder = builder.create(this.registerCreateMutationPart(processedEntities, entityState), alias)
				}
			}
			return builder
		})
	}

	private registerUpdateMutationPart(
		processedEntities: ProcessedEntities,
		currentState: InternalEntityState,
		builder: CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Update>,
	): CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Update> {
		if (processedEntities.has(currentState)) {
			return builder
		}
		processedEntities.add(currentState)

		for (const [placeholderName, marker] of currentState.markersContainer.markers) {
			if (placeholderName === PRIMARY_KEY_NAME || placeholderName === TYPENAME_KEY_NAME) {
				continue
			}
			const fieldState = currentState.fields.get(placeholderName)
			if (marker instanceof FieldMarker) {
				if (fieldState?.type !== InternalStateType.Field) {
					continue
				}
				if (fieldState.persistedValue !== undefined) {
					const resolvedValue = fieldState.getAccessor().resolvedValue
					if (fieldState.persistedValue !== resolvedValue) {
						builder = builder.set(placeholderName, resolvedValue)
					}
				}
			} else if (marker instanceof HasOneRelationMarker) {
				if (fieldState?.type !== InternalStateType.SingleEntity) {
					continue
				}

				const reducedBy = marker.relation.reducedBy
				if (reducedBy === undefined) {
					const subBuilder = ((
						builder: CrudQueryBuilder.WriteOneRelationBuilder<CrudQueryBuilder.WriteOperation.Update>,
					) => {
						const persistedValue = currentState.persistedData?.get?.(placeholderName)

						if (persistedValue instanceof BoxedSingleEntityId) {
							if (persistedValue.id === fieldState.id) {
								// The persisted and currently referenced ids match, and so this is an update.
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
							if (typeof fieldState.id === 'string') {
								// This isn't the persisted entity but it does exist on the server. Thus this is a connect.
								// TODO also potentially update
								return builder.connect({
									[PRIMARY_KEY_NAME]: fieldState.id,
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
						} else if (typeof fieldState.id === 'string') {
							// There isn't a linked entity on the server but we're seeing one that exists there.
							// Thus this is a connect.
							// TODO also potentially update
							return builder.connect({
								[PRIMARY_KEY_NAME]: fieldState.id,
							})
						} else {
							return builder.create(this.registerCreateMutationPart(processedEntities, fieldState))
						}
					})(CrudQueryBuilder.WriteOneRelationBuilder.instantiate<CrudQueryBuilder.WriteOperation.Update>())

					if (subBuilder.data) {
						builder = builder.one(marker.relation.field, subBuilder)
					}
				} else {
					// This is a reduced has many relation.
					builder = builder.many(marker.relation.field, builder => {
						const persistedValue = currentState.persistedData?.get?.(placeholderName)
						const alias = AliasTransformer.entityToAlias(fieldState.getAccessor())

						if (persistedValue instanceof BoxedSingleEntityId) {
							if (persistedValue.id === fieldState.id) {
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
							if (typeof fieldState.id === 'string') {
								// TODO will re-using the alias like this work?
								// TODO also potentially update
								return builder.disconnect(reducedBy, alias).connect({ [PRIMARY_KEY_NAME]: fieldState.id }, alias)
							}
							const subBuilder = builder.create(this.registerCreateMutationPart(processedEntities, fieldState))
							if (isEmptyObject(subBuilder.data)) {
								return builder.disconnect(reducedBy, alias)
							}
							return subBuilder
						} else if (typeof fieldState.id === 'string') {
							return builder.connect({ [PRIMARY_KEY_NAME]: fieldState.id }, alias)
						} else {
							return builder.create(this.registerCreateMutationPart(processedEntities, fieldState))
						}
					})
				}
			} else if (marker instanceof HasManyRelationMarker) {
				if (fieldState?.type !== InternalStateType.EntityList) {
					continue
				}
				builder = builder.many(marker.relation.field, builder => {
					for (const [, childEntityState] of fieldState.children) {
						const alias = AliasTransformer.entityToAlias(childEntityState.getAccessor())

						if (typeof childEntityState.id === 'string') {
							if (fieldState.persistedEntityIds.has(childEntityState.id)) {
								builder = builder.update(
									{ [PRIMARY_KEY_NAME]: childEntityState.id },
									builder => this.registerUpdateMutationPart(processedEntities, childEntityState, builder),
									alias,
								)
							} else {
								// TODO also potentially update
								builder = builder.connect({ [PRIMARY_KEY_NAME]: childEntityState.id }, alias)
							}
						} else {
							builder = builder.create(this.registerCreateMutationPart(processedEntities, childEntityState), alias)
						}
					}
					if (fieldState.plannedRemovals) {
						for (const [entityToRemove, removalType] of fieldState.plannedRemovals) {
							const alias = AliasTransformer.entityToAlias(entityToRemove.getAccessor())
							if (removalType === 'delete') {
								builder = builder.delete({ [PRIMARY_KEY_NAME]: entityToRemove.id }, alias)
							} else if (removalType === 'disconnect') {
								// TODO also potentially update
								builder = builder.disconnect({ [PRIMARY_KEY_NAME]: entityToRemove.id }, alias)
							} else {
								assertNever(removalType)
							}
						}
					}
					return builder
				})
			} else if (marker instanceof SubTreeMarker) {
				// Do nothing: all sub trees have been hoisted and are handled elsewhere.
			} else {
				assertNever(marker)
			}
		}

		return builder
	}
}
