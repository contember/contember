import { Input, Value } from '@contember/schema'
import { Mapper } from '../Mapper'
import { InsertBuilder } from './InsertBuilder'
import { Providers, resolveColumnValue } from '@contember/schema-utils'
import { CreateInputProcessor } from '../../inputProcessing'
import * as Context from '../../inputProcessing'
import {
	ConstraintType,
	getInsertPrimary,
	MutationConstraintViolationError,
	MutationEntryNotFoundError,
	MutationResultList,
} from '../Result'
import { hasManyProcessor, hasOneProcessor } from '../MutationProcessorHelper'
import { AbortInsert } from './Inserter'

export class SqlCreateInputProcessor implements CreateInputProcessor<MutationResultList> {
	constructor(
		private readonly insertBuilder: InsertBuilder,
		private readonly mapper: Mapper,
		private readonly providers: Providers,
	) {
	}

	public async column(context: Context.ColumnContext): Promise<MutationResultList> {
		this.insertBuilder.addFieldValue(
			context.column.name,
			((): Value.GenericValueLike<Value.AtomicValue | undefined> => {
				return resolveColumnValue(context, this.providers)
			})(),
		)
		return []
	}

	manyHasManyInverse: CreateInputProcessor<MutationResultList>['manyHasManyInverse'] = {
		connect: hasManyProcessor(async (context): Promise<MutationResultList> => {
			const inversePrimary = await this.insertBuilder.insert
			if (!inversePrimary) {
				return []
			}
			const owningPrimary = await this.mapper.getPrimaryValue(context.targetEntity, context.input)
			if (!owningPrimary) {
				return [new MutationEntryNotFoundError([], context.input)]
			}
			return await this.mapper.connectJunction(
				context.targetEntity,
				context.targetRelation,
				owningPrimary,
				inversePrimary,
			)
		}),
		create: hasOneProcessor(async (context): Promise<MutationResultList> => {
			const inversePrimary = await this.insertBuilder.insert
			if (!inversePrimary) {
				return []
			}
			const insertResult = await this.mapper.insert(context.targetEntity, context.input)
			const owningPrimary = getInsertPrimary(insertResult)
			if (owningPrimary) {
				const connectResult = await this.mapper.connectJunction(
					context.targetEntity,
					context.targetRelation,
					owningPrimary,
					inversePrimary,
				)
				return [...insertResult, ...connectResult]
			}
			return insertResult
		}),
	}

	manyHasManyOwning: CreateInputProcessor<MutationResultList>['manyHasManyOwning'] = {
		connect: hasManyProcessor(async (context): Promise<MutationResultList> => {
			const primary = await this.insertBuilder.insert
			if (!primary) {
				return []
			}
			const inversePrimary = await this.mapper.getPrimaryValue(context.targetEntity, context.input)
			if (!inversePrimary) {
				return [new MutationEntryNotFoundError([], context.input)]
			}
			return await this.mapper.connectJunction(context.entity, context.relation, primary, inversePrimary)
		}),
		create: hasManyProcessor(async (context): Promise<MutationResultList> => {
			const primary = await this.insertBuilder.insert
			if (!primary) {
				return []
			}
			const insertResult = await this.mapper.insert(context.targetEntity, context.input)
			const inversePrimary = getInsertPrimary(insertResult)
			if (inversePrimary) {
				const connectResult = await this.mapper.connectJunction(
					context.entity,
					context.relation,
					primary,
					inversePrimary,
				)
				return [...insertResult, ...connectResult]
			}
			return insertResult
		}),
	}

	manyHasOne: CreateInputProcessor<MutationResultList>['manyHasOne'] = {
		nothing: async ctx => {
			this.insertBuilder.addFieldValue(ctx.relation.name, null)
			return []
		},
		connect: hasOneProcessor(async (context): Promise<MutationResultList> => {
			const primaryValue = this.mapper.getPrimaryValue(context.targetEntity, context.input)
			this.insertBuilder.addFieldValue(context.relation.name, async () => {
				const value = await primaryValue
				if (!value) {
					return AbortInsert
				}
				return value
			})
			if (!(await primaryValue)) {
				return [new MutationEntryNotFoundError([], context.input)]
			}
			return []
		}),
		create: hasOneProcessor(async (context): Promise<MutationResultList> => {
			const insertPromise = this.mapper.insert(context.targetEntity, context.input)
			await this.insertBuilder.addFieldValue(context.relation.name, async () => {
				const insertResult = await insertPromise
				const primary = getInsertPrimary(insertResult)
				if (!primary) {
					return AbortInsert
				}
				return primary
			})
			return await insertPromise
		}),
	}

	oneHasMany: CreateInputProcessor<MutationResultList>['oneHasMany'] = {
		connect: hasManyProcessor(async (context): Promise<MutationResultList> => {
			const primary = await this.insertBuilder.insert
			if (!primary) {
				return []
			}
			return await this.mapper.update(context.targetEntity, context.input, {
				[context.targetRelation.name]: {
					connect: { [context.entity.primary]: primary },
				},
			})
		}),
		create: hasManyProcessor(async (context): Promise<MutationResultList> => {
			const primary = await this.insertBuilder.insert
			if (!primary) {
				return []
			}
			return await this.mapper.insert(context.targetEntity, {
				...context.input,
				[context.targetRelation.name]: {
					connect: { [context.entity.primary]: primary },
				},
			})
		}),
	}

	oneHasOneOwning: CreateInputProcessor<MutationResultList>['oneHasOneOwning'] = {
		nothing: async ctx => {
			this.insertBuilder.addFieldValue(ctx.relation.name, null)
			return []
		},
		connect: hasOneProcessor(
			async (context: Context.OneHasOneOwningContext & { input: Input.UniqueWhere }): Promise<MutationResultList> => {
				const result: MutationResultList = []
				await this.insertBuilder.addFieldValue(context.relation.name, async () => {
					const inverseSide = await this.mapper.getPrimaryValue(context.targetEntity, context.input)
					if (!inverseSide) {
						result.push(new MutationEntryNotFoundError([], context.input))
						return AbortInsert
					}
					const currentOwnerOfInverseSide = await this.mapper.getPrimaryValue(context.entity, {
						[context.relation.name]: { [context.targetEntity.primary]: inverseSide },
					})

					if (currentOwnerOfInverseSide) {
						if (!context.relation.nullable) {
							result.push(new MutationConstraintViolationError([], ConstraintType.notNull))
							return AbortInsert
						}

						const currentOwnerDisconnectResult = await this.mapper.updateInternal(
							context.entity,
							{
								[context.entity.primary]: currentOwnerOfInverseSide,
							},
							builder => {
								builder.addPredicates([context.relation.name])
								builder.addFieldValue(context.relation.name, null)
							},
						)
						result.push(...currentOwnerDisconnectResult)
					}

					return inverseSide
				})
				return result
			},
		),
		create: hasOneProcessor(async (context): Promise<MutationResultList> => {
			const insertPromise = this.mapper.insert(context.targetEntity, context.input)
			await this.insertBuilder.addFieldValue(context.relation.name, async () => {
				const insertResult = await insertPromise
				const primary = getInsertPrimary(insertResult)
				if (!primary) {
					return AbortInsert
				}
				return primary
			})
			return await insertPromise
		}),
	}

	oneHasOneInverse: CreateInputProcessor<MutationResultList>['oneHasOneInverse'] = {
		connect: hasOneProcessor(async (context): Promise<MutationResultList> => {
			const value = await this.insertBuilder.insert
			if (!value) {
				return []
			}
			const owner = await this.mapper.getPrimaryValue(context.targetEntity, context.input)
			if (!owner) {
				return [new MutationEntryNotFoundError([], context.input)]
			}
			const currentInverseSideOfOwner = await this.mapper.selectField(
				context.targetEntity,
				context.input,
				context.targetRelation.name,
			)
			const result: MutationResultList = []
			if (currentInverseSideOfOwner) {
				if (context.targetRelation.orphanRemoval) {
					result.push(
						...(await this.mapper.delete(context.entity, { [context.entity.primary]: currentInverseSideOfOwner })),
					)
				} else if (!context.relation.nullable) {
					return [new MutationConstraintViolationError([], ConstraintType.notNull)]
				}
			}

			return [
				...await this.mapper.updateInternal(context.targetEntity, context.input, update => {
					update.addPredicates([context.targetRelation.name])
					update.addFieldValue(context.targetRelation.name, value)
				}),
				...result,
			]
		}),
		create: hasOneProcessor(async (context): Promise<MutationResultList> => {
			const primary = await this.insertBuilder.insert
			if (!primary) {
				return []
			}
			return await this.mapper.insert(context.targetEntity, context.input, builder => {
				builder.addPredicates([context.targetRelation.name])
				builder.addFieldValue(context.targetRelation.name, primary)
			})
		}),
	}
}
