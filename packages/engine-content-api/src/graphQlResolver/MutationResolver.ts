import { Input, Model, Result, Value } from '@contember/schema'
import ObjectNode from './ObjectNode'
import UniqueWhereExpander from './UniqueWhereExpander'
import Mapper from '../sql/Mapper'
import InputValidator from '../input-validation/InputValidator'
import ValidationResolver from './ValidationResolver'
import { ConstraintViolation } from '../sql/Constraints'
import { UserError } from './UserError'
import { GraphQLObjectType, GraphQLResolveInfo } from 'graphql'
import GraphQlQueryAstFactory from './GraphQlQueryAstFactory'
import { ImplementationException } from '../exception'
import { NoResultError } from '../sql/NoResultError'

type WithoutNode<T extends { node: any }> = Pick<T, Exclude<keyof T, 'node'>>

export default class MutationResolver {
	constructor(
		private readonly mapper: Mapper,
		private readonly uniqueWhereExpander: UniqueWhereExpander,
		private readonly inputValidator: InputValidator,
		private readonly graphqlQueryAstFactory: GraphQlQueryAstFactory,
	) {}

	public async resolveTransaction(info: GraphQLResolveInfo): Promise<Result.TransactionResult> {
		const queryAst = this.graphqlQueryAstFactory.create(info, (node, path) => {
			return (
				(path.length === 1 && !['ok', 'validation'].includes(node.name.value)) ||
				(path.length === 2 && node.name.value === 'node') ||
				path.length > 2 ||
				path.length === 0
			)
		})
		const fields = (info.returnType as GraphQLObjectType).getFields()

		// todo: pre-validation

		const trxResult: Record<string, any> = {}

		for (const field of queryAst.fields) {
			if (!(field instanceof ObjectNode)) {
				throw new ImplementationException()
			}
			const fieldConfig = fields[field.name]
			const extra = fieldConfig.extensions || {}
			if (!extra.operation || !extra.entity) {
				throw new ImplementationException()
			}
			let result: { ok: boolean; validation?: Result.ValidationResult }
			switch (extra.operation) {
				case 'create':
					result = await this.resolveCreateInternal(extra.entity, field)
					break
				case 'update':
					result = await this.resolveUpdateInternal(extra.entity, field)
					break
				case 'delete':
					result = await this.resolveDeleteInternal(extra.entity, field)
					break
				default:
					throw new ImplementationException()
			}
			if (!result.ok) {
				return {
					ok: false,
					validation: result.validation
						? {
								valid: result.validation.valid,
								errors: result.validation.errors.map(it => ({
									...it,
									path: [{ __typename: '_FieldPathFragment', field: field.alias }, ...it.path],
								})),
						  }
						: { valid: true, errors: [] },
				}
			}
			trxResult[field.alias] = result
		}

		return { ok: true, validation: { valid: true, errors: [] }, ...trxResult }
	}

	public async resolveUpdate(
		entity: Model.Entity,
		info: GraphQLResolveInfo,
	): Promise<WithoutNode<Result.UpdateResult>> {
		const queryAst = this.createQueryAst(info)
		return await this.resolveUpdateInternal(entity, queryAst)
	}

	private async resolveUpdateInternal(
		entity: Model.Entity,
		queryAst: ObjectNode<Input.UpdateInput>,
	): Promise<WithoutNode<Result.UpdateResult>> {
		const input = queryAst.args
		const validationResult = await this.inputValidator.validateUpdate(entity, input.by, input.data, [])
		if (validationResult.length > 0) {
			return { ok: false, validation: ValidationResolver.createValidationResponse(validationResult) }
		}
		try {
			await this.mapper.update(entity, input.by, input.data)
		} catch (e) {
			return this.handleError(e)
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
		info: GraphQLResolveInfo,
	): Promise<WithoutNode<Result.CreateResult>> {
		const queryAst = this.createQueryAst(info)

		return await this.resolveCreateInternal(entity, queryAst)
	}

	private async resolveCreateInternal(
		entity: Model.Entity,
		queryAst: ObjectNode<Input.CreateInput>,
	): Promise<WithoutNode<Result.CreateResult>> {
		const input = queryAst.args
		const validationResult = await this.inputValidator.validateCreate(entity, input.data, [], null)
		if (validationResult.length > 0) {
			return { ok: false, validation: ValidationResolver.createValidationResponse(validationResult) }
		}
		let primary: Input.PrimaryValue
		try {
			primary = await this.mapper.insert(entity, input.data)
		} catch (e) {
			return this.handleError(e)
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

	public async resolveDelete(
		entity: Model.Entity,
		info: GraphQLResolveInfo,
	): Promise<WithoutNode<Result.DeleteResult>> {
		const queryAst = this.createQueryAst(info)
		return await this.resolveDeleteInternal(entity, queryAst)
	}

	private async resolveDeleteInternal(
		entity: Model.Entity,
		queryAst: ObjectNode<Input.DeleteInput>,
	): Promise<WithoutNode<Result.DeleteResult>> {
		const input = queryAst.args
		const whereExpanded = this.uniqueWhereExpander.expand(entity, input.by)

		const nodes = await this.resolveResultNodes(entity, whereExpanded, queryAst)

		try {
			await this.mapper.delete(entity, queryAst.args.by)
		} catch (e) {
			return this.handleError(e)
		}

		return { ok: true, ...nodes }
	}

	private createQueryAst(info: GraphQLResolveInfo) {
		const queryAst = this.graphqlQueryAstFactory.create(info, (node, path) => {
			return path.length !== 1 || node.name.value === 'node'
		})
		return queryAst
	}

	private handleError(e: Error): never {
		if (e instanceof NoResultError) {
			throw new UserError('Mutation failed, operation denied by ACL rules')
		} else if (e instanceof ConstraintViolation) {
			console.error(e)
			throw new UserError('Constraint violations: ' + e.message)
		}
		throw e
	}

	private async resolveResultNodes(
		entity: Model.Entity,
		where: Input.Where,
		queryAst: ObjectNode,
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
