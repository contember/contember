import {
	collectResults,
	MutationCreateOk,
	MutationNoResultError,
	MutationNothingToDo,
	MutationResultList,
	NothingToDoReason,
	RowValues,
} from '../Result'
import { CreateInputVisitor } from '../../inputProcessing'
import { SqlCreateInputProcessor } from './SqlCreateInputProcessor'
import { Mapper } from '../Mapper'
import { Input, Model, Value } from '@contember/schema'
import { acceptEveryFieldVisitor, Providers } from '@contember/schema-utils'
import { InsertBuilderFactory } from './InsertBuilderFactory'
import { InsertBuilder } from './InsertBuilder'
import { tryMutation } from '../ErrorUtils'
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
		// eslint-disable-next-line promise/catch-or-return
		insertBuilder.insert.then(id => id && insertIdCallback(String(id)))

		insertBuilder.addPredicates(Object.keys(data))
		const visitor = new CreateInputVisitor<MutationResultList>(
			new SqlCreateInputProcessor(insertBuilder, mapper, this.providers),
			this.schema,
			data,
		)
		const promises = acceptEveryFieldVisitor<Promise<MutationResultList[]>>(
			this.schema,
			entity,
			visitor,
		)
		builderCb(insertBuilder)

		const okResultFactory = (primary: Value.PrimaryValue, values: RowValues) =>
			new MutationCreateOk([], entity, primary, data, values)
		const insertPromise = this.executeInsert(insertBuilder, mapper, okResultFactory)

		return await collectResults(this.schema, this.schemaDatabaseMetadata, insertPromise, Object.values(promises))
	}

	private async executeInsert(
		insertBuilder: InsertBuilder,
		mapper: Mapper,
		okResultFactory: (primary: Value.PrimaryValue, values: RowValues) => MutationCreateOk,
	): Promise<MutationResultList> {
		return tryMutation(this.schema, this.schemaDatabaseMetadata, async () => {
			const result = await insertBuilder.execute(mapper)
			if (result.aborted) {
				return [new MutationNothingToDo([], NothingToDoReason.aborted)]
			}

			if (result.primaryValue === null) {
				return [new MutationNoResultError([])]
			}
			return [okResultFactory(result.primaryValue, rowDataToFieldValues(result.values))]
		})
	}
}

