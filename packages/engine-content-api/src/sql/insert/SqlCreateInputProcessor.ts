import { Input, Value } from '@contember/schema'
import Mapper from '../Mapper'
import InsertBuilder from './InsertBuilder'
import { Providers, resolveColumnValue } from '@contember/schema-utils'
import { CreateInputProcessor } from '../../inputProcessing'
import * as Context from '../../inputProcessing/InputContext'
import { getInsertPrimary, MutationEntryNotFoundError, MutationResultList } from '../Result'

export default class SqlCreateInputProcessor implements CreateInputProcessor<MutationResultList> {
	constructor(
		private readonly insertBuilder: InsertBuilder,
		private readonly mapper: Mapper,
		private readonly providers: Providers,
	) {}

	public async column(context: Context.ColumnContext): Promise<MutationResultList> {
		this.insertBuilder.addFieldValue(
			context.column.name,
			((): Value.GenericValueLike<Value.AtomicValue> => {
				return resolveColumnValue(context, this.providers)
			})(),
		)
		return []
	}

	manyHasManyInversed = {
		connect: async (
			context: Context.ManyHasManyInversedContext & { input: Input.UniqueWhere },
		): Promise<MutationResultList> => {
			const primaryInversed = await this.insertBuilder.insert
			if (!primaryInversed) {
				return []
			}
			const primaryOwner = await this.mapper.getPrimaryValue(context.entity, context.input)
			if (!primaryOwner) {
				return [new MutationEntryNotFoundError([], context.input)]
			}
			return await this.mapper.connectJunction(
				context.targetEntity,
				context.targetRelation,
				primaryOwner,
				primaryInversed,
			)
		},
		create: async (
			context: Context.ManyHasManyInversedContext & { input: Input.CreateDataInput },
		): Promise<MutationResultList> => {
			const primaryInversed = await this.insertBuilder.insert
			if (!primaryInversed) {
				return []
			}
			const insertResult = await this.mapper.insert(context.targetEntity, context.input)
			const primaryOwner = getInsertPrimary(insertResult)
			if (primaryOwner) {
				const connectResult = await this.mapper.connectJunction(
					context.targetEntity,
					context.targetRelation,
					primaryOwner,
					primaryInversed,
				)
				return [...insertResult, ...connectResult]
			}
			return insertResult
		},
	}

	manyHasManyOwner = {
		connect: async (
			context: Context.ManyHasManyOwnerContext & { input: Input.UniqueWhere },
		): Promise<MutationResultList> => {
			const primary = await this.insertBuilder.insert
			if (!primary) {
				return []
			}
			const primaryInversed = await this.mapper.getPrimaryValue(context.targetEntity, context.input)
			if (!primaryInversed) {
				return [new MutationEntryNotFoundError([], context.input)]
			}
			return await this.mapper.connectJunction(context.entity, context.relation, primary, primaryInversed)
		},
		create: async (
			context: Context.ManyHasManyOwnerContext & { input: Input.CreateDataInput },
		): Promise<MutationResultList> => {
			const primary = await this.insertBuilder.insert
			if (!primary) {
				return []
			}
			const insertResult = await this.mapper.insert(context.targetEntity, context.input)
			const primaryInversed = getInsertPrimary(insertResult)
			if (primaryInversed) {
				const connectResult = await this.mapper.connectJunction(
					context.entity,
					context.relation,
					primary,
					primaryInversed,
				)
				return [...insertResult, ...connectResult]
			}
			return insertResult
		},
	}

	manyHasOne = {
		connect: async (context: Context.ManyHasOneContext & { input: Input.UniqueWhere }): Promise<MutationResultList> => {
			const primaryValue = this.mapper.getPrimaryValue(context.targetEntity, context.input)
			this.insertBuilder.addFieldValue(context.relation.name, primaryValue)
			if (!(await primaryValue)) {
				return [new MutationEntryNotFoundError([], context.input)]
			}
			return []
		},
		create: async (
			context: Context.ManyHasOneContext & { input: Input.CreateDataInput },
		): Promise<MutationResultList> => {
			const insertPromise = this.mapper.insert(context.targetEntity, context.input)
			await this.insertBuilder.addFieldValue(context.relation.name, async () => {
				const insertResult = await insertPromise
				return getInsertPrimary(insertResult)
			})
			return await insertPromise
		},
	}

	oneHasMany = {
		connect: async (context: Context.OneHasManyContext & { input: Input.UniqueWhere }): Promise<MutationResultList> => {
			const value = await this.insertBuilder.insert
			if (!value) {
				return []
			}
			return await this.mapper.update(context.targetEntity, context.input, {
				[context.targetRelation.name]: {
					connect: { [context.relation.name]: value },
				},
			})
		},
		create: async (
			context: Context.OneHasManyContext & { input: Input.CreateDataInput },
		): Promise<MutationResultList> => {
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
		},
	}

	oneHasOneOwner = {
		connect: async (
			context: Context.OneHasOneOwnerContext & { input: Input.UniqueWhere },
		): Promise<MutationResultList> => {
			const primaryValue = this.mapper.getPrimaryValue(context.targetEntity, context.input)
			this.insertBuilder.addFieldValue(context.relation.name, primaryValue)
			if (!(await primaryValue)) {
				return [new MutationEntryNotFoundError([], context.input)]
			}
			return []
		},
		create: async (
			context: Context.OneHasOneOwnerContext & { input: Input.CreateDataInput },
		): Promise<MutationResultList> => {
			const insertPromise = this.mapper.insert(context.targetEntity, context.input)
			await this.insertBuilder.addFieldValue(context.relation.name, async () => {
				const insertResult = await insertPromise
				return getInsertPrimary(insertResult)
			})
			return await insertPromise
		},
	}

	oneHasOneInversed = {
		connect: async (
			context: Context.OneHasOneInversedContext & { input: Input.UniqueWhere },
		): Promise<MutationResultList> => {
			const value = await this.insertBuilder.insert
			if (!value) {
				return []
			}
			return await this.mapper.update(context.targetEntity, context.input, {
				[context.targetRelation.name]: {
					connect: { [context.entity.primary]: value },
				},
			})
		},
		create: async (
			context: Context.OneHasOneInversedContext & { input: Input.CreateDataInput },
		): Promise<MutationResultList> => {
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
		},
	}
}
