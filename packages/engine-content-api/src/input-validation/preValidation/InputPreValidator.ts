import { acceptEveryFieldVisitor } from '@contember/schema-utils'
import { isIt, tuple } from '../../utils/index.js'
import { Input, Model, Validation, Value } from '@contember/schema'
import { InputValidation } from '@contember/schema-definition'
import { CreateInputVisitor, UpdateInputVisitor } from '../../inputProcessing/index.js'
import { CreateInputPreValidationProcessor } from './CreateInputPreValidationProcessor.js'
import { ValidationContext } from '../ValidationContext.js'
import { evaluateValidation } from '../ValidationEvaluation.js'
import { ValidationPath } from '../ValidationPath.js'
import { EntityRulesResolver } from '../EntityRulesResolver.js'
import { FieldValidationResult, ValidationResult } from '../InputValidator.js'
import { UpdateInputPreValidationProcessor } from './UpdateInputPreValidationProcessor.js'
import { ColumnValueResolver } from '../ColumnValueResolver.js'
import { Mapper } from '../../mapper/index.js'
import { Dependencies, DependencyCollector, DependencyMerger } from '../dependencies/index.js'
import { NotSupportedError } from '../exceptions.js'
import { ValidationDataSelector } from '../ValidationDataSelector.js'

export interface CreateValidationArgs {
	mapper: Mapper
	entity: Model.Entity
	data: Input.CreateDataInput
	path: ValidationPath
	overRelation: Model.AnyRelation | null
}

export interface UpdateValidationArgs {
	mapper: Mapper
	entity: Model.Entity
	where: Input.UniqueWhere
	data: Input.UpdateDataInput
	path: ValidationPath
}

export class InputPreValidator {
	constructor(
		private readonly model: Model.Schema,
		private readonly entityRulesResolver: EntityRulesResolver,
		private readonly columnValueResolver: ColumnValueResolver,
		private readonly dataSelector: ValidationDataSelector,
	) {}

	async validateCreate({ entity, data, path, mapper, overRelation }: CreateValidationArgs): Promise<ValidationResult> {
		const rules = this.entityRulesResolver.getSimpleRules(entity.name)

		const dataWithRelation = overRelation
			? {
				...data,
				[overRelation.name]: { create: {} },
			  }
			: data
		const context = this.createContextForCreate(entity, dataWithRelation)

		const fieldsResult = this.validateFields(rules, context, path)

		const processor = new CreateInputPreValidationProcessor(this, path, mapper)
		const visitor = new CreateInputVisitor(processor, this.model, data)
		const relationResult = await this.validateRelations(entity, visitor)

		return [...fieldsResult, ...relationResult]
	}

	async validateUpdate({ entity, data, path, mapper, where }: UpdateValidationArgs): Promise<ValidationResult> {
		const simpleRules = this.entityRulesResolver.getSimpleRules(entity.name)
		const rules = this.getApplicableRules(Object.keys(data), simpleRules)
		const dependencies = this.buildDependencies(rules)

		const context = await this.createContextForUpdate(mapper, entity, where, data, dependencies)
		const fieldsResult: ValidationResult = this.validateFields(rules, context, path)

		const processor = new UpdateInputPreValidationProcessor(this, path, mapper)
		const visitor = new UpdateInputVisitor(processor, this.model, data)
		const relationResult = await this.validateRelations(entity, visitor)

		return [...fieldsResult, ...relationResult]
	}

	private createContextForCreate(entity: Model.Entity, data: Input.CreateDataInput): ValidationContext.NodeContext {
		const nodeData = acceptEveryFieldVisitor(this.model, entity, {
			visitColumn: (entity, column) => {
				const value = data[column.name] as Input.ColumnValue | undefined
				const validationValue = this.columnValueResolver.getDefaultValidationValue({ entity, column, input: value })
				return validationValue === undefined ? null : validationValue
			},
			visitHasOne: (entity, relation) => {
				const value = data[relation.name] as Input.CreateOneRelationInput | undefined
				return value ? true : null
			},
			// more complex validation on relations are not possible in pre-validation phase
			visitHasMany: () => null,
		})

		return ValidationContext.createRootContext(nodeData)
	}
	private async createContextForUpdate(
		mapper: Mapper,
		entity: Model.Entity,
		where: Input.UniqueWhere,
		data: Input.UpdateDataInput,
		dependencies: Dependencies,
	): Promise<ValidationContext.NodeContext> {
		const inputNodeData = acceptEveryFieldVisitor(this.model, entity, {
			visitColumn: (entity, column) => {
				return data[column.name] as Input.ColumnValue | undefined
			},
			visitHasOne: (entity, relation) => {
				const value = data[relation.name] as Input.CreateOneRelationInput | Input.UpdateOneRelationInput | undefined | null
				if (value === undefined || value === null) {
					return undefined
				}
				if ('disconnect' in value) {
					return null
				}
				if ('delete' in value) {
					if (
						isIt<Model.JoiningColumnRelation>(relation, 'joiningColumn') &&
						relation.joiningColumn.onDelete === Model.OnDelete.cascade
					) {
						return true
					}
					return null
				}
				return true
			},
			// more complex validation on relations are not possible in pre-validation phase
			visitHasMany: () => null,
		})

		const missingDependencies = Object.keys(dependencies).filter(it => inputNodeData[it] === undefined)
		missingDependencies.forEach(it => {
			if (Object.keys(dependencies[it]).length !== 0) {
				throw new NotSupportedError()
			}
		})

		const dbData = await this.dataSelector.select(
			mapper,
			entity,
			where,
			missingDependencies.reduce((acc, field) => ({ ...acc, [field]: {} }), {}),
		)

		return ValidationContext.createRootContext({ ...(inputNodeData as Value.Object), ...(dbData || {}) })
	}

	private validateFields(rules: Validation.EntityRules, context: ValidationContext.NodeContext, path: ValidationPath) {
		return Object.entries(rules)
			.map(([field, fieldRules]) =>
				tuple(
					field,
					fieldRules.find(it => evaluateValidation(context, InputValidation.rules.on(field, it.validator)) === false),
				),
			)
			.filter((arg): arg is [string, Validation.ValidationRule] => !!arg[1])
			.map(([field, { message }]) => ({ path: [...path, { field }], message }))
	}

	private async validateRelations(
		entity: Model.Entity,
		visitor: Model.FieldVisitor<Promise<ValidationResult | ValidationResult[] | undefined>>,
	): Promise<FieldValidationResult[]> {
		const validateRelationsResult = acceptEveryFieldVisitor(this.model, entity, visitor)

		return (await Promise.all(Object.values(validateRelationsResult)))
			.filter((value): value is FieldValidationResult[] | FieldValidationResult[][] => value !== undefined)
			.reduce<(FieldValidationResult[] | FieldValidationResult)[]>((res, it) => [...res, ...it], [])
			.reduce<FieldValidationResult[]>((res, it) => [...res, ...(Array.isArray(it) ? it : [it])], [])
	}

	private getApplicableRules(changedFields: string[], entityRules: Validation.EntityRules): Validation.EntityRules {
		return Object.fromEntries(
			Object.entries(entityRules)
				.map(([field, fieldRules]) => {
					return tuple(
						field,
						changedFields.includes(field)
							? fieldRules
							: fieldRules.filter(rule =>
								Object.keys(DependencyCollector.collect(rule.validator)).find(it => changedFields.includes(it)),
							  ),
					)
				})
				.filter(([, it]) => it.length > 0),
		)
	}

	private buildDependencies(rules: Validation.EntityRules): Dependencies {
		const baseFieldsAsDeps = Object.keys(rules).reduce((acc, field) => ({ ...acc, [field]: {} }), {})

		return Object.values(rules)
			.flatMap(it => it)
			.map(it => DependencyCollector.collect(it.validator))
			.concat(baseFieldsAsDeps)
			.reduce((acc, dependecy) => DependencyMerger.merge(acc, dependecy), {})
	}
}
