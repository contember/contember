import { SqlUpdateInputProcessor } from './SqlUpdateInputProcessor'
import { UpdateInputVisitor } from '../../inputProcessing'
import { Acl, Input, Model } from '@contember/schema'
import { PredicateFactory } from '../../acl'
import { UpdateBuilderFactory } from './UpdateBuilderFactory'
import { Mapper } from '../Mapper'
import { acceptEveryFieldVisitor } from '@contember/schema-utils'
import {
	collectResults,
	MutationNoResultError,
	MutationNothingToDo,
	MutationResultList,
	MutationUpdateOk,
	NothingToDoReason,
	ResultListNotFlatten,
	RowValues,
} from '../Result'
import { UpdateBuilder } from './UpdateBuilder'
import { rowDataToFieldValues } from '../ColumnValue'

export class Updater {
	constructor(
		private readonly schema: Model.Schema,
		private readonly predicateFactory: PredicateFactory,
		private readonly updateBuilderFactory: UpdateBuilderFactory,
	) {}

	public async update(
		mapper: Mapper,
		entity: Model.Entity,
		primaryValue: Input.PrimaryValue,
		data: Input.UpdateDataInput,
		filter?: Input.OptionalWhere,
	): Promise<MutationResultList> {
		const updateBuilder = this.updateBuilderFactory.create(entity, primaryValue)

		const predicateFields = Object.keys(data)
		this.applyPredicates(entity, predicateFields, updateBuilder)

		if (filter) {
			updateBuilder.addOldWhere(filter)
		}

		const updateVisitor = new SqlUpdateInputProcessor(primaryValue, data, updateBuilder, mapper)
		const visitor = new UpdateInputVisitor<MutationResultList>(updateVisitor, this.schema, data)
		const promises = acceptEveryFieldVisitor<Promise<ResultListNotFlatten | undefined>>(this.schema, entity, visitor)

		const okResultFactory = (values: RowValues) => new MutationUpdateOk([], entity, primaryValue, data, values)
		const mutationResultPromise = Updater.executeUpdate(updateBuilder, mapper, okResultFactory)

		return await collectResults(this.schema, mutationResultPromise, Object.values(promises))
	}

	public async updateCb(
		mapper: Mapper,
		entity: Model.Entity,
		primaryValue: Input.PrimaryValue,
		predicateFields: string[],
		builderCb: (builder: UpdateBuilder) => void,
	): Promise<MutationResultList> {
		const updateBuilder = this.updateBuilderFactory.create(entity, primaryValue)
		this.applyPredicates(entity, predicateFields, updateBuilder)

		const okResultFactory = (values: RowValues) => new MutationUpdateOk([], entity, primaryValue, {}, values)
		builderCb(updateBuilder)

		return Updater.executeUpdate(updateBuilder, mapper, okResultFactory)
	}

	private applyPredicates(entity: Model.Entity, predicateFields: string[], updateBuilder: UpdateBuilder): void {
		const predicateWhere = this.predicateFactory.create(entity, Acl.Operation.update, predicateFields)
		updateBuilder.addOldWhere(predicateWhere)
		updateBuilder.addNewWhere(predicateWhere)
	}

	private static async executeUpdate(
		updateBuilder: UpdateBuilder,
		mapper: Mapper,
		okResultFactory: (values: RowValues) => MutationUpdateOk,
	): Promise<MutationResultList> {
		const result = await updateBuilder.execute(mapper)
		if (result.aborted) {
			return [new MutationNothingToDo([], NothingToDoReason.aborted)]
		}
		if (!result.executed) {
			return [new MutationNothingToDo([], NothingToDoReason.noData)]
		}
		if (result.affectedRows !== 1) {
			return [new MutationNoResultError([])]
		}
		return [okResultFactory(rowDataToFieldValues(result.values))]
	}
}

export const AbortUpdate = Symbol('AbortUpdate')
export type AbortUpdate = typeof AbortUpdate
