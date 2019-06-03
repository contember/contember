import { Input, Model } from 'cms-common'
import Mapper from '../Mapper'
import { uuid } from '../../../utils/uuid'
import InsertBuilder from './InsertBuilder'
import { resolveDefaultValue } from '../../../content-schema/dataUtils'
import CreateInputProcessor from '../../inputProcessing/CreateInputProcessor'

export default class SqlCreateInputProcessor implements CreateInputProcessor {
	constructor(private readonly insertBuilder: InsertBuilder, private readonly mapper: Mapper) {}

	public async processColumn({ entity, column, input }: CreateInputProcessor.ColumnContext): Promise<void> {
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

	public async processManyHasManyInversedConnect(
		context: CreateInputProcessor.ManyHasManyInversedContext<Input.UniqueWhere>
	): Promise<void> {
		const primaryInversed = await this.insertBuilder.insert
		await this.mapper.connectJunction(
			context.targetEntity,
			context.targetRelation,
			{ [context.targetEntity.primary]: context.input[context.targetEntity.primary] },
			{ [context.entity.primary]: primaryInversed }
		)
	}

	public async processManyHasManyInversedCreate(
		context: CreateInputProcessor.ManyHasManyInversedContext<Input.CreateDataInput>
	): Promise<void> {
		const primaryInversed = await this.insertBuilder.insert
		const primaryOwner = await this.mapper.insert(context.targetEntity, context.input)
		await this.mapper.connectJunction(
			context.targetEntity,
			context.targetRelation,
			{ [context.targetEntity.primary]: primaryOwner },
			{ [context.entity.primary]: primaryInversed }
		)
	}

	public async processManyHasManyOwnerConnect(
		context: CreateInputProcessor.ManyHasManyOwnerContext<Input.UniqueWhere>
	): Promise<void> {
		const primary = await this.insertBuilder.insert
		await this.mapper.connectJunction(
			context.entity,
			context.relation,
			{ [context.entity.primary]: primary },
			{ [context.targetEntity.primary]: context.input[context.targetEntity.primary] }
		)
	}

	public async processManyHasManyOwnerCreate(
		context: CreateInputProcessor.ManyHasManyOwnerContext<Input.CreateDataInput>
	): Promise<void> {
		const primary = await this.insertBuilder.insert
		const primaryInversed = await this.mapper.insert(context.targetEntity, context.input)
		await this.mapper.connectJunction(
			context.entity,
			context.relation,
			{ [context.entity.primary]: primary },
			{ [context.targetEntity.primary]: primaryInversed }
		)
	}

	public async processManyHasOneConnect(
		context: CreateInputProcessor.ManyHasOneContext<Input.UniqueWhere>
	): Promise<void> {
		this.insertBuilder.addFieldValue(
			context.relation.name,
			this.mapper.getPrimaryValue(context.targetEntity, context.input)
		)
	}

	public async processManyHasOneCreate(
		context: CreateInputProcessor.ManyHasOneContext<Input.CreateDataInput>
	): Promise<void> {
		this.insertBuilder.addFieldValue(context.relation.name, this.mapper.insert(context.targetEntity, context.input))
	}

	public async processOneHasManyConnect(
		context: CreateInputProcessor.OneHasManyContext<Input.UniqueWhere>
	): Promise<void> {
		const value = await this.insertBuilder.insert
		await this.mapper.update(context.targetEntity, context.input, {
			[context.targetRelation.name]: {
				connect: { [context.relation.name]: value },
			},
		})
	}

	public async processOneHasManyCreate(
		context: CreateInputProcessor.OneHasManyContext<Input.CreateDataInput>
	): Promise<void> {
		const primary = await this.insertBuilder.insert
		await this.mapper.insert(context.targetEntity, {
			...context.input,
			[context.targetRelation.name]: {
				connect: { [context.entity.primary]: primary },
			},
		})
	}

	public async processOneHasOneInversedConnect(
		context: CreateInputProcessor.OneHasOneInversedContext<Input.UniqueWhere>
	): Promise<void> {
		const value = await this.insertBuilder.insert
		await this.mapper.update(context.targetEntity, context.input, {
			[context.targetRelation.name]: {
				connect: { [context.entity.primary]: value },
			},
		})
	}

	public async processOneHasOneInversedCreate(
		context: CreateInputProcessor.OneHasOneInversedContext<Input.CreateDataInput>
	): Promise<void> {
		const primary = await this.insertBuilder.insert
		await this.mapper.insert(context.targetEntity, {
			...context.input,
			[context.targetRelation.name]: {
				connect: { [context.entity.primary]: primary },
			},
		})
	}

	public async processOneHasOneOwnerConnect(
		context: CreateInputProcessor.OneHasOneOwnerContext<Input.UniqueWhere>
	): Promise<void> {
		this.insertBuilder.addFieldValue(
			context.relation.name,
			this.mapper.getPrimaryValue(context.targetEntity, context.input)
		)
	}

	public async processOneHasOneOwnerCreate(
		context: CreateInputProcessor.OneHasOneOwnerContext<Input.CreateDataInput>
	): Promise<void> {
		this.insertBuilder.addFieldValue(context.relation.name, this.mapper.insert(context.targetEntity, context.input))
	}

	private resolvePrimaryGenerator(column: Model.AnyColumn): () => Input.PrimaryValue {
		if (column.type === Model.ColumnType.Uuid) {
			return uuid
		}
		throw new Error('not implemented')
	}
}
