import { CrudQueryBuilder } from 'cms-client'
import * as GraphQlBuilder from 'cms-client/dist/src/graphQlBuilder'
import { Input } from 'cms-common'
import { DataContextValue } from '../coreComponents/DataContext'
import EntityAccessor, { FieldData } from '../dao/EntityAccessor'
import FieldAccessor from '../dao/FieldAccessor'

export default class PersistQueryGenerator {
	private static PRIMARY_KEY_NAME = 'id'

	public constructor(private persistedData: any, private currentData: EntityAccessor) {}

	public generatePersistQuery(): string | undefined {
		const accessor = this.currentData
		const crudQueryBuilder = new CrudQueryBuilder.CrudQueryBuilder()

		if (accessor.primaryKey === undefined) {
			return crudQueryBuilder
				.create(`create${accessor.entityName}`, builder => {
					return builder.data(builder => this.attachCreateQueryPart(this.currentData, builder))
				})
				.getGql()
		}

		return crudQueryBuilder
			.update(`update${accessor.entityName}`, builder => {
				if (accessor.where) {
					builder = builder.where(accessor.where as Input.UniqueWhere<GraphQlBuilder.Literal>)
				}

				return builder.data(builder =>
					this.attachUpdateQueryPart(this.persistedData[accessor.entityName], this.currentData, builder)
				)
			})
			.getGql()
	}

	private attachCreateQueryPart(
		currentData: EntityAccessor,
		builder: CrudQueryBuilder.CreateDataBuilder
	): CrudQueryBuilder.CreateDataBuilder {
		return builder
	}

	private attachUpdateQueryPart(
		persistedData: any,
		currentData: EntityAccessor,
		builder: CrudQueryBuilder.UpdateDataBuilder
	): CrudQueryBuilder.UpdateDataBuilder {
		console.log('aa', persistedData, currentData)

		for (const fieldName in persistedData) {
			const persistedField = persistedData[fieldName]
			const accessor = currentData.data[fieldName]

			if (typeof persistedField === 'string') {
				if (accessor instanceof FieldAccessor && persistedField !== accessor.currentValue) {
					builder = builder.set(fieldName, accessor.currentValue)
				}
			} else if (Array.isArray(persistedField)) {
				builder = builder.many(fieldName, builder => {
					const innerAccessor = Array.isArray(accessor) ? accessor : []

					for (const field of persistedField) {
						const persistedId = field[PersistQueryGenerator.PRIMARY_KEY_NAME]
						const currentById = innerAccessor.find(
							element => element instanceof EntityAccessor && element.primaryKey === persistedId
						)

						if (currentById) {
							//builder = builder.update(innerAccessor)
						} else {
							builder = builder.disconnect({ [PersistQueryGenerator.PRIMARY_KEY_NAME]: persistedId })
						}
					}

					return builder
				})
			} else if (typeof persistedField === 'object') {
				if (accessor === undefined) {
					builder = builder.one(fieldName, builder => {
						return builder.disconnect()
					})
				} else if (accessor instanceof EntityAccessor) {
					builder = builder.one(fieldName, builder => {
						if (accessor.primaryKey !== undefined) {
							return builder
								.connect({ [PersistQueryGenerator.PRIMARY_KEY_NAME]: accessor.primaryKey })
								.update(builder => {
									return this.attachUpdateQueryPart(persistedField, accessor, builder)
								})
						}
						return builder.create(builder => {
							return this.attachCreateQueryPart(accessor, builder)
						})
					})
				}
			} else {
				// If the reference was undefined but we've added it, we need to insert the rows from here
				/*


				 */
			}
		}

		return builder
	}
}
