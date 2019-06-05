import { Input, Model } from 'cms-common'
import Mapper from '../Mapper'
import { uuid } from '../../../utils/uuid'
import InsertBuilder from './InsertBuilder'
import { resolveDefaultValue } from '../../../content-schema/dataUtils'
import CreateInputProcessor from '../../inputProcessing/CreateInputProcessor'
import * as Context from '../../inputProcessing/InputContext'

export default class SqlCreateInputProcessor implements CreateInputProcessor {
	constructor(private readonly insertBuilder: InsertBuilder, private readonly mapper: Mapper) {}

	public async column({ entity, column, input }: Context.ColumnContext): Promise<void> {
		this.insertBuilder.addFieldValue(
			column.name,
			(() => {
				if (input !== undefined) {
					return input
				}
				if (entity.primary === column.name) {
					return this.resolvePrimaryGenerator(column)()
				}

				return resolveDefaultValue(column, new Date())
			})()
		)
		return Promise.resolve()
	}

	manyHasManyInversed = {
		connect: async (context: Context.ManyHasManyInversedContext & { input: Input.UniqueWhere }): Promise<void> => {
			const primaryInversed = await this.insertBuilder.insert
			await this.mapper.connectJunction(
				context.targetEntity,
				context.targetRelation,
				{ [context.targetEntity.primary]: context.input[context.targetEntity.primary] },
				{ [context.entity.primary]: primaryInversed }
			)
		},
		create: async (context: Context.ManyHasManyInversedContext & { input: Input.CreateDataInput }): Promise<void> => {
			const primaryInversed = await this.insertBuilder.insert
			const primaryOwner = await this.mapper.insert(context.targetEntity, context.input)
			await this.mapper.connectJunction(
				context.targetEntity,
				context.targetRelation,
				{ [context.targetEntity.primary]: primaryOwner },
				{ [context.entity.primary]: primaryInversed }
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
				{ [context.targetEntity.primary]: context.input[context.targetEntity.primary] }
			)
		},
		create: async (context: Context.ManyHasManyOwnerContext & { input: Input.CreateDataInput }): Promise<void> => {
			const primary = await this.insertBuilder.insert
			const primaryInversed = await this.mapper.insert(context.targetEntity, context.input)
			await this.mapper.connectJunction(
				context.entity,
				context.relation,
				{ [context.entity.primary]: primary },
				{ [context.targetEntity.primary]: primaryInversed }
			)
		},
	}

	manyHasOne = {
		connect: async (context: Context.ManyHasOneContext & { input: Input.UniqueWhere }): Promise<void> => {
			this.insertBuilder.addFieldValue(
				context.relation.name,
				this.mapper.getPrimaryValue(context.targetEntity, context.input)
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
				this.mapper.getPrimaryValue(context.targetEntity, context.input)
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

	private resolvePrimaryGenerator(column: Model.AnyColumn): () => Input.PrimaryValue {
		if (column.type === Model.ColumnType.Uuid) {
			return uuid
		}
		throw new Error('not implemented')
	}
}
