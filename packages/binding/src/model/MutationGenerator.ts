import { CrudQueryBuilder, GraphQlBuilder } from '@contember/client'
import { Input } from '@contember/schema'
import { EntityAccessor, EntityForRemovalAccessor, EntityListAccessor, FieldAccessor, RootAccessor } from '../accessors'
import { ReceivedData, ReceivedEntityData } from '../accessorTree'
import { PRIMARY_KEY_NAME, TYPENAME_KEY_NAME } from '../bindingTypes'
import { BindingError } from '../BindingError'
import {
	ConnectionMarker,
	EntityFields,
	FieldMarker,
	MarkerTreeParameters,
	MarkerTreeRoot,
	ReferenceMarker,
} from '../markers'
import { ExpectedEntityCount, FieldValue, UniqueWhere } from '../treeParameters'
import { assertNever, isEmptyObject } from '../utils'
import { AliasTransformer } from './AliasTransformer'

type QueryBuilder = Omit<CrudQueryBuilder.CrudQueryBuilder, CrudQueryBuilder.Queries>

export class MutationGenerator {
	public constructor(
		private persistedData: any,
		private currentData: RootAccessor,
		private markerTree: MarkerTreeRoot,
	) {}

	public getPersistMutation(): string | undefined {
		try {
			const builder = this.addSubMutation(
				this.persistedData ? this.persistedData[this.markerTree.id] : undefined,
				this.markerTree.fields,
				this.currentData,
				this.markerTree.id,
				this.markerTree.parameters,
			)
			return builder.getGql()
		} catch (e) {
			return undefined
		}
	}

	private addSubMutation(
		data: ReceivedData<undefined>,
		entityFields: EntityFields,
		entity: RootAccessor,
		alias: string,
		parameters: MarkerTreeParameters,
		queryBuilder?: QueryBuilder,
	): QueryBuilder {
		if (!queryBuilder) {
			queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}

		if (entity instanceof EntityAccessor) {
			if (!entity.isPersisted) {
				queryBuilder = this.addCreateMutation(entity, entityFields, alias, parameters, queryBuilder)
			} else if (data && !Array.isArray(data)) {
				queryBuilder = this.addUpdateMutation(entity, entityFields, data, alias, parameters, queryBuilder)
			}
		} else if (entity instanceof EntityForRemovalAccessor) {
			queryBuilder = this.addDeleteMutation(entity, alias, parameters, queryBuilder)
		} else if (entity instanceof EntityListAccessor) {
			if (Array.isArray(data) || data === undefined) {
				data = data || []
				let i = 0
				for (const currentEntity of entity) {
					queryBuilder = this.addSubMutation(
						data[i++], // Deliberately using that this may evaluate to undefined
						entityFields,
						currentEntity,
						AliasTransformer.joinAliasSections(alias, AliasTransformer.entityToAlias(currentEntity)),
						parameters,
						queryBuilder,
					)
				}
			}
		} else {
			assertNever(entity)
		}

		return queryBuilder
	}

	private addDeleteMutation(
		entity: EntityForRemovalAccessor,
		alias: string,
		parameters: MarkerTreeParameters,
		queryBuilder?: QueryBuilder,
	): QueryBuilder {
		if (!queryBuilder) {
			queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}

		return queryBuilder.delete(
			parameters.entityName,
			builder => {
				let where = {}
				if (parameters && parameters.type === 'unique') {
					where = parameters.where
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
		entityFields: EntityFields,
		data: ReceivedEntityData<undefined>,
		alias: string,
		parameters: MarkerTreeParameters,
		queryBuilder?: QueryBuilder,
	): QueryBuilder {
		if (!queryBuilder) {
			queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}

		const runtimeId = entity.runtimeId

		if (runtimeId instanceof EntityAccessor.UnpersistedEntityId || !data) {
			return queryBuilder
		}

		return queryBuilder.update(
			parameters.entityName,
			builder => {
				let where = {}
				if (parameters && parameters.type === 'unique') {
					where = parameters.where
				}

				return builder
					.data(builder => this.registerUpdateMutationPart(entity, entityFields, data, builder))
					.by({ ...where, [PRIMARY_KEY_NAME]: runtimeId })
					.node(builder => builder.column(PRIMARY_KEY_NAME))
					.ok()
					.validation()
			},
			alias,
		)
	}

	private addCreateMutation(
		entity: EntityAccessor,
		entityFields: EntityFields,
		alias: string,
		parameters: MarkerTreeParameters,
		queryBuilder?: QueryBuilder,
	): QueryBuilder {
		if (!queryBuilder) {
			queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}

		return queryBuilder.create(
			parameters.entityName,
			builder => {
				let writeBuilder = this.registerCreateMutationPart(
					entity,
					entityFields,
					new CrudQueryBuilder.WriteDataBuilder(),
				)
				if (
					parameters &&
					parameters.type === 'unique' &&
					writeBuilder.data !== undefined &&
					!isEmptyObject(writeBuilder.data)
				) {
					// Shallow cloning the parameters like this IS too naïve but it will likely last surprisingly long before we
					// run into issues.
					writeBuilder = new CrudQueryBuilder.WriteDataBuilder({ ...writeBuilder.data, ...parameters.where })
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
		const allData = currentData.fieldData
		const nonbearingFields: Array<{
			placeholderName: string
			value: FieldValue
		}> = []
		const nonbearingConnections: ConnectionMarker[] = []

		for (const [placeholderName, marker] of entityFields) {
			if (placeholderName === PRIMARY_KEY_NAME || placeholderName === TYPENAME_KEY_NAME) {
				continue
			}
			if (marker instanceof FieldMarker) {
				const accessor = allData.get(placeholderName)
				if (accessor instanceof FieldAccessor) {
					const resolvedValue = accessor.resolvedValue

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
					accessor: EntityAccessor
					reference: ReferenceMarker.Reference
				}> = []

				for (const referencePlaceholder in references) {
					const reference = references[referencePlaceholder]
					const accessor = allData.get(reference.placeholderName)

					if (reference.expectedCount === ExpectedEntityCount.UpToOne) {
						if (accessor instanceof EntityAccessor) {
							accessorReference.push({ accessor, reference, alias: referencePlaceholder })

							if (reference.reducedBy === undefined) {
								unreducedHasOnePresent = true
							}
						}
					} else if (reference.expectedCount === ExpectedEntityCount.PossiblyMany) {
						if (accessor instanceof EntityListAccessor) {
							for (const innerAccessor of accessor) {
								if (innerAccessor instanceof EntityAccessor) {
									accessorReference.push({
										accessor: innerAccessor,
										reference,
										alias: AliasTransformer.entityToAlias(innerAccessor),
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
						const { accessor, reference } = accessorReference[0]

						if (!accessor.primaryKey) {
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
						throw new BindingError(`Creating several entities for the hasOne '${placeholderName}' relation.`)
					}
				} else {
					builder = builder.many(placeholderName, builder => {
						for (const referencePair of accessorReference) {
							const { alias, accessor, reference } = referencePair

							if (!accessor.primaryKey) {
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
		const allData = currentData.fieldData

		for (const [placeholderName, marker] of entityFields) {
			if (placeholderName === PRIMARY_KEY_NAME || placeholderName === TYPENAME_KEY_NAME) {
				continue
			}
			if (marker instanceof FieldMarker) {
				const accessor = allData.get(placeholderName)
				const persistedValue = persistedData ? persistedData[placeholderName] : undefined

				if (accessor instanceof FieldAccessor && persistedValue !== undefined) {
					const resolvedValue = accessor.resolvedValue
					if (persistedValue !== resolvedValue) {
						builder = builder.set(placeholderName, resolvedValue)
					}
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
					const accessor = allData.get(reference.placeholderName)
					const persistedField = persistedData ? persistedData[reference.placeholderName] : undefined

					if (reference.expectedCount === ExpectedEntityCount.UpToOne) {
						if (
							(accessor instanceof EntityAccessor || accessor instanceof EntityForRemovalAccessor) &&
							((persistedField !== null && typeof persistedField === 'object' && !Array.isArray(persistedField)) ||
								persistedField === undefined ||
								persistedField === null)
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
					} else if (reference.expectedCount === ExpectedEntityCount.PossiblyMany) {
						if (
							accessor instanceof EntityListAccessor &&
							(Array.isArray(persistedField) || persistedField === undefined || persistedField === null)
						) {
							let i = 0
							for (const innerAccessor of accessor) {
								const innerField = persistedField ? persistedField[i] : undefined
								accessorReference.push({
									accessor: innerAccessor,
									reference,
									persistedField: innerField,
									alias: AliasTransformer.entityToAlias(innerAccessor),
								})
								i++
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
								if (!accessor.primaryKey) {
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

								if (removalType === 'delete') {
									return builder.delete()
								} else if (removalType === 'disconnect') {
									return builder.disconnect()
								}
								assertNever(removalType)
							}
							assertNever(accessor)
						})(CrudQueryBuilder.WriteOneRelationBuilder.instantiate<CrudQueryBuilder.WriteOperation.Update>())

						if (subBuilder.data) {
							builder = builder.one(placeholderName, subBuilder)
						}
					} else {
						throw new BindingError(`Creating several entities for the hasOne '${placeholderName}' relation.`)
					}
				} else {
					builder = builder.many(placeholderName, builder => {
						for (const referencePair of accessorReference) {
							const { accessor, reference, persistedField, alias } = referencePair

							if (accessor instanceof EntityAccessor) {
								if (!accessor.primaryKey) {
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

								if (removalType === 'delete') {
									builder = builder.delete({ [PRIMARY_KEY_NAME]: accessor.primaryKey }, alias)
								} else if (removalType === 'disconnect') {
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
}
