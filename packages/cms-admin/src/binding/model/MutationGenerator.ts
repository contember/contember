import { CrudQueryBuilder } from 'cms-client'
import { assertNever } from 'cms-common'
import { EntityName, ReceivedData, ReceivedEntityData } from '../bindingTypes'
import AccessorTreeRoot, { RootAccessor } from '../dao/AccessorTreeRoot'
import DataBindingError from '../dao/DataBindingError'
import EntityAccessor from '../dao/EntityAccessor'
import EntityCollectionAccessor from '../dao/EntityCollectionAccessor'
import EntityFields from '../dao/EntityFields'
import EntityForRemovalAccessor from '../dao/EntityForRemovalAccessor'
import FieldAccessor from '../dao/FieldAccessor'
import FieldMarker from '../dao/FieldMarker'
import MarkerTreeRoot from '../dao/MarkerTreeRoot'
import ReferenceMarker from '../dao/ReferenceMarker'

type Queries = 'get' | 'list'
type QueryBuilder = Pick<CrudQueryBuilder.CrudQueryBuilder, Exclude<keyof CrudQueryBuilder.CrudQueryBuilder, Queries>>

export default class MutationGenerator {
	private static readonly PRIMARY_KEY_NAME = 'id'

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
				this.currentData.root
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
		queryBuilder?: QueryBuilder
	): QueryBuilder {
		if (!queryBuilder) {
			queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}

		if (entity instanceof EntityAccessor) {
			if (entity.primaryKey === undefined) {
				queryBuilder = this.addCreateMutation(entity, entityName, entityFields, queryBuilder)
			} else if (data && !Array.isArray(data)) {
				queryBuilder = this.addUpdateMutation(entity, entityName, entityFields, data, queryBuilder)
			}
		} else if (entity instanceof EntityForRemovalAccessor) {
			queryBuilder = this.addDeleteMutation(entity, entityName, queryBuilder)
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
		queryBuilder?: QueryBuilder
	): QueryBuilder {
		if (!queryBuilder) {
			queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}

		return queryBuilder.delete(
			`delete${entityName}`,
			builder => {
				builder = builder.column(MutationGenerator.PRIMARY_KEY_NAME)
				return builder.where({ [MutationGenerator.PRIMARY_KEY_NAME]: entity.primaryKey })
			},
			`delete${entityName}_${this.primaryKeyToAlias(entity.primaryKey)}`
		)
	}

	private addUpdateMutation(
		entity: EntityAccessor,
		entityName: EntityName,
		entityFields: EntityFields,
		data: ReceivedEntityData<undefined>,
		queryBuilder?: QueryBuilder
	): QueryBuilder {
		if (!queryBuilder) {
			queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}

		const primaryKey = entity.primaryKey

		if (!primaryKey || !data) {
			return queryBuilder
		}

		return queryBuilder.update(
			`update${entityName}`,
			builder => {
				builder = builder.column(MutationGenerator.PRIMARY_KEY_NAME)
				builder = builder.where({ [MutationGenerator.PRIMARY_KEY_NAME]: primaryKey })

				return builder.data(builder => this.registerUpdateMutationPart(entity, entityFields, data, builder))
			},
			`update${entityName}_${this.primaryKeyToAlias(primaryKey)}`
		)
	}

	private addCreateMutation(
		entity: EntityAccessor,
		entityName: EntityName,
		entityFields: EntityFields,
		queryBuilder?: QueryBuilder
	): QueryBuilder {
		if (!queryBuilder) {
			queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}

		return queryBuilder.create(
			`create${entityName}`,
			builder => {
				builder = builder.column(MutationGenerator.PRIMARY_KEY_NAME)

				return builder.data(builder => this.registerCreateMutationPart(entity, entityFields, builder))
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

		for (const placeholderName in entityFields) {
			const marker = entityFields[placeholderName]

			if (marker instanceof FieldMarker) {
				const accessor = allData[placeholderName]
				if (accessor instanceof FieldAccessor && accessor.currentValue !== null) {
					builder = builder.set(placeholderName, accessor.currentValue)
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
						builder = builder.one(placeholderName, builder => {
							const { accessor, reference } = accessorReference[0]

							if (accessor.primaryKey === undefined) {
								const innerBuilder = new CrudQueryBuilder.CreateDataBuilder(reference.reducedBy)
								return builder.create(this.registerCreateMutationPart(accessor, reference.fields, innerBuilder))
							} else {
								return builder.connect({ [MutationGenerator.PRIMARY_KEY_NAME]: accessor.primaryKey })
							}
						})
					} else {
						throw new DataBindingError(`Creating several entities for the hasOne '${placeholderName}' relation.`)
					}
				} else {
					builder = builder.many(placeholderName, builder => {
						for (const referencePair of accessorReference) {
							const { accessor, reference } = referencePair

							if (accessor.primaryKey === undefined) {
								const innerBuilder = new CrudQueryBuilder.CreateDataBuilder(reference.reducedBy)
								builder = builder.create(this.registerCreateMutationPart(accessor, reference.fields, innerBuilder))
							} else {
								builder = builder.connect({ [MutationGenerator.PRIMARY_KEY_NAME]: accessor.primaryKey })
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
						builder = builder.one(placeholderName, builder => {
							const { accessor, reference, persistedField } = accessorReference[0]

							if (accessor instanceof EntityAccessor) {
								if (accessor.primaryKey === undefined) {
									const innerBuilder = new CrudQueryBuilder.CreateDataBuilder(reference.reducedBy)
									return builder.create(this.registerCreateMutationPart(accessor, reference.fields, innerBuilder))
								} else {
									const updated = builder.update(builder =>
										this.registerUpdateMutationPart(accessor, reference.fields, persistedField, builder)
									)

									if (
										!persistedField ||
										(persistedField && accessor.primaryKey !== persistedField[MutationGenerator.PRIMARY_KEY_NAME])
									) {
										return updated.connect({
											[MutationGenerator.PRIMARY_KEY_NAME]: accessor.primaryKey
										})
									}
									return updated
								}
							} else if (accessor instanceof EntityForRemovalAccessor) {
								return builder.disconnect()
							} else {
								return assertNever(accessor)
							}
						})
					} else {
						throw new DataBindingError(`Creating several entities for the hasOne '${placeholderName}' relation.`)
					}
				} else {
					builder = builder.many(placeholderName, builder => {
						for (const referencePair of accessorReference) {
							const { accessor, reference, persistedField } = referencePair

							if (accessor instanceof EntityAccessor) {
								if (accessor.primaryKey === undefined) {
									const innerBuilder = new CrudQueryBuilder.CreateDataBuilder(reference.reducedBy)
									builder = builder.create(this.registerCreateMutationPart(accessor, reference.fields, innerBuilder))
								} else {
									builder = builder.update({ [MutationGenerator.PRIMARY_KEY_NAME]: accessor.primaryKey }, builder => {
										return this.registerUpdateMutationPart(accessor, reference.fields, persistedField, builder)
									})

									if (
										!persistedField ||
										(persistedField && accessor.primaryKey !== persistedField[MutationGenerator.PRIMARY_KEY_NAME])
									) {
										builder = builder.connect({
											[MutationGenerator.PRIMARY_KEY_NAME]: accessor.primaryKey
										})
									}
								}
							} else if (accessor instanceof EntityForRemovalAccessor) {
								builder = builder.disconnect({
									[MutationGenerator.PRIMARY_KEY_NAME]: accessor.primaryKey
								})
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

	private primaryKeyToAlias(primaryKey: string): string {
		return `_${primaryKey.replace(/-/g, '')}`
	}
}
