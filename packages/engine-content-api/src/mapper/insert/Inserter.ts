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
import { Acl, Input, Model, Value } from '@contember/schema'
import { acceptEveryFieldVisitor, Providers } from '@contember/schema-utils'
import { PredicateFactory } from '../../acl'
import { InsertBuilderFactory } from './InsertBuilderFactory'
import { Client } from '@contember/database'
import { InsertBuilder } from './InsertBuilder'
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
		// eslint-disable-next-line promise/catch-or-return
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
		const insertPromise = this.executeInsert(insertBuilder, mapper, okResultFactory)

		return await collectResults(this.schema, insertPromise, Object.values(promises))
	}

	private async executeInsert(
		insertBuilder: InsertBuilder,
		mapper: Mapper,
		okResultFactory: (primary: Value.PrimaryValue, values: RowValues) => MutationCreateOk,
	): Promise<MutationResultList> {
		return tryMutation(this.schema, async () => {
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

export const AbortInsert = Symbol('AbortInsert')
export type AbortInsert = typeof AbortInsert
