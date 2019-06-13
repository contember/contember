import { CrudQueryBuilder, GraphQlBuilder } from 'cms-client'
import { assertNever, Input, isEmptyObject, OmitMethods } from 'cms-common'
import { EntityName, PRIMARY_KEY_NAME, ReceivedData, ReceivedEntityData, Scalar } from '../bindingTypes'
import {
	AccessorTreeRoot,
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
	RootAccessor
} from '../dao'

type QueryBuilder = OmitMethods<CrudQueryBuilder.CrudQueryBuilder, CrudQueryBuilder.Queries>

export class MutationGenerator {
	private createCounter: number = 0

	public constructor(
		private persistedData: any,
		private currentData: AccessorTreeRoot,
		private markerTree: MarkerTreeRoot
	) {}

	public getPersistMutation(): string | undefined {
		try {
			const builder = this.addSubMutation(
				this.persistedData ? this.persistedData[this.currentData.id] : undefined,
				this.markerTree.entityName,
				this.markerTree.fields,
				this.currentData.root,
				this.markerTree.constraints
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
		constraints?: MarkerTreeConstraints,
		queryBuilder?: QueryBuilder
	): QueryBuilder {
		if (!queryBuilder) {
			queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}

		if (entity instanceof EntityAccessor) {
			if (entity.primaryKey instanceof EntityAccessor.UnpersistedEntityID) {
				queryBuilder = this.addCreateMutation(entity, entityName, entityFields, constraints, queryBuilder)
			} else if (data && !Array.isArray(data)) {
				queryBuilder = this.addUpdateMutation(entity, entityName, entityFields, data, constraints, queryBuilder)
			}
		} else if (entity instanceof EntityForRemovalAccessor) {
			queryBuilder = this.addDeleteMutation(entity, entityName, constraints, queryBuilder)
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
							constraints,
							queryBuilder
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
		constraints?: MarkerTreeConstraints,
		queryBuilder?: QueryBuilder
	): QueryBuilder {
		if (!queryBuilder) {
			queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}

		return queryBuilder.delete(
			entityName,
			builder => {
				builder = builder.column(PRIMARY_KEY_NAME)

				let where = {}
				if (constraints && constraints.whereType === 'unique') {
					where = constraints.where
				}

				return builder.by({ ...where, [PRIMARY_KEY_NAME]: entity.primaryKey })
			},
			`delete${entityName}_${this.primaryKeyToAlias(entity.primaryKey)}`
		)
	}

	private addUpdateMutation(
		entity: EntityAccessor,
		entityName: EntityName,
		entityFields: EntityFields,
		data: ReceivedEntityData<undefined>,
		constraints?: MarkerTreeConstraints,
		queryBuilder?: QueryBuilder
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
					.column(PRIMARY_KEY_NAME)
					.by({ ...where, [PRIMARY_KEY_NAME]: primaryKey })
			},
			`update${entityName}_${this.primaryKeyToAlias(primaryKey)}`
		)
	}

	private addCreateMutation(
		entity: EntityAccessor,
		entityName: EntityName,
		entityFields: EntityFields,
		constraints?: MarkerTreeConstraints,
		queryBuilder?: QueryBuilder
	): QueryBuilder {
		if (!queryBuilder) {
			queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}

		return queryBuilder.create(
			entityName,
			builder => {
				return builder
					.data(
						this.registerCreateMutationPart(
							entity,
							entityFields,
							new CrudQueryBuilder.CreateDataBuilder(
								constraints && constraints.whereType === 'unique' ? constraints.where : undefined
							)
						)
					)
					.column(PRIMARY_KEY_NAME)
			},
			`create${entityName}_${(this.createCounter++).toFixed(0)}`
		)
	}

	private registerCreateMutationPart(
		currentData: EntityAccessor,
		entityFields: EntityFields,
		builder: CrudQueryBuilder.CreateDataBuilder
	): CrudQueryBuilder.CreateDataBuilder {
		const allData = currentData.data.allFieldData
		const nonbearingFields: Array<{
			placeholderName: string
			value: GraphQlBuilder.Literal | Scalar
		}> = []

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
								placeholderName
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
					accessor: EntityAccessor
					reference: ReferenceMarker.Reference
				}> = []

				for (const referencePlaceholder in references) {
					const reference = references[referencePlaceholder]
					const accessor = allData[reference.placeholderName]

					if (reference.expectedCount === ReferenceMarker.ExpectedCount.UpToOne) {
						if (accessor instanceof EntityAccessor) {
							accessorReference.push({ accessor, reference })

							if (reference.reducedBy === undefined) {
								unreducedHasOnePresent = true
							}
						}
					} else if (reference.expectedCount === ReferenceMarker.ExpectedCount.PossiblyMany) {
						if (accessor instanceof EntityCollectionAccessor) {
							for (const innerAccessor of accessor.entities) {
								if (innerAccessor instanceof EntityAccessor) {
									accessorReference.push({ accessor: innerAccessor, reference })
								}
							}
						}
					} else {
						assertNever(reference.expectedCount)
					}
				}

				if (unreducedHasOnePresent) {
					if (accessorReference.length === 1) {
						const createOneRelationBuilder = new CrudQueryBuilder.CreateOneRelationBuilder<undefined>()
						const { accessor, reference } = accessorReference[0]

						if (accessor.primaryKey instanceof EntityAccessor.UnpersistedEntityID) {
							const innerBuilder = this.createCreateDataBuilderByReference(reference)
							const createBuilder = createOneRelationBuilder.create(
								this.registerCreateMutationPart(accessor, reference.fields, innerBuilder)
							)
							if (createBuilder.data) {
								builder = builder.one(placeholderName, createBuilder)
							}
						} else {
							builder = builder.one(
								placeholderName,
								createOneRelationBuilder.connect({
									[PRIMARY_KEY_NAME]: accessor.primaryKey
								})
							)
						}
					} else {
						throw new DataBindingError(`Creating several entities for the hasOne '${placeholderName}' relation.`)
					}
				} else {
					builder = builder.many(placeholderName, builder => {
						for (const referencePair of accessorReference) {
							const { accessor, reference } = referencePair

							if (accessor.primaryKey instanceof EntityAccessor.UnpersistedEntityID) {
								const innerBuilder = this.createCreateDataBuilderByReference(reference)
								builder = builder.create(this.registerCreateMutationPart(accessor, reference.fields, innerBuilder))
							} else {
								builder = builder.connect({ [PRIMARY_KEY_NAME]: accessor.primaryKey })
							}
						}
						return builder
					})
				}
			} else if (marker instanceof MarkerTreeRoot) {
				// Do nothing: we don't support persisting nested queries (yet?).
			} else {
				assertNever(marker)
			}
		}

		if (nonbearingFields.length && builder.data !== undefined && !isEmptyObject(builder.data)) {
			for (const { value, placeholderName } of nonbearingFields) {
				builder = builder.set(placeholderName, value)
			}
		}

		return builder
	}

	private registerUpdateMutationPart(
		currentData: EntityAccessor,
		entityFields: EntityFields,
		persistedData: ReceivedEntityData<undefined>,
		builder: CrudQueryBuilder.UpdateDataBuilder
	): CrudQueryBuilder.UpdateDataBuilder {
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
					accessor: EntityAccessor | EntityForRemovalAccessor
					reference: ReferenceMarker.Reference
					persistedField: ReceivedEntityData<undefined>
				}> = []

				for (const referencePlaceholder in references) {
					const reference = references[referencePlaceholder]
					const accessor = allData[reference.placeholderName]
					const persistedField = persistedData ? persistedData[reference.placeholderName] : undefined

					if (reference.expectedCount === ReferenceMarker.ExpectedCount.UpToOne) {
						if (
							(accessor instanceof EntityAccessor || accessor instanceof EntityForRemovalAccessor) &&
							((persistedField !== null && typeof persistedField === 'object' && !Array.isArray(persistedField)) ||
								(persistedField === undefined || persistedField === null))
						) {
							accessorReference.push({ accessor, reference, persistedField: persistedField || undefined })

							if (reference.reducedBy === undefined) {
								unreducedHasOnePresent = true
							}
						}
					} else if (reference.expectedCount === ReferenceMarker.ExpectedCount.PossiblyMany) {
						if (
							accessor instanceof EntityCollectionAccessor &&
							(Array.isArray(persistedField) || persistedField === undefined || persistedField === null)
						) {
							for (let i = 0, entityCount = accessor.entities.length; i < entityCount; i++) {
								const innerAccessor = accessor.entities[i]
								const innerField = persistedField ? persistedField[i] : undefined
								if (innerAccessor) {
									accessorReference.push({ accessor: innerAccessor, reference, persistedField: innerField })
								}
							}
						}
					} else {
						assertNever(reference.expectedCount)
					}
				}

				if (unreducedHasOnePresent) {
					if (accessorReference.length === 1) {
						const subBuilder = ((builder: CrudQueryBuilder.UpdateOneRelationBuilder<undefined>) => {
							const { accessor, reference, persistedField } = accessorReference[0]

							if (accessor instanceof EntityAccessor) {
								if (accessor.primaryKey instanceof EntityAccessor.UnpersistedEntityID) {
									const innerBuilder = this.createCreateDataBuilderByReference(reference)
									return builder.create(this.registerCreateMutationPart(accessor, reference.fields, innerBuilder))
								} else {
									const updated = builder.update(builder =>
										this.registerUpdateMutationPart(accessor, reference.fields, persistedField, builder)
									)

									if (!persistedField || (persistedField && accessor.primaryKey !== persistedField[PRIMARY_KEY_NAME])) {
										return updated.connect({
											[PRIMARY_KEY_NAME]: accessor.primaryKey
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
						})(new CrudQueryBuilder.UpdateOneRelationBuilder<undefined>())

						if (subBuilder.data) {
							builder = builder.one(placeholderName, subBuilder as CrudQueryBuilder.UpdateOneRelationBuilder<
								Input.UpdateOneRelationInput<GraphQlBuilder.Literal>
							>)
						}
					} else {
						throw new DataBindingError(`Creating several entities for the hasOne '${placeholderName}' relation.`)
					}
				} else {
					builder = builder.many(placeholderName, builder => {
						for (const referencePair of accessorReference) {
							const { accessor, reference, persistedField } = referencePair

							if (accessor instanceof EntityAccessor) {
								if (accessor.primaryKey instanceof EntityAccessor.UnpersistedEntityID) {
									const innerBuilder = this.createCreateDataBuilderByReference(reference)
									builder = builder.create(this.registerCreateMutationPart(accessor, reference.fields, innerBuilder))
								} else {
									builder = builder.update({ [PRIMARY_KEY_NAME]: accessor.primaryKey }, builder => {
										return this.registerUpdateMutationPart(accessor, reference.fields, persistedField, builder)
									})

									if (!persistedField || (persistedField && accessor.primaryKey !== persistedField[PRIMARY_KEY_NAME])) {
										builder = builder.connect({
											[PRIMARY_KEY_NAME]: accessor.primaryKey
										})
									}
								}
							} else if (accessor instanceof EntityForRemovalAccessor) {
								const removalType = accessor.removalType

								if (removalType === EntityAccessor.RemovalType.Delete) {
									builder = builder.delete({
										[PRIMARY_KEY_NAME]: accessor.primaryKey
									})
								} else if (removalType === EntityAccessor.RemovalType.Disconnect) {
									builder = builder.disconnect({
										[PRIMARY_KEY_NAME]: accessor.primaryKey
									})
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
			} else if (marker instanceof MarkerTreeRoot) {
				// Do nothing: we don't support persisting nested queries (yet?).
			} else {
				assertNever(marker)
			}
		}

		return builder
	}

	private createCreateDataBuilderByReference(reference: ReferenceMarker.Reference): CrudQueryBuilder.CreateDataBuilder {
		const registerReductionFields = (
			where: Input.UniqueWhere<GraphQlBuilder.Literal>
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
						connect: field
					}
				}
			}

			return data
		}

		return new CrudQueryBuilder.CreateDataBuilder(reference.reducedBy && registerReductionFields(reference.reducedBy))
	}

	private primaryKeyToAlias(primaryKey: string): string {
		return `_${primaryKey.replace(/-/g, '')}`
	}
}
