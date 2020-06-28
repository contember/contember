import { CrudQueryBuilder, GraphQlBuilder } from '@contember/client'
import { Input } from '@contember/schema'
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
import { EntityCreationParameters, FieldValue, UniqueWhere } from '../treeParameters'
import { assertNever, isEmptyObject } from '../utils'
import { AliasTransformer } from './AliasTransformer'
import { InternalEntityState, InternalRootStateNode, InternalStateType } from './internalState'

type QueryBuilder = Omit<CrudQueryBuilder.CrudQueryBuilder, CrudQueryBuilder.Queries>

type ProcessedEntities = Set<InternalEntityState>

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

	// TODO this legacy implementation is no longer appropriate. It was superficially updated to make it compile but
	// 		for actual nested tree updates it is completely inadequate. We must, among other things, mark visited
	// 		entities in order to break cycles.
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
			for (const childKey of rootState.childrenKeys) {
				const childState = this.entityStore.get(childKey)!

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
			},
			alias,
		)
	}

	private registerCreateMutationPart(
		processedEntities: ProcessedEntities,
		currentState: InternalEntityState,
		builder: CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Create>,
	): CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Create> {
		if (processedEntities.has(currentState)) {
			return builder
		}
		processedEntities.add(currentState)

		const nonbearingFields: Array<{
			placeholderName: string
			value: FieldValue
		}> = []
		const nonbearingConnections: any[] = []

		for (const [placeholderName, marker] of currentState.fieldMarkers) {
			if (placeholderName === PRIMARY_KEY_NAME || placeholderName === TYPENAME_KEY_NAME) {
				continue
			}
			if (marker instanceof FieldMarker) {
				const fieldState = currentState.fields.get(placeholderName)!
				if (fieldState.type === InternalStateType.Field) {
					const resolvedValue = fieldState.getAccessor().resolvedValue

					if (resolvedValue !== undefined && resolvedValue !== null) {
						if (marker.isNonbearing) {
							nonbearingFields.push({
								value: resolvedValue,
								placeholderName,
							})
						} else {
							builder = builder.set(placeholderName, resolvedValue)
						}
					}
				}
			} else if (marker instanceof HasOneRelationMarker) {
				if (marker.relation.reducedBy === undefined) {
				} else {
				}
			} else if (marker instanceof HasManyRelationMarker) {
				// TODO
			} /*else if (marker instanceof ReferenceMarker) {
				let unreducedHasOnePresent = false
				const references = marker.references
				const accessorReference: Array<{
					alias?: string
					entityState: InternalEntityState
					reference: ReferenceMarker.Reference
				}> = []

				for (const referencePlaceholder in references) {
					const reference = references[referencePlaceholder]
					const referenceState = currentState.fields.get(reference.placeholderName)!

					if (reference.expectedCount === ExpectedEntityCount.UpToOne) {
						if (referenceState.type === InternalStateType.SingleEntity) {
							accessorReference.push({ entityState: referenceState, reference, alias: referencePlaceholder })

							if (reference.reducedBy === undefined) {
								unreducedHasOnePresent = true
							}
						}
					} else if (reference.expectedCount === ExpectedEntityCount.PossiblyMany) {
						if (referenceState.type === InternalStateType.EntityList) {
							for (const childKey of referenceState.childrenKeys) {
								const childState = this.entityStore.get(childKey)!

								if (childState) {
									accessorReference.push({
										entityState: childState,
										reference,
										alias: AliasTransformer.entityToAlias(childState.getAccessor()),
									})
								}
							}
						}
					} else {
						assertNever(reference.expectedCount)
					}
				}

				if (unreducedHasOnePresent) {

				} else {
					builder = builder.many(placeholderName, builder => {
						for (const { alias, entityState, reference } of accessorReference) {
							if (typeof entityState.id !== 'string') {
								builder = builder.create(this.registerCreateReferenceMutationPart(entityState, reference), alias)
							} else {
								builder = builder.connect({ [PRIMARY_KEY_NAME]: entityState.id }, alias)
							}
						}
						return builder
					})
				}
			} else if (
				marker instanceof ConnectionMarker
			) {
				if (marker.isNonbearing) {
					nonbearingConnections.push(marker)
				} else {
					builder = builder.one(marker.fieldName, builder => builder.connect(marker.target))
				}
			} */ else if (
				marker instanceof SubTreeMarker
			) {
				// Do nothing: all sub trees have been hoisted and shouldn't appear here.
			} else {
				assertNever(marker)
			}
		}

		if (builder.data !== undefined && !isEmptyObject(builder.data)) {
			for (const { value, placeholderName } of nonbearingFields) {
				builder = builder.set(placeholderName, value)
			}
			for (const marker of nonbearingConnections) {
				builder = builder.one(marker.fieldName, builder => builder.connect(marker.target))
			}
		}

		return builder
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

		for (const [placeholderName, marker] of currentState.fieldMarkers) {
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
				if (fieldState?.type !== InternalStateType.SingleEntity || processedEntities.has(fieldState)) {
					continue
				}
				// Deliberately not adding the entity to processedEntities - it will be done in a subroutine.

				const reducedBy = marker.relation.reducedBy
				if (reducedBy === undefined) {
					const subBuilder = ((
						builder: CrudQueryBuilder.WriteOneRelationBuilder<CrudQueryBuilder.WriteOperation.Update>,
					) => {
						const persistedValue = currentState.persistedData?.get?.(placeholderName)

						if (persistedValue instanceof BoxedSingleEntityId) {
							if (persistedValue.id === fieldState.id) {
								return builder.update(builder =>
									this.registerUpdateMutationPart(processedEntities, fieldState, builder),
								)
							}
							const plannedDeletion = currentState.plannedHasOneDeletions?.get(placeholderName)
							if (plannedDeletion !== undefined) {
								// TODO also potentially do something about the current entity
								return builder.delete()
							}
							if (typeof fieldState.id === 'string') {
								// TODO also potentially update
								return builder.connect({
									[PRIMARY_KEY_NAME]: fieldState.id,
								})
							}
							const subBuilder = builder.create(
								this.registerCreateReferenceMutationPart(processedEntities, fieldState, fieldState.creationParameters),
							)
							if (isEmptyObject(subBuilder.data)) {
								return builder.disconnect()
							}
							return subBuilder
						} else {
							return builder.create(
								this.registerCreateReferenceMutationPart(processedEntities, fieldState, fieldState.creationParameters),
							)
						}
					})(CrudQueryBuilder.WriteOneRelationBuilder.instantiate<CrudQueryBuilder.WriteOperation.Update>())

					if (subBuilder.data) {
						builder = builder.one(marker.relation.field, subBuilder)
					}
				} else {
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
								// TODO also potentially update
								return builder.disconnect(reducedBy, alias).connect(
									{
										[PRIMARY_KEY_NAME]: fieldState.id,
									},
									alias,
								)
							}
							const subBuilder = builder.create(
								this.registerCreateReferenceMutationPart(processedEntities, fieldState, fieldState.creationParameters),
							)
							if (isEmptyObject(subBuilder.data)) {
								return builder.disconnect(reducedBy, alias)
							}
							return subBuilder
						} else {
							return builder.create(
								this.registerCreateReferenceMutationPart(processedEntities, fieldState, fieldState.creationParameters),
							)
						}
					})
				}
			} else if (marker instanceof HasManyRelationMarker) {
				if (fieldState?.type !== InternalStateType.EntityList) {
					continue
				}
				builder = builder.many(marker.relation.field, builder => {
					for (const childKey of fieldState.childrenKeys) {
						const childEntityState = this.entityStore.get(childKey)

						if (childEntityState === undefined || processedEntities.has(childEntityState)) {
							continue
						}
						// Deliberately not adding the entity to processedEntities - it will be done in a subroutine.
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
							builder = builder.create(
								this.registerCreateReferenceMutationPart(
									processedEntities,
									childEntityState,
									childEntityState.creationParameters,
								),
								alias,
							)
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

	private registerCreateReferenceMutationPart(
		processedEntities: ProcessedEntities,
		entityState: InternalEntityState,
		creationParameters: EntityCreationParameters,
	): CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Create> {
		const registerReductionFields = (where: UniqueWhere): Input.CreateDataInput<GraphQlBuilder.Literal> => {
			const data: Input.CreateDataInput<GraphQlBuilder.Literal> = {}

			for (const key in where) {
				const field = where[key]

				if (
					typeof field === 'string' ||
					typeof field === 'number' ||
					field === null ||
					field instanceof GraphQlBuilder.Literal
				) {
					data[key] = field
				} else {
					data[key] = {
						connect: field,
					}
				}
			}

			return data
		}
		// TODO creation params & reducedBy
		// TODO forceCreate

		const dataBuilder = this.registerCreateMutationPart(
			processedEntities,
			entityState,
			new CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Create>(),
		)

		if (!creationParameters.setOnCreate || isEmptyObject(dataBuilder.data)) {
			return dataBuilder
		}
		return new CrudQueryBuilder.WriteDataBuilder({
			...dataBuilder.data,
			...registerReductionFields(creationParameters.setOnCreate),
		})
	}
}
