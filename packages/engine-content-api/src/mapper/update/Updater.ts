import { SqlUpdateInputProcessor, SqlUpdateInputProcessorResult } from './SqlUpdateInputProcessor'
import { UpdateInputVisitor } from '../../inputProcessing'
import { Input, Model } from '@contember/schema'
import { UpdateBuilderFactory } from './UpdateBuilderFactory'
import { Mapper } from '../Mapper'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { MutationEntryNotFoundError, MutationNoResultError, MutationNothingToDo, MutationResultList, MutationUpdateOk, NothingToDoReason } from '../Result'
import { UpdateBuilder } from './UpdateBuilder'
import { rowDataToFieldValues } from '../ColumnValue'
import { MapperInput } from '../types'

export class Updater {
	constructor(
		private readonly schema: Model.Schema,
		private readonly updateBuilderFactory: UpdateBuilderFactory,
	) {}

	public async update(
		mapper: Mapper,
		entity: Model.Entity,
		primaryValue: Input.PrimaryValue,
		data: MapperInput.UpdateDataInput,
		filter?: Input.OptionalWhere,
	): Promise<MutationResultList> {
		const updateBuilder = this.updateBuilderFactory.create(entity, primaryValue)

		const predicateFields = Object.keys(data)
		updateBuilder.addPredicates(predicateFields)
		if (filter && Object.keys(filter).length > 0) {
			updateBuilder.addOldWhere(filter)
		}

		const visitor = new UpdateInputVisitor<SqlUpdateInputProcessorResult>(
			new SqlUpdateInputProcessor(primaryValue, data, updateBuilder, mapper),
			this.schema,
			data,
		)
		const resultList: MutationResultList = []
		const postUpdates: Exclude<SqlUpdateInputProcessorResult, MutationResultList>[] = []

		for (const key of Object.keys(data)) {
			const resultSet = await acceptFieldVisitor(
				this.schema,
				entity,
				key,
				visitor,
			)
			for (const result of resultSet) {
				if (typeof result === 'function') {
					postUpdates.push(result)
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

		const result = await updateBuilder.execute(mapper)

		if (!result.executed) {
			if (filter && Object.keys(filter).length > 0) {
				// direct update was not invoked, but we still need to check if the row matches the filter
				const where: Input.OptionalWhere = {
					and: [
						filter,
						{
							[entity.primary]: { eq: primaryValue },
						},
					],
				}
				const count = await mapper.count(entity, where)
				if (!count) {
					return [new MutationEntryNotFoundError([], where)]
				}
			}
			resultList.unshift(new MutationNothingToDo([], NothingToDoReason.noData))
		} else if (result.affectedRows !== 1) {
			return [new MutationNoResultError([])]
		} else {
			const okResult = new MutationUpdateOk([], entity, primaryValue, data, rowDataToFieldValues(result.values))
			resultList.unshift(okResult)
		}

		for (const postUpdate of postUpdates) {
			const postInsertResult = await postUpdate({ primary: primaryValue })
			for (const result of postInsertResult) {
				resultList.push(result)
				if (result.error) {
					return resultList
				}
			}
		}

		return resultList
	}

	public async updateCb(
		mapper: Mapper,
		entity: Model.Entity,
		primaryValue: Input.PrimaryValue,
		builderCb: (builder: UpdateBuilder) => void,
	): Promise<MutationResultList> {
		const updateBuilder = this.updateBuilderFactory.create(entity, primaryValue)

		builderCb(updateBuilder)

		const result = await updateBuilder.execute(mapper)

		if (!result.executed) {
			return [new MutationNothingToDo([], NothingToDoReason.noData)]
		}
		if (result.affectedRows !== 1) {
			return [new MutationNoResultError([])]
		}
		return [new MutationUpdateOk([], entity, primaryValue, {}, rowDataToFieldValues(result.values))]
	}
}
