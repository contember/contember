import { Input, Value } from '@contember/schema'
import Mapper from '../Mapper'
import InsertBuilder from './InsertBuilder'
import { Providers, resolveColumnValue } from '@contember/schema-utils'
import CreateInputProcessor from '../../inputProcessing/CreateInputProcessor'
import * as Context from '../../inputProcessing/InputContext'

export default class SqlCreateInputProcessor implements CreateInputProcessor {
	constructor(
		private readonly insertBuilder: InsertBuilder,
		private readonly mapper: Mapper,
		private readonly providers: Providers,
	) {}

	public async column(context: Context.ColumnContext): Promise<void> {
		this.insertBuilder.addFieldValue(
			context.column.name,
			((): Value.GenericValueLike<Value.AtomicValue> => {
				return resolveColumnValue(context, this.providers)
			})(),
		)
		return Promise.resolve()
	}

	manyHasManyInversed = {
		connect: async (context: Context.ManyHasManyInversedContext & { input: Input.UniqueWhere }): Promise<void> => {
			const primaryInversed = await this.insertBuilder.insert
			await this.mapper.connectJunction(context.targetEntity, context.targetRelation, context.input, {
				[context.entity.primary]: primaryInversed,
			})
		},
		create: async (context: Context.ManyHasManyInversedContext & { input: Input.CreateDataInput }): Promise<void> => {
			const primaryInversed = await this.insertBuilder.insert
			const primaryOwner = await this.mapper.insert(context.targetEntity, context.input)
			await this.mapper.connectJunction(
				context.targetEntity,
				context.targetRelation,
				{ [context.targetEntity.primary]: primaryOwner },
				{ [context.entity.primary]: primaryInversed },
			)
		},
	}

	manyHasManyOwner = {
		connect: async (context: Context.ManyHasManyOwnerContext & { input: Input.UniqueWhere }): Promise<void> => {
			const primary = await this.insertBuilder.insert
			await this.mapper.connectJunction(
				context.entity,
				context.relation,
				{ [context.entity.primary]: primary },
				context.input,
			)
		},
		create: async (context: Context.ManyHasManyOwnerContext & { input: Input.CreateDataInput }): Promise<void> => {
			const primary = await this.insertBuilder.insert
			const primaryInversed = await this.mapper.insert(context.targetEntity, context.input)
			await this.mapper.connectJunction(
				context.entity,
				context.relation,
				{ [context.entity.primary]: primary },
				{ [context.targetEntity.primary]: primaryInversed },
			)
		},
	}

	manyHasOne = {
		connect: async (context: Context.ManyHasOneContext & { input: Input.UniqueWhere }): Promise<void> => {
			this.insertBuilder.addFieldValue(
				context.relation.name,
				this.mapper.getPrimaryValue(context.targetEntity, context.input),
			)
		},
		create: async (context: Context.ManyHasOneContext & { input: Input.CreateDataInput }): Promise<void> => {
			this.insertBuilder.addFieldValue(context.relation.name, this.mapper.insert(context.targetEntity, context.input))
		},
	}

	oneHasMany = {
		connect: async (context: Context.OneHasManyContext & { input: Input.UniqueWhere }): Promise<void> => {
			const value = await this.insertBuilder.insert
			await this.mapper.update(context.targetEntity, context.input, {
				[context.targetRelation.name]: {
					connect: { [context.relation.name]: value },
				},
			})
		},
		create: async (context: Context.OneHasManyContext & { input: Input.CreateDataInput }): Promise<void> => {
			const primary = await this.insertBuilder.insert
			await this.mapper.insert(context.targetEntity, {
				...context.input,
				[context.targetRelation.name]: {
					connect: { [context.entity.primary]: primary },
				},
			})
		},
	}

	oneHasOneOwner = {
		connect: async (context: Context.OneHasOneOwnerContext & { input: Input.UniqueWhere }): Promise<void> => {
			this.insertBuilder.addFieldValue(
				context.relation.name,
				this.mapper.getPrimaryValue(context.targetEntity, context.input),
			)
		},
		create: async (context: Context.OneHasOneOwnerContext & { input: Input.CreateDataInput }): Promise<void> => {
			this.insertBuilder.addFieldValue(context.relation.name, this.mapper.insert(context.targetEntity, context.input))
		},
	}

	oneHasOneInversed = {
		connect: async (context: Context.OneHasOneInversedContext & { input: Input.UniqueWhere }): Promise<void> => {
			const value = await this.insertBuilder.insert
			await this.mapper.update(context.targetEntity, context.input, {
				[context.targetRelation.name]: {
					connect: { [context.entity.primary]: value },
				},
			})
		},
		create: async (context: Context.OneHasOneInversedContext & { input: Input.CreateDataInput }): Promise<void> => {
			const primary = await this.insertBuilder.insert
			await this.mapper.insert(context.targetEntity, {
				...context.input,
				[context.targetRelation.name]: {
					connect: { [context.entity.primary]: primary },
				},
			})
		},
	}
}
