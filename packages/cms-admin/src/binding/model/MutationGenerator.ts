import { CrudQueryBuilder, GraphQlBuilder } from 'cms-client'
import { isEmptyObject } from 'cms-common'
import { assertNever } from '@contember/utils'
import { Input } from '@contember/schema'
import { EntityName, ExpectedCount, PRIMARY_KEY_NAME } from '../bindingTypes'
import {
	AccessorTreeRoot,
	ConnectionMarker,
	DataBindingError,
	EntityAccessor,
	EntityCollectionAccessor,
	EntityFields,
	EntityForRemovalAccessor,
	FieldAccessor,
	FieldMarker,
	MarkerTreeConstraints,
	MarkerTreeRoot,
	ReferenceMarker,
	RootAccessor,
} from '../dao'
import { ReceivedData, ReceivedEntityData, Scalar } from '../accessorTree'

type QueryBuilder = Omit<CrudQueryBuilder.CrudQueryBuilder, CrudQueryBuilder.Queries>

export class MutationGenerator {
	public static readonly ALIAS_SEPARATOR = '__'

	public constructor(
		private persistedData: any,
		private currentData: AccessorTreeRoot,
		private markerTree: MarkerTreeRoot,
	) {}

	public getPersistMutation(): string | undefined {
		try {
			const builder = this.addSubMutation(
				this.persistedData ? this.persistedData[this.currentData.id] : undefined,
				this.markerTree.entityName,
				this.markerTree.fields,
				this.currentData.root,
				this.markerTree.id,
				this.markerTree.constraints,
			)
			return builder.getGql()
		} catch (e) {
			return undefined
		}
	}

	private addSubMutation(
		data: ReceivedData<undefined>,
		entityName: EntityName,
		entityFields: EntityFields,
		entity: RootAccessor,
		alias: string,
		constraints?: MarkerTreeConstraints,
		queryBuilder?: QueryBuilder,
	): QueryBuilder {
		if (!queryBuilder) {
			queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}

		if (entity instanceof EntityAccessor) {
			if (entity.primaryKey instanceof EntityAccessor.UnpersistedEntityID) {
				queryBuilder = this.addCreateMutation(entity, entityName, entityFields, alias, constraints, queryBuilder)
			} else if (data && !Array.isArray(data)) {
				queryBuilder = this.addUpdateMutation(entity, entityName, entityFields, data, alias, constraints, queryBuilder)
			}
		} else if (entity instanceof EntityForRemovalAccessor) {
			queryBuilder = this.addDeleteMutation(entity, entityName, alias, constraints, queryBuilder)
		} else if (entity instanceof EntityCollectionAccessor) {
			if (Array.isArray(data) || data === undefined) {
				const entityCount = entity.entities.length

				for (let entityI = 0, dataI = 0; entityI < entityCount; entityI++) {
					const currentEntity = entity.entities[entityI]

					if (currentEntity instanceof EntityAccessor || currentEntity instanceof EntityForRemovalAccessor) {
						queryBuilder = this.addSubMutation(
							data ? data[dataI++] : undefined,
							entityName,
							entityFields,
							currentEntity,
							`${alias}${MutationGenerator.ALIAS_SEPARATOR}${entityI}`,
							constraints,
							queryBuilder,
						)
					} else if (currentEntity === undefined) {
						// Do nothing. This was a non-persisted entity that was subsequently deleted.
						// No need to create it only to delete it again…
					} else {
						assertNever(currentEntity)
					}
				}
			}
		} else {
			assertNever(entity)
		}

		return queryBuilder
	}

	private addDeleteMutation(
		entity: EntityForRemovalAccessor,
		entityName: EntityName,
		alias: string,
		constraints?: MarkerTreeConstraints,
		queryBuilder?: QueryBuilder,
	): QueryBuilder {
		if (!queryBuilder) {
			queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}

		return queryBuilder.delete(
			entityName,
			builder => {
				let where = {}
				if (constraints && constraints.whereType === 'unique') {
					where = constraints.where
				}

				return builder
					.ok()
					.node(builder => builder.column(PRIMARY_KEY_NAME))
					.by({ ...where, [PRIMARY_KEY_NAME]: entity.primaryKey })
			},
			alias,
		)
	}

	private addUpdateMutation(
		entity: EntityAccessor,
		entityName: EntityName,
		entityFields: EntityFields,
		data: ReceivedEntityData<undefined>,
		alias: string,
		constraints?: MarkerTreeConstraints,
		queryBuilder?: QueryBuilder,
	): QueryBuilder {
		if (!queryBuilder) {
			queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}

		const primaryKey = entity.primaryKey

		if (primaryKey instanceof EntityAccessor.UnpersistedEntityID || !data) {
			return queryBuilder
		}

		return queryBuilder.update(
			entityName,
			builder => {
				let where = {}
				if (constraints && constraints.whereType === 'unique') {
					where = constraints.where
				}

				return builder
					.data(builder => this.registerUpdateMutationPart(entity, entityFields, data, builder))
					.by({ ...where, [PRIMARY_KEY_NAME]: primaryKey })
					.node(builder => builder.column(PRIMARY_KEY_NAME))
					.ok()
					.validation()
			},
			alias,
		)
	}

	private addCreateMutation(
		entity: EntityAccessor,
		entityName: EntityName,
		entityFields: EntityFields,
		alias: string,
		constraints?: MarkerTreeConstraints,
		queryBuilder?: QueryBuilder,
	): QueryBuilder {
		if (!queryBuilder) {
			queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}

		return queryBuilder.create(
			entityName,
			builder => {
				let writeBuilder = this.registerCreateMutationPart(
					entity,
					entityFields,
					new CrudQueryBuilder.WriteDataBuilder(),
				)
				if (
					constraints &&
					constraints.whereType === 'unique' &&
					writeBuilder.data !== undefined &&
					!isEmptyObject(writeBuilder.data)
				) {
					// Shallow cloning the constraints like this IS too naïve but it will likely last surprisingly long before we
					// run into issues.
					writeBuilder = new CrudQueryBuilder.WriteDataBuilder({ ...writeBuilder.data, ...constraints.where })
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
		currentData: EntityAccessor,
		entityFields: EntityFields,
		builder: CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Create>,
	): CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Create> {
		const allData = currentData.data.allFieldData
		const nonbearingFields: Array<{
			placeholderName: string
			value: GraphQlBuilder.Literal | Scalar
		}> = []
		const nonbearingConnections: ConnectionMarker[] = []

		for (const placeholderName in entityFields) {
			const marker = entityFields[placeholderName]

			if (marker instanceof FieldMarker) {
				const accessor = allData[placeholderName]
				if (accessor instanceof FieldAccessor) {
					const value = accessor.currentValue === null ? marker.defaultValue : accessor.currentValue

					if (value !== undefined && value !== null) {
						if (marker.isNonbearing) {
							nonbearingFields.push({
								value,
								placeholderName,
							})
						} else {
							builder = builder.set(placeholderName, value)
						}
					}
				}
			} else if (marker instanceof ReferenceMarker) {
				let unreducedHasOnePresent = false
				const references = marker.references
				const accessorReference: Array<{
					alias?: string
					accessor: EntityAccessor
					reference: ReferenceMarker.Reference
				}> = []

				for (const referencePlaceholder in references) {
					const reference = references[referencePlaceholder]
					const accessor = allData[reference.placeholderName]

					if (reference.expectedCount === ExpectedCount.UpToOne) {
						if (accessor instanceof EntityAccessor) {
							accessorReference.push({ accessor, reference, alias: referencePlaceholder })

							if (reference.reducedBy === undefined) {
								unreducedHasOnePresent = true
							}
						}
					} else if (reference.expectedCount === ExpectedCount.PossiblyMany) {
						if (accessor instanceof EntityCollectionAccessor) {
							for (let i = 0, accessorCount = accessor.entities.length; i < accessorCount; i++) {
								const innerAccessor = accessor.entities[i]
								if (innerAccessor instanceof EntityAccessor) {
									accessorReference.push({ accessor: innerAccessor, reference, alias: i.toString() })
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
						const { accessor, reference } = accessorReference[0]

						if (accessor.primaryKey instanceof EntityAccessor.UnpersistedEntityID) {
							const createBuilder = createOneRelationBuilder.create(
								this.registerCreateReferenceMutationPart(accessor, reference),
							)
							if (createBuilder.data) {
								builder = builder.one(placeholderName, createBuilder)
							}
						} else {
							builder = builder.one(
								placeholderName,
								createOneRelationBuilder.connect({
									[PRIMARY_KEY_NAME]: accessor.primaryKey,
								}),
							)
						}
					} else {
						throw new DataBindingError(`Creating several entities for the hasOne '${placeholderName}' relation.`)
					}
				} else {
					builder = builder.many(placeholderName, builder => {
						for (const referencePair of accessorReference) {
							const { alias, accessor, reference } = referencePair

							if (accessor.primaryKey instanceof EntityAccessor.UnpersistedEntityID) {
								builder = builder.create(this.registerCreateReferenceMutationPart(accessor, reference), alias)
							} else {
								builder = builder.connect({ [PRIMARY_KEY_NAME]: accessor.primaryKey }, alias)
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
			} else if (marker instanceof MarkerTreeRoot) {
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
		currentData: EntityAccessor,
		entityFields: EntityFields,
		persistedData: ReceivedEntityData<undefined>,
		builder: CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Update>,
	): CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Update> {
		const allData = currentData.data.allFieldData

		for (const placeholderName in entityFields) {
			const marker = entityFields[placeholderName]

			if (marker instanceof FieldMarker) {
				const accessor = allData[placeholderName]
				const persistedField = persistedData ? persistedData[placeholderName] : undefined

				if (
					accessor instanceof FieldAccessor &&
					persistedField !== accessor.currentValue &&
					persistedField !== undefined
				) {
					builder = builder.set(placeholderName, accessor.currentValue)
				}
			} else if (marker instanceof ReferenceMarker) {
				let unreducedHasOnePresent = false
				const references = marker.references
				const accessorReference: Array<{
					alias?: string
					accessor: EntityAccessor | EntityForRemovalAccessor
					reference: ReferenceMarker.Reference
					persistedField: ReceivedEntityData<undefined>
				}> = []

				for (const referencePlaceholder in references) {
					const reference = references[referencePlaceholder]
					const accessor = allData[reference.placeholderName]
					const persistedField = persistedData ? persistedData[reference.placeholderName] : undefined

					if (reference.expectedCount === ExpectedCount.UpToOne) {
						if (
							(accessor instanceof EntityAccessor || accessor instanceof EntityForRemovalAccessor) &&
							((persistedField !== null && typeof persistedField === 'object' && !Array.isArray(persistedField)) ||
								(persistedField === undefined || persistedField === null))
						) {
							accessorReference.push({
								accessor,
								reference,
								persistedField: persistedField || undefined,
								alias: referencePlaceholder,
							})

							if (reference.reducedBy === undefined) {
								unreducedHasOnePresent = true
							}
						}
					} else if (reference.expectedCount === ExpectedCount.PossiblyMany) {
						if (
							accessor instanceof EntityCollectionAccessor &&
							(Array.isArray(persistedField) || persistedField === undefined || persistedField === null)
						) {
							for (let i = 0, entityCount = accessor.entities.length; i < entityCount; i++) {
								const innerAccessor = accessor.entities[i]
								const innerField = persistedField ? persistedField[i] : undefined
								if (innerAccessor) {
									accessorReference.push({
										accessor: innerAccessor,
										reference,
										persistedField: innerField,
										alias: i.toString(),
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
						const subBuilder = ((
							builder: CrudQueryBuilder.WriteOneRelationBuilder<CrudQueryBuilder.WriteOperation.Update>,
						) => {
							const { accessor, reference, persistedField, alias } = accessorReference[0]

							if (accessor instanceof EntityAccessor) {
								if (accessor.primaryKey instanceof EntityAccessor.UnpersistedEntityID) {
									return builder.create(this.registerCreateReferenceMutationPart(accessor, reference))
								} else {
									const updated = builder.update(builder =>
										this.registerUpdateMutationPart(accessor, reference.fields, persistedField, builder),
									)

									if (!persistedField || (persistedField && accessor.primaryKey !== persistedField[PRIMARY_KEY_NAME])) {
										return updated.connect({
											[PRIMARY_KEY_NAME]: accessor.primaryKey,
										})
									}
									return updated
								}
							} else if (accessor instanceof EntityForRemovalAccessor) {
								const removalType = accessor.removalType

								if (removalType === EntityAccessor.RemovalType.Delete) {
									return builder.delete()
								} else if (removalType === EntityAccessor.RemovalType.Disconnect) {
									return builder.disconnect()
								} else {
									return assertNever(removalType)
								}
							} else {
								return assertNever(accessor)
							}
						})(CrudQueryBuilder.WriteOneRelationBuilder.instantiate<CrudQueryBuilder.WriteOperation.Update>())

						if (subBuilder.data) {
							builder = builder.one(placeholderName, subBuilder)
						}
					} else {
						throw new DataBindingError(`Creating several entities for the hasOne '${placeholderName}' relation.`)
					}
				} else {
					builder = builder.many(placeholderName, builder => {
						for (const referencePair of accessorReference) {
							const { accessor, reference, persistedField, alias } = referencePair

							if (accessor instanceof EntityAccessor) {
								if (accessor.primaryKey instanceof EntityAccessor.UnpersistedEntityID) {
									builder = builder.create(this.registerCreateReferenceMutationPart(accessor, reference), alias)
								} else {
									builder = builder.update(
										{ [PRIMARY_KEY_NAME]: accessor.primaryKey },
										builder => {
											return this.registerUpdateMutationPart(accessor, reference.fields, persistedField, builder)
										},
										alias,
									)

									if (!persistedField || (persistedField && accessor.primaryKey !== persistedField[PRIMARY_KEY_NAME])) {
										builder = builder.connect({ [PRIMARY_KEY_NAME]: accessor.primaryKey }, alias)
									}
								}
							} else if (accessor instanceof EntityForRemovalAccessor) {
								const removalType = accessor.removalType

								if (removalType === EntityAccessor.RemovalType.Delete) {
									builder = builder.delete({ [PRIMARY_KEY_NAME]: accessor.primaryKey }, alias)
								} else if (removalType === EntityAccessor.RemovalType.Disconnect) {
									builder = builder.disconnect({ [PRIMARY_KEY_NAME]: accessor.primaryKey }, alias)
								} else {
									assertNever(removalType)
								}
							} else {
								assertNever(accessor)
							}
						}
						return builder
					})
				}
			} else if (marker instanceof ConnectionMarker) {
				// Do nothing: connections are only relevant to create mutations. At the point of updating, the entity is
				// supposed to have already been connected.
			} else if (marker instanceof MarkerTreeRoot) {
				// Do nothing: we don't support persisting nested queries (yet?).
			} else {
				assertNever(marker)
			}
		}

		return builder
	}

	private registerCreateReferenceMutationPart(
		accessor: EntityAccessor,
		reference: ReferenceMarker.Reference,
	): CrudQueryBuilder.WriteDataBuilder<CrudQueryBuilder.WriteOperation.Create> {
		const registerReductionFields = (
			where: Input.UniqueWhere<GraphQlBuilder.Literal>,
		): Input.CreateDataInput<GraphQlBuilder.Literal> => {
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
			accessor,
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

	private primaryKeyToAlias(primaryKey: string): string {
		return `_${primaryKey.replace(/-/g, '')}`
	}
}
