import { Input, Model, Value } from '@contember/schema'
import { Mapper } from '../Mapper.js'
import { UpdateBuilder } from './UpdateBuilder.js'
import { UpdateInputProcessor } from '../../inputProcessing/index.js'
import * as Context from '../../inputProcessing/index.js'
import {
	ConstraintType,
	getInsertPrimary,
	MutationConstraintViolationError,
	MutationEntryNotFoundError,
	MutationNothingToDo,
	MutationResultList,
	MutationResultType,
	NothingToDoReason,
} from '../Result.js'
import { hasManyProcessor, hasOneProcessor } from '../MutationProcessorHelper.js'
import { AbortUpdate } from './Updater.js'
import { ImplementationException } from '../../exception.js'
import { CheckedPrimary } from '../CheckedPrimary.js'

export class SqlUpdateInputProcessor implements UpdateInputProcessor<MutationResultList> {
	constructor(
		private readonly primaryValue: Input.PrimaryValue,
		private readonly data: Input.UpdateDataInput,
		private readonly updateBuilder: UpdateBuilder,
		private readonly mapper: Mapper,
	) {}

	public column({ entity, column }: Context.ColumnContext) {
		if (this.data[column.name] !== undefined) {
			this.updateBuilder.addFieldValue(column.name, this.data[column.name] as Value.AtomicValue)
		}
		return Promise.resolve([])
	}

	manyHasManyInverse: UpdateInputProcessor<MutationResultList>['manyHasManyInverse'] = {
		connect: hasManyProcessor(async ({ targetEntity, targetRelation, input, entity }) => {
			const primaryValue = await this.mapper.getPrimaryValue(targetEntity, input)
			if (!primaryValue) {
				return [new MutationEntryNotFoundError([], input)]
			}

			return await this.mapper.connectJunction(targetEntity, targetRelation, primaryValue, this.primaryValue)
		}),
		create: hasManyProcessor(async ({ targetEntity, targetRelation, input, entity }) => {
			const insertResult = await this.mapper.insert(targetEntity, input)
			const primaryValue = getInsertPrimary(insertResult)
			if (!primaryValue) {
				return insertResult
			}
			return await this.mapper.connectJunction(targetEntity, targetRelation, primaryValue, this.primaryValue)
		}),
		update: hasManyProcessor(async ({ targetEntity, targetRelation, input: { where, data }, entity }) => {
			const primary = await this.mapper.getPrimaryValue(targetEntity, where)
			if (!primary) {
				return [new MutationEntryNotFoundError([], where)]
			}
			return [
				...(await this.mapper.update(targetEntity, { [targetEntity.primary]: primary }, data)),
				...(await this.mapper.connectJunction(targetEntity, targetRelation, primary, this.primaryValue)),
			]
		}),
		upsert: hasManyProcessor(async ({ targetEntity, targetRelation, input: { where, update, create }, entity }) => {
			const primary = await this.mapper.getPrimaryValue(targetEntity, where)
			if (primary) {
				const updateResult = await this.mapper.update(targetEntity, { [targetEntity.primary]: primary }, update)
				const connectResult = await this.mapper.connectJunction(
					targetEntity,
					targetRelation,
					primary,
					this.primaryValue,
				)
				return [...updateResult, ...connectResult]
			} else {
				const insertResult = await this.mapper.insert(targetEntity, create)
				const primaryValue = getInsertPrimary(insertResult)
				if (!primaryValue) {
					return insertResult
				}
				const connectResult = await this.mapper.connectJunction(
					targetEntity,
					targetRelation,
					primaryValue,
					this.primaryValue,
				)
				return [...insertResult, ...connectResult]
			}
		}),
		delete: hasManyProcessor(async ({ targetEntity, input }) => {
			return await this.mapper.delete(targetEntity, input)
		}),
		disconnect: hasManyProcessor(async ({ targetEntity, targetRelation, input, entity }) => {
			const primaryValue = await this.mapper.getPrimaryValue(targetEntity, input)
			if (!primaryValue) {
				return [new MutationEntryNotFoundError([], input)]
			}

			return await this.mapper.disconnectJunction(targetEntity, targetRelation, primaryValue, this.primaryValue)
		}),
	}

	manyHasManyOwning: UpdateInputProcessor<MutationResultList>['manyHasManyOwning'] = {
		connect: hasManyProcessor(async ({ input, entity, relation, targetEntity }) => {
			const primaryValue = await this.mapper.getPrimaryValue(targetEntity, input)
			if (!primaryValue) {
				return [new MutationEntryNotFoundError([], input)]
			}
			return await this.mapper.connectJunction(entity, relation, this.primaryValue, primaryValue)
		}),
		create: hasManyProcessor(async ({ targetEntity, input, entity, relation }) => {
			const insertResult = await this.mapper.insert(targetEntity, input)
			const insertPrimary = getInsertPrimary(insertResult)
			if (!insertPrimary) {
				return insertResult
			}
			return [
				...insertResult,
				...(await this.mapper.connectJunction(entity, relation, this.primaryValue, insertPrimary)),
			]
		}),
		update: hasManyProcessor(async ({ targetEntity, input: { where, data }, entity, relation }) => {
			const primary = await this.mapper.getPrimaryValue(targetEntity, where)
			if (!primary) {
				return [new MutationEntryNotFoundError([], where)]
			}
			return [
				...(await this.mapper.update(targetEntity, { [targetEntity.primary]: primary }, data)),
				...(await this.mapper.connectJunction(entity, relation, this.primaryValue, primary)),
			]
		}),
		upsert: hasManyProcessor(async ({ targetEntity, input: { where, update, create }, entity, relation }) => {
			const primary = await this.mapper.getPrimaryValue(targetEntity, where)
			if (primary) {
				const updateResult = await this.mapper.update(targetEntity, { [targetEntity.primary]: primary }, update)
				const connectResult = await this.mapper.connectJunction(entity, relation, this.primaryValue, primary)
				return [...updateResult, ...connectResult]
			} else {
				const insertResult = await this.mapper.insert(targetEntity, create)

				const primaryValue = getInsertPrimary(insertResult)
				if (!primaryValue) {
					return insertResult
				}
				const connectResult = await this.mapper.connectJunction(entity, relation, this.primaryValue, primaryValue)
				return [...insertResult, ...connectResult]
			}
		}),
		delete: hasManyProcessor(async ({ targetEntity, input }) => {
			return await this.mapper.delete(targetEntity, input)
		}),
		disconnect: hasManyProcessor(async ({ input, entity, relation, targetEntity }) => {
			const primaryValue = await this.mapper.getPrimaryValue(targetEntity, input)
			if (!primaryValue) {
				return [new MutationEntryNotFoundError([], input)]
			}

			return await this.mapper.disconnectJunction(entity, relation, this.primaryValue, primaryValue)
		}),
	}

	manyHasOne: UpdateInputProcessor<MutationResultList>['manyHasOne'] = {
		connect: hasOneProcessor(async ({ targetEntity, input, relation }) => {
			const primaryValue = this.mapper.getPrimaryValue(targetEntity, input)
			this.updateBuilder.addFieldValue(relation.name, async () => {
				const value = await primaryValue
				if (!value) {
					return AbortUpdate
				}
				return value
			})
			if (!(await primaryValue)) {
				return [new MutationEntryNotFoundError([], input)]
			}
			return []
		}),
		create: hasOneProcessor(async ({ targetEntity, input, relation }) => {
			// intentionally no await here
			const insert = this.mapper.insert(targetEntity, input)
			this.updateBuilder.addFieldValue(relation.name, async () => {
				const insertResult = await insert
				const value = getInsertPrimary(insertResult)
				if (!value) {
					return AbortUpdate
				}
				return value
			})
			return await insert
		}),
		update: hasOneProcessor(async ({ targetEntity, input, entity, relation }) => {
			const inversePrimary = await this.mapper.selectField(
				entity,
				{ [entity.primary]: this.primaryValue },
				relation.name,
			)
			if (!inversePrimary) {
				return [new MutationNothingToDo([], NothingToDoReason.emptyRelation)]
			}
			return await this.mapper.update(targetEntity, { [targetEntity.primary]: inversePrimary }, input)
		}),
		upsert: hasOneProcessor(async ({ targetEntity, input: { create, update }, entity, relation }) => {
			const select = this.mapper.selectField(entity, { [entity.primary]: this.primaryValue }, relation.name)

			const result: MutationResultList = []
			// addFieldValue has to be called immediately
			await this.updateBuilder.addFieldValue(relation.name, async () => {
				const primary = await select
				if (primary) {
					return undefined
				}
				const insertResult = await this.mapper.insert(targetEntity, create)
				const insertPrimary = getInsertPrimary(insertResult)
				if (insertPrimary) {
					return insertPrimary
				}
				result.push(...insertResult)
				return AbortUpdate
			})

			const inversePrimary = await select
			if (inversePrimary) {
				return await this.mapper.update(targetEntity, { [targetEntity.primary]: inversePrimary }, update)
			} else {
				return result
			}
		}),
		delete: hasOneProcessor(async ({ targetEntity, entity, relation }) => {
			if (!relation.nullable && relation.joiningColumn.onDelete !== Model.OnDelete.cascade) {
				return [new MutationConstraintViolationError([], ConstraintType.notNull)]
			}
			if (relation.joiningColumn.onDelete === Model.OnDelete.restrict) {
				// eslint-disable-next-line no-console
				console.error(
					'[DEPRECATED] You are deleting an entity over the relation where onDelete behaviour is set to restrict. This will fail in next version.',
				)
				this.updateBuilder.addFieldValue(relation.name, null)
			}
			const inversePrimary = await this.mapper.selectField(
				entity,
				{ [entity.primary]: this.primaryValue },
				relation.name,
			)
			await this.updateBuilder.update
			return await this.mapper.delete(targetEntity, { [targetEntity.primary]: inversePrimary })
		}),
		disconnect: hasOneProcessor(async ({ entity, relation }) => {
			if (!relation.nullable) {
				return [new MutationConstraintViolationError([], ConstraintType.notNull)]
			}
			this.updateBuilder.addFieldValue(relation.name, null)
			return []
		}),
	}

	oneHasMany: UpdateInputProcessor<MutationResultList>['oneHasMany'] = {
		connect: hasManyProcessor(async ({ targetEntity, targetRelation, input, entity }) => {
			return await this.mapper.update(targetEntity, input, {
				[targetRelation.name]: { connect: { [entity.primary]: this.primaryValue } },
			})
		}),
		create: hasManyProcessor(async ({ targetEntity, targetRelation, input, entity }) => {
			return await this.mapper.insert(targetEntity, {
				...input,
				[targetRelation.name]: { connect: { [entity.primary]: this.primaryValue } },
			})
		}),
		update: hasManyProcessor(async ({ targetEntity, targetRelation, input: { where, data }, entity }) => {
			return await this.mapper.update(
				targetEntity,
				{ ...where, [targetRelation.name]: { [entity.primary]: this.primaryValue } },
				{
					...data,
					// [targetRelation.name]: {connect: thisPrimary}
				},
			)
		}),
		upsert: hasManyProcessor(async ({ targetEntity, targetRelation, input: { create, where, update }, entity }) => {
			const result = await this.mapper.update(
				targetEntity,
				{ ...where, [targetRelation.name]: { [entity.primary]: this.primaryValue } },
				{
					...update,
					// [targetRelation.name]: {connect: thisPrimary}
				},
			)
			if (result[0].result === MutationResultType.notFoundError) {
				return await this.mapper.insert(targetEntity, {
					...create,
					[targetRelation.name]: { connect: { [entity.primary]: this.primaryValue } },
				})
			}
			return result
		}),
		delete: hasManyProcessor(async ({ targetEntity, targetRelation, input, entity }) => {
			return await this.mapper.delete(targetEntity, {
				...input,
				[targetRelation.name]: { [entity.primary]: this.primaryValue },
			})
		}),
		disconnect: hasManyProcessor(async ({ targetEntity, targetRelation, input, entity }) => {
			return await this.mapper.update(
				targetEntity,
				{ ...input, [targetRelation.name]: { [entity.primary]: this.primaryValue } },
				{ [targetRelation.name]: { disconnect: true } },
			)
		}),
	}

	oneHasOneInverse: UpdateInputProcessor<MutationResultList>['oneHasOneInverse'] = {
		connect: hasOneProcessor(async ({ targetEntity, targetRelation, input, entity }) => {
			return await this.mapper.update(targetEntity, input, {
				[targetRelation.name]: { connect: { [entity.primary]: this.primaryValue } },
			})
		}),
		create: hasOneProcessor(async ({ targetEntity, targetRelation, input, entity }) => {
			return [
				...(
					await this.mapper.update(
						targetEntity,
						{ [targetRelation.name]: { [entity.primary]: this.primaryValue } },
						{ [targetRelation.name]: { disconnect: true } },
					)
				).filter(it => it.result !== MutationResultType.notFoundError),
				...(await this.mapper.insert(targetEntity, {
					...input,
					[targetRelation.name]: { connect: { [entity.primary]: this.primaryValue } },
				})),
			]
		}),
		update: hasOneProcessor(async ({ targetEntity, targetRelation, input, entity }) => {
			return await this.mapper.update(
				targetEntity,
				{ [targetRelation.name]: { [entity.primary]: this.primaryValue } },
				input,
			)
		}),
		upsert: hasOneProcessor(async ({ targetEntity, targetRelation, input: { create, update }, entity }) => {
			const result = await this.mapper.update(
				targetEntity,
				{ [targetRelation.name]: { [entity.primary]: this.primaryValue } },
				update,
			)
			if (result[0].result === MutationResultType.notFoundError) {
				return await this.mapper.insert(targetEntity, {
					...create,
					[targetRelation.name]: { connect: { [entity.primary]: this.primaryValue } },
				})
			}
			return result
		}),
		delete: hasOneProcessor(async ({ targetEntity, targetRelation, entity, relation }) => {
			if (!relation.nullable) {
				return [new MutationConstraintViolationError([], ConstraintType.notNull)]
			}
			return await this.mapper.delete(targetEntity, { [targetRelation.name]: { [entity.primary]: this.primaryValue } })
		}),
		disconnect: hasOneProcessor(async ({ targetEntity, targetRelation, entity, relation }) => {
			if (!relation.nullable) {
				return [new MutationConstraintViolationError([], ConstraintType.notNull)]
			}
			return await this.mapper.update(
				targetEntity,
				{ [targetRelation.name]: { [entity.primary]: this.primaryValue } },
				{ [targetRelation.name]: { disconnect: true } },
			)
		}),
	}

	oneHasOneOwning: UpdateInputProcessor<MutationResultList>['oneHasOneOwning'] = {
		connect: hasOneProcessor(async ({ targetEntity, input, entity, relation, targetRelation }) => {
			const result: MutationResultList = []

			await this.updateBuilder.addFieldValue(relation.name, async () => {
				const targetPrimary = (await this.mapper.getPrimaryValue(targetEntity, input)) as Input.PrimaryValue
				if (!targetPrimary) {
					result.push(new MutationEntryNotFoundError([], input))
					return AbortUpdate
				}

				const currentOwnerOfTarget = await this.mapper.getPrimaryValue(entity, {
					[relation.name]: { [targetEntity.primary]: targetPrimary },
				})

				if (currentOwnerOfTarget === this.primaryValue) {
					// same owner, nothing to do
					return undefined
				}
				if (targetRelation && !targetRelation.nullable) {
					const currentTargetPrimary = await this.mapper.selectField(
						entity,
						{ [entity.primary]: this.primaryValue },
						relation.name,
					)
					if (currentTargetPrimary === targetPrimary) {
						// should be already handled in a currentOwnerOfTarget === this.primaryValue branch
						throw new ImplementationException()
					}
					if (currentTargetPrimary) {
						result.push(new MutationConstraintViolationError([], ConstraintType.uniqueKey))
						return AbortUpdate
					}
				}

				if (currentOwnerOfTarget) {
					if (!relation.nullable) {
						result.push(new MutationConstraintViolationError([], ConstraintType.notNull))
						return AbortUpdate
					}

					result.push(
						...(await this.mapper.updateInternal(
							entity,
							{
								[entity.primary]: currentOwnerOfTarget,
							},
							[relation.name],
							builder => {
								builder.addFieldValue(relation.name, null)
							},
						)),
					)
				}
				return targetPrimary
			})
			return result
		}),
		create: hasOneProcessor(async ({ targetEntity, input, relation, entity, targetRelation }) => {
			const insert = this.mapper.insert(targetEntity, input)
			const result: MutationResultList = []
			this.updateBuilder.addFieldValue(relation.name, async () => {
				if (targetRelation && !targetRelation.nullable) {
					const currentTargetPrimary = await this.mapper.selectField(
						entity,
						{ [entity.primary]: this.primaryValue },
						relation.name,
					)
					if (currentTargetPrimary) {
						result.push(new MutationConstraintViolationError([], ConstraintType.uniqueKey))
						return AbortUpdate
					}
				}

				const insertResult = await insert
				const insertPrimary = getInsertPrimary(insertResult)
				if (insertPrimary) {
					return insertPrimary
				}
				return AbortUpdate
			})
			result.push(...(await insert))
			return result
		}),
		update: hasOneProcessor(async ({ targetEntity, input, entity, relation }) => {
			const inversePrimary = await this.mapper.selectField(
				entity,
				{ [entity.primary]: this.primaryValue },
				relation.name,
			)
			if (!inversePrimary) {
				return [new MutationNothingToDo([], NothingToDoReason.emptyRelation)]
			}
			return await this.mapper.update(targetEntity, { [targetEntity.primary]: inversePrimary }, input)
		}),
		upsert: hasOneProcessor(async ({ targetEntity, input: { create, update }, entity, relation }) => {
			const select = this.mapper.selectField(entity, { [entity.primary]: this.primaryValue }, relation.name)

			const result: MutationResultList = []
			//addColumnData has to be called synchronously
			await this.updateBuilder.addFieldValue(relation.name, async () => {
				const primary = await select
				if (primary) {
					return undefined
				}
				const insertResult = await this.mapper.insert(targetEntity, create)
				const insertPrimary = getInsertPrimary(insertResult)
				if (insertPrimary) {
					return insertPrimary
				}
				result.push(...insertResult)
				return AbortUpdate
			})

			const inversePrimary = await select
			if (inversePrimary) {
				return await this.mapper.update(targetEntity, { [targetEntity.primary]: inversePrimary }, update)
			}
			return result
		}),
		delete: hasOneProcessor(async ({ targetEntity, entity, relation }) => {
			if (!relation.nullable && relation.joiningColumn.onDelete !== Model.OnDelete.cascade) {
				return [new MutationConstraintViolationError([], ConstraintType.notNull)]
			}
			if (relation.joiningColumn.onDelete === Model.OnDelete.restrict) {
				// eslint-disable-next-line no-console
				console.error(
					'[DEPRECATED] You are deleting an entity over the relation where onDelete behaviour is set to restrict. This will fail in next version.',
				)
				this.updateBuilder.addFieldValue(relation.name, null)
			}
			const targetPrimary = await this.mapper.selectField(
				entity,
				{ [entity.primary]: this.primaryValue },
				relation.name,
			)
			if (!targetPrimary) {
				return [new MutationNothingToDo([], NothingToDoReason.emptyRelation)]
			}
			await this.updateBuilder.update
			return await this.mapper.delete(targetEntity, new CheckedPrimary(targetPrimary))
		}),
		disconnect: hasOneProcessor(async ({ entity, relation, targetRelation, input }) => {
			if (!relation.nullable) {
				return [new MutationConstraintViolationError([], ConstraintType.notNull)]
			}
			if (targetRelation && !targetRelation.nullable) {
				const targetPrimary = await this.mapper.selectField(
					entity,
					{ [entity.primary]: this.primaryValue },
					relation.name,
				)
				if (targetPrimary) {
					return [new MutationConstraintViolationError([], ConstraintType.notNull)]
				}
			}
			this.updateBuilder.addFieldValue(relation.name, null)
			return []
		}),
	}
}
