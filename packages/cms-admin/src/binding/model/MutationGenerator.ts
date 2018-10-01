import { CrudQueryBuilder, GraphQlBuilder } from 'cms-client'
import { assertNever, Input } from 'cms-common'
import { ReceivedData, ReceivedEntityData } from '../bindingTypes'
import AccessorTreeRoot, { RootAccessor } from '../dao/AccessorTreeRoot'
import EntityAccessor from '../dao/EntityAccessor'
import EntityCollectionAccessor from '../dao/EntityCollectionAccessor'
import EntityForRemovalAccessor from '../dao/EntityForRemovalAccessor'
import FieldAccessor from '../dao/FieldAccessor'

type Queries = 'get' | 'list'
type QueryBuilder = Pick<CrudQueryBuilder.CrudQueryBuilder, Exclude<keyof CrudQueryBuilder.CrudQueryBuilder, Queries>>

export default class MutationGenerator {
	private static readonly PRIMARY_KEY_NAME = 'id'

	public constructor(private persistedData: any, private currentData: AccessorTreeRoot) {}

	public getPersistMutation(): string {
		const builder = this.addSubMutation(this.persistedData[this.currentData.id], this.currentData.root)
		return builder.getGql()
	}

	private addSubMutation(data: ReceivedData, entity: RootAccessor, queryBuilder?: QueryBuilder): QueryBuilder {
		if (!queryBuilder) {
			queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}

		if (entity instanceof EntityAccessor) {
			if (entity.primaryKey === undefined) {
				queryBuilder = this.addCreateMutation(entity, queryBuilder)
			} else if (!Array.isArray(data)) {
				queryBuilder = this.addUpdateMutation(entity, data, queryBuilder)
			}
		} else if (entity instanceof EntityForRemovalAccessor) {
			queryBuilder = this.addDeleteMutation(entity, queryBuilder)
		} else if (entity instanceof EntityCollectionAccessor) {
			if (Array.isArray(data)) {
				const entityCount = entity.entities.length

				for (let entityI = 0, dataI = 0; entityI < entityCount; entityI++) {
					const currentEntity = entity.entities[entityI]

					if (currentEntity instanceof EntityAccessor || currentEntity instanceof EntityForRemovalAccessor) {
						queryBuilder = this.addSubMutation(data[dataI++], currentEntity, queryBuilder)
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

	private addDeleteMutation(entity: EntityForRemovalAccessor, queryBuilder?: QueryBuilder): QueryBuilder {
		if (!queryBuilder) {
			queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}

		return queryBuilder.delete(
			`delete${entity.entityName}`,
			builder => {
				builder = builder.column(MutationGenerator.PRIMARY_KEY_NAME)
				return builder.where({ [MutationGenerator.PRIMARY_KEY_NAME]: entity.primaryKey })
			},
			`delete${entity.entityName}_${entity.primaryKey}`,
		)
	}

	private addUpdateMutation(
		entity: EntityAccessor,
		data: ReceivedEntityData,
		queryBuilder?: QueryBuilder,
	): QueryBuilder {
		if (!queryBuilder) {
			queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}

		return queryBuilder.update(`update${entity.entityName}`, builder => {
			if (!entity.primaryKey) {
				return builder
			}

			builder = builder.column(MutationGenerator.PRIMARY_KEY_NAME)
			builder = builder.where({ [MutationGenerator.PRIMARY_KEY_NAME]: entity.primaryKey })

			return builder.data(builder => this.registerUpdateMutationPart(entity, data, builder))
		})
	}

	private addCreateMutation(entity: EntityAccessor, queryBuilder?: QueryBuilder): QueryBuilder {
		if (!queryBuilder) {
			queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()
		}

		return queryBuilder.create(`create${entity.entityName}`, builder => {
			builder = builder.column(MutationGenerator.PRIMARY_KEY_NAME)
			console.log('top-level create')
			return builder // TODO
		})
	}

	private registerCreateMutationPart(
		currentData: EntityAccessor,
		builder: CrudQueryBuilder.CreateDataBuilder,
	): CrudQueryBuilder.CreateDataBuilder {
		console.log('inner create')
		return builder
	}

	private registerUpdateMutationPart(
		currentData: EntityAccessor,
		persistedData: ReceivedEntityData,
		builder: CrudQueryBuilder.UpdateDataBuilder,
	): CrudQueryBuilder.UpdateDataBuilder {
		for (const fieldName in persistedData) {
			const persistedField = persistedData[fieldName]
			const accessor = currentData.data[fieldName]

			if (accessor instanceof FieldAccessor) {
				if (persistedField !== accessor.currentValue) {
					builder = builder.set(fieldName, accessor.currentValue)
				}
			} else if (accessor instanceof EntityAccessor) {
				if (persistedField && typeof persistedField === 'object' && !Array.isArray(persistedField)) {
					builder = builder.one(fieldName, builder => {
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
					builder = builder.many(fieldName, builder => {
						for (let i = 0, entityCount = accessor.entities.length; i < entityCount; i++) {
							const innerAccessor = accessor.entities[i]

							if (innerAccessor instanceof EntityAccessor) {
								if (innerAccessor.primaryKey) {
									builder = builder.update(
										{
											[MutationGenerator.PRIMARY_KEY_NAME]: innerAccessor.primaryKey,
										},
										builder => {
											return this.registerUpdateMutationPart(innerAccessor, persistedField[i], builder)
										},
									)
								}
							} else if (innerAccessor instanceof EntityForRemovalAccessor) {
								builder = builder.disconnect({
									[MutationGenerator.PRIMARY_KEY_NAME]: innerAccessor.primaryKey,
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
				builder = builder.one(fieldName, builder => {
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
}
