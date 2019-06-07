import { assertNever, Input, Model } from 'cms-common'
import ObjectNode from './ObjectNode'
import UniqueWhereExpander from './UniqueWhereExpander'
import Mapper from '../sql/Mapper'
import { UserError } from 'graphql-errors'
import InputValidator from '../input-validation/InputValidator'

export default class MutationResolver {
	constructor(
		private readonly mapper: Mapper,
		private readonly uniqueWhereExpander: UniqueWhereExpander,
		private readonly inputValidator: InputValidator
	) {}

	public async resolveUpdate(entity: Model.Entity, input: Input.UpdateInput, queryAst: ObjectNode<Input.UpdateInput>) {
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

	public async resolveCreate(entity: Model.Entity, input: Input.CreateInput, queryAst: ObjectNode) {
		const validationResult = await this.inputValidator.validateCreate(entity, input.data)
		if (validationResult.length > 0) {
			return {
				ok: false,
				validation: {
					valid: false,
					errors: validationResult.map(it => ({
						message: it.message,
						path: it.path.map(part => {
							switch (typeof part) {
								case 'number':
									return { __typename: '_IndexPathFragment', index: part }
								case 'string':
									return { __typename: '_FieldPathFragment', field: part }
								default:
									assertNever(part)
							}
						}),
					})),
				},
				node: null,
			}
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

	private async resolveResultNodes(entity: Model.Entity, where: Input.Where, queryAst: ObjectNode): Promise<Record<string, any>> {
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

	public async resolveDelete(entity: Model.Entity, queryAst: ObjectNode<Input.DeleteInput>) {
		const whereExpanded = this.uniqueWhereExpander.expand(entity, queryAst.args.by)
		const queryExpanded = queryAst.withArg<Input.ListQueryInput>('filter', whereExpanded)

		const result = (await this.mapper.select(entity, queryExpanded))[0] || null

		try {
			await this.mapper.delete(entity, queryAst.args.by)
		} catch (e) {
			if (!(e instanceof Mapper.NoResultError)) {
				throw e
			}
			throw new UserError('Mutation failed, operation denied by ACL rules')
		}

		return result
	}
}
