import { CrudQueryBuilder, GraphQlBuilder } from '@contember/client'
import { Input } from '@contember/schema'
import { EntityAccessor } from '../accessors'
import { ReceivedEntityData } from '../accessorTree'
import { BindingError } from '../BindingError'
import { PRIMARY_KEY_NAME, TYPENAME_KEY_NAME } from '../bindingTypes'
import {
	ConnectionMarker,
	EntityFieldMarkers,
	FieldMarker,
	MarkerSubTree,
	MarkerSubTreeParameters,
	MarkerTreeRoot,
	ReferenceMarker,
} from '../markers'
import { ExpectedEntityCount, FieldValue, UniqueWhere } from '../treeParameters'
import { assertNever, isEmptyObject } from '../utils'
import { AliasTransformer } from './AliasTransformer'
import { InternalEntityState, InternalRootStateNode, InternalStateType } from './internalState'

type QueryBuilder = Omit<CrudQueryBuilder.CrudQueryBuilder, CrudQueryBuilder.Queries>

export class MutationGenerator {
	public constructor(
		private markerTree: MarkerTreeRoot,
		private allSubTrees: Map<string, InternalRootStateNode>,
		private entityStore: Map<string, InternalEntityState>,
	) {}

	public getPersistMutation(): string | undefined {
		try {
			let builder: QueryBuilder = new CrudQueryBuilder.CrudQueryBuilder()

			for (const [placeholderName, markerSubTree] of this.markerTree.subTrees) {
				builder = this.addSubMutation(
					markerSubTree.fields,
					this.allSubTrees.get(placeholderName)!,
					placeholderName,
					markerSubTree.parameters,
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
		entityFieldMarkers: EntityFieldMarkers,
		rootState: InternalRootStateNode,
		alias: string,
		parameters: MarkerSubTreeParameters,
		queryBuilder: QueryBuilder,
	): QueryBuilder {
		if (rootState.type === InternalStateType.SingleEntity) {
			if (rootState.isScheduledForDeletion) {
				queryBuilder = this.addDeleteMutation(rootState, alias, parameters, queryBuilder)
			} else if (!rootState.accessor.existsOnServer) {
				queryBuilder = this.addCreateMutation(rootState, entityFieldMarkers, alias, parameters, queryBuilder)
			} else {
				queryBuilder = this.addUpdateMutation(rootState, entityFieldMarkers, alias, parameters, queryBuilder)
			}
		} else if (rootState.type === InternalStateType.EntityList) {
			for (const childKey of rootState.childrenKeys) {
				const childState = this.entityStore.get(childKey)!

				queryBuilder = this.addSubMutation(
					entityFieldMarkers,
					childState,
					AliasTransformer.joinAliasSections(alias, AliasTransformer.entityToAlias(childState.accessor)),
					parameters,
					queryBuilder,
				)
			}
		} else {
			assertNever(rootState)
		}

		return queryBuilder
	}

	private addDeleteMutation(
		entityState: InternalEntityState,
		alias: string,
		parameters: MarkerSubTreeParameters,
		queryBuilder?: QueryBuilder,
	): QueryBuilder {
		if (!queryBuilder) {
			queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}

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
					.by({ ...where, [PRIMARY_KEY_NAME]: entityState.accessor.primaryKey! })
			},
			alias,
		)
	}

	private addUpdateMutation(
		entityState: InternalEntityState,
		entityFieldMarkers: EntityFieldMarkers,
		alias: string,
		parameters: MarkerSubTreeParameters,
		queryBuilder?: QueryBuilder,
	): QueryBuilder {
		if (!queryBuilder) {
			queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}

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
					.data(builder => this.registerUpdateMutationPart(entityState, entityFieldMarkers, builder))
					.by({ ...where, [PRIMARY_KEY_NAME]: runtimeId })
					.node(builder => builder.column(PRIMARY_KEY_NAME))
					.ok()
					.validation()
			},
			alias,
		)
	}

	private addCreateMutation(
		entityState: InternalEntityState,
		entityFieldMarkers: EntityFieldMarkers,
		alias: string,
		parameters: MarkerSubTreeParameters,
		queryBuilder?: QueryBuilder,
	): QueryBuilder {
		if (!queryBuilder) {
			queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}

		return queryBuilder.create(
			parameters.value.entityName,
			builder => {
				let writeBuilder = this.registerCreateMutationPart(
					entityState,
					entityFieldMarkers,
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
		currentState: InternalEntityState,
		entityFieldMarkers: EntityFieldMarkers,
		builder: CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Create>,
	): CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Create> {
		const nonbearingFields: Array<{
			placeholderName: string
			value: FieldValue
		}> = []
		const nonbearingConnections: ConnectionMarker[] = []

		for (const [placeholderName, marker] of entityFieldMarkers) {
			if (placeholderName === PRIMARY_KEY_NAME || placeholderName === TYPENAME_KEY_NAME) {
				continue
			}
			if (marker instanceof FieldMarker) {
				const fieldState = currentState.fields.get(placeholderName)!
				if (fieldState.type === InternalStateType.Field) {
					const resolvedValue = fieldState.accessor.resolvedValue

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
			} else if (marker instanceof ReferenceMarker) {
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
										alias: AliasTransformer.entityToAlias(childState.accessor),
									})
								}
							}
						}
					} else {
						assertNever(reference.expectedCount)
					}
				}

				if (unreducedHasOnePresent) {
					if (accessorReference.length === 1) {
						const createOneRelationBuilder = CrudQueryBuilder.WriteOneRelationBuilder.instantiate<
							CrudQueryBuilder.WriteOperation.Create
						>()
						const { entityState, reference } = accessorReference[0]

						if (typeof entityState.id !== 'string') {
							const createBuilder = createOneRelationBuilder.create(
								this.registerCreateReferenceMutationPart(entityState, reference),
							)
							if (createBuilder.data) {
								builder = builder.one(placeholderName, createBuilder)
							}
						} else {
							builder = builder.one(
								placeholderName,
								createOneRelationBuilder.connect({
									[PRIMARY_KEY_NAME]: entityState.id,
								}),
							)
						}
					} else {
						throw new BindingError(`Creating several entities for the hasOne '${placeholderName}' relation.`)
					}
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
			} else if (marker instanceof ConnectionMarker) {
				if (marker.isNonbearing) {
					nonbearingConnections.push(marker)
				} else {
					builder = builder.one(marker.fieldName, builder => builder.connect(marker.target))
				}
			} else if (marker instanceof MarkerSubTree) {
				// Do nothing: we don't support persisting nested queries (yet?).
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
		currentState: InternalEntityState,
		entityFieldMarkers: EntityFieldMarkers,
		builder: CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Update>,
	): CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Update> {
		for (const [placeholderName, marker] of entityFieldMarkers) {
			if (placeholderName === PRIMARY_KEY_NAME || placeholderName === TYPENAME_KEY_NAME) {
				continue
			}
			if (marker instanceof FieldMarker) {
				const fieldState = currentState.fields.get(placeholderName)

				if (fieldState?.type === InternalStateType.Field && fieldState.persistedValue !== undefined) {
					const resolvedValue = fieldState.accessor.resolvedValue
					if (fieldState.persistedValue !== resolvedValue) {
						builder = builder.set(placeholderName, resolvedValue)
					}
				}
			} else if (marker instanceof ReferenceMarker) {
				let unreducedHasOnePresent = false
				const references = marker.references
				const accessorReference: Array<{
					alias?: string
					referenceState: InternalEntityState
					reference: ReferenceMarker.Reference
					persistedField: ReceivedEntityData<undefined>
				}> = []

				for (const referencePlaceholder in references) {
					const reference = references[referencePlaceholder]
					const referenceState = currentState.fields.get(reference.placeholderName)

					if (referenceState === undefined) {
						continue
					}

					if (
						reference.expectedCount === ExpectedEntityCount.UpToOne &&
						referenceState.type === InternalStateType.SingleEntity
					) {
						const persistedField = referenceState.persistedData
						if (
							(persistedField !== null && typeof persistedField === 'object' && !Array.isArray(persistedField)) ||
							persistedField === undefined ||
							persistedField === null
						) {
							accessorReference.push({
								referenceState,
								reference,
								persistedField: (persistedField as ReceivedEntityData<undefined>) || undefined, // TODO handle this cast
								alias: referencePlaceholder,
							})

							if (reference.reducedBy === undefined) {
								unreducedHasOnePresent = true
							}
						}
					} else if (
						reference.expectedCount === ExpectedEntityCount.PossiblyMany &&
						referenceState.type === InternalStateType.EntityList
					) {
						const persistedField = referenceState.initialData
						if (Array.isArray(persistedField) || persistedField === undefined || persistedField === null) {
							let i = 0
							for (const childKey of referenceState.childrenKeys) {
								const innerState = this.entityStore.get(childKey)
								if (innerState === undefined) {
									continue
								}
								const innerField = persistedField ? persistedField[i] : undefined
								accessorReference.push({
									referenceState: innerState,
									reference,
									persistedField: innerField as ReceivedEntityData<undefined>, // TODO handle this cast
									alias: AliasTransformer.entityToAlias(innerState.accessor),
								})
								i++
							}
						}
					}
				}

				if (unreducedHasOnePresent) {
					if (accessorReference.length === 1) {
						const subBuilder = ((
							builder: CrudQueryBuilder.WriteOneRelationBuilder<CrudQueryBuilder.WriteOperation.Update>,
						) => {
							const { referenceState, reference, persistedField, alias } = accessorReference[0]

							// TODO (dis)connects!!
							if (referenceState.isScheduledForDeletion) {
								return builder.delete() // builder.disconnect()
							} else if (typeof referenceState.id === 'string') {
								const updated = builder.update(builder =>
									this.registerUpdateMutationPart(referenceState, reference.fields, builder),
								)

								if (!persistedField || (persistedField && referenceState.id !== persistedField[PRIMARY_KEY_NAME])) {
									return updated.connect({
										[PRIMARY_KEY_NAME]: referenceState.id,
									})
								}
								return updated
							} else {
								return builder.create(this.registerCreateReferenceMutationPart(referenceState, reference))
							}
						})(CrudQueryBuilder.WriteOneRelationBuilder.instantiate<CrudQueryBuilder.WriteOperation.Update>())

						if (subBuilder.data) {
							builder = builder.one(placeholderName, subBuilder)
						}
					} else {
						throw new BindingError(`Creating several entities for the hasOne '${placeholderName}' relation.`)
					}
				} else {
					builder = builder.many(placeholderName, builder => {
						for (const { referenceState, reference, persistedField, alias } of accessorReference) {
							if (referenceState.isScheduledForDeletion) {
								// TODO builder = builder.disconnect({ [PRIMARY_KEY_NAME]: accessor.primaryKey }, alias)
								builder = builder.delete({ [PRIMARY_KEY_NAME]: referenceState.id }, alias)
							} else if (typeof referenceState.id === 'string') {
								builder = builder.update(
									{ [PRIMARY_KEY_NAME]: referenceState.id },
									builder => {
										return this.registerUpdateMutationPart(referenceState, reference.fields, builder)
									},
									alias,
								)

								if (!persistedField || (persistedField && referenceState.id !== persistedField[PRIMARY_KEY_NAME])) {
									builder = builder.connect({ [PRIMARY_KEY_NAME]: referenceState.id }, alias)
								}
							} else {
								builder = builder.create(this.registerCreateReferenceMutationPart(referenceState, reference), alias)
							}
						}
						return builder
					})
				}
			} else if (marker instanceof ConnectionMarker) {
				// Do nothing: connections are only relevant to create mutations. At the point of updating, the entity is
				// supposed to have already been connected.
			} else if (marker instanceof MarkerSubTree) {
				// Do nothing: we don't support persisting nested queries (yet?).
			} else {
				assertNever(marker)
			}
		}

		return builder
	}

	private registerCreateReferenceMutationPart(
		entityState: InternalEntityState,
		reference: ReferenceMarker.Reference,
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

		const dataBuilder = this.registerCreateMutationPart(
			entityState,
			reference.fields,
			new CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Create>(),
		)

		if (!reference.reducedBy || isEmptyObject(dataBuilder.data)) {
			return dataBuilder
		}
		return new CrudQueryBuilder.WriteDataBuilder({
			...dataBuilder.data,
			...registerReductionFields(reference.reducedBy),
		})
	}
}
