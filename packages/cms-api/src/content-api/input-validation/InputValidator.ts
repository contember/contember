import { Input, Model, Validation } from 'cms-common'
import DependencyCollector from './DependencyCollector'
import QueryAstFactory from './QueryAstFactory'
import Mapper from '../sql/Mapper'
import DependencyMerger from './DependencyMerger'
import { acceptEveryFieldVisitor, acceptFieldVisitor } from '../../content-schema/modelUtils'
import CreateInputProcessor from '../inputProcessing/CreateInputProcessor'
import UniqueWhereExpander from '../graphQlResolver/UniqueWhereExpander'
import CreateInputVisitor from '../inputProcessing/CreateInputVisitor'
import { createRootContext, evaluate, NodeContext, rules } from './index'
import { tuple } from '../../utils/tuple'
import { ColumnContext } from '../inputProcessing/InputContext'

type Path = (string | number)[]

class InputValidator {
	constructor(
		private readonly validationSchema: Validation.Schema,
		private readonly model: Model.Schema,
		private readonly dependencyCollector: DependencyCollector,
		private readonly queryAstFactory: QueryAstFactory,
		private readonly mapper: Mapper,
		private readonly uniqueWhereExpander: UniqueWhereExpander
	) {}

	async validateCreate(
		entity: Model.Entity,
		data: Input.CreateDataInput,
		path: Path = []
	): Promise<InputValidator.Result> {
		const entityRules = this.validationSchema[entity.name] || {}
		const fieldsWithRules = Object.entries(entityRules)
			.filter(([, rules]) => rules.length > 0)
			.map(([field]) => field)
		if (fieldsWithRules.length === 0) {
			return []
		}

		const dependencies: DependencyCollector.Dependencies = fieldsWithRules
			.map(it => entityRules[it])
			.reduce((acc, val) => [...acc, ...val], [])
			.map(it => this.dependencyCollector.collect(it.validator))
			.concat(fieldsWithRules.reduce((acc, field) => ({ ...acc, [field]: {} }), {}))
			.reduce((acc, dependency) => DependencyMerger.merge(acc, dependency), {})

		const context = await this.createValidationContext(entity, data, dependencies)

		const fieldsResult = fieldsWithRules
			.map(field => tuple(field, entityRules[field]))
			.map(([field, fieldRules]) =>
				tuple(field, fieldRules.find(it => !evaluate(context, rules.on(field, it.validator))))
			)
			.filter((arg): arg is [string, Validation.ValidationRule] => !!arg[1])
			.map(([field, { message }]) => ({ path: [...path, field], message }))

		const noneResult = async () => []
		const processCreate = async (context: {
			targetEntity: Model.Entity
			relation: Model.AnyRelation
			input: Input.CreateDataInput
			index?: number
		}) => {
			const newPath = [...path, ...(context.index ? [context.index] : []), context.relation.name]
			return this.validateCreate(context.targetEntity, context.input, newPath)
		}
		const relationProcessors = {
			create: processCreate,
			connect: noneResult,
		}
		const processor: CreateInputProcessor<InputValidator.Result> = {
			column: noneResult,
			manyHasManyInversed: relationProcessors,
			manyHasManyOwner: relationProcessors,
			oneHasOneInversed: relationProcessors,
			oneHasOneOwner: relationProcessors,
			oneHasMany: relationProcessors,
			manyHasOne: relationProcessors,
		}

		const visitor = new CreateInputVisitor(processor, this.model, data)

		type VisitorType = Promise<InputValidator.Result | InputValidator.Result[] | undefined>
		const nestedCreateResult = acceptEveryFieldVisitor<VisitorType>(this.model, entity, visitor)

		const nestedResult = (await Promise.all(Object.values(nestedCreateResult)))
			.filter((value): value is InputValidator.FieldResult[] | InputValidator.FieldResult[][] => value !== undefined)
			.reduce<(InputValidator.FieldResult[] | InputValidator.FieldResult)[]>((res, it) => [...res, ...it], [])
			.reduce<InputValidator.FieldResult[]>((res, it) => [...res, ...(Array.isArray(it) ? it : [it])], [])

		return [...fieldsResult, ...nestedResult]
	}

	private async createValidationContext(
		entity: Model.Entity,
		data: Input.CreateDataInput,
		dependencies: DependencyCollector.Dependencies
	): Promise<NodeContext> {
		const processConnect = async (context: {
			targetEntity: Model.Entity
			relation: Model.AnyRelation
			input: Input.UniqueWhere
		}) => {
			return this.select(context.targetEntity, context.input, dependencies[context.relation.name])
		}
		const processCreate = async (context: {
			targetEntity: Model.Entity
			relation: Model.AnyRelation
			input: Input.CreateDataInput
		}) => {
			return this.createValidationContext(context.targetEntity, context.input, dependencies[context.relation.name])
		}

		const relationProcessors = {
			create: processCreate,
			connect: processConnect,
		}
		const processor: CreateInputProcessor<any> = {
			column: async (context: ColumnContext) => {
				return context.input
			},
			manyHasManyInversed: relationProcessors,
			manyHasManyOwner: relationProcessors,
			oneHasOneInversed: relationProcessors,
			oneHasOneOwner: relationProcessors,
			oneHasMany: relationProcessors,
			manyHasOne: relationProcessors,
		}

		const visitor = new CreateInputVisitor(processor, this.model, data)
		const contextData = (await Promise.all(
			Object.keys(dependencies).map(async field => {
				return [field, await acceptFieldVisitor(this.model, entity, field, visitor)]
			})
		)).reduce((acc, [field, value]) => ({ ...acc, [field]: value }), {})

		return createRootContext(contextData)
	}

	private async select(entity: Model.Entity, where: Input.UniqueWhere, dependencies: DependencyCollector.Dependencies) {
		const queryAst = this.queryAstFactory.create(entity.name, dependencies)
		const whereExpanded = this.uniqueWhereExpander.expand(entity, where)
		const queryExpanded = queryAst.withArg<Input.ListQueryInput>('filter', whereExpanded)
		return (await this.mapper.select(entity, queryExpanded))[0] || undefined
	}
}

namespace InputValidator {
	export interface FieldResult {
		path: Path
		message: Validation.Message
	}

	export type Result = FieldResult[]
}

export default InputValidator
