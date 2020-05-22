import {
	collectResults,
	MutationCreateOk,
	MutationNoResultError,
	MutationResultList,
	RowValues,
	MutationNothingToDo,
	NothingToDoReason,
} from '../Result'
import { CreateInputVisitor } from '../../inputProcessing'
import SqlCreateInputProcessor from './SqlCreateInputProcessor'
import Mapper from '../Mapper'
import { Acl, Input, Model, Value } from '@contember/schema'
import { acceptEveryFieldVisitor, Providers } from '@contember/schema-utils'
import PredicateFactory from '../../acl/PredicateFactory'
import InsertBuilderFactory from './InsertBuilderFactory'
import { Client } from '@contember/database'
import InsertBuilder from './InsertBuilder'
import { tryMutation } from '../ErrorUtils'
import { rowDataToFieldValues } from '../ColumnValue'

export class Inserter {
	constructor(
		private readonly schema: Model.Schema,
		private readonly predicateFactory: PredicateFactory,
		private readonly insertBuilderFactory: InsertBuilderFactory,
		private readonly providers: Providers,
	) {}

	public async insert(
		mapper: Mapper,
		entity: Model.Entity,
		data: Input.CreateDataInput,
		pushId: (id: string) => void,
	): Promise<MutationResultList> {
		const where = this.predicateFactory.create(entity, Acl.Operation.create, Object.keys(data))
		const insertBuilder = this.insertBuilderFactory.create(entity)
		insertBuilder.insert.then(id => id && pushId(String(id)))

		insertBuilder.addWhere(where)

		const visitor = new CreateInputVisitor<MutationResultList>(
			new SqlCreateInputProcessor(insertBuilder, mapper, this.providers),
			this.schema,
			data,
		)
		const promises = acceptEveryFieldVisitor<Promise<MutationResultList | MutationResultList[] | undefined>>(
			this.schema,
			entity,
			visitor,
		)

		const okResultFactory = (primary: Value.PrimaryValue, values: RowValues) =>
			new MutationCreateOk([], entity, primary, data, values)
		const insertPromise = this.executeInsert(insertBuilder, mapper.db, okResultFactory)

		return await collectResults([insertPromise, ...Object.values(promises)])
	}

	private async executeInsert(
		insertBuilder: InsertBuilder,
		db: Client,
		okResultFactory: (primary: Value.PrimaryValue, values: RowValues) => MutationCreateOk,
	): Promise<MutationResultList> {
		return tryMutation(async () => {
			try {
				const result = await insertBuilder.execute(db)

				if (result.primaryValue === null) {
					return [new MutationNoResultError([])]
				}
				return [okResultFactory(result.primaryValue, rowDataToFieldValues(result.values))]
			} catch (e) {
				if (e instanceof AbortInsert) {
					return [new MutationNothingToDo([], NothingToDoReason.aborted)]
				}
				throw e
			}
		})
	}
}

export class AbortInsert {}
