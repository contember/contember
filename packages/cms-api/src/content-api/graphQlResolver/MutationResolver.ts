import { Input, Model, Result, Value } from 'cms-common'
import ObjectNode from './ObjectNode'
import UniqueWhereExpander from './UniqueWhereExpander'
import Mapper from '../sql/Mapper'
import { UserError } from 'graphql-errors'
import InputValidator from '../input-validation/InputValidator'
import ValidationResolver from './ValidationResolver'

type WithoutNode<T extends { node: any }> = Pick<T, Exclude<keyof T, 'node'>>

export default class MutationResolver {
	constructor(
		private readonly mapper: Mapper,
		private readonly uniqueWhereExpander: UniqueWhereExpander,
		private readonly inputValidator: InputValidator
	) {}

	public async resolveUpdate(
		entity: Model.Entity,
		input: Input.UpdateInput,
		queryAst: ObjectNode<Input.UpdateInput>
	): Promise<WithoutNode<Result.UpdateResult>> {
		const validationResult = await this.inputValidator.validateUpdate(entity, input.by, input.data)
		if (validationResult.length > 0) {
			return { ok: false, validation: ValidationResolver.createValidationResponse(validationResult) }
		}
		try {
			await this.mapper.update(entity, input.by, input.data)
		} catch (e) {
			if (!(e instanceof Mapper.NoResultError)) {
				throw e
			}
			throw new UserError('Mutation failed, operation denied by ACL rules')
		}

		const whereExpanded = this.uniqueWhereExpander.expand(entity, input.by)
		const nodes = await this.resolveResultNodes(entity, whereExpanded, queryAst)
		return {
			ok: true,
			validation: {
				valid: true,
				errors: [],
			},
			...nodes,
		}
	}

	public async resolveCreate(
		entity: Model.Entity,
		input: Input.CreateInput,
		queryAst: ObjectNode
	): Promise<WithoutNode<Result.CreateResult>> {
		const validationResult = await this.inputValidator.validateCreate(entity, input.data)
		if (validationResult.length > 0) {
			return { ok: false, validation: ValidationResolver.createValidationResponse(validationResult) }
		}
		let primary: Input.PrimaryValue
		try {
			primary = await this.mapper.insert(entity, input.data)
		} catch (e) {
			if (!(e instanceof Mapper.NoResultError)) {
				throw e
			}
			throw new UserError('Mutation failed, operation denied by ACL rules')
		}

		const nodes = await this.resolveResultNodes(entity, { [entity.primary]: { eq: primary } }, queryAst)
		return {
			ok: true,
			validation: {
				valid: true,
				errors: [],
			},
			...nodes,
		}
	}

	public async resolveDelete(entity: Model.Entity, input: Input.DeleteInput, queryAst: ObjectNode) {
		const whereExpanded = this.uniqueWhereExpander.expand(entity, input.by)

		const nodes = await this.resolveResultNodes(entity, whereExpanded, queryAst)

		try {
			await this.mapper.delete(entity, queryAst.args.by)
		} catch (e) {
			if (!(e instanceof Mapper.NoResultError)) {
				throw e
			}
			throw new UserError('Mutation failed, operation denied by ACL rules')
		}

		return { ok: true, ...nodes }
	}

	private async resolveResultNodes(
		entity: Model.Entity,
		where: Input.Where,
		queryAst: ObjectNode
	): Promise<Record<string, Value.Object>> {
		const nodeQuery = queryAst.findFieldByName('node')
		let nodes: Record<string, any> = {}
		for (const singleNodeQuery of nodeQuery) {
			if (!(singleNodeQuery instanceof ObjectNode)) {
				throw new Error()
			}
			const objectWithArgs = singleNodeQuery.withArgs({ filter: where })
			nodes[singleNodeQuery.alias] = (await this.mapper.select(entity, objectWithArgs))[0] || null
		}
		return nodes
	}
}
