import { Input, Model, Result, Value } from '@contember/schema'
import Mapper from '../sql/Mapper'
import ValidationResolver from './ValidationResolver'
import { GraphQLResolveInfo } from 'graphql'
import GraphQlQueryAstFactory from './GraphQlQueryAstFactory'
import { ImplementationException } from '../exception'
import { Client, Connection, SerializationFailureError } from '@contember/database'
import { Operation, readOperationMeta } from '../graphQLSchema/OperationExtension'
import { assertNever } from '../utils'
import { ConstraintType, getInsertPrimary, InputErrorKind, MutationResultList, MutationResultType } from '../sql/Result'
import { InputPreValidator } from '../input-validation/preValidation/InputPreValidator'
import { ObjectNode } from '../inputProcessing'
import { retryTransaction } from '@contember/database/dist/src/utils'

type WithoutNode<T extends { node: any }> = Pick<T, Exclude<keyof T, 'node'>>

export default class MutationResolver {
	constructor(
		private readonly db: Client,
		private readonly mapperFactory: Mapper.Factory,
		private readonly systemVariablesSetup: (db: Client) => Promise<void>,
		private readonly inputValidator: InputPreValidator,
		private readonly graphqlQueryAstFactory: GraphQlQueryAstFactory,
	) {}

	public async resolveTransaction(info: GraphQLResolveInfo): Promise<Result.TransactionResult> {
		const queryAst = this.graphqlQueryAstFactory.create(info, (node, path) => {
			return (
				(path.length === 1 && !['ok', 'validation', 'errorMessage', 'errors'].includes(node.name.value)) ||
				(path.length === 2 && node.name.value === 'node') ||
				path.length > 2 ||
				path.length === 0
			)
		})
		const fields = GraphQlQueryAstFactory.resolveObjectType(info.returnType).getFields()

		const prefixErrors = <T extends { path: Result.PathFragment[] }>(errors: T[], field: string): T[] =>
			errors.map(it => ({
				...it,
				path: [{ __typename: '_FieldPathFragment', field }, ...it.path],
			}))

		return this.transaction(async (mapper, trx) => {
			const validationResult: Record<string, Result.MutationFieldResult> = {}
			const validationErrors: Result.ValidationError[] = []
			for (const field of queryAst.fields) {
				if (!(field instanceof ObjectNode)) {
					throw new ImplementationException()
				}
				const fieldConfig = fields[field.name]
				if (!fieldConfig) {
					throw new ImplementationException()
				}
				const meta = readOperationMeta(fieldConfig.extensions)

				const result: Result.ValidationResult | null = await (() => {
					switch (meta.operation) {
						case Operation.create:
							return this.validateCreate(mapper, meta.entity, field)
						case Operation.update:
							return this.validateUpdate(mapper, meta.entity, field)
						case Operation.delete:
							return null
						case Operation.get:
						case Operation.paginate:
						case Operation.list:
							throw new ImplementationException(`Invalid OperationMeta: ${String(meta)}`)
					}
					return assertNever(meta.operation)
				})()
				if (result !== null) {
					validationResult[field.alias] = {
						ok: false,
						validation: result,
						errors: [],
						errorMessage: this.stringifyValidationErrors(result.errors),
						node: null,
					}
					validationErrors.push(...prefixErrors(result.errors, field.alias))
				} else {
					validationResult[field.alias] = { ok: false, errors: [], validation: { valid: true, errors: [] }, node: null }
				}
			}
			if (validationErrors.length) {
				return {
					ok: false,
					errorMessage: this.stringifyValidationErrors(validationErrors),
					errors: [],
					validation: {
						valid: false,
						errors: validationErrors,
					},
					...validationResult,
				}
			}

			const trxResult: Record<string, { ok: boolean; validation?: Result.ValidationResult }> = {}
			for (const field of queryAst.fields) {
				if (!(field instanceof ObjectNode)) {
					throw new ImplementationException()
				}
				const fieldConfig = fields[field.name]
				if (!fieldConfig) {
					throw new ImplementationException()
				}
				const meta = readOperationMeta(fieldConfig.extensions)

				const result: {
					ok: boolean
					validation?: Result.ValidationResult
					errors: Result.ExecutionError[]
				} = await (() => {
					switch (meta.operation) {
						case Operation.create:
							return this.resolveCreateInternal(mapper, meta.entity, field)
						case Operation.update:
							return this.resolveUpdateInternal(mapper, meta.entity, field)
						case Operation.delete:
							return this.resolveDeleteInternal(mapper, meta.entity, field)
						case Operation.get:
						case Operation.paginate:
						case Operation.list:
							throw new ImplementationException()
					}
					return assertNever(meta.operation)
				})()

				if (!result.ok) {
					const validationErrors = result.validation ? prefixErrors(result.validation.errors, field.alias) : []
					const executionErrors = prefixErrors(result.errors, field.alias)
					return {
						ok: false,
						errors: executionErrors,
						validation: result.validation
							? {
									valid: result.validation.valid,
									errors: validationErrors,
							  }
							: { valid: true, errors: [] },
						errorMessage: [
							this.stringifyValidationErrors(validationErrors),
							this.stringifyExecutionErrors(executionErrors),
						]
							.filter(it => it !== undefined)
							.join('\n'),
						...validationResult,
						[field.alias]: result,
					}
				}
				trxResult[field.alias] = result
			}

			return { ok: true, errors: [], validation: { valid: true, errors: [] }, ...trxResult }
		})
	}

	public async resolveUpdate(
		entity: Model.Entity,
		info: GraphQLResolveInfo,
	): Promise<WithoutNode<Result.UpdateResult>> {
		const queryAst = this.createQueryAst(info)
		return this.transaction(async mapper => {
			const validation = await this.validateUpdate(mapper, entity, queryAst)
			if (validation !== null) {
				return { ok: false, validation, errors: [], errorMessage: this.stringifyValidationErrors(validation.errors) }
			}
			return await this.resolveUpdateInternal(mapper, entity, queryAst)
		})
	}

	private async validateUpdate(
		mapper: Mapper,
		entity: Model.Entity,
		queryAst: ObjectNode<Input.UpdateInput>,
	): Promise<Result.ValidationResult | null> {
		const input = queryAst.args
		const validationResult = await this.inputValidator.validateUpdate({
			mapper,
			entity,
			where: input.by,
			data: input.data,
			path: [],
		})
		if (validationResult.length > 0) {
			return ValidationResolver.createValidationResponse(validationResult)
		}
		return null
	}

	private async resolveUpdateInternal(
		mapper: Mapper,
		entity: Model.Entity,
		queryAst: ObjectNode<Input.UpdateInput>,
	): Promise<WithoutNode<Result.UpdateResult>> {
		const input = queryAst.args
		const result = await mapper.update(entity, input.by, input.data, input.filter)
		const errors = this.convertResultToErrors(result)
		if (errors.length > 0) {
			return {
				ok: false,
				validation: { valid: true, errors: [] },
				errors,
				errorMessage: this.stringifyExecutionErrors(errors),
			}
		}

		const nodes = await this.resolveResultNodes(mapper, entity, input.by, queryAst)
		return {
			ok: true,
			validation: {
				valid: true,
				errors: [],
			},
			errors: [],
			...nodes,
		}
	}

	public async resolveCreate(
		entity: Model.Entity,
		info: GraphQLResolveInfo,
	): Promise<WithoutNode<Result.CreateResult>> {
		const queryAst = this.createQueryAst(info)
		return this.transaction(async mapper => {
			const validation = await this.validateCreate(mapper, entity, queryAst)
			if (validation !== null) {
				return { ok: false, validation, errors: [], errorMessage: this.stringifyValidationErrors(validation.errors) }
			}
			return await this.resolveCreateInternal(mapper, entity, queryAst)
		})
	}

	private async validateCreate(
		mapper: Mapper,
		entity: Model.Entity,
		queryAst: ObjectNode<Input.CreateInput>,
	): Promise<Result.ValidationResult | null> {
		const input = queryAst.args
		const validationResult = await this.inputValidator.validateCreate({
			mapper,
			entity,
			data: input.data,
			path: [],
			overRelation: null,
		})
		if (validationResult.length > 0) {
			return ValidationResolver.createValidationResponse(validationResult)
		}
		return null
	}

	private async resolveCreateInternal(
		mapper: Mapper,
		entity: Model.Entity,
		queryAst: ObjectNode<Input.CreateInput>,
	): Promise<WithoutNode<Result.CreateResult>> {
		const input = queryAst.args
		const result = await mapper.insert(entity, input.data)
		const errors = this.convertResultToErrors(result)
		if (errors.length > 0) {
			return {
				ok: false,
				validation: { valid: true, errors: [] },
				errors,
				errorMessage: this.stringifyExecutionErrors(errors),
			}
		}
		const primary = getInsertPrimary(result)
		if (!primary) {
			throw new ImplementationException('MutationResolver::resolveCreateInternal does not handle result properly')
		}

		const nodes = await this.resolveResultNodes(mapper, entity, { [entity.primary]: primary }, queryAst)
		return {
			ok: true,
			validation: {
				valid: true,
				errors: [],
			},
			errors: [],
			...nodes,
		}
	}

	public async resolveDelete(
		entity: Model.Entity,
		info: GraphQLResolveInfo,
	): Promise<WithoutNode<Result.DeleteResult>> {
		const queryAst = this.createQueryAst(info)
		return this.transaction(async mapper => {
			return await this.resolveDeleteInternal(mapper, entity, queryAst)
		})
	}

	private async resolveDeleteInternal(
		mapper: Mapper,
		entity: Model.Entity,
		queryAst: ObjectNode<Input.DeleteInput>,
	): Promise<WithoutNode<Result.DeleteResult>> {
		const input = queryAst.args

		const nodes = await this.resolveResultNodes(mapper, entity, input.by, queryAst)

		const result = await mapper.delete(entity, queryAst.args.by, queryAst.args.filter)
		if (
			result.length === 1 &&
			(result[0].result === MutationResultType.ok || result[0].result === MutationResultType.nothingToDo)
		) {
			return { ok: true, errors: [], ...nodes }
		} else {
			const errors = this.convertResultToErrors(result)
			return { ok: false, errors, errorMessage: this.stringifyExecutionErrors(errors) }
		}
	}

	private createQueryAst(info: GraphQLResolveInfo) {
		const queryAst = this.graphqlQueryAstFactory.create(info, (node, path) => {
			return path.length !== 1 || node.name.value === 'node'
		})
		return queryAst
	}

	private async resolveResultNodes(
		mapper: Mapper,
		entity: Model.Entity,
		where: Input.UniqueWhere,
		queryAst: ObjectNode,
	): Promise<Record<string, Value.Object>> {
		const nodeQuery = queryAst.findFieldByName('node')
		let nodes: Record<string, any> = {}
		for (const singleNodeQuery of nodeQuery) {
			if (!(singleNodeQuery instanceof ObjectNode)) {
				throw new Error('MutationResolver: expected ObjectNode')
			}
			const objectWithArgs = singleNodeQuery.withArgs({ by: where })
			nodes[singleNodeQuery.alias] = await mapper.selectUnique(entity, objectWithArgs)
		}
		return nodes
	}

	private async transaction<R extends { ok: boolean }>(
		cb: (mapper: Mapper, db: Client<Connection.TransactionLike>) => Promise<R>,
	): Promise<R> {
		return await retryTransaction(async () => {
			return await this.db.transaction(async trx => {
				await trx.connection.query(Connection.REPEATABLE_READ)
				await this.systemVariablesSetup(trx)
				const mapper = this.mapperFactory(trx)

				const result = await cb(mapper, trx)
				if (!result.ok) {
					await trx.connection.rollback()
				}
				return result
			})
		})
	}

	private convertResultToErrors(result: MutationResultList): Result.ExecutionError[] {
		return result
			.filter(
				it =>
					![MutationResultType.ok, MutationResultType.nothingToDo, MutationResultType.validationError].includes(
						it.result,
					),
			)
			.map(it => {
				const path = it.path.map(it => ({
					...it,
					__typename: 'field' in it ? '_FieldPathFragment' : '_IndexPathFragment',
				}))
				switch (it.result) {
					case MutationResultType.constraintViolationError:
						switch (it.constraint) {
							case ConstraintType.notNull:
								return { path: path, type: Result.ExecutionErrorType.NotNullConstraintViolation, message: it.message }
							case ConstraintType.foreignKey:
								return {
									path: path,
									type: Result.ExecutionErrorType.ForeignKeyConstraintViolation,
									message: it.message,
								}
							case ConstraintType.uniqueKey:
								return { path: path, type: Result.ExecutionErrorType.UniqueConstraintViolation, message: it.message }
							default:
								return assertNever(it.constraint)
						}
					case MutationResultType.noResultError:
					case MutationResultType.notFoundError:
						return { path: path, type: Result.ExecutionErrorType.NotFoundOrDenied }
					case MutationResultType.inputError:
						switch (it.kind) {
							case InputErrorKind.nonUniqueWhere:
								return { path: path, type: Result.ExecutionErrorType.NonUniqueWhereInput, message: it.message }
							case InputErrorKind.invalidData:
								return { path: path, type: Result.ExecutionErrorType.InvalidDataInput, message: it.message }
							default:
								return assertNever(it.kind)
						}

					case MutationResultType.sqlError:
						return { path, type: Result.ExecutionErrorType.SqlError, message: it.message }
					case MutationResultType.ok:
					case MutationResultType.nothingToDo:
						throw new ImplementationException('MutationResolver: unexpected MutationResultType')
					default:
						return assertNever(it)
				}
			})
	}

	private stringifyValidationErrors(validationErrors: Result.ValidationError[]): string | undefined {
		if (validationErrors.length === 0) {
			return undefined
		}
		return (
			'Validation has failed:\n' +
			validationErrors.map(it => `${this.stringifyPath(it.path)}: ${it.message.text}`).join('\n')
		)
	}

	private stringifyExecutionErrors(executionErrors: Result.ExecutionError[]): string | undefined {
		if (executionErrors.length === 0) {
			return undefined
		}
		return (
			'Execution has failed:\n' +
			executionErrors.map(it => `${this.stringifyPath(it.path)}: ${it.type} (${it.message || ''})`)
		)
	}

	private stringifyPath(path: Result.PathFragment[]): string {
		if (path.length === 0) {
			return 'unknown field'
		}
		return path
			.map(it => {
				if ('field' in it) {
					return it.field
				}
				if ('alias' in it) {
					return `${it.index}(${it.alias})`
				}
				return it.index
			})
			.join('.')
	}
}
