import { Input, Model } from 'cms-common'
import { isIt } from '../../../utils/type'
import Mapper from '../mapper'
import UpdateBuilder from './UpdateBuilder'

interface HasOneRelationInputProcessor {
	connect(input: Input.UniqueWhere): PromiseLike<void>

	create(input: Input.CreateDataInput): PromiseLike<void>

	update(input: Input.UpdateDataInput): PromiseLike<void>

	upsert(update: Input.UpdateDataInput, create: Input.CreateDataInput): PromiseLike<void>

	disconnect(): PromiseLike<void>

	delete(): PromiseLike<void>
}

interface HasManyRelationInputProcessor {
	connect(input: Input.UniqueWhere): PromiseLike<void>

	create(input: Input.CreateDataInput): PromiseLike<void>

	update(where: Input.UniqueWhere, input: Input.UpdateDataInput): PromiseLike<void>

	upsert(where: Input.UniqueWhere, update: Input.UpdateDataInput, create: Input.CreateDataInput): PromiseLike<void>

	disconnect(where: Input.UniqueWhere): PromiseLike<void>

	delete(where: Input.UniqueWhere): PromiseLike<void>
}

export default class UpdateVisitor implements Model.ColumnVisitor<void>, Model.RelationByTypeVisitor<PromiseLike<any>> {
	private primaryValue: Input.PrimaryValue
	private data: Input.UpdateDataInput
	private updateBuilder: UpdateBuilder
	private mapper: Mapper

	constructor(
		primaryValue: Input.PrimaryValue,
		data: Input.UpdateDataInput,
		updateBuilder: UpdateBuilder,
		mapper: Mapper
	) {
		this.primaryValue = primaryValue
		this.data = data
		this.updateBuilder = updateBuilder
		this.mapper = mapper
	}

	public visitColumn(entity: Model.Entity, column: Model.AnyColumn): void {
		if (this.data[column.name] !== undefined) {
			this.updateBuilder.addColumnData(column.columnName, this.data[column.name] as Input.ColumnValue)
		}
	}

	public visitManyHasManyInversed(
		entity: Model.Entity,
		relation: Model.ManyHasManyInversedRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasManyOwnerRelation
	) {
		const relationData = this.data[relation.name] as Input.CreateManyRelationInput
		if (relationData === undefined) {
			return Promise.resolve(undefined)
		}
		const thisUnique = { [entity.primary]: this.primaryValue }

		const mapper = this.mapper

		const connect = (primaryUnique: Input.UniqueWhere) =>
			mapper.connectJunction(targetEntity, targetRelation, primaryUnique, thisUnique)
		const disconnect = (primaryUnique: Input.UniqueWhere) =>
			mapper.disconnectJunction(targetEntity, targetRelation, primaryUnique, thisUnique)

		return this.processHasManyRelationInput(
			relationData,
			new class implements HasManyRelationInputProcessor {
				public async connect(input: Input.UniqueWhere) {
					await connect(input)
				}

				public async create(input: Input.CreateDataInput) {
					const primaryOwner = await mapper.insert(targetEntity, input)
					await connect({ [targetEntity.primary]: primaryOwner })
				}

				public async delete(where: Input.UniqueWhere) {
					await disconnect(where)
					await mapper.delete(targetEntity, where)
				}

				public async disconnect(where: Input.UniqueWhere) {
					await disconnect(where)
				}

				public async update(where: Input.UniqueWhere, input: Input.UpdateDataInput) {
					// fixme should check if relation really exists
					await mapper.update(targetEntity, where, input)
					await connect(where)
				}

				public async upsert(where: Input.UniqueWhere, update: Input.UpdateDataInput, create: Input.CreateDataInput) {
					// fixme should check if relation really exists
					const result = await mapper.update(targetEntity, where, update)
					if (result > 0) {
						// fixme it should already exist
						await connect(where)
					} else {
						const primaryValue = await mapper.insert(targetEntity, create)
						await connect({ [targetEntity.primary]: primaryValue })
					}
				}
			}()
		)
	}

	public visitManyHasManyOwner(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasManyInversedRelation | null
	) {
		const relationData = this.data[relation.name] as Input.UpdateManyRelationInput
		if (relationData === undefined) {
			return Promise.resolve(undefined)
		}
		const primaryUnique = { [entity.primary]: this.primaryValue }

		const mapper = this.mapper

		const connect = (inversedUnique: Input.UniqueWhere) =>
			mapper.connectJunction(entity, relation, primaryUnique, inversedUnique)
		const disconnect = (inversedUnique: Input.UniqueWhere) =>
			mapper.disconnectJunction(entity, relation, primaryUnique, inversedUnique)

		return this.processHasManyRelationInput(
			relationData,
			new class implements HasManyRelationInputProcessor {
				public async connect(input: Input.UniqueWhere) {
					await connect(input)
				}

				public async create(input: Input.CreateDataInput) {
					const primaryOwner = await mapper.insert(targetEntity, input)
					await connect({ [targetEntity.primary]: primaryOwner })
				}

				public async delete(where: Input.UniqueWhere) {
					await disconnect(where)
					await mapper.delete(targetEntity, where)
				}

				public async disconnect(where: Input.UniqueWhere) {
					await disconnect(where)
				}

				public async update(where: Input.UniqueWhere, input: Input.UpdateDataInput) {
					// fixme should check if relation really exists
					await mapper.update(targetEntity, where, input)
					// fixme it should already exist
					await connect(where)
				}

				public async upsert(where: Input.UniqueWhere, update: Input.UpdateDataInput, create: Input.CreateDataInput) {
					// fixme should check if relation really exists
					const result = await mapper.update(targetEntity, where, update)
					if (result > 0) {
						// fixme it should already exist
						await connect(where)
					} else {
						const primaryValue = await mapper.insert(targetEntity, create)
						await connect({ [targetEntity.primary]: primaryValue })
					}
				}
			}()
		)
	}

	public visitManyHasOne(
		entity: Model.Entity,
		relation: Model.ManyHasOneRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.OneHasManyRelation | null
	) {
		const relationData = this.data[relation.name] as Input.UpdateOneRelationInput
		const updateBuilder = this.updateBuilder
		const mapper = this.mapper
		const primaryUnique = { [entity.primary]: this.primaryValue }

		return this.processHasOneRelationInput(
			relationData,
			new class implements HasOneRelationInputProcessor {
				public async connect(input: Input.UniqueWhere) {
					updateBuilder.addColumnData(relation.joiningColumn.columnName, mapper.getPrimaryValue(targetEntity, input))
				}

				public async create(input: Input.CreateDataInput) {
					updateBuilder.addColumnData(relation.joiningColumn.columnName, mapper.insert(targetEntity, input))
				}

				public async delete() {
					updateBuilder.addColumnData(relation.joiningColumn.columnName, null)
					const inversedPrimary = await mapper.selectField(entity, primaryUnique, relation.name)
					await updateBuilder.update
					await mapper.delete(targetEntity, { [targetEntity.primary]: inversedPrimary })
				}

				public async disconnect() {
					updateBuilder.addColumnData(relation.joiningColumn.columnName, null)
				}

				public async update(input: Input.UpdateDataInput) {
					const inversedPrimary = await mapper.selectField(entity, primaryUnique, relation.name)
					await mapper.update(targetEntity, { [targetEntity.primary]: inversedPrimary }, input)
				}

				public async upsert(update: Input.UpdateDataInput, create: Input.CreateDataInput) {
					const select = mapper.selectField(entity, primaryUnique, relation.name)

					//addColumnData has to be called synchronously
					updateBuilder.addColumnData(relation.joiningColumn.columnName, async () => {
						const primary = await select
						if (primary) {
							return undefined
						}
						return mapper.insert(targetEntity, create)
					})

					const inversedPrimary = await select
					if (inversedPrimary) {
						await mapper.update(targetEntity, { [targetEntity.primary]: inversedPrimary }, update)
					}
				}
			}()
		)
	}

	public visitOneHasMany(
		entity: Model.Entity,
		relation: Model.OneHasManyRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasOneRelation
	) {
		const relationData = this.data[relation.name] as Input.CreateManyRelationInput
		if (relationData === undefined) {
			return Promise.resolve(undefined)
		}
		const primaryValue = this.primaryValue
		const thisPrimary = { [entity.primary]: primaryValue }

		const mapper = this.mapper

		return this.processHasManyRelationInput(
			relationData,
			new class implements HasManyRelationInputProcessor {
				public async connect(input: Input.UniqueWhere) {
					await mapper.update(targetEntity, input, {
						[targetRelation.name]: { connect: thisPrimary }
					})
				}

				public async create(input: Input.CreateDataInput) {
					await mapper.insert(targetEntity, {
						...input,
						[targetRelation.name]: { connect: thisPrimary }
					})
				}

				public async delete(where: Input.UniqueWhere) {
					await mapper.delete(targetEntity, { ...where, [targetRelation.name]: primaryValue })
				}

				public async disconnect(where: Input.UniqueWhere) {
					await mapper.update(
						targetEntity,
						{ ...where, [targetRelation.name]: primaryValue },
						{ [targetRelation.name]: { disconnect: true } }
					)
				}

				public async update(where: Input.UniqueWhere, input: Input.UpdateDataInput) {
					await mapper.update(
						targetEntity,
						{ ...where, [targetRelation.name]: primaryValue },
						{
							...input
							// [targetRelation.name]: {connect: thisPrimary}
						}
					)
				}

				public async upsert(where: Input.UniqueWhere, update: Input.UpdateDataInput, create: Input.CreateDataInput) {
					const result = await mapper.update(
						targetEntity,
						{ ...where, [targetRelation.name]: primaryValue },
						{
							...update
							// [targetRelation.name]: {connect: thisPrimary}
						}
					)
					if (result === 0) {
						await mapper.insert(targetEntity, {
							...create,
							[targetRelation.name]: { connect: thisPrimary }
						})
					}
				}
			}()
		)
	}

	public visitOneHasOneInversed(
		entity: Model.Entity,
		relation: Model.OneHasOneInversedRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.OneHasOneOwnerRelation
	) {
		const relationData = this.data[relation.name] as Input.UpdateOneRelationInput
		const thisPrimary = { [entity.primary]: this.primaryValue }

		const mapper = this.mapper

		const primaryValue = this.primaryValue

		return this.processHasOneRelationInput(
			relationData,
			new class implements HasOneRelationInputProcessor {
				public async connect(where: Input.UniqueWhere) {
					await mapper.update(targetEntity, where, { [targetRelation.name]: { connect: thisPrimary } })
				}

				public async create(input: Input.CreateDataInput) {
					await mapper.update(
						targetEntity,
						{ [targetRelation.name]: primaryValue },
						{ [targetRelation.name]: { disconnect: true } }
					)
					await mapper.insert(targetEntity, {
						...input,
						[targetRelation.name]: { connect: thisPrimary }
					})
				}

				public async delete() {
					await mapper.delete(targetEntity, { [targetRelation.name]: primaryValue })
				}

				public async disconnect() {
					await mapper.update(
						targetEntity,
						{ [targetRelation.name]: primaryValue },
						{ [targetRelation.name]: { disconnect: true } }
					)
				}

				public async update(input: Input.UpdateDataInput) {
					await mapper.update(targetEntity, { [targetRelation.name]: primaryValue }, input)
				}

				public async upsert(update: Input.UpdateDataInput, create: Input.CreateDataInput) {
					const result = await mapper.update(targetEntity, { [targetRelation.name]: primaryValue }, update)
					if (result === 0) {
						await mapper.insert(targetEntity, {
							...create,
							[targetRelation.name]: { connect: thisPrimary }
						})
					}
				}
			}()
		)
	}

	public visitOneHasOneOwner(
		entity: Model.Entity,
		relation: Model.OneHasOneOwnerRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.OneHasOneInversedRelation | null
	) {
		const relationData = this.data[relation.name] as Input.UpdateOneRelationInput
		const updateBuilder = this.updateBuilder
		const mapper = this.mapper
		const primaryValue = this.primaryValue
		const primaryUnique = { [entity.primary]: primaryValue }

		return this.processHasOneRelationInput(
			relationData,
			new class implements HasOneRelationInputProcessor {
				public async connect(input: Input.UniqueWhere) {
					updateBuilder.addColumnData(relation.joiningColumn.columnName, async () => {
						const relationPrimary = await mapper.getPrimaryValue(targetEntity, input)
						const currentOwner = await mapper.selectField(entity, { [relation.name]: relationPrimary }, entity.primary)
						if (currentOwner === primaryValue) {
							return undefined
						}
						if (currentOwner) {
							await mapper.update(
								entity,
								{
									[entity.primary]: currentOwner
								},
								{ [relation.name]: { disconnect: true } }
							)
						}
						return relationPrimary
					})
				}

				public async create(input: Input.CreateDataInput) {
					updateBuilder.addColumnData(relation.joiningColumn.columnName, mapper.insert(targetEntity, input))
				}

				public async delete() {
					updateBuilder.addColumnData(relation.joiningColumn.columnName, null)
					const inversedPrimary = await mapper.selectField(entity, primaryUnique, relation.name)
					await mapper.delete(targetEntity, { [targetEntity.primary]: inversedPrimary })
				}

				public async disconnect() {
					updateBuilder.addColumnData(relation.joiningColumn.columnName, null)
				}

				public async update(input: Input.UpdateDataInput) {
					const inversedPrimary = await mapper.selectField(entity, primaryUnique, relation.name)
					await mapper.update(targetEntity, { [targetEntity.primary]: inversedPrimary }, input)
				}

				public async upsert(update: Input.UpdateDataInput, create: Input.CreateDataInput) {
					const select = mapper.selectField(entity, primaryUnique, relation.name)

					//addColumnData has to be called synchronously
					updateBuilder.addColumnData(relation.joiningColumn.columnName, async () => {
						const primary = await select
						if (primary) {
							return undefined
						}
						return mapper.insert(targetEntity, create)
					})

					const inversedPrimary = await select
					if (inversedPrimary) {
						await mapper.update(targetEntity, { [targetEntity.primary]: inversedPrimary }, update)
					}
				}
			}()
		)
	}

	private processHasOneRelationInput(
		input: Input.UpdateOneRelationInput | undefined,
		processor: HasOneRelationInputProcessor
	): PromiseLike<any> {
		if (input === undefined) {
			return Promise.resolve(undefined)
		}
		const operation = []
		let result
		if (isIt<Input.ConnectRelationInput>(input, 'connect')) {
			operation.push('connect')
			result = processor.connect(input.connect)
		}
		if (isIt<Input.CreateRelationInput>(input, 'create')) {
			operation.push('create')
			result = processor.create(input.create)
		}
		if (isIt<Input.DeleteRelationInput>(input, 'delete')) {
			operation.push('delete')
			result = processor.delete()
		}
		if (isIt<Input.DisconnectRelationInput>(input, 'disconnect')) {
			operation.push('disconnect')
			result = processor.disconnect()
		}
		if (isIt<Input.UpdateRelationInput>(input, 'update')) {
			operation.push('update')
			result = processor.update(input.update)
		}
		if (isIt<Input.UpsertRelationInput>(input, 'upsert')) {
			operation.push('upsert')
			result = processor.upsert(input.upsert.update, input.upsert.create)
		}

		if (operation.length !== 1) {
			const found = operation.length === 0 ? 'none' : operation.join(', ')
			throw new Error(
				`Expected exactly one of: "create", "connect", "delete", "disconnect", "update" or "upsert". ${found} found.`
			)
		}
		if (result === undefined) {
			throw new Error()
		}
		return result
	}

	private processHasManyRelationInput(
		input: Input.UpdateManyRelationInput | undefined,
		processor: HasManyRelationInputProcessor
	): PromiseLike<any> {
		if (input === undefined) {
			return Promise.resolve(undefined)
		}
		const promises: Array<PromiseLike<void>> = []
		for (const element of input) {
			const operation = []
			let result
			if (isIt<Input.ConnectRelationInput>(element, 'connect')) {
				operation.push('connect')
				result = processor.connect(element.connect)
			}
			if (isIt<Input.CreateRelationInput>(element, 'create')) {
				operation.push('create')
				result = processor.create(element.create)
			}
			if (isIt<Input.DeleteSpecifiedRelationInput>(element, 'delete')) {
				operation.push('delete')
				result = processor.delete(element.delete)
			}
			if (isIt<Input.DisconnectSpecifiedRelationInput>(element, 'disconnect')) {
				operation.push('disconnect')
				result = processor.disconnect(element.disconnect)
			}
			if (isIt<Input.UpdateSpecifiedRelationInput>(element, 'update')) {
				operation.push('update')
				result = processor.update(element.update.where, element.update.data)
			}
			if (isIt<Input.UpsertSpecifiedRelationInput>(element, 'upsert')) {
				operation.push('upsert')
				result = processor.upsert(element.upsert.where, element.upsert.update, element.upsert.create)
			}
			if (operation.length !== 1) {
				const found = operation.length === 0 ? 'none' : operation.join(', ')
				throw new Error(
					`Expected exactly one of: "create", "connect", "delete", "disconnect", "update" or "upsert". ${found} found.`
				)
			}
			if (result !== undefined) {
				promises.push(result)
			}
		}
		return Promise.all(promises)
	}
}
