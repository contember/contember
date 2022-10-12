import { Input, Model, Result, Value } from '@contember/schema'
import {
	AfterCommitEvent,
	BeforeCommitEvent,
	ConstraintType,
	getInsertPrimary,
	InputErrorKind,
	Mapper,
	MapperFactory,
	MutationResultHint,
	MutationResultList,
	MutationResultType,
	tryMutation,
} from '../mapper'
import { ValidationResolver } from './ValidationResolver'
import { GraphQLResolveInfo } from 'graphql'
import { GraphQlQueryAstFactory } from './GraphQlQueryAstFactory'
import { ImplementationException } from '../exception'
import { retryTransaction } from '@contember/database'
import { Operation, readOperationMeta } from '../schema'
import { assertNever } from '../utils'
import { InputPreValidator } from '../input-validation'
import { ObjectNode } from '../inputProcessing'
import { executeReadOperations } from './ReadHelpers'
import { logger } from '@contember/logger'

type WithoutNode<T extends { node: any }> = Pick<T, Exclude<keyof T, 'node'>>

type TransactionOptions = { deferForeignKeyConstraints?: boolean }

export class MutationResolver {
	constructor(
		private readonly schema: Model.Schema,
		private readonly mapperFactory: MapperFactory,
		private readonly inputValidator: InputPreValidator,
		private readonly graphqlQueryAstFactory: GraphQlQueryAstFactory,
	) {}

	public async resolveTransaction(info: GraphQLResolveInfo, options: TransactionOptions): Promise<Result.TransactionResult> {
		const queryAst = this.graphqlQueryAstFactory.create(info, (node, path) => {
			return (
				(path.length === 1 && !['ok', 'validation', 'errorMessage', 'errors'].includes(node.name.value)) ||
				(path.length === 2 && node.name.value === 'node') ||
				path.length > 2 ||
				path.length === 0 ||
				(path.length > 1 && path[1] === 'query')
			)
		})
		const fields = GraphQlQueryAstFactory.resolveObjectType(info.returnType).getFields()

		const prefixErrors = <T extends { path: Result.PathFragment[]; paths?: Result.PathFragment[][] }>(
			errors: T[],
			field: string,
		): T[] =>
			errors.map(it => ({
				...it,
				path: [{ __typename: '_FieldPathFragment', field }, ...it.path],
				paths: it.paths
					? (it.paths.length === 0 ? [[]] : it.paths)?.map(it => [{ __typename: '_FieldPathFragment', field }, ...it])
					: undefined,
			}))

		return this.transaction(async mapper => {
			if (options?.deferForeignKeyConstraints) {
				await mapper.constraintHelper.setFkConstraintsDeferred()
			}
			const validationResult: Record<string, Result.MutationFieldResult> = {}
			const validationErrors: Result.ValidationError[] = []
			for (const field of queryAst.fields) {
				if (field.name === 'query' || field.name === '__typename') {
					continue
				}
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
						case Operation.upsert:
							return this.validateUpsert(mapper, meta.entity, field)
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
					__typename: 'MutationTransaction',
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

			const trxResult: Record<string, any> = {}
			for (const field of queryAst.fields) {
				if (field.name === '__typename') {
					continue
				}
				if (!(field instanceof ObjectNode)) {
					throw new ImplementationException()
				}
				const fieldConfig = fields[field.name]
				if (!fieldConfig) {
					throw new ImplementationException()
				}
				if (field.name === 'query') {
					trxResult[field.alias] = await executeReadOperations(
						field,
						GraphQlQueryAstFactory.resolveObjectType(fieldConfig.type).getFields(),
						mapper,
					)
					continue
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
						case Operation.upsert:
							return this.resolveUpsertInternal(mapper, meta.entity, field)
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
			if (options?.deferForeignKeyConstraints) {
				const constraintsResult = await tryMutation(this.schema, async () => {
					await mapper.constraintHelper.setFkConstraintsImmediate()
					return []
				})
				const errorResponse = this.createErrorResponse(constraintsResult)
				if (errorResponse) {
					return { ...errorResponse, ...validationResult }
				}
			}

			return {
				__typename: 'MutationTransaction',
				ok: true,
				errors: [],
				validation: { valid: true, errors: [] },
				...trxResult,
			}
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
		const errorResponse = this.createErrorResponse(result)
		if (errorResponse) {
			return errorResponse
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
		const errorResponse = this.createErrorResponse(result)
		if (errorResponse) {
			return errorResponse
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

	public async resolveUpsert(
		entity: Model.Entity,
		info: GraphQLResolveInfo,
	): Promise<WithoutNode<Result.UpsertResult>> {
		const queryAst = this.createQueryAst(info)
		return this.transaction(async mapper => {
			const validation = await this.validateUpsert(mapper, entity, queryAst)
			if (validation !== null) {
				return {
					ok: false,
					validation,
					errors: [],
					errorMessage: this.stringifyValidationErrors(validation.errors),
				}
			}
			return await this.resolveUpsertInternal(mapper, entity, queryAst)
		})
	}

	private async validateUpsert(
		mapper: Mapper,
		entity: Model.Entity,
		queryAst: ObjectNode<Input.UpsertInput>,
	): Promise<Result.ValidationResult | null> {
		const input = queryAst.args
		const validationResult = [
			...(await this.inputValidator.validateCreate({
				mapper,
				entity,
				data: input.create,
				path: [],
				overRelation: null,
			})),
			...(await this.inputValidator.validateUpdate({
				mapper,
				entity,
				data: input.update,
				where: input.by,
				path: [],
			})),
		]
		if (validationResult.length > 0) {
			return ValidationResolver.createValidationResponse(validationResult)
		}
		return null
	}

	private async resolveUpsertInternal(
		mapper: Mapper,
		entity: Model.Entity,
		queryAst: ObjectNode<Input.UpsertInput>,
	): Promise<WithoutNode<Result.UpsertResult>> {
		const input = queryAst.args
		const result = await mapper.upsert(entity, input.by, input.update, input.create, input.filter)
		const errorResponse = this.createErrorResponse(result)
		if (errorResponse) {
			return errorResponse
		}
		const primary = getInsertPrimary(result)
		const byResolved = primary ? { [entity.primary]: primary } : input.by
		if (!byResolved) {
			throw new ImplementationException('MutationResolver::resolveUpsertInternal does not handle result properly')
		}

		const nodes = await this.resolveResultNodes(mapper, entity, byResolved, queryAst)
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
			result.length >= 1 &&
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
			nodes[singleNodeQuery.alias] = await mapper.selectUnique(entity, objectWithArgs, [])
		}
		return nodes
	}

	private async transaction<R extends { ok: boolean }>(
		cb: (mapper: Mapper) => Promise<R>,
	): Promise<R> {
		return await retryTransaction(
			async () => {
				const [result, mapper] = await this.mapperFactory.transaction(async mapper => {
					const result = await cb(mapper)
					if (!result.ok) {
						await mapper.db.connection.rollback()
					}
					await mapper.eventManager.fire(new BeforeCommitEvent())
					return [result, mapper]
				})
				await mapper.eventManager.fire(new AfterCommitEvent())
				return result
			},
			message => logger.warn(message),
			{
				maxAttempts: 15,
				minTimeout: 10,
				maxTimeout: 1000,
			},
		)
	}

	private createErrorResponse(result: MutationResultList) {
		const errors = this.convertResultToErrors(result)
		if (errors.length > 0) {
			return {
				ok: false,
				validation: { valid: true, errors: [] },
				errors,
				errorMessage: this.stringifyExecutionErrors(errors),
			}
		}
		return null
	}

	private convertResultToErrors(result: MutationResultList): Result.ExecutionError[] {
		const errors = result.filter(
			it =>
				![MutationResultType.ok, MutationResultType.nothingToDo, MutationResultType.validationError].includes(
					it.result,
				),
		)

		let hasSqlError = false
		const filteredErrors: MutationResultList = []
		for (const error of errors) {
			if (error.hints.includes(MutationResultHint.subSequentSqlError) && hasSqlError) {
				continue
			}
			if (error.hints.includes(MutationResultHint.sqlError)) {
				hasSqlError = true
			}
			filteredErrors.push(error)
		}

		return filteredErrors.map(it => {
			const paths = it.paths.map(path =>
				path.map(it => ({
					...it,
					__typename: 'field' in it ? '_FieldPathFragment' : '_IndexPathFragment',
				})),
			)
			const path = paths[0] || []
			switch (it.result) {
				case MutationResultType.constraintViolationError:
					switch (it.constraint) {
						case ConstraintType.notNull:
							return { path, paths, type: Result.ExecutionErrorType.NotNullConstraintViolation, message: it.message }
						case ConstraintType.foreignKey:
							return {
								path,
								paths,
								type: Result.ExecutionErrorType.ForeignKeyConstraintViolation,
								message: it.message,
							}
						case ConstraintType.uniqueKey:
							return { path, paths, type: Result.ExecutionErrorType.UniqueConstraintViolation, message: it.message }
						default:
							return assertNever(it.constraint)
					}
				case MutationResultType.noResultError:
				case MutationResultType.notFoundError:
					return { path, paths, type: Result.ExecutionErrorType.NotFoundOrDenied, message: it.message }
				case MutationResultType.inputError:
					switch (it.kind) {
						case InputErrorKind.nonUniqueWhere:
							return { path, paths, type: Result.ExecutionErrorType.NonUniqueWhereInput, message: it.message }
						case InputErrorKind.invalidData:
							return { path, paths, type: Result.ExecutionErrorType.InvalidDataInput, message: it.message }
						default:
							return assertNever(it.kind)
					}

				case MutationResultType.sqlError:
					return { path, paths, type: Result.ExecutionErrorType.SqlError, message: it.message }
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
			executionErrors.map(it => `${this.stringifyPath(it.paths[0] || [])}: ${it.type} (${it.message || ''})`)
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
				if ('alias' in it && it.alias) {
					return `${it.index}(${it.alias})`
				}
				return it.index
			})
			.join('.')
	}
}
