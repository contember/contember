import { Input, Value } from '@contember/schema'
import Mapper from '../Mapper'
import UpdateBuilder from './UpdateBuilder'
import UpdateInputProcessor from '../../inputProcessing/UpdateInputProcessor'
import * as Context from '../../inputProcessing/InputContext'
import { NotNullConstraintViolation } from '../Constraints'

export default class SqlUpdateInputProcessor implements UpdateInputProcessor<void> {
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
		return Promise.resolve()
	}

	manyHasManyInversed: UpdateInputProcessor['manyHasManyInversed'] = {
		connect: async ({ targetEntity, targetRelation, input, entity }) => {
			await this.mapper.connectJunction(targetEntity, targetRelation, input, { [entity.primary]: this.primaryValue })
		},
		create: async ({ targetEntity, targetRelation, input, entity }) => {
			const primaryOwner = await this.mapper.insert(targetEntity, input)
			await this.mapper.connectJunction(
				targetEntity,
				targetRelation,
				{ [targetEntity.primary]: primaryOwner },
				{ [entity.primary]: this.primaryValue },
			)
		},
		update: async ({ targetEntity, targetRelation, input: { where, data }, entity }) => {
			await this.mapper.update(targetEntity, where, data)
			await this.mapper.connectJunction(targetEntity, targetRelation, where, { [entity.primary]: this.primaryValue })
		},
		upsert: async ({ targetEntity, targetRelation, input: { where, update, create }, entity }) => {
			try {
				await this.mapper.update(targetEntity, where, update)
				await this.mapper.connectJunction(targetEntity, targetRelation, where, { [entity.primary]: this.primaryValue })
			} catch (e) {
				if (e instanceof Mapper.NoResultError) {
					const primaryValue = await this.mapper.insert(targetEntity, create)
					await this.mapper.connectJunction(
						targetEntity,
						targetRelation,
						{ [targetEntity.primary]: primaryValue },
						{ [entity.primary]: this.primaryValue },
					)
				} else {
					throw e
				}
			}
		},
		delete: async ({ targetEntity, input }) => {
			await this.mapper.delete(targetEntity, input)
		},
		disconnect: async ({ targetEntity, targetRelation, input, entity }) => {
			await this.mapper.disconnectJunction(targetEntity, targetRelation, input, { [entity.primary]: this.primaryValue })
		},
	}

	manyHasManyOwner: UpdateInputProcessor['manyHasManyOwner'] = {
		connect: async ({ input, entity, relation }) => {
			await this.mapper.connectJunction(entity, relation, { [entity.primary]: this.primaryValue }, input)
		},
		create: async ({ targetEntity, input, entity, relation }) => {
			const primaryOwner = await this.mapper.insert(targetEntity, input)
			await this.mapper.connectJunction(
				entity,
				relation,
				{ [entity.primary]: this.primaryValue },
				{ [targetEntity.primary]: primaryOwner },
			)
		},
		update: async ({ targetEntity, input: { where, data }, entity, relation }) => {
			await this.mapper.update(targetEntity, where, data)
			await this.mapper.connectJunction(entity, relation, { [entity.primary]: this.primaryValue }, where)
		},
		upsert: async ({ targetEntity, input: { where, update, create }, entity, relation }) => {
			try {
				await this.mapper.update(targetEntity, where, update)
				await this.mapper.connectJunction(entity, relation, { [entity.primary]: this.primaryValue }, where)
			} catch (e) {
				if (e instanceof Mapper.NoResultError) {
					const primaryValue = await this.mapper.insert(targetEntity, create)
					await this.mapper.connectJunction(
						entity,
						relation,
						{ [entity.primary]: this.primaryValue },
						{ [targetEntity.primary]: primaryValue },
					)
				} else {
					throw e
				}
			}
		},
		delete: async ({ targetEntity, input }) => {
			await this.mapper.delete(targetEntity, input)
		},
		disconnect: async ({ input, entity, relation }) => {
			await this.mapper.disconnectJunction(entity, relation, { [entity.primary]: this.primaryValue }, input)
		},
	}

	manyHasOne: UpdateInputProcessor['manyHasOne'] = {
		connect: async ({ targetEntity, input, relation }) => {
			this.updateBuilder.addFieldValue(relation.name, this.mapper.getPrimaryValue(targetEntity, input))
		},
		create: async ({ targetEntity, input, relation }) => {
			this.updateBuilder.addFieldValue(relation.name, this.mapper.insert(targetEntity, input))
		},
		update: async ({ targetEntity, input, entity, relation }) => {
			const inversedPrimary = await this.mapper.selectField(
				entity,
				{ [entity.primary]: this.primaryValue },
				relation.name,
			)
			await this.mapper.update(targetEntity, { [targetEntity.primary]: inversedPrimary }, input)
		},
		upsert: async ({ targetEntity, input: { create, update }, entity, relation }) => {
			const select = this.mapper.selectField(entity, { [entity.primary]: this.primaryValue }, relation.name)

			//addColumnData has to be called synchronously
			this.updateBuilder.addFieldValue(relation.name, async () => {
				const primary = await select
				if (primary) {
					return undefined
				}
				return this.mapper.insert(targetEntity, create)
			})

			const inversedPrimary = await select
			if (inversedPrimary) {
				await this.mapper.update(targetEntity, { [targetEntity.primary]: inversedPrimary }, update)
			}
		},
		delete: async ({ targetEntity, entity, relation }) => {
			if (!relation.nullable) {
				throw new NotNullConstraintViolation(entity.name, relation.name)
			}
			this.updateBuilder.addFieldValue(relation.name, null)
			const inversedPrimary = await this.mapper.selectField(
				entity,
				{ [entity.primary]: this.primaryValue },
				relation.name,
			)
			await this.updateBuilder.update
			await this.mapper.delete(targetEntity, { [targetEntity.primary]: inversedPrimary })
		},
		disconnect: async ({ entity, relation }) => {
			if (!relation.nullable) {
				throw new NotNullConstraintViolation(entity.name, relation.name)
			}
			this.updateBuilder.addFieldValue(relation.name, null)
		},
	}

	oneHasMany: UpdateInputProcessor['oneHasMany'] = {
		connect: async ({ targetEntity, targetRelation, input, entity }) => {
			await this.mapper.update(targetEntity, input, {
				[targetRelation.name]: { connect: { [entity.primary]: this.primaryValue } },
			})
		},
		create: async ({ targetEntity, targetRelation, input, entity }) => {
			await this.mapper.insert(targetEntity, {
				...input,
				[targetRelation.name]: { connect: { [entity.primary]: this.primaryValue } },
			})
		},
		update: async ({ targetEntity, targetRelation, input: { where, data }, entity }) => {
			await this.mapper.update(
				targetEntity,
				{ ...where, [targetRelation.name]: { [entity.primary]: this.primaryValue } },
				{
					...data,
					// [targetRelation.name]: {connect: thisPrimary}
				},
			)
		},
		upsert: async ({ targetEntity, targetRelation, input: { create, where, update }, entity }) => {
			const result = await this.mapper.update(
				targetEntity,
				{ ...where, [targetRelation.name]: { [entity.primary]: this.primaryValue } },
				{
					...update,
					// [targetRelation.name]: {connect: thisPrimary}
				},
			)
			if (result === 0) {
				await this.mapper.insert(targetEntity, {
					...create,
					[targetRelation.name]: { connect: { [entity.primary]: this.primaryValue } },
				})
			}
		},
		delete: async ({ targetEntity, targetRelation, input, entity }) => {
			await this.mapper.delete(targetEntity, {
				...input,
				[targetRelation.name]: { [entity.primary]: this.primaryValue },
			})
		},
		disconnect: async ({ targetEntity, targetRelation, input, entity }) => {
			await this.mapper.update(
				targetEntity,
				{ ...input, [targetRelation.name]: { [entity.primary]: this.primaryValue } },
				{ [targetRelation.name]: { disconnect: true } },
			)
		},
	}

	oneHasOneInversed: UpdateInputProcessor['oneHasOneInversed'] = {
		connect: async ({ targetEntity, targetRelation, input, entity }) => {
			await this.mapper.update(targetEntity, input, {
				[targetRelation.name]: { connect: { [entity.primary]: this.primaryValue } },
			})
		},
		create: async ({ targetEntity, targetRelation, input, entity }) => {
			await this.mapper.update(
				targetEntity,
				{ [targetRelation.name]: { [entity.primary]: this.primaryValue } },
				{ [targetRelation.name]: { disconnect: true } },
			)
			await this.mapper.insert(targetEntity, {
				...input,
				[targetRelation.name]: { connect: { [entity.primary]: this.primaryValue } },
			})
		},
		update: async ({ targetEntity, targetRelation, input, entity }) => {
			await this.mapper.update(targetEntity, { [targetRelation.name]: { [entity.primary]: this.primaryValue } }, input)
		},
		upsert: async ({ targetEntity, targetRelation, input: { create, update }, entity }) => {
			const result = await this.mapper.update(
				targetEntity,
				{ [targetRelation.name]: { [entity.primary]: this.primaryValue } },
				update,
			)
			if (result === 0) {
				await this.mapper.insert(targetEntity, {
					...create,
					[targetRelation.name]: { connect: { [entity.primary]: this.primaryValue } },
				})
			}
		},
		delete: async ({ targetEntity, targetRelation, entity }) => {
			await this.mapper.delete(targetEntity, { [targetRelation.name]: { [entity.primary]: this.primaryValue } })
		},
		disconnect: async ({ targetEntity, targetRelation, entity }) => {
			await this.mapper.update(
				targetEntity,
				{ [targetRelation.name]: { [entity.primary]: this.primaryValue } },
				{ [targetRelation.name]: { disconnect: true } },
			)
		},
	}

	oneHasOneOwner: UpdateInputProcessor['oneHasOneOwner'] = {
		connect: async ({ targetEntity, input, entity, relation }) => {
			this.updateBuilder.addFieldValue(relation.name, async () => {
				const relationPrimary = (await this.mapper.getPrimaryValue(targetEntity, input)) as Input.PrimaryValue

				const currentOwner = await this.mapper.selectField(
					entity,
					{ [relation.name]: { [targetEntity.primary]: relationPrimary } },
					entity.primary,
				)
				if (currentOwner === this.primaryValue) {
					return undefined
				}
				if (currentOwner) {
					await this.mapper.update(
						entity,
						{
							[entity.primary]: currentOwner,
						},
						{ [relation.name]: { disconnect: true } },
					)
				}
				return relationPrimary
			})
		},
		create: async ({ targetEntity, input, relation }) => {
			this.updateBuilder.addFieldValue(relation.name, this.mapper.insert(targetEntity, input))
		},
		update: async ({ targetEntity, input, entity, relation }) => {
			const inversedPrimary = await this.mapper.selectField(
				entity,
				{ [entity.primary]: this.primaryValue },
				relation.name,
			)
			await this.mapper.update(targetEntity, { [targetEntity.primary]: inversedPrimary }, input)
		},
		upsert: async ({ targetEntity, input: { create, update }, entity, relation }) => {
			const select = this.mapper.selectField(entity, { [entity.primary]: this.primaryValue }, relation.name)

			//addColumnData has to be called synchronously
			this.updateBuilder.addFieldValue(relation.name, async () => {
				const primary = await select
				if (primary) {
					return undefined
				}
				return this.mapper.insert(targetEntity, create)
			})

			const inversedPrimary = await select
			if (inversedPrimary) {
				await this.mapper.update(targetEntity, { [targetEntity.primary]: inversedPrimary }, update)
			}
		},
		delete: async ({ targetEntity, entity, relation }) => {
			if (!relation.nullable) {
				throw new NotNullConstraintViolation(entity.name, relation.name)
			}
			this.updateBuilder.addFieldValue(relation.name, null)
			const inversedPrimary = await this.mapper.selectField(
				entity,
				{ [entity.primary]: this.primaryValue },
				relation.name,
			)
			await this.updateBuilder.update
			await this.mapper.delete(targetEntity, { [targetEntity.primary]: inversedPrimary })
		},
		disconnect: async ({ entity, relation }) => {
			if (!relation.nullable) {
				throw new NotNullConstraintViolation(entity.name, relation.name)
			}
			this.updateBuilder.addFieldValue(relation.name, null)
		},
	}
}
