import { MutationCreateOk, MutationNoResultError, MutationNothingToDo, MutationResultList, NothingToDoReason } from '../Result'
import { CreateInputVisitor } from '../../inputProcessing'
import { SqlCreateInputProcessor, SqlCreateInputProcessorResult } from './SqlCreateInputProcessor'
import { Mapper } from '../Mapper'
import { Input, Model } from '@contember/schema'
import { acceptFieldVisitor, Providers } from '@contember/schema-utils'
import { InsertBuilderFactory } from './InsertBuilderFactory'
import { InsertBuilder } from './InsertBuilder'
import { rowDataToFieldValues } from '../ColumnValue'
import { DatabaseMetadata } from '@contember/database'

export class Inserter {
	constructor(
		private readonly schema: Model.Schema,
		private readonly schemaDatabaseMetadata: DatabaseMetadata,
		private readonly insertBuilderFactory: InsertBuilderFactory,
		private readonly providers: Providers,
	) {}

	public async insert(
		mapper: Mapper,
		entity: Model.Entity,
		data: Input.CreateDataInput,
		insertIdCallback: (id: string) => void,
		builderCb: (builder: InsertBuilder) => void,
	): Promise<MutationResultList> {
		const insertBuilder = this.insertBuilderFactory.create(entity)

		insertBuilder.addPredicates(Object.keys(data))

		const visitor = new CreateInputVisitor<SqlCreateInputProcessorResult>(
			new SqlCreateInputProcessor(insertBuilder, mapper, this.providers),
			this.schema,
			data,
		)

		const resultList: MutationResultList = []
		const postInserts: Exclude<SqlCreateInputProcessorResult, MutationResultList>[] = []

		const keys = new Set([
			entity.primary,
			...Object.keys(data),
			...Object.keys(entity.fields),
		])

		for (const key of keys.values()) {
			const resultSet = await acceptFieldVisitor(
				this.schema,
				entity,
				key,
				visitor,
			)
			for (const result of resultSet) {
				if (typeof result === 'function') {
					postInserts.push(result)
				} else {
					for (const resultItem of await result) {
						resultList.push(resultItem)
						if (resultItem.error) {
							return resultList
						}
					}
				}
			}
		}

		builderCb(insertBuilder)
		const insertResult = await insertBuilder.execute(mapper)

		if (insertResult.primaryValue === null) {
			return [new MutationNoResultError([]), ...resultList]
		}
		insertIdCallback(String(insertResult.primaryValue))

		const okResult = new MutationCreateOk([], entity, insertResult.primaryValue, data, rowDataToFieldValues(insertResult.values))
		resultList.unshift(okResult)

		for (const postInsert of postInserts) {
			const postInsertResult = await postInsert({ primary: insertResult.primaryValue })
			for (const result of postInsertResult) {
				resultList.push(result)
				if (result.error) {
					return resultList
				}
			}
		}

		return resultList
	}
}

