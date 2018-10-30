import { CrudQueryBuilder } from 'cms-client'
import { assertNever } from 'cms-common'
import { EntityName, ReceivedData, ReceivedEntityData } from '../bindingTypes'
import AccessorTreeRoot, { RootAccessor } from '../dao/AccessorTreeRoot'
import EntityAccessor from '../dao/EntityAccessor'
import EntityCollectionAccessor from '../dao/EntityCollectionAccessor'
import EntityForRemovalAccessor from '../dao/EntityForRemovalAccessor'
import FieldAccessor from '../dao/FieldAccessor'

type Queries = 'get' | 'list'
type QueryBuilder = Pick<CrudQueryBuilder.CrudQueryBuilder, Exclude<keyof CrudQueryBuilder.CrudQueryBuilder, Queries>>

export default class MutationGenerator {
	private static readonly PRIMARY_KEY_NAME = 'id'

	private createCounter: number = 0

	public constructor(private persistedData: any, private currentData: AccessorTreeRoot) {}

	public getPersistMutation(): string | undefined {
		try {
			const builder = this.addSubMutation(
				this.persistedData ? this.persistedData[this.currentData.id] : undefined,
				this.currentData.entityName,
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
		entity: RootAccessor,
		queryBuilder?: QueryBuilder
	): QueryBuilder {
		if (!queryBuilder) {
			queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}

		if (entity instanceof EntityAccessor) {
			if (entity.primaryKey === undefined) {
				queryBuilder = this.addCreateMutation(entity, entityName, queryBuilder)
			} else if (data && !Array.isArray(data)) {
				queryBuilder = this.addUpdateMutation(entity, entityName, data, queryBuilder)
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

				return builder.data(builder => this.registerUpdateMutationPart(entity, data, builder))
			},
			`update${entityName}_${this.primaryKeyToAlias(primaryKey)}`
		)
	}

	private addCreateMutation(entity: EntityAccessor, entityName: EntityName, queryBuilder?: QueryBuilder): QueryBuilder {
		if (!queryBuilder) {
			queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}

		return queryBuilder.create(
			`create${entityName}`,
			builder => {
				builder = builder.column(MutationGenerator.PRIMARY_KEY_NAME)

				return builder.data(builder => this.registerCreateMutationPart(entity, builder))
			},
			`create${entityName}_${(this.createCounter++).toFixed(0)}`
		)
	}

	private registerCreateMutationPart(
		currentData: EntityAccessor,
		builder: CrudQueryBuilder.CreateDataBuilder
	): CrudQueryBuilder.CreateDataBuilder {
		const allData = currentData.data.allFieldData
		for (const placeholderName in allData) {
			const accessor = allData[placeholderName]

			if (accessor instanceof FieldAccessor) {
				if (accessor.currentValue !== null) {
					builder = builder.set(placeholderName, accessor.currentValue)
				}
			} else if (accessor instanceof EntityAccessor) {
				builder = builder.one(placeholderName, builder => {
					return builder.create(builder => {
						return this.registerCreateMutationPart(accessor, builder)
					})
				})
			} else if (accessor instanceof EntityCollectionAccessor) {
				builder = builder.many(placeholderName, builder => {
					for (let i = 0, entityCount = accessor.entities.length; i < entityCount; i++) {
						const innerAccessor = accessor.entities[i]

						if (innerAccessor instanceof EntityAccessor) {
							builder = builder.create(builder => {
								return this.registerCreateMutationPart(innerAccessor, builder)
							})
						} else if (innerAccessor instanceof EntityForRemovalAccessor) {
							// Do nothing
						} else if (innerAccessor === undefined) {
							// Do nothing
						} else {
							assertNever(innerAccessor)
						}
					}
					return builder
				})
			} else if (accessor instanceof EntityForRemovalAccessor) {
				// Do nothing: this should never happen.
			} else if (accessor instanceof AccessorTreeRoot) {
				// Do nothing: we don't support persisting nested queries (yet?).
			} else if (accessor === undefined) {
				// Do nothing.
			} else {
				assertNever(accessor)
			}
		}

		return builder
	}

	private registerUpdateMutationPart(
		currentData: EntityAccessor,
		persistedData: ReceivedEntityData<undefined>,
		builder: CrudQueryBuilder.UpdateDataBuilder
	): CrudQueryBuilder.UpdateDataBuilder {
		const allData = currentData.data.allFieldData
		for (const placeholderName in allData) {
			const persistedField = persistedData ? persistedData[placeholderName] : undefined
			const accessor = allData[placeholderName]

			if (accessor instanceof FieldAccessor) {
				if (persistedField !== accessor.currentValue && persistedField !== undefined) {
					builder = builder.set(placeholderName, accessor.currentValue)
				}
			} else if (accessor instanceof EntityAccessor) {
				if (persistedField && typeof persistedField === 'object' && !Array.isArray(persistedField)) {
					builder = builder.one(placeholderName, builder => {
						if (accessor.primaryKey === undefined) {
							return builder.create(builder => {
								return this.registerCreateMutationPart(accessor, builder)
							})
						}
						return builder.connect({ [MutationGenerator.PRIMARY_KEY_NAME]: accessor.primaryKey }).update(builder => {
							return this.registerUpdateMutationPart(accessor, persistedField, builder)
						})
					})
				}
			} else if (accessor instanceof EntityCollectionAccessor) {
				if (Array.isArray(persistedField)) {
					builder = builder.many(placeholderName, builder => {
						for (let i = 0, entityCount = accessor.entities.length; i < entityCount; i++) {
							const innerAccessor = accessor.entities[i]

							if (innerAccessor instanceof EntityAccessor) {
								if (innerAccessor.primaryKey === undefined) {
									builder = builder.create(builder => {
										return this.registerCreateMutationPart(innerAccessor, builder)
									})
								} else {
									builder = builder.update(
										{
											[MutationGenerator.PRIMARY_KEY_NAME]: innerAccessor.primaryKey
										},
										builder => {
											return this.registerUpdateMutationPart(innerAccessor, persistedField[i], builder)
										}
									)
								}
							} else if (innerAccessor instanceof EntityForRemovalAccessor) {
								builder = builder.disconnect({
									[MutationGenerator.PRIMARY_KEY_NAME]: innerAccessor.primaryKey
								})
							} else if (innerAccessor === undefined) {
								// Do nothing
							} else {
								assertNever(innerAccessor)
							}
						}
						return builder
					})
				}
			} else if (accessor instanceof EntityForRemovalAccessor) {
				builder = builder.one(placeholderName, builder => {
					return builder.disconnect()
				})
			} else if (accessor instanceof AccessorTreeRoot) {
				// Do nothing: we don't support persisting nested queries (yet?).
			} else if (accessor === undefined) {
				// Do nothing.
			} else {
				assertNever(accessor)
			}
		}

		return builder
	}

	private primaryKeyToAlias(primaryKey: string): string {
		return `_${primaryKey.replace(/-/g, '')}`
	}
}
