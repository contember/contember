import { Input, Model, Validation } from 'cms-common'
import DependencyCollector from './DependencyCollector'
import DependencyMerger from './DependencyMerger'
import { acceptEveryFieldVisitor } from '../../content-schema/modelUtils'
import CreateInputVisitor from '../inputProcessing/CreateInputVisitor'
import { tuple } from '../../utils/tuple'
import UpdateInputVisitor from '../inputProcessing/UpdateInputVisitor'
import UpdateInputValidationProcessor from './UpdateInputValidationProcessor'
import ValidationContextFactory from './ValidationContextFactory'
import ValidationDataSelector from './ValidationDataSelector'
import CreateInputValidationProcessor from './CreateInputValidationProcessor'
import UpdateInputProcessor from '../inputProcessing/UpdateInputProcessor'
import CreateInputProcessor from '../inputProcessing/CreateInputProcessor'
import ValidationContext from './ValidationContext'
import { evaluateValidation } from './ValidationEvaluation'
import { rules } from './ValidationDefinition'
import { ValidationPath } from './ValidationPath'

class InputValidator {
	constructor(
		private readonly validationSchema: Validation.Schema,
		private readonly model: Model.Schema,
		private readonly dependencyCollector: DependencyCollector,
		private readonly validationContextFactory: ValidationContextFactory,
		private readonly validationDataSelector: ValidationDataSelector
	) {}

	async hasValidationRulesOnUpdate(entity: Model.Entity, data: Input.UpdateDataInput): Promise<boolean> {
		const fieldsWithRules = this.getFieldsWithRules(entity, Object.keys(data))
		if (fieldsWithRules.length > 0) {
			return true
		}
		const hasManyProcessor: UpdateInputProcessor.HasManyRelationInputProcessor<
			{
				targetEntity: Model.Entity
				relation: Model.AnyRelation
			},
			boolean
		> = {
			connect: () => Promise.resolve(false),
			disconnect: () => Promise.resolve(false),
			delete: () => Promise.resolve(false),
			create: context => this.hasValidationRulesOnCreate(context.targetEntity, context.input),
			update: context => this.hasValidationRulesOnUpdate(context.targetEntity, context.input.data),
			upsert: context =>
				this.hasValidationRulesOnUpdate(context.targetEntity, context.input.update) ||
				this.hasValidationRulesOnCreate(context.targetEntity, context.input.create),
		}
		const hasOneProcessor: UpdateInputProcessor.HasOneRelationInputProcessor<
			{
				targetEntity: Model.Entity
				relation: Model.AnyRelation
			},
			boolean
		> = {
			connect: () => Promise.resolve(false),
			disconnect: () => Promise.resolve(false),
			delete: () => Promise.resolve(false),
			create: context => this.hasValidationRulesOnCreate(context.targetEntity, context.input),
			update: context => this.hasValidationRulesOnUpdate(context.targetEntity, context.input),
			upsert: context =>
				this.hasValidationRulesOnUpdate(context.targetEntity, context.input.update) ||
				this.hasValidationRulesOnCreate(context.targetEntity, context.input.create),
		}
		const processor: UpdateInputProcessor<boolean> = {
			column: () => Promise.resolve(false),
			manyHasManyInversed: hasManyProcessor,
			manyHasManyOwner: hasManyProcessor,
			oneHasMany: hasManyProcessor,
			manyHasOne: hasOneProcessor,
			oneHasOneInversed: hasOneProcessor,
			oneHasOneOwner: hasOneProcessor,
		}
		const visitor = new UpdateInputVisitor(processor, this.model, data)
		return await this.checkRelationHasValidation(entity, visitor)
	}

	async hasValidationRulesOnCreate(entity: Model.Entity, data: Input.CreateDataInput): Promise<boolean> {
		const fieldsWithRules = this.getFieldsWithRules(entity)
		if (fieldsWithRules.length > 0) {
			return true
		}
		const hasManyProcessor: CreateInputProcessor.HasManyRelationProcessor<
			{
				targetEntity: Model.Entity
				relation: Model.AnyRelation
			},
			boolean
		> = {
			connect: () => Promise.resolve(false),
			create: context => this.hasValidationRulesOnCreate(context.targetEntity, context.input),
		}
		const hasOneProcessor: CreateInputProcessor.HasOneRelationProcessor<
			{
				targetEntity: Model.Entity
				relation: Model.AnyRelation
			},
			boolean
		> = {
			connect: () => Promise.resolve(false),
			create: context => this.hasValidationRulesOnCreate(context.targetEntity, context.input),
		}
		const processor: CreateInputProcessor<boolean> = {
			column: () => Promise.resolve(false),
			manyHasManyInversed: hasManyProcessor,
			manyHasManyOwner: hasManyProcessor,
			oneHasMany: hasManyProcessor,
			manyHasOne: hasOneProcessor,
			oneHasOneInversed: hasOneProcessor,
			oneHasOneOwner: hasOneProcessor,
		}
		const visitor = new CreateInputVisitor(processor, this.model, data)

		return await this.checkRelationHasValidation(entity, visitor)
	}

	private async checkRelationHasValidation(
		entity: Model.Entity,
		visitor: Model.FieldVisitor<Promise<boolean | boolean[] | undefined>>
	): Promise<boolean> {
		const validateRelationsResult = acceptEveryFieldVisitor<Promise<boolean | boolean[] | undefined>>(
			this.model,
			entity,
			visitor
		)

		const results = await Promise.all(Object.values(validateRelationsResult))

		return results.find(it => it === true || (Array.isArray(it) && it.includes(true))) !== undefined
	}

	async validateCreate(
		entity: Model.Entity,
		data: Input.CreateDataInput,
		path: ValidationPath = []
	): Promise<InputValidator.Result> {
		if (!(await this.hasValidationRulesOnCreate(entity, data))) {
			return []
		}
		const entityRules = this.validationSchema[entity.name] || {}
		const fieldsWithRules = this.getFieldsWithRules(entity)

		const dependencies = this.buildDependencies(fieldsWithRules, entityRules)

		const context = ValidationContext.createRootContext(
			await this.validationContextFactory.createForCreate(entity, data, dependencies)
		)

		const fieldsResult = this.validateFields(fieldsWithRules, entityRules, context, path)

		const processor = new CreateInputValidationProcessor(this, path)
		const visitor = new CreateInputVisitor(processor, this.model, data)
		const relationResult = await this.validateRelations(entity, visitor)

		return [...fieldsResult, ...relationResult]
	}

	async validateUpdate(
		entity: Model.Entity,
		where: Input.UniqueWhere,
		data: Input.UpdateDataInput,
		path: ValidationPath = []
	): Promise<InputValidator.Result> {
		if (!(await this.hasValidationRulesOnUpdate(entity, data))) {
			return []
		}
		const entityRules = this.validationSchema[entity.name] || {}

		const dependencies = this.buildDependencies(Object.keys(data), entityRules)

		const fieldsWithRules = this.getFieldsWithRules(entity, Object.keys(data))

		let fieldsResult: InputValidator.Result = []
		const node = (await this.validationContextFactory.createForUpdate(entity, { where }, data, dependencies)) || {}
		if (fieldsWithRules.length > 0) {
			const context = ValidationContext.createRootContext(node)
			fieldsResult = this.validateFields(fieldsWithRules, entityRules, context, path)
		}

		const processor = new UpdateInputValidationProcessor(this, path, node, this.validationDataSelector)
		const visitor = new UpdateInputVisitor(processor, this.model, data)
		const relationResult = await this.validateRelations(entity, visitor)

		return [...fieldsResult, ...relationResult]
	}

	private getFieldsWithRules(entity: Model.Entity, fields?: string[]) {
		const entityRules = this.validationSchema[entity.name] || {}
		return (fields || Object.keys(entityRules)).filter(field => entityRules[field] && entityRules[field].length > 0)
	}

	private validateFields(
		fields: string[],
		entityRules: Validation.EntityRules,
		context: ValidationContext.NodeContext,
		path: ValidationPath
	) {
		return fields
			.map(field => tuple(field, entityRules[field]))
			.map(([field, fieldRules]) =>
				tuple(field, fieldRules.find(it => !evaluateValidation(context, rules.on(field, it.validator))))
			)
			.filter((arg): arg is [string, Validation.ValidationRule] => !!arg[1])
			.map(([field, { message }]) => ({ path: [...path, { field }], message }))
	}

	private async validateRelations(
		entity: Model.Entity,
		visitor: Model.FieldVisitor<Promise<InputValidator.Result | InputValidator.Result[] | undefined>>
	): Promise<InputValidator.FieldResult[]> {
		const validateRelationsResult = acceptEveryFieldVisitor(this.model, entity, visitor)

		return (await Promise.all(Object.values(validateRelationsResult)))
			.filter((value): value is InputValidator.FieldResult[] | InputValidator.FieldResult[][] => value !== undefined)
			.reduce<(InputValidator.FieldResult[] | InputValidator.FieldResult)[]>((res, it) => [...res, ...it], [])
			.reduce<InputValidator.FieldResult[]>((res, it) => [...res, ...(Array.isArray(it) ? it : [it])], [])
	}

	private buildDependencies(fields: string[], entityRules: Validation.EntityRules) {
		return fields
			.map(it => entityRules[it] || [])
			.reduce((acc, val) => [...acc, ...val], [])
			.map(it => this.dependencyCollector.collect(it.validator))
			.concat(fields.reduce((acc, field) => ({ ...acc, [field]: {} }), {}))
			.reduce((acc, dependency) => DependencyMerger.merge(acc, dependency), {})
	}
}

namespace InputValidator {
	export interface FieldResult {
		path: ValidationPath
		message: Validation.Message
	}

	export type Result = FieldResult[]
}

export default InputValidator
