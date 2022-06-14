import { Input, Model, Value } from '@contember/schema'
import { Mapper } from '../Mapper'
import { UpdateBuilder } from './UpdateBuilder'
import { UpdateInputProcessor } from '../../inputProcessing'
import * as Context from '../../inputProcessing'
import {
	ConstraintType,
	getInsertPrimary,
	MutationConstraintViolationError,
	MutationEntryNotFoundError,
	MutationNothingToDo,
	MutationResultList,
	MutationResultType,
	NothingToDoReason,
} from '../Result'
import { hasManyProcessor, hasOneProcessor } from '../MutationProcessorHelper'
import { AbortUpdate } from './Updater'
import { CheckedPrimary } from '../CheckedPrimary'

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
			const newOwner = await this.mapper.getPrimaryValue(targetEntity, input)
			if (!newOwner) {
				return [new MutationEntryNotFoundError([], input)]
			}
			const currentOwner = await this.mapper.getPrimaryValue(targetEntity, {
				[targetRelation.name]: { [entity.primary]: this.primaryValue },
			})
			if (newOwner === currentOwner) {
				return [new MutationNothingToDo([], NothingToDoReason.alreadyExists)]
			}
			const result: MutationResultList = []
			if (currentOwner) {
				if (!targetRelation.nullable) {
					// todo cascade delete support?
					return [new MutationConstraintViolationError([], ConstraintType.notNull)]
				}
				const disconnectFromCurrentOwner = await this.mapper.updateInternal(targetEntity, { [targetEntity.primary]: currentOwner }, builder => {
					builder.addPredicates([targetRelation.name])
					builder.addFieldValue(targetRelation.name, null)
				})
				result.push(...disconnectFromCurrentOwner)
			}
			const orphanedInverseSide = targetRelation.orphanRemoval
				? await this.mapper.selectField(targetEntity, { [targetEntity.primary]: newOwner }, targetRelation.name)
				: null

			const connectToNewOwner = await this.mapper.updateInternal(targetEntity, { [targetEntity.primary]: newOwner }, builder => {
				builder.addPredicates([targetRelation.name])
				builder.addFieldValue(targetRelation.name, this.primaryValue)
			})
			result.push(...connectToNewOwner)

			if (orphanedInverseSide) {
				const deleteOrphanedInverseSide = await this.mapper.delete(entity, { [entity.primary]: orphanedInverseSide })
				result.push(...deleteOrphanedInverseSide)
			}
			return result
		}),
		create: hasOneProcessor(async ({ targetEntity, targetRelation, input, entity, relation }) => {
			const currentOwner = await this.mapper.getPrimaryValue(targetEntity, {
				[targetRelation.name]: { [entity.primary]: this.primaryValue },
			})
			if (currentOwner && !targetRelation.nullable) {
				// todo cascade delete support?
				return [new MutationConstraintViolationError([], ConstraintType.notNull)]
			}
			const result: MutationResultList = []
			if (currentOwner) {
				const disconnectFromCurrentOwner = await this.mapper.updateInternal(targetEntity, { [targetEntity.primary]: currentOwner }, builder => {
					builder.addPredicates([targetRelation.name])
					builder.addFieldValue(targetRelation.name, null)
				})
				result.push(...disconnectFromCurrentOwner)
			}

			const connectToNewlyCreatedOwner = await this.mapper.insert(targetEntity, input, builder => {
				builder.addFieldValue(targetRelation.name, this.primaryValue)
				builder.addPredicates([targetRelation.name])
			})
			result.push(...connectToNewlyCreatedOwner)

			return result
		}),
		update: hasOneProcessor(async ({ targetEntity, targetRelation, input, entity }) => {
			return await this.mapper.update(
				targetEntity,
				{ [targetRelation.name]: { [entity.primary]: this.primaryValue } },
				input,
			)
		}),
		upsert: hasOneProcessor(async ({ targetEntity, targetRelation, input: { create, update }, entity, relation }) => {
			const result = await this.mapper.update(
				targetEntity,
				{ [targetRelation.name]: { [entity.primary]: this.primaryValue } },
				update,
			)
			if (result[0].result === MutationResultType.notFoundError) {
				return await this.oneHasOneInverse.create({
					entity,
					targetEntity,
					targetRelation,
					relation,
					input: create,
				})
			}
			return result
		}),
		delete: hasOneProcessor(async ({ targetEntity, targetRelation, entity, relation }) => {
			if (!relation.nullable && !targetRelation.orphanRemoval) {
				return [new MutationConstraintViolationError([], ConstraintType.notNull)]
			}
			// orphan removal is handled in mapper.delete
			return await this.mapper.delete(targetEntity, { [targetRelation.name]: { [entity.primary]: this.primaryValue } })
		}),
		disconnect: hasOneProcessor(async ({ targetEntity, targetRelation, entity, relation }) => {
			if (!relation.nullable && !targetRelation.orphanRemoval) {
				return [new MutationConstraintViolationError([], ConstraintType.notNull)]
			}
			const currentOwner = await this.mapper.getPrimaryValue(targetEntity, {
				[targetRelation.name]: { [entity.primary]: this.primaryValue },
			})
			if (!currentOwner) {
				return [new MutationNothingToDo([], NothingToDoReason.emptyRelation)]
			}
			if (currentOwner && !targetRelation.nullable) {
				return [new MutationConstraintViolationError([], ConstraintType.notNull)]
			}

			const result = await this.mapper.updateInternal(
				targetEntity,
				{ [targetEntity.primary]: currentOwner },
				builder => {
					builder.addPredicates([targetRelation.name])
					builder.addFieldValue(targetRelation.name, null)
				},
			)
			if (targetRelation.orphanRemoval) {
				result.push(...(await this.mapper.delete(entity, { [entity.primary]: this.primaryValue })))
			}
			return result
		}),
	}

	oneHasOneOwning: UpdateInputProcessor<MutationResultList>['oneHasOneOwning'] = {
		connect: hasOneProcessor(async ({ targetEntity, input, entity, relation, targetRelation }) => {
			const result: MutationResultList = []

			const currentInverseSide = (targetRelation && !targetRelation.nullable) || relation.orphanRemoval
				? this.mapper.selectField(entity, { [entity.primary]: this.primaryValue }, relation.name)
				: Promise.resolve(undefined)

			const newInverseSide = await this.updateBuilder.addFieldValue(relation.name, async () => {
				const newInverseSide = await this.mapper.getPrimaryValue(targetEntity, input)
				if (!newInverseSide) {
					result.push(new MutationEntryNotFoundError([], input))
					return AbortUpdate
				}
				const inverseSidePrimary = await currentInverseSide
				if (inverseSidePrimary === newInverseSide) {
					result.push(new MutationNothingToDo([], NothingToDoReason.alreadyExists))
					return undefined
				}

				const currentOwnerOfNewInverseSide = await this.mapper.getPrimaryValue(entity, {
					[relation.name]: { [targetEntity.primary]: newInverseSide },
				})

				if (currentOwnerOfNewInverseSide === this.primaryValue) {
					result.push(new MutationNothingToDo([], NothingToDoReason.alreadyExists))
					return undefined
				}

				// orphan removal handled bellow
				if (targetRelation && !targetRelation.nullable && !relation.orphanRemoval && inverseSidePrimary) {
					result.push(new MutationConstraintViolationError([], ConstraintType.notNull))
					return AbortUpdate
				}

				if (currentOwnerOfNewInverseSide) {
					if (!relation.nullable) {
						result.push(new MutationConstraintViolationError([], ConstraintType.notNull))
						return AbortUpdate
					}

					const currentOwnerDisconnect = await this.mapper.updateInternal(
						entity,
						{
							[entity.primary]: currentOwnerOfNewInverseSide,
						},
						builder => {
							builder.addPredicates([relation.name])
							builder.addFieldValue(relation.name, null)
						},
					)
					result.push(...currentOwnerDisconnect)
				}
				return newInverseSide
			})
			const inverseSidePrimary = await currentInverseSide
			if (relation.orphanRemoval && newInverseSide && inverseSidePrimary) {
				await this.updateBuilder.update
				const deleteOrphanedInverseSide = await this.mapper.delete(targetEntity, { [targetEntity.primary]: inverseSidePrimary })
				result.push(...deleteOrphanedInverseSide)
			}
			return result
		}),
		create: hasOneProcessor(async ({ targetEntity, input, relation, entity, targetRelation }) => {
			const insert = this.mapper.insert(targetEntity, input)
			const result: MutationResultList = []
			const currentInverseSide = (targetRelation && !targetRelation.nullable) || relation.orphanRemoval
				? this.mapper.selectField(entity, { [entity.primary]: this.primaryValue }, relation.name)
				: Promise.resolve(undefined)
			await this.updateBuilder.addFieldValue(relation.name, async () => {
				const inversePrimary = await currentInverseSide
				// orphan removal handled bellow
				if (targetRelation && !targetRelation.nullable && !relation.orphanRemoval && inversePrimary) {
					result.push(new MutationConstraintViolationError([], ConstraintType.notNull))
					return AbortUpdate
				}

				const insertResult = await insert
				const newInverseSide = getInsertPrimary(insertResult)
				if (newInverseSide) {
					return newInverseSide
				}
				return AbortUpdate
			})
			result.push(...(await insert))
			const inversePrimary = await currentInverseSide
			if (relation.orphanRemoval && inversePrimary) {
				await this.updateBuilder.update
				const deleteOrphanedInverseSide = await this.mapper.delete(targetEntity, { [targetEntity.primary]: inversePrimary })
				result.push(...deleteOrphanedInverseSide)
			}
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
		disconnect: hasOneProcessor(async ({ entity, relation, targetRelation, targetEntity, input }) => {
			if (!relation.nullable) {
				return [new MutationConstraintViolationError([], ConstraintType.notNull)]
			}
			const result: MutationResultList = []

			const currentInverseSide = (targetRelation && !targetRelation.nullable) || relation.orphanRemoval
				? this.mapper.selectField(entity, { [entity.primary]: this.primaryValue }, relation.name)
				: Promise.resolve(undefined)

			this.updateBuilder.addFieldValue(relation.name, async () => {
				const inversePrimary = await currentInverseSide
				if (inversePrimary && targetRelation && !targetRelation.nullable && !relation.orphanRemoval) {
					result.push(new MutationConstraintViolationError([], ConstraintType.notNull))
					return AbortUpdate
				}
				return null
			})
			if (relation.orphanRemoval) {
				const inversePrimary = await currentInverseSide
				if (inversePrimary) {
					await this.updateBuilder.update
					const deleteOrphanedInverseSide = await this.mapper.delete(targetEntity, { [targetEntity.primary]: inversePrimary })
					result.push(...deleteOrphanedInverseSide)
				}
			}
			return result
		}),
	}
}
