import SqlUpdateInputProcessor from './SqlUpdateInputProcessor'
import { UniqueWhereExpander, UpdateInputVisitor } from '../../inputProcessing'
import { Acl, Input, Model } from '@contember/schema'
import PredicateFactory from '../../acl/PredicateFactory'
import UpdateBuilderFactory from './UpdateBuilderFactory'
import Mapper from '../Mapper'
import { acceptEveryFieldVisitor } from '@contember/schema-utils'
import { Client } from '@contember/database'
import {
	collectResults,
	MutationEntryNotFoundError,
	MutationNoResultError,
	MutationNothingToDo,
	MutationResultList,
	MutationUpdateOk,
	NothingToDoReason,
	ResultListNotFlatten,
	RowValues,
} from '../Result'
import UpdateBuilder from './UpdateBuilder'
import { rowDataToFieldValues } from '../ColumnValue'

export class Updater {
	constructor(
		private readonly schema: Model.Schema,
		private readonly predicateFactory: PredicateFactory,
		private readonly updateBuilderFactory: UpdateBuilderFactory,
		private readonly uniqueWhereExpander: UniqueWhereExpander,
	) {}

	public async update(
		mapper: Mapper,
		entity: Model.Entity,
		by: Input.UniqueWhere,
		data: Input.UpdateDataInput,
		filter?: Input.Where,
	): Promise<MutationResultList> {
		const primaryValue = await mapper.getPrimaryValue(entity, by)

		if (primaryValue === undefined) {
			return [new MutationEntryNotFoundError([], by)]
		}

		const uniqueWhere = this.uniqueWhereExpander.expand(entity, by)
		const updateBuilder = this.updateBuilderFactory.create(entity, uniqueWhere)

		const predicateWhere = this.predicateFactory.create(entity, Acl.Operation.update, Object.keys(data))
		updateBuilder.addOldWhere(predicateWhere)
		if (filter) {
			updateBuilder.addOldWhere(filter)
		}
		updateBuilder.addNewWhere(predicateWhere)

		const updateVisitor = new SqlUpdateInputProcessor(primaryValue, data, updateBuilder, mapper)
		const visitor = new UpdateInputVisitor<MutationResultList>(updateVisitor, this.schema, data)
		const promises = acceptEveryFieldVisitor<Promise<ResultListNotFlatten | undefined>>(this.schema, entity, visitor)

		const okResultFactory = (values: RowValues) => new MutationUpdateOk([], entity, primaryValue, data, values)
		const mutationResultPromise = Updater.executeUpdate(updateBuilder, mapper.db, okResultFactory)

		return await collectResults([mutationResultPromise, ...Object.values(promises)])
	}

	private static async executeUpdate(
		updateBuilder: UpdateBuilder,
		db: Client,
		okResultFactory: (values: RowValues) => MutationUpdateOk,
	): Promise<MutationResultList> {
		try {
			const result = await updateBuilder.execute(db)
			if (!result.executed) {
				return [new MutationNothingToDo([], NothingToDoReason.noData)]
			}
			if (result.affectedRows !== 1) {
				return [new MutationNoResultError([])]
			}
			return [okResultFactory(rowDataToFieldValues(result.values))]
		} catch (e) {
			if (e instanceof AbortUpdate) {
				return [new MutationNothingToDo([], NothingToDoReason.aborted)]
			}
			throw e
		}
	}
}

export class AbortUpdate {}
